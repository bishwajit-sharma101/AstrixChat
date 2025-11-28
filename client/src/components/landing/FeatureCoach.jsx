import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Sparkles, Bot, Send } from "lucide-react";

export default function FeatureCoach() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: false, margin: "-20%" });

  return (
    <section className="py-32 relative bg-[#030014] z-20 overflow-hidden">
      
      <div className="max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-20 items-center">
        
        {/* LEFT: The Copy */}
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="relative z-10"
        >
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-xs font-mono mb-6">
            <Bot size={14} /> LIVE COACHING ENGINE
          </div>
          <h2 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Never second-guess <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-purple-600">
              your words.
            </span>
          </h2>
          <p className="text-slate-400 text-lg mb-8 leading-relaxed max-w-md">
            The built-in AI Coach analyzes tone, sentiment, and clarity in real-time. 
            Turn hesitation into confidence with a single tap.
          </p>
        </motion.div>


        {/* RIGHT: The Live Demo Animation */}
        <div ref={ref} className="relative">
            {/* Background Glow */}
            <div className="absolute inset-0 bg-brand-600/20 blur-[100px] rounded-full" />
            
            {/* The Floating Glass Phone */}
            <motion.div 
                initial={{ y: 50, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                className="relative bg-black/40 backdrop-blur-xl border border-white/10 rounded-3xl p-6 shadow-2xl overflow-hidden"
            >
                {/* Header */}
                <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-brand-500 to-blue-500" />
                        <div>
                            <div className="font-semibold text-white">Sarah</div>
                            <div className="text-xs text-brand-400">Neural Link Active</div>
                        </div>
                    </div>
                </div>

                {/* Message Area */}
                <div className="space-y-4 mb-8">
                    <div className="bg-white/5 p-4 rounded-2xl rounded-tl-sm max-w-[80%] text-slate-300 text-sm">
                        Are you free tonight?
                    </div>
                    
                    {/* THE MAGIC TRANSFORMATION */}
                    <div className="relative">
                        {/* 1. The Bad Input (Fades out) */}
                        <motion.div 
                            initial={{ opacity: 1 }}
                            animate={isInView ? { opacity: 0 } : {}}
                            transition={{ delay: 2, duration: 0.5 }}
                            className="bg-brand-500/10 border border-brand-500/20 p-4 rounded-2xl rounded-tr-sm self-end ml-auto max-w-[80%] text-white text-sm"
                        >
                            idk if i can go
                        </motion.div>

                        {/* 2. The AI Rewrite (Fades in + Glow) */}
                        <motion.div 
                             initial={{ opacity: 0, scale: 0.95 }}
                             animate={isInView ? { opacity: 1, scale: 1 } : {}}
                             transition={{ delay: 2.5, duration: 0.5 }}
                             className="absolute top-0 right-0 bg-gradient-to-r from-brand-600 to-purple-600 p-4 rounded-2xl rounded-tr-sm max-w-[90%] text-white shadow-[0_0_30px_rgba(139,92,246,0.4)] text-sm flex items-center gap-3"
                        >
                             <div>
                                I'm debating if I should go. What do you think?
                             </div>
                             <Sparkles size={16} className="text-yellow-300 animate-pulse" />
                        </motion.div>
                    </div>
                </div>

                {/* Input Area Decoration */}
                <div className="flex items-center gap-3 opacity-50">
                    <div className="flex-1 h-10 bg-white/5 rounded-full" />
                    <div className="p-3 bg-brand-600 rounded-full">
                        <Send size={16} />
                    </div>
                </div>

                {/* The "AI Thinking" Cursor */}
                {isInView && (
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 1, 0] }}
                        transition={{ delay: 1.5, duration: 1 }}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/80 backdrop-blur-md px-4 py-2 rounded-lg border border-brand-500/30 text-xs font-mono text-brand-300 flex items-center gap-2"
                    >
                        <Bot size={12} /> REWRITING TONE...
                    </motion.div>
                )}

            </motion.div>
        </div>
      </div>
    </section>
  );
}