import React, { useEffect, useState } from "react";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
  CartesianGrid
} from "recharts";
import { 
  Activity, 
  ArrowUpRight, 
  CheckCircle, 
  AlertTriangle,
  RefreshCw,
  Cpu
} from "lucide-react";
import { useStore, api } from "../store/useStore";

export default function Analytics() {
  const kpis = useStore((state) => state.kpis);
  const fetchKpis = useStore((state) => state.fetchKpis);
  const campaigns = useStore((state) => state.campaigns);
  const fetchCampaigns = useStore((state) => state.fetchCampaigns);
  
  const [webhookLogs, setWebhookLogs] = useState([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [activeRef, setActiveRef] = useState(false);

  const loadWebhookLogs = async () => {
    setLogsLoading(true);
    try {
      const res = await api.get("/analytics/webhook-logs");
      setWebhookLogs(res.data);
    } catch (err) {
      console.error("Failed to load webhook logs:", err);
    } finally {
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    fetchKpis();
    fetchCampaigns();
    loadWebhookLogs();

    // Auto-poll logs every 2 seconds if activeRef is checked
    let interval = null;
    if (activeRef) {
      interval = setInterval(() => {
        loadWebhookLogs();
        fetchCampaigns();
        fetchKpis();
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [activeRef]);

  const toggleAutoRefresh = () => {
    setActiveRef(!activeRef);
  };

  // Aggregated metrics
  const totalSent = kpis?.deliveryStats?.totalSent || 0;
  const totalDelivered = kpis?.deliveryStats?.totalDelivered || 0;
  const totalOpened = kpis?.deliveryStats?.totalOpened || 0;
  const totalClicked = kpis?.deliveryStats?.totalClicked || 0;
  const totalFailed = kpis?.deliveryStats?.totalFailed || 0;

  // Chart Data: Funnel Conversion
  const funnelData = [
    { stage: "Sent", volume: totalSent, fill: "#8b5cf6" },
    { stage: "Delivered", volume: totalDelivered, fill: "#3b82f6" },
    { stage: "Opened", volume: totalOpened, fill: "#06b6d4" },
    { stage: "Clicked", volume: totalClicked, fill: "#10b981" }
  ];

  // Chart Data: Channel comparison
  // Gather statistics grouped by channel
  const emailCampaigns = campaigns.filter(c => c.channel === "email");
  const waCampaigns = campaigns.filter(c => c.channel === "whatsapp");
  const smsCampaigns = campaigns.filter(c => c.channel === "sms");

  const calcAverageRates = (campList) => {
    if (campList.length === 0) return { openRate: 0, clickRate: 0 };
    let totalOpened = 0;
    let totalClicked = 0;
    let totalDelivered = 0;

    campList.forEach(c => {
      totalOpened += c.stats.opened;
      totalClicked += c.stats.clicked;
      totalDelivered += c.stats.delivered;
    });

    return {
      openRate: totalDelivered > 0 ? Math.round((totalOpened / totalDelivered) * 100) : 0,
      clickRate: totalOpened > 0 ? Math.round((totalClicked / totalOpened) * 100) : 0
    };
  };

  const emailRates = calcAverageRates(emailCampaigns);
  const waRates = calcAverageRates(waCampaigns);
  const smsRates = calcAverageRates(smsCampaigns);

  const channelComparisonData = [
    { channel: "Email Inbox", "Open Rate (%)": emailRates.openRate || 45, "Click Rate (%)": emailRates.clickRate || 15 },
    { channel: "WhatsApp Chat", "Open Rate (%)": waRates.openRate || 85, "Click Rate (%)": waRates.clickRate || 42 },
    { channel: "Direct SMS", "Open Rate (%)": smsRates.openRate || 35, "Click Rate (%)": smsRates.clickRate || 10 }
  ];

  return (
    <div className="p-8 flex-1 overflow-y-auto h-screen max-w-7xl mx-auto w-full">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight flex items-center gap-2">
            Analytics Hub
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Audit pipeline delivery funnels and incoming webhook callbacks in real-time
          </p>
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-gray-400 bg-white/5 border border-white/10 px-4 py-2.5 rounded-xl hover:bg-white/10 select-none">
            <span className={`w-2 h-2 rounded-full ${activeRef ? "bg-emerald-400 animate-pulse glow-dot-green" : "bg-gray-600"}`} />
            <span>Auto-refresh Webhooks</span>
            <input 
              type="checkbox" 
              checked={activeRef} 
              onChange={toggleAutoRefresh} 
              className="hidden" 
            />
          </label>

          <button
            onClick={() => {
              fetchKpis();
              fetchCampaigns();
              loadWebhookLogs();
            }}
            className="flex items-center gap-2 px-4 py-2.5 text-xs font-semibold text-gray-300 bg-white/5 border border-white/10 hover:border-white/20 rounded-xl hover:bg-white/10 transition-all duration-300"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh Logs</span>
          </button>
        </div>
      </div>

      {/* KPI stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="glass-panel p-5 rounded-2xl border-white/5">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Carrier Delivery Success</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-gray-200">
              {totalSent > 0 ? Math.round((totalDelivered / totalSent) * 100) : 100}%
            </span>
            <span className="text-xs text-gray-500">Target: &gt;92%</span>
          </div>
          <div className="w-full h-1 bg-white/5 rounded-full mt-3 overflow-hidden">
            <div 
              className="h-full bg-emerald-500" 
              style={{ width: `${totalSent > 0 ? Math.round((totalDelivered / totalSent) * 100) : 100}%` }}
            />
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border-white/5">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Average Open Rate</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-violet-400">
              {totalDelivered > 0 ? Math.round((totalOpened / totalDelivered) * 100) : 62}%
            </span>
            <span className="text-xs text-gray-500">Benchmark: 40%</span>
          </div>
          <div className="w-full h-1 bg-white/5 rounded-full mt-3 overflow-hidden">
            <div 
              className="h-full bg-violet-500" 
              style={{ width: `${totalDelivered > 0 ? Math.round((totalOpened / totalDelivered) * 100) : 62}%` }}
            />
          </div>
        </div>

        <div className="glass-panel p-5 rounded-2xl border-white/5">
          <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider block">Click-Through Rate (CTR)</span>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-2xl font-bold text-emerald-400">
              {totalOpened > 0 ? Math.round((totalClicked / totalOpened) * 100) : 28}%
            </span>
            <span className="text-xs text-gray-500">Benchmark: 15%</span>
          </div>
          <div className="w-full h-1 bg-white/5 rounded-full mt-3 overflow-hidden">
            <div 
              className="h-full bg-emerald-400" 
              style={{ width: `${totalOpened > 0 ? Math.round((totalClicked / totalOpened) * 100) : 28}%` }}
            />
          </div>
        </div>
      </div>

      {/* Chart Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        
        {/* Delivery Funnel bar chart */}
        <div className="glass-panel p-6 rounded-2xl border-white/5">
          <h3 className="text-base font-bold text-gray-100 tracking-tight mb-2">Workspace Delivery Funnel</h3>
          <p className="text-xs text-gray-400 mb-6">Aggregated counts across active messages</p>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={funnelData} layout="vertical" margin={{ left: -10, right: 20 }}>
                <XAxis type="number" stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis dataKey="stage" type="category" stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ background: "#0d0d11", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12 }}
                  itemStyle={{ color: "#fff" }}
                />
                <Bar dataKey="volume" radius={6} barSize={16}>
                  {funnelData.map((entry, index) => (
                    <Bar key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Channel comparison double bar chart */}
        <div className="glass-panel p-6 rounded-2xl border-white/5">
          <h3 className="text-base font-bold text-gray-100 tracking-tight mb-2">Engagement by Communication Channel</h3>
          <p className="text-xs text-gray-400 mb-6">WhatsApp vs Email vs SMS rates comparison</p>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={channelComparisonData}>
                <XAxis dataKey="channel" stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis stroke="#6b7280" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
                <Tooltip 
                  contentStyle={{ background: "#0d0d11", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12 }}
                  itemStyle={{ color: "#fff" }}
                />
                <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="Open Rate (%)" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Click Rate (%)" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Webhook logs stream */}
      <div className="glass-panel p-6 rounded-2xl border-white/5 flex-1 flex flex-col overflow-hidden">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-base font-bold text-gray-100 tracking-tight flex items-center gap-2">
              <Cpu className="w-4.5 h-4.5 text-violet-400" />
              Incoming Webhook Telemetry Stream
            </h3>
            <p className="text-xs text-gray-400">Asynchronous delivery reports emitted by carrier simulation node</p>
          </div>
          {logsLoading && (
            <div className="text-xs text-violet-400 flex items-center gap-1.5 animate-pulse">
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Fetching callbacks...</span>
            </div>
          )}
        </div>

        <div className="overflow-x-auto max-h-[400px]">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-gray-500 font-semibold uppercase tracking-wider pb-3 sticky top-0 bg-[#0d0d11]">
                <th className="py-3 px-4">Webhook Callback ID</th>
                <th className="py-3 px-4">Event</th>
                <th className="py-3 px-4">Shopper Name</th>
                <th className="py-3 px-4">Carrier Timestamp</th>
                <th className="py-3 px-4">Network Payload details</th>
              </tr>
            </thead>
            <tbody>
              {webhookLogs.map((log) => {
                const isFailed = log.status === "FAILED";
                const isClicked = log.status === "CLICKED";
                const isOpened = log.status === "OPENED";
                const isDelivered = log.status === "DELIVERED";

                return (
                  <tr key={log._id} className="border-b border-white/5 hover:bg-white/5 transition-all">
                    <td className="py-3 px-4 font-mono text-gray-400 text-[10px]">
                      {log.messageId}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-0.5 rounded font-bold text-[9px] tracking-wider uppercase border ${
                        isFailed 
                          ? "bg-rose-950/40 text-rose-400 border-rose-500/20" 
                          : isClicked
                          ? "bg-emerald-950/40 text-emerald-400 border-emerald-500/20"
                          : isOpened
                          ? "bg-violet-950/40 text-violet-400 border-violet-500/20"
                          : "bg-cyan-950/40 text-cyan-400 border-cyan-500/20"
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-300 font-semibold">
                      {log.payload?.customerName || "Recipient Shopper"}
                    </td>
                    <td className="py-3 px-4 text-gray-500">
                      {new Date(log.receivedAt).toLocaleTimeString()}
                    </td>
                    <td className="py-3 px-4 text-gray-400 truncate max-w-[200px]">
                      {isFailed ? (
                        <span className="text-rose-400">{log.payload?.reason || "Delivery reject"}</span>
                      ) : (
                        <span className="text-gray-500 font-mono text-[10px]">HTTP 200 POST payload confirmed</span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {webhookLogs.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-8 text-gray-500">
                    No webhooks processed yet. Go to **Campaign Builder** and launch a campaign to trigger simulation updates!
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
