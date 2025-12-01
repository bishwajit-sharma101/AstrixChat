// src/pages/auth/Signin.jsx
import React, { useState } from "react";
import axios from "axios";
import { useNavigate, Link } from 'react-router-dom'; 
import { motion } from "framer-motion";
import { Lock, Mail, ArrowRight, Sparkles } from "lucide-react";

const Signin = () => {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // NOTE: Ensure your API URL is correct
      let response = await axios.post(
        "http://localhost:5000/api/v1/auth/login",
        formData,
        { withCredentials: true }
      );

      console.log("Login success:", response.data);
      setFormData({ email: '', password: '' });
      
      // Simulate a small delay for the "premium feel" loading state
      setTimeout(() => {
          navigate("/chat");
      }, 800);
      
    } catch (error) {
      console.log("Login failed:", error.response?.data || error.message);
      alert(error.response?.data?.message || "Login failed");
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full bg-[#030014] flex items-center justify-center overflow-hidden font-sans selection:bg-brand-500/30">
      
      {/* --- BACKGROUND FX --- */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />
      {/* The "Portal" Glow behind the card */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-brand-600/20 rounded-full blur-[100px] pointer-events-none animate-pulse-slow" />
      
      {/* --- MAIN CARD --- */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md p-1"
      >
        {/* Border Gradient Wrapper */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-transparent rounded-2xl pointer-events-none" />
        
        <div className="relative bg-[#0b0b15]/80 backdrop-blur-2xl border border-white/5 shadow-2xl shadow-black/50 rounded-2xl p-8 md:p-10">
          
          {/* Header */}
          <div className="text-center mb-10">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-brand-500/10 border border-brand-500/20 mb-4 text-brand-400">
                <Sparkles size={24} />
            </div>
            <h2 className="text-3xl font-bold text-white tracking-tight mb-2">Welcome Back</h2>
            <p className="text-slate-400 text-sm">Enter the Astrix Neural Network.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* EMAIL INPUT */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider ml-1">Email</label>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-brand-400 transition-colors">
                    <Mail size={18} />
                </div>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="name@example.com"
                  className="w-full bg-[#13131f] border border-white/10 text-white text-sm rounded-xl py-3.5 pl-10 pr-4 placeholder:text-slate-600 outline-none focus:border-brand-500/50 focus:bg-brand-500/5 transition-all duration-300"
                />
              </div>
            </div>

            {/* PASSWORD INPUT */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider ml-1">Password</label>
              <div className="relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-brand-400 transition-colors">
                    <Lock size={18} />
                </div>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength="6"
                  placeholder="••••••••"
                  className="w-full bg-[#13131f] border border-white/10 text-white text-sm rounded-xl py-3.5 pl-10 pr-4 placeholder:text-slate-600 outline-none focus:border-brand-500/50 focus:bg-brand-500/5 transition-all duration-300"
                />
              </div>
            </div>

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full relative group overflow-hidden bg-white text-black font-bold py-3.5 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none mt-4"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-brand-200 to-brand-100 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative flex items-center justify-center gap-2">
                 {isLoading ? (
                    <span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                 ) : (
                    <>
                        <span>Authenticate</span>
                        <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </>
                 )}
              </div>
            </button>

          </form>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-white/5 text-center">
            <p className="text-slate-500 text-sm">
              Don't have an identity?{' '}
              <Link to="/signup" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">
                Initialize Protocol
              </Link>
            </p>
          </div>

        </div>
      </motion.div>
    </div>
  );
};

export default Signin;