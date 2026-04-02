const Diary = require('./models/diary.model');
const DiarySettings = require('./models/diarySettings.model');

// Basic settings sync
exports.getSettings = async (req, res) => {
    try {
        let settings = await DiarySettings.findOne({ user: req.user.id });
        if (!settings) {
            settings = await DiarySettings.create({ user: req.user.id });
        }
        res.json({ success: true, settings });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.updateSettings = async (req, res) => {
    try {
        const { enabled, persona, cycleMinutes } = req.body;
        const settings = await DiarySettings.findOneAndUpdate(
            { user: req.user.id },
            { enabled, persona, cycleMinutes },
            { new: true, upsert: true }
        );
        res.json({ success: true, settings });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.getTodayDiary = async (req, res) => {
    try {
        const todayStr = new Date().toISOString().split('T')[0];
        let diary = await Diary.findOne({ user: req.user.id, date: todayStr });
        if (!diary) {
            diary = await Diary.create({ user: req.user.id, date: todayStr });
        }
        res.json({ success: true, diary });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

exports.getDiaryHistory = async (req, res) => {
    try {
        const history = await Diary.find({ user: req.user.id }).sort({ date: -1 });
        res.json({ success: true, history });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
};

// AI Engine
exports.processDiaryEvents = async (req, res) => {
    try {
        const { rawEvents } = req.body;
        if (!rawEvents || rawEvents.length === 0) return res.json({ success: true, message: "No events" });

        const settings = await DiarySettings.findOne({ user: req.user.id });
        if (!settings || !settings.enabled) return res.json({ success: false, message: "Observer disabled" });

        const todayStr = new Date().toISOString().split('T')[0];
        let diary = await Diary.findOne({ user: req.user.id, date: todayStr });
        if (!diary) diary = new Diary({ user: req.user.id, date: todayStr, persona: settings.persona });

        const User = require('../user-management/models/user.model');
        const user = await User.findById(req.user.id);
        const targetName = user ? user.name : "the user";

        const previousSummary = diary.summaryText === "No observations yet today." ? "" : diary.summaryText;
        const newEventsStr = rawEvents.join('\n- ');

        // Advanced Persona Guidelines
        const personaGuidelines = {
            "detective": "You are a hard-boiled Private Investigator writing a dossier/case file on the suspect.",
            "yandere": "You are a deeply obsessed Yandere stalker secretly taking obsessive, intense notes about your darling.",
            "therapist": "You are a clinical psychologist writing observational session notes focusing on emotional well-being.",
            "analyst": "You are a cold corporate analyst generating an engagement metric report.",
            "gossip": "You are a sassy gossip blogger writing a juicy column about the latest drama.",
            "sci-fi": "You are a rogue central AI compiling behavioral profiles on human subjects.",
            "mom": "You are an overprotective, slightly embarrassing parent writing a diary about your child."
        };

        const activeGuideline = personaGuidelines[settings.persona] || personaGuidelines["detective"];

        const systemInstruction = `${activeGuideline} 
Your target subject is named '${targetName}'.
Below are the recent telemetry logs of their actions on AstrixChat today:
- ${newEventsStr}

Here is what you had ALREADY written about them today:
${previousSummary ? `"${previousSummary}"` : "You haven't written anything today yet."}

INSTRUCTIONS:
Refine, expand, and rewrite today's diary entry. Seamlessly weave these new actions into the existing narrative. MAKE SURE you stay deeply in character. Do not break the 4th wall.
Format it beautifully. Limit it to 1-3 highly descriptive paragraphs.`;

        // We will attempt to use Dolphin locally as requested. 
        // We will fallback to Gemini if local is unavailable, but local is priority for Diaries per instructions.
        let updatedSummary = "AI Offline";
        try {
            // Force Dolphin
            const tagsRes = await fetch("http://localhost:11434/api/tags");
            const tagsData = await tagsRes.json();
            let localModel = "dolphin3:8b";
            if (tagsData && tagsData.models) {
                const validModels = tagsData.models.map(m => m.name).filter(n => n.includes("dolphin") || (!n.includes("karma") && !n.includes("translate") && !n.includes("my-chat") && !n.includes("mychat")));
                if (validModels.some(m => m.includes("dolphin"))) {
                    localModel = validModels.find(m => m.includes("dolphin"));
                } else if (validModels.length > 0) {
                    localModel = validModels[0];
                }
            }

            const localRes = await fetch("http://localhost:11434/api/generate", {
                method: "POST",
                headers: {"Content-Type": "application/json"},
                body: JSON.stringify({
                    model: localModel, 
                    prompt: systemInstruction,
                    stream: false
                })
            });
            const data = await localRes.json();
            updatedSummary = data.response;
        } catch (err) {
            // Fallback to Gemini
            const { GoogleGenAI } = require("@google/genai");
            const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
            const response = await ai.models.generateContent({
                model: "gemini-2.0-flash",
                systemInstruction: "You are generating a daily diary entry in a specific persona.",
                contents: [{ role: "user", parts: [{ text: systemInstruction }] }],
            });
            updatedSummary = response.text?.trim() || "Fallback error";
        }

        // Save new events & summary
        diary.summaryText = updatedSummary;
        diary.trackedEventsCount += rawEvents.length;
        rawEvents.forEach(e => diary.eventLog.push({ time: new Date(), event: e }));
        await diary.save();

        res.json({ success: true, diary });
    } catch (err) {
        console.error("Process diary error:", err);
        res.status(500).json({ success: false, error: err.message });
    }
};
