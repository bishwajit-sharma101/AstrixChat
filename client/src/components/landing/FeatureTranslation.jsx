import React from "react";
import { motion } from "framer-motion";
import { Mic, Globe, MoveRight, AudioLines } from "lucide-react";

const AudioWave = ({ color, delay }) => (
  <div className="flex items-center gap-1 h-12">
    {[...Array(20)].map((_, i) => (
      <motion.div
        key={i}
        className={`w-1 rounded-full ${color}`}
        animate={{ 
            height: [10, Math.random() * 40 + 10, 10],
            opacity: [0.5, 1, 0.5] 
        }}
        transition={{ 
            duration: 1.5, 
            repeat: Infinity, 
            ease: "easeInOut", 
            delay: i * 0.1 + delay 
        }}
      />
    ))}
  </div>
);

export default function FeatureTranslation() {
  return (
    <section className="py-40 relative bg-[#030014] overflow-hidden">
      
      {/* Background Decor */}
      <div className="absolute right-0 top-1/4 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px]" />

      <div className="max-w-7xl mx-auto px-6">
        
        {/* SECTION HEADER */}
        <div className="text-center mb-24 relative z-10">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-300 text-xs font-mono mb-6"
          >
            <Globe size={14} /> GLOBAL NEURAL LINK
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold mb-6"
          >
            Language is <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400">
              no longer a barrier.
            </span>
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-slate-400 text-lg max-w-2xl mx-auto"
          >
            Real-time audio-to-audio translation that preserves your emotional tone.
            Speak Hindi, they hear Spanish. The feeling remains the same.
          </motion.p>
        </div>


        {/* THE VISUALIZATION */}
        <div className="relative max-w-5xl mx-auto">
            
            {/* The Glass Container */}
            <div className="relative bg-white/5 border border-white/10 rounded-3xl p-8 md:p-12 backdrop-blur-md overflow-hidden">
                
                {/* Grid Pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px] opacity-20 pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 md:gap-0">
                    
                    {/* LEFT: INPUT (HINDI) */}
                    <motion.div 
                        initial={{ opacity: 0, x: -50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="flex flex-col items-center gap-4"
                    >
                        <div className="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/30 text-orange-300">
                            <Mic size={24} />
                        </div>
                        <div className="text-sm font-mono text-slate-400">INPUT: HINDI</div>
                        <AudioWave color="bg-orange-500" delay={0} />
                    </motion.div>

                    {/* CENTER: THE PRISM (PROCESSOR) */}
                    <div className="relative">
                        <motion.div 
                            animate={{ rotate: 360 }}
                            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                            className="w-32 h-32 rounded-full border border-white/10 flex items-center justify-center relative"
                        >
                            <div className="absolute inset-0 border-t border-brand-500/50 rounded-full blur-[2px]" />
                            <div className="w-24 h-24 rounded-full bg-brand-500/10 backdrop-blur-xl border border-white/20 flex items-center justify-center shadow-[0_0_50px_rgba(139,92,246,0.3)]">
                                <AudioLines size={32} className="text-brand-400" />
                            </div>
                        </motion.div>
                        
                        {/* Flow Arrows */}
                        <div className="absolute top-1/2 left-[-60px] -translate-y-1/2 text-slate-600 hidden md:block">
                            <MoveRight size={24} className="animate-pulse" />
                        </div>
                        <div className="absolute top-1/2 right-[-60px] -translate-y-1/2 text-slate-600 hidden md:block">
                            <MoveRight size={24} className="animate-pulse" />
                        </div>
                    </div>

                    {/* RIGHT: OUTPUT (SPANISH) */}
                    <motion.div 
                        initial={{ opacity: 0, x: 50 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="flex flex-col items-center gap-4"
                    >
                        <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 text-blue-300">
                            <Globe size={24} />
                        </div>
                        <div className="text-sm font-mono text-slate-400">OUTPUT: SPANISH</div>
                        {/* Same Wave Shape (Emotion), Different Color (Language) */}
                        <AudioWave color="bg-blue-400" delay={0.5} />
                    </motion.div>

                </div>

                {/* Bottom Label */}
                <div className="mt-12 text-center">
                    <div className="inline-block px-4 py-2 rounded-lg bg-black/40 border border-white/5 text-xs text-slate-500 font-mono">
                        EMOTIONAL PRESERVATION: 99.8% ACCURACY
                    </div>
                </div>

            </div>
        </div>

      </div>
    </section>
  );
}