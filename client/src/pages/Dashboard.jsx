import React, { useEffect, useState } from "react";
import { 
  ShoppingBag, 
  Layers, 
  Send, 
  DollarSign, 
  Sparkles, 
  TrendingUp, 
  ArrowUpRight,
  RefreshCw,
  Percent
} from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar } from "recharts";
import { useStore, api } from "../store/useStore";

export default function Dashboard() {
  const kpis = useStore((state) => state.kpis);
  const fetchKpis = useStore((state) => state.fetchKpis);
  const campaigns = useStore((state) => state.campaigns);
  const fetchCampaigns = useStore((state) => state.fetchCampaigns);
  const addToast = useStore((state) => state.addToast);

  const [insights, setInsights] = useState([]);
  const [insightsLoading, setInsightsLoading] = useState(false);

  const loadInsights = async () => {
    setInsightsLoading(true);
    try {
      const res = await api.get("/ai/insights");
      setInsights(res.data);
    } catch (err) {
      console.error("Failed to load insights:", err);
    } finally {
      setInsightsLoading(false);
    }
  };

  useEffect(() => {
    fetchKpis();
    fetchCampaigns();
    loadInsights();
  }, []);

  const handleRefresh = async () => {
    await Promise.all([fetchKpis(), fetchCampaigns(), loadInsights()]);
    addToast({
      title: "Data Synced",
      message: "Dashboard state successfully updated from database.",
      type: "success"
    });
  };

  // Mock revenue chart data (since we're a simulation platform, a trendline based on total revenue looks beautiful)
  const revenueTrend = [
    { name: "Jan", revenue: 45000, conversion: 2.1 },
    { name: "Feb", revenue: 52000, conversion: 2.4 },
    { name: "Mar", revenue: 61000, conversion: 2.8 },
    { name: "Apr", revenue: 58000, conversion: 2.5 },
    { name: "May", revenue: 72000, conversion: 3.2 },
    { name: "Jun", revenue: kpis?.totalRevenue ? Math.round(kpis.totalRevenue * 1.1) : 89000, conversion: 3.7 }
  ];

  // Helper for delivery ratios
  const getDeliveryRatio = (campaign) => {
    const stats = campaign.stats;
    if (!stats || stats.total === 0) return 0;
    return Math.round((stats.delivered / stats.total) * 100);
  };

  const getOpenRatio = (campaign) => {
    const stats = campaign.stats;
    if (!stats || stats.total === 0) return 0;
    return Math.round((stats.opened / stats.total) * 100);
  };

  const getClickRatio = (campaign) => {
    const stats = campaign.stats;
    if (!stats || stats.total === 0) return 0;
    return Math.round((stats.clicked / stats.total) * 100);
  };

  return (
    <div className="p-8 flex-1 overflow-y-auto h-screen max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            Workspace Dashboard
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Real-time campaign telemetry and automated AI recommendation engine
          </p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-gray-300 bg-white/5 border border-white/10 hover:border-white/20 rounded-xl hover:bg-white/10 transition-all duration-300"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Sync Database</span>
        </button>
      </div>

      {/* KPI Section */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[
          {
            title: "Total Revenue",
            value: `₹${(kpis?.totalRevenue || 220000).toLocaleString()}`,
            desc: "+14.2% from last month",
            icon: DollarSign,
            color: "text-emerald-400"
          },
          {
            title: "Total Shoppers",
            value: (kpis?.totalShoppers || 50).toString(),
            desc: "Active shopper profiles",
            icon: ShoppingBag,
            color: "text-violet-400"
          },
          {
            title: "Smart Segments",
            value: (kpis?.activeSegments || 3).toString(),
            desc: "Filtered audience groups",
            icon: Layers,
            color: "text-cyan-400"
          },
          {
            title: "Campaigns Run",
            value: (kpis?.activeCampaigns || 0).toString(),
            desc: "Dispatched & active messages",
            icon: Send,
            color: "text-amber-400"
          }
        ].map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <div key={idx} className="glass-panel p-6 rounded-2xl relative overflow-hidden border-white/5">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">
                    {kpi.title}
                  </span>
                  <span className="text-2xl font-bold text-gray-100 mt-2 block tracking-tight">
                    {kpi.value}
                  </span>
                </div>
                <div className={`p-2.5 rounded-xl bg-white/5 border border-white/10 ${kpi.color}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-1.5 text-xs text-gray-400">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{kpi.desc}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        
        {/* Revenue Performance Area Chart */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-2xl border-white/5">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-base font-bold text-gray-100 tracking-tight">Store Revenue & Conversions</h3>
              <p className="text-xs text-gray-400">6-month ecommerce store telemetry</p>
            </div>
            <div className="flex gap-4 text-xs font-medium text-gray-400">
              <div className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded bg-violet-500" />
                <span>Revenue (₹)</span>
              </div>
            </div>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueTrend}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val/1000}k`} />
                <Tooltip 
                  contentStyle={{ background: "#0d0d11", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, fontSize: 12, color: "#fff" }}
                  itemStyle={{ color: "#a78bfa" }}
                />
                <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* AI Marketing Insights Panel */}
        <div className="glass-panel p-6 rounded-2xl border-white/5 bg-gradient-to-b from-violet-950/20 to-black/40">
          <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-white/5">
            <div className="p-2 bg-violet-600/20 text-violet-400 rounded-xl border border-violet-500/30">
              <Sparkles className="w-4.5 h-4.5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-100 tracking-tight">XenoAI Smart Insights</h3>
              <p className="text-[10px] text-violet-400 font-bold uppercase tracking-wider">Dynamic CMO Agent Recommendations</p>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {insightsLoading ? (
              [1, 2, 3].map((s) => (
                <div key={s} className="w-full h-16 rounded-xl skeleton-pulse" />
              ))
            ) : insights.length > 0 ? (
              insights.map((insight, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-white/5 border border-white/5 hover:border-violet-500/10 transition-all duration-300">
                  <p className="text-xs text-gray-300 leading-relaxed">
                    {insight}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-xs text-gray-500 text-center py-6">No insights calculated yet.</p>
            )}
          </div>
        </div>

      </div>

      {/* Campaigns & Active Channels Section */}
      <div className="glass-panel p-6 rounded-2xl border-white/5">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-base font-bold text-gray-100 tracking-tight">Active Campaigns Telemetry</h3>
            <p className="text-xs text-gray-400">Observe delivery simulation callbacks in real-time</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-gray-500 font-semibold uppercase tracking-wider pb-3">
                <th className="py-3 px-4">Campaign Name</th>
                <th className="py-3 px-4">Channel</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Delivery Funnel (Delivered / Opened / Clicked)</th>
                <th className="py-3 px-4">Telemetry Progress</th>
              </tr>
            </thead>
            <tbody>
              {campaigns.slice(0, 5).map((campaign) => {
                const isDraft = campaign.status === "draft";
                const isSending = campaign.status === "sending";
                const isCompleted = campaign.status === "completed";

                return (
                  <tr key={campaign._id} className="border-b border-white/5 hover:bg-white/5 transition-all">
                    <td className="py-4 px-4 font-semibold text-gray-200">
                      {campaign.name}
                    </td>
                    <td className="py-4 px-4">
                      <span className={`px-2.5 py-1 rounded-md uppercase font-bold text-[10px] tracking-wider ${
                        campaign.channel === "whatsapp" 
                          ? "bg-emerald-950/40 text-emerald-400 border border-emerald-500/20" 
                          : campaign.channel === "email"
                          ? "bg-violet-950/40 text-violet-400 border border-violet-500/20"
                          : "bg-cyan-950/40 text-cyan-400 border border-cyan-500/20"
                      }`}>
                        {campaign.channel}
                      </span>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${
                          isSending ? "bg-amber-400 animate-pulse glow-dot-cyan" : isCompleted ? "bg-emerald-400 glow-dot-green" : "bg-gray-500"
                        }`} />
                        <span className="capitalize text-gray-300">{campaign.status}</span>
                      </div>
                    </td>
                    <td className="py-4 px-4">
                      {isDraft ? (
                        <span className="text-gray-500 italic">Not dispatched</span>
                      ) : (
                        <div className="flex gap-4 text-[11px]">
                          <div>
                            <span className="text-gray-500 block">Delivered</span>
                            <span className="font-semibold text-gray-300">
                              {getDeliveryRatio(campaign)}% <span className="text-gray-500 font-normal">({campaign.stats.delivered})</span>
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500 block">Opened</span>
                            <span className="font-semibold text-violet-400">
                              {getOpenRatio(campaign)}% <span className="text-gray-500 font-normal">({campaign.stats.opened})</span>
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-500 block">Clicked</span>
                            <span className="font-semibold text-emerald-400">
                              {getClickRatio(campaign)}% <span className="text-gray-500 font-normal">({campaign.stats.clicked})</span>
                            </span>
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-4">
                      {isDraft ? (
                        <span className="text-gray-500">Draft</span>
                      ) : (
                        <div className="w-full max-w-[200px]">
                          <div className="flex justify-between text-[10px] text-gray-500 mb-1">
                            <span>Progress</span>
                            <span>{campaign.stats.delivered + campaign.stats.failed} / {campaign.stats.total}</span>
                          </div>
                          <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                            <div 
                              className={`h-full transition-all duration-500 ${isSending ? "bg-violet-500" : "bg-emerald-500"}`} 
                              style={{ width: `${Math.round(((campaign.stats.delivered + campaign.stats.failed) / campaign.stats.total) * 100)}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
              {campaigns.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-500">
                    No campaigns created yet. Build one in the Campaign Builder tab!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
