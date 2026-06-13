import React, { useState } from "react";
import { Sparkles, Mail, Lock, User, ArrowRight } from "lucide-react";
import { useStore } from "../store/useStore";

export default function Auth() {
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("cmo@xenoai.com");
  const [password, setPassword] = useState("password123");

  const login = useStore((state) => state.login);
  const register = useStore((state) => state.register);
  const authLoading = useStore((state) => state.authLoading);
  const authError = useStore((state) => state.authError);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLogin) {
      await login(email, password);
    } else {
      await register(name, email, password);
    }
  };

  const handleDemoFill = () => {
    setEmail("cmo@xenoai.com");
    setPassword("password123");
    setIsLogin(true);
  };

  return (
    <div className="w-screen h-screen flex items-center justify-center bg-[#030303] relative overflow-hidden">
      {/* Background glowing blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Main card */}
      <div className="w-full max-w-md p-8 rounded-2xl glass-panel-glow border-violet-500/20 shadow-2xl relative z-10">
        
        {/* Header logo */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-violet-500/30 mb-3">
            <Sparkles className="w-6 h-6 text-white animate-pulse" />
          </div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            XenoAI Shopper CRM
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Intelligent Shopper Engagement Platform
          </p>
        </div>

        {authError && (
          <div className="mb-4 p-3 rounded-lg bg-rose-950/30 border border-rose-500/20 text-rose-400 text-xs text-center">
            {authError}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {!isLogin && (
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-gray-400 pl-1">Full Name</label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  placeholder="Abhijeet Chattopadhyay"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-violet-500 transition-colors"
                />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-400 pl-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="cmo@xenoai.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-gray-400 pl-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-violet-500 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={authLoading}
            className="w-full mt-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl py-3 text-sm font-semibold flex items-center justify-center gap-2 shadow-lg shadow-violet-500/20 hover:shadow-violet-500/30 transition-all duration-300 disabled:opacity-50"
          >
            {authLoading ? "Initializing..." : isLogin ? "Access Dashboard" : "Create Marketer Profile"}
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Toggle between login and register */}
        <div className="mt-6 text-center text-xs">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-gray-400 hover:text-violet-400 transition-colors font-medium"
          >
            {isLogin
              ? "New here? Create a developer profile"
              : "Already have a profile? Sign In"}
          </button>
        </div>

        {/* Demo Login Assist Banner */}
        <div className="mt-6 pt-4 border-t border-white/5 flex flex-col items-center">
          <span className="text-[10px] text-violet-400 font-bold uppercase tracking-wider mb-2">
            🚀 Quick Demo Access
          </span>
          <button
            onClick={handleDemoFill}
            className="px-4 py-2 rounded-lg bg-violet-950/30 hover:bg-violet-900/40 border border-violet-500/20 text-[11px] font-medium text-violet-300 transition-all duration-300"
          >
            Fill Demo Account (cmo@xenoai.com)
          </button>
        </div>

      </div>
    </div>
  );
}
