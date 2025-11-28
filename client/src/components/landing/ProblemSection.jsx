import React, { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { MessageSquareOff } from "lucide-react";

// Bubble: Controls opacity and blur based on input transforms
const GhostBubble = ({ text, align, inProgress, outProgress }) => (
  <motion.div
    style={{ 
      opacity: useTransform(inProgress, [0, 1], [0, 1]), // Fade In
      filter: useTransform(inProgress, [0, 1], ["blur(10px)", "blur(0px)"]), // Unblur
    }} 
    className={`flex w-full ${align === "right" ? "justify-end" : "justify-start"} mb-16 relative`}
  >
    {/* The wrapper that handles the "Exit" animation */}
    <motion.div 
        style={{ 
            opacity: useTransform(outProgress, [0, 1], [1, 0]), // Fade Out
            filter: useTransform(outProgress, [0, 1], ["blur(0px)", "blur(10px)"]), // Re-blur
        }}
        className={`relative px-8 py-6 rounded-2xl max-w-lg text-xl md:text-3xl font-medium tracking-wide border backdrop-blur-sm
        ${align === "right" 
            ? "bg-slate-800/40 text-slate-200 rounded-tr-sm border-slate-700/50" 
            : "bg-slate-900/40 text-slate-300 rounded-tl-sm border-slate-800/50"
        }`}
    >
      {text}
    </motion.div>
  </motion.div>
);

export default function ProblemSection() {
  const containerRef = useRef(null);
  
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  // --- 1. ENTER SEQUENCE (One by One) ---
  // Scroll 0% to 30%: Bubbles appear
  const in1 = useTransform(scrollYProgress, [0.00, 0.10], [0, 1]);
  const in2 = useTransform(scrollYProgress, [0.05, 0.15], [0, 1]);
  const in3 = useTransform(scrollYProgress, [0.10, 0.20], [0, 1]);
  const in4 = useTransform(scrollYProgress, [0.15, 0.25], [0, 1]);

  // --- 2. THE BEAM & EXIT SEQUENCE ---
  // Scroll 30% to 70%: Beam moves down, bubbles blur out
  const beamY = useTransform(scrollYProgress, [0.3, 0.7], ["-10%", "110%"]);
  
  const out1 = useTransform(scrollYProgress, [0.35, 0.40], [0, 1]);
  const out2 = useTransform(scrollYProgress, [0.45, 0.50], [0, 1]);
  const out3 = useTransform(scrollYProgress, [0.55, 0.60], [0, 1]);
  const out4 = useTransform(scrollYProgress, [0.65, 0.70], [0, 1]);

  // --- 3. REVEAL & DISAPPEAR ---
  // Scroll 75% to 85%: Clarity Fades IN
  // Scroll 90% to 98%: Clarity Fades OUT (Clean exit)
  const revealOpacity = useTransform(scrollYProgress, [0.75, 0.85, 0.90, 0.98], [0, 1, 1, 0]);
  const revealScale = useTransform(scrollYProgress, [0.75, 0.85], [0.8, 1]);
  
  // Background darkness: only darkens during the reveal
  const bgDarkness = useTransform(scrollYProgress, [0.7, 0.85, 0.95], ["rgba(3,0,20,0)", "rgba(3,0,20,0.9)", "rgba(3,0,20,0)"]);

  return (
    <section ref={containerRef} className="relative h-[400vh] bg-[#030014] z-20">
      
      <div className="sticky top-0 h-screen w-full overflow-hidden flex flex-col items-center justify-center">
        
        {/* Dynamic Background Overlay */}
        <motion.div style={{ backgroundColor: bgDarkness }} className="absolute inset-0 z-0 pointer-events-none" />

        {/* BUBBLES CONTAINER */}
        <div className="w-full max-w-5xl px-6 relative z-10 mt-20">
            <GhostBubble text="I don't know how to say this..." align="left" inProgress={in1} outProgress={out1} />
            <GhostBubble text="What do you mean?" align="right" inProgress={in2} outProgress={out2} />
            
            <motion.div 
                style={{ opacity: useTransform(out3, [0, 1], [1, 0]) }} 
                className="flex justify-center my-10 opacity-30"
            >
               <MessageSquareOff size={50} className="text-slate-600" />
            </motion.div>

            <GhostBubble text="Forget it." align="left" inProgress={in3} outProgress={out3} />
            <GhostBubble text="Can we talk later?" align="right" inProgress={in4} outProgress={out4} />
        </div>

        {/* THE LASER BEAM */}
        <motion.div 
            style={{ top: beamY }}
            className="absolute left-0 right-0 h-[3px] z-30 shadow-[0_0_60px_rgba(168,85,247,1)]"
        >
            <div className="w-full h-full bg-gradient-to-r from-transparent via-brand-400 to-transparent" />
        </motion.div>

        {/* THE REVEAL (Centered Perfectly) */}
        <motion.div 
            style={{ opacity: revealOpacity, scale: revealScale }}
            className="absolute inset-0 z-40 flex flex-col items-center justify-center text-center pointer-events-none"
        >
            <div className="p-10">
                <h2 className="text-7xl md:text-9xl font-bold tracking-tighter text-white mb-6">
                  Enter <span className="text-brand-400">Clarity.</span>
                </h2>
                <p className="text-xl text-slate-300 tracking-widest uppercase">Communication evolved.</p>
            </div>
        </motion.div>

      </div>
    </section>
  );
}