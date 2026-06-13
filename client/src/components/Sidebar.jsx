import React from "react";
import { 
  LayoutDashboard, 
  Users, 
  Layers, 
  Send, 
  BarChart3, 
  MessageSquare, 
  LogOut,
  Sparkles
} from "lucide-react";
import { useStore } from "../store/useStore";

export default function Sidebar() {
  const activeTab = useStore((state) => state.activeTab);
  const setActiveTab = useStore((state) => state.setActiveTab);
  const user = useStore((state) => state.user);
  const logout = useStore((state) => state.logout);

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "customers", label: "Customers", icon: Users },
    { id: "segments", label: "Smart Segments", icon: Layers },
    { id: "campaigns", label: "Campaign Builder", icon: Send },
    { id: "analytics", label: "Analytics Hub", icon: BarChart3 },
    { id: "aichat", label: "XenoAI Assistant", icon: MessageSquare, badge: "AI" },
  ];

  return (
    <div className="w-64 border-r border-white/5 h-screen flex flex-col justify-between glass-panel select-none">
      {/* Header / Brand */}
      <div>
        <div className="p-6 flex items-center gap-3 border-b border-white/5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-violet-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
            <Sparkles className="w-5 h-5 text-white animate-pulse" />
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              XenoAI
            </span>
            <span className="text-[10px] block text-violet-400 font-bold tracking-widest uppercase -mt-0.5">
              CRM Platform
            </span>
          </div>
        </div>

        {/* Menu Items */}
        <div className="p-4 flex flex-col gap-1.5 mt-4">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-300 font-medium text-sm group ${
                  isActive
                    ? "bg-violet-600/15 border border-violet-500/30 text-violet-300 shadow-inner"
                    : "text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-transparent"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4.5 h-4.5 transition-transform duration-300 ${
                    isActive ? "text-violet-400 scale-105" : "text-gray-500 group-hover:text-gray-400"
                  }`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[9px] px-1.5 py-0.5 font-extrabold bg-violet-500/20 text-violet-400 border border-violet-500/30 rounded-md tracking-wider">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* User Footer Profile */}
      <div className="p-4 border-t border-white/5 bg-black/20">
        <div className="flex items-center gap-3 mb-3 p-2 rounded-xl">
          <div className="w-9 h-9 rounded-xl bg-violet-900/30 border border-violet-500/20 flex items-center justify-center font-bold text-violet-400 text-sm">
            {user?.name?.split(" ").map(n => n[0]).join("") || "AC"}
          </div>
          <div className="flex-1 overflow-hidden">
            <h4 className="text-xs font-semibold text-gray-200 truncate leading-none">
              {user?.name || "Marketer Account"}
            </h4>
            <span className="text-[10px] text-gray-500 truncate block mt-0.5">
              {user?.email || "cmo@xenoai.com"}
            </span>
          </div>
        </div>

        <button
          onClick={logout}
          className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg border border-white/5 hover:border-rose-500/20 hover:bg-rose-950/20 text-xs text-gray-500 hover:text-rose-400 transition-all duration-300"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Disconnect Session</span>
        </button>
      </div>
    </div>
  );
}
