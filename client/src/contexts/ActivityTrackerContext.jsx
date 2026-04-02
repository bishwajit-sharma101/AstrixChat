import React, { createContext, useState, useEffect, useContext, useRef } from 'react';
import axios from 'axios';
import Cookies from 'js-cookie';

const ActivityTrackerContext = createContext();

export const useActivityTracker = () => useContext(ActivityTrackerContext);

export const ActivityTrackerProvider = ({ children }) => {
    const [settings, setSettings] = useState({ enabled: false, persona: 'detective', cycleMinutes: 1 });
    const eventQueue = useRef([]);
    const timerRef = useRef(null);

    // Fetch initial settings
    useEffect(() => {
        const fetchSettings = async () => {
            const token = Cookies.get('token');
            if (!token) return;
            try {
                const res = await axios.get('http://localhost:5000/api/v1/diary/settings', {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (res.data.success && res.data.settings) {
                    setSettings(res.data.settings);
                }
            } catch (err) {
                console.error("Diary settings load fail", err);
            }
        };
        fetchSettings();
    }, []);

    const trackEvent = (eventStr) => {
        if (!settings.enabled) return;
        console.log("OBSERVER LOGGED:", eventStr);
        eventQueue.current.push(eventStr);
    };

    // Cycle Loop
    useEffect(() => {
        if (!settings.enabled) {
            if (timerRef.current) clearInterval(timerRef.current);
            return;
        }

        const flushEvents = async () => {
            if (eventQueue.current.length === 0) return;
            
            const eventsToSend = [...eventQueue.current];
            eventQueue.current = []; // Clear queue immediately

            try {
                const token = Cookies.get('token');
                await axios.post('http://localhost:5000/api/v1/diary/update', 
                    { rawEvents: eventsToSend },
                    { headers: { Authorization: `Bearer ${token}` }}
                );
            } catch (err) {
                console.error("Diary flush fail", err);
                // Put them back if failed (simplified, just prepend to not drop logs)
                eventQueue.current = [...eventsToSend, ...eventQueue.current];
            }
        };

        const cycleMs = settings.cycleMinutes * 60 * 1000;
        timerRef.current = setInterval(flushEvents, cycleMs);

        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
        };
    }, [settings.enabled, settings.cycleMinutes]);

    return (
        <ActivityTrackerContext.Provider value={{ trackEvent, settings, setSettings }}>
            {children}
        </ActivityTrackerContext.Provider>
    );
};
