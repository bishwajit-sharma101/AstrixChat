// src/layouts/NebulaLayout.jsx
import React from "react";

export default function NebulaLayout({ children }) {
  return (
    <div className="relative min-h-screen w-full bg-[#030014] overflow-hidden text-white font-sans selection:bg-brand-500/30">
      
      {/* 1. THE LIVING BACKGROUND */}
      <div className="absolute top-0 left-0 w-full h-full z-0 pointer-events-none">
        {/* Purple Orb */}
        <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-purple-600/20 blur-[100px] animate-pulse-slow" />
        {/* Blue Orb */}
        <div className="absolute bottom-[10%] right-[-5%] w-[600px] h-[600px] rounded-full bg-blue-600/10 blur-[120px]" />
        {/* Grid Overlay for "Tech" feel */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150" />
      </div>

      {/* 2. GLASS CONTENT WRAPPER */}
      <div className="relative z-10 flex h-screen w-full backdrop-blur-[1px]">
        {children}
      </div>
    </div>
  );
}