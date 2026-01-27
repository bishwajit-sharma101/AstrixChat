import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight, Sparkles, Cpu, Globe } from "lucide-react";
import Hero3D from "../../components/landing/Hero3D"; // Import the 3D blob
import ProblemSection from "../../components/landing/ProblemSection";
import FeatureCoach from "../../components/landing/FeatureCoach";
import FeatureTranslation from "../../components/landing/FeatureTranslation";
import FeatureDiscovery from "../../components/landing/FeatureDiscovery";
import FooterCTA from "../../components/landing/FooterCTA";
export default function LandingPage() {
  return (
    <div className="relative min-h-screen w-full bg-[#030014] text-white overflow-x-hidden selection:bg-brand-500/30">
      
      {/* 1. BACKGROUND NEBULA (Static fallback + 3D) */}
      <div className="fixed inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none z-[1]" />
      <div className="fixed top-[-20%] left-[-10%] w-[600px] h-[600px] bg-purple-600/30 rounded-full blur-[120px] pointer-events-none z-[0]" />
      <div className="fixed bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-blue-600/20 rounded-full blur-[120px] pointer-events-none z-[0]" />
      
      {/* 2. THE 3D HERO ELEMENT */}
      <div className="fixed inset-0 z-[2] flex items-center justify-center">
         <Hero3D /> 
      </div>

      {/* 3. NAVBAR */}
      <nav className="relative z-50 flex items-center justify-between px-8 py-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-2 font-bold text-xl tracking-tight">
           <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-500 to-blue-500 flex items-center justify-center">
             <Sparkles size={16} className="text-white" />
           </div>
           AstrixChat
        </div>
        <div className="hidden md:flex items-center gap-8 text-sm text-slate-300 font-medium">
           <a href="#features" className="hover:text-white transition">Features</a>
           <a href="#security" className="hover:text-white transition">Security</a>
           <Link to="/signin" className="px-5 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition text-white">
             Login
           </Link>
        </div>
      </nav>

      {/* 4. HERO SECTION CONTENT */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-[85vh] text-center px-4">
        
        {/* Status Badge */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-8"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
          <span className="text-xs font-mono text-slate-300">NEURAL ENGINE V2.0 ONLINE</span>
        </motion.div>

        {/* Main Headline */}
        <motion.h1 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-6xl md:text-8xl font-bold tracking-tight mb-6 max-w-4xl mx-auto leading-tight"
        >
          Speak. The Universe <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-blue-400 to-purple-400 animate-gradient">
            Translates.
          </span>
        </motion.h1>

        {/* Subheadline */}
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          The first AI-native communication platform. Real-time voice translation, 
          emotional intelligence coaching, and intent-based discovery. 
          <span className="text-white block mt-2">Communication has evolved.</span>
        </motion.p>

        {/* Call to Action */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8 }}
          className="flex flex-col md:flex-row gap-4"
        >
          <Link 
            to="/chat"
            className="group relative px-8 py-4 bg-white text-black rounded-full font-bold text-lg flex items-center gap-2 hover:scale-105 transition-transform"
          >
            Initialize Interface
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            <div className="absolute inset-0 rounded-full bg-white/50 blur-lg group-hover:blur-xl transition-all opacity-40 -z-10" />
          </Link>
          
          <button className="px-8 py-4 rounded-full border border-white/10 hover:bg-white/5 backdrop-blur-sm transition text-slate-300">
            View Protocol
          </button>
        </motion.div>

        {/* Floating HUD Elements (Decorations) */}
        <div className="absolute left-10 bottom-20 hidden lg:block">
           <div className="p-4 rounded-xl bg-black/40 border border-white/10 backdrop-blur-md flex items-center gap-4">
             <div className="p-3 bg-brand-500/20 rounded-lg"><Cpu size={24} className="text-brand-400" /></div>
             <div className="text-left">
               <div className="text-xs text-slate-400 uppercase">Processing</div>
               <div className="font-mono text-sm">120ms Latency</div>
             </div>
           </div>
        </div>

        <div className="absolute right-10 bottom-40 hidden lg:block">
           <div className="p-4 rounded-xl bg-black/40 border border-white/10 backdrop-blur-md flex items-center gap-4">
             <div className="p-3 bg-blue-500/20 rounded-lg"><Globe size={24} className="text-blue-400" /></div>
             <div className="text-left">
               <div className="text-xs text-slate-400 uppercase">Global Nodes</div>
               <div className="font-mono text-sm">Active</div>
             </div>
           </div>
        </div>

      </main>

      <ProblemSection />
      <FeatureCoach />
      <FeatureTranslation/>
      <FeatureDiscovery/>
      <FooterCTA/>
      {/* 5. SCROLL TEASER */}
      <motion.div 
        animate={{ y: [0, 10, 0] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="absolute bottom-10 left-1/2 -translate-x-1/2 text-slate-500 text-sm flex flex-col items-center gap-2"
      >
        <span className="text-[10px] uppercase tracking-widest">Scroll to Decrypt</span>
        <div className="w-[1px] h-12 bg-gradient-to-b from-slate-500 to-transparent"></div>
      </motion.div>

    </div>
  );
}