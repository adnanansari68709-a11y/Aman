import React, { useState, useEffect } from 'react';
import {
  Files,
  Download,
  FolderTree,
  HardDrive,
  Upload,
  PlusCircle,
  ExternalLink,
  Loader2,
  TrendingUp,
  Activity,
  LogOut,
  Sparkles
} from 'lucide-react';
import { SiteStats } from '../../types';
import { api } from '../../services/api';
import { formatBytes, formatDownloadCount } from '../../utils/formatters';

interface AdminDashboardProps {
  onNavigate: (route: string) => void;
  onLogout: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate, onLogout }) => {
  const [stats, setStats] = useState<SiteStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      try {
        const data = await api.getAdminStats();
        setStats(data);
      } catch (err) {
        console.error('Failed to load admin stats:', err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  if (loading || !stats) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-zinc-400">
        <Loader2 className="w-8 h-8 animate-spin text-[#D4AF37] mb-3" />
        <span className="text-sm font-light">Aggregating telemetry from database...</span>
      </div>
    );
  }

  // Calculate highest count for SVG chart scaling
  const downloads = stats.downloadsOverTime || [];
  const maxDownloadInDay = Math.max(...downloads.map((d) => d.count), 10);
  const chartHeight = 160;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full">
      {/* Top Header & Quick Actions */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-8 mb-8 border-b border-white/5">
        <div>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.25em] text-[#D4AF37] font-semibold mb-1">
            <Sparkles className="w-3 h-3" />
            <span>Master Console</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-light text-white tracking-tight">
            Administrative Operations
          </h1>
          <p className="text-xs text-zinc-400 font-light mt-1">
            Live telemetry, resource indexing, and cryptographic payload distribution.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            id="admin-btn-upload-nav"
            onClick={() => onNavigate('/admin/upload')}
            className="px-5 py-2.5 bg-[#D4AF37] hover:bg-[#E5C158] text-black text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-[0_0_15px_rgba(212,175,55,0.3)] flex items-center gap-2 active:scale-95"
          >
            <Upload className="w-4 h-4" />
            <span>Ingest Asset</span>
          </button>
          <button
            id="admin-btn-files-nav"
            onClick={() => onNavigate('/admin/files')}
            className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold uppercase tracking-wider rounded-xl transition-all"
          >
            Manage Files
          </button>
          <button
            id="admin-btn-categories-nav"
            onClick={() => onNavigate('/admin/categories')}
            className="px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-xs font-semibold uppercase tracking-wider rounded-xl transition-all"
          >
            Categories
          </button>
          <button
            id="admin-btn-logout"
            onClick={onLogout}
            className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-zinc-400 hover:text-red-400 hover:border-red-400/40 transition-all"
            title="Terminate Session"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* KPI Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="bg-white/5 border border-white/10 p-6 rounded-3xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] uppercase tracking-wider text-zinc-400 font-semibold">
              Published Resources
            </span>
            <div className="w-9 h-9 rounded-xl bg-[#D4AF37]/10 border border-[#D4AF37]/20 flex items-center justify-center text-[#D4AF37]">
              <Files className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white font-mono mb-1">
            {stats.totalFiles.toLocaleString()}
          </div>
          <span className="text-[10px] text-zinc-500 font-mono">
            {stats.recentlyUpdatedCount} updated this week
          </span>
        </div>

        <div className="bg-white/5 border border-white/10 p-6 rounded-3xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] uppercase tracking-wider text-zinc-400 font-semibold">
              Total Transmissions
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Download className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-[#D4AF37] font-mono mb-1">
            {stats.totalDownloads.toLocaleString()}
          </div>
          <span className="text-[10px] text-zinc-500 font-mono">Verified payloads served</span>
        </div>

        <div className="bg-white/5 border border-white/10 p-6 rounded-3xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] uppercase tracking-wider text-zinc-400 font-semibold">
              Active Sectors
            </span>
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <FolderTree className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white font-mono mb-1">
            {stats.totalCategories}
          </div>
          <button
            onClick={() => onNavigate('/admin/categories')}
            className="text-[10px] text-[#D4AF37] hover:underline font-semibold"
          >
            Configure Taxonomies &rarr;
          </button>
        </div>

        <div className="bg-white/5 border border-white/10 p-6 rounded-3xl relative overflow-hidden">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[11px] uppercase tracking-wider text-zinc-400 font-semibold">
              Vault Footprint
            </span>
            <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <HardDrive className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white font-mono mb-1">
            {formatBytes(stats.totalStorageBytes)}
          </div>
          <span className="text-[10px] text-zinc-500 font-mono">Immutable local storage</span>
        </div>
      </div>

      {/* Charts & Popular Files Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
        {/* 14-Day Download Telemetry SVG Chart */}
        <div className="lg:col-span-2 bg-white/5 border border-white/10 p-6 sm:p-8 rounded-3xl">
          <div className="flex items-center justify-between mb-6">
            <div>
              <span className="text-[10px] uppercase tracking-wider text-[#D4AF37] font-semibold">
                Throughput Telemetry
              </span>
              <h3 className="text-lg font-medium text-white flex items-center gap-2 mt-0.5">
                <TrendingUp className="w-4 h-4 text-[#D4AF37]" /> 14-Day Transmission Volume
              </h3>
            </div>
            <span className="text-xs font-mono text-zinc-400 bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
              Live DB Synced
            </span>
          </div>

          {/* SVG Visual Chart */}
          <div className="w-full pt-4">
            <div className="h-44 w-full flex items-end gap-1.5 sm:gap-3 border-b border-white/10 pb-2">
              {(stats.downloadsOverTime || []).map((pt, idx) => {
                const barHeight = Math.max(12, (pt.count / maxDownloadInDay) * chartHeight);
                const isLatest = idx === (stats.downloadsOverTime || []).length - 1;
                return (
                  <div
                    key={pt.date}
                    className="flex-1 flex flex-col items-center gap-1 group relative cursor-pointer"
                  >
                    {/* Tooltip */}
                    <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-black/90 border border-[#D4AF37]/50 text-[10px] font-mono text-white px-2 py-1 rounded-md pointer-events-none whitespace-nowrap z-20">
                      {pt.count} downloads ({pt.date})
                    </div>
                    {/* Bar */}
                    <div
                      style={{ height: `${barHeight}px` }}
                      className={`w-full rounded-t-lg transition-all ${
                        isLatest
                          ? 'bg-[#D4AF37] shadow-[0_0_12px_rgba(212,175,55,0.4)]'
                          : 'bg-white/15 group-hover:bg-[#D4AF37]/70'
                      }`}
                    ></div>
                    <span className="text-[9px] text-zinc-500 font-mono scale-90 sm:scale-100">
                      {pt.date.split('-')[2]}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between text-[10px] text-zinc-500 font-mono pt-3">
              <span>14 Days Ago</span>
              <span>Today</span>
            </div>
          </div>
        </div>

        {/* Sector Distribution */}
        <div className="bg-white/5 border border-white/10 p-6 sm:p-8 rounded-3xl flex flex-col justify-between">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-[#D4AF37] font-semibold">
              Taxonomy Breakdown
            </span>
            <h3 className="text-lg font-medium text-white mt-0.5 mb-6">
              Sector Distribution
            </h3>

            <div className="space-y-4">
              {(stats.categoryDistribution || []).map((cat) => {
                const pct = stats.totalFiles > 0 ? Math.round((cat.count / stats.totalFiles) * 100) : 0;
                return (
                  <div key={cat.slug} className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-zinc-300 font-medium">{cat.name}</span>
                      <span className="text-zinc-500 font-mono">
                        {cat.count} ({pct}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-black/60 rounded-full overflow-hidden border border-white/5">
                      <div
                        style={{ width: `${pct}%` }}
                        className="h-full bg-[#D4AF37] rounded-full"
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-6 border-t border-white/5 mt-6">
            <button
              onClick={() => onNavigate('/admin/categories')}
              className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-xs font-semibold"
            >
              Modify Sectors &rarr;
            </button>
          </div>
        </div>
      </div>

      {/* Popular Assets & Activity Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Most Downloaded Assets */}
        <div className="bg-white/5 border border-white/10 p-6 sm:p-8 rounded-3xl">
          <div className="flex items-center justify-between mb-6 pb-2 border-b border-white/5">
            <h3 className="text-lg font-medium text-white flex items-center gap-2">
              <Download className="w-4 h-4 text-emerald-400" /> Top Downloaded Resources
            </h3>
            <button
              onClick={() => onNavigate('/admin/files')}
              className="text-xs text-[#D4AF37] hover:underline"
            >
              All Assets &rarr;
            </button>
          </div>

          <div className="space-y-3">
            {(stats.popularFiles || []).map((file, idx) => (
              <div
                key={file.id}
                className="p-3.5 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-xs font-mono font-bold text-[#D4AF37]">
                    #{idx + 1}
                  </div>
                  <div>
                    <h4 className="text-white text-sm font-medium line-clamp-1">{file.title}</h4>
                    <span className="text-[11px] text-zinc-500 font-mono">
                      {file.categoryName} • {formatBytes(file.fileSize)}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-mono text-emerald-400 font-bold">
                    {formatDownloadCount(file.downloadCount)}
                  </div>
                  <div className="text-[9px] text-zinc-500 uppercase tracking-wider">transfers</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Realtime Ingestion & Download Audit Log */}
        <div className="bg-white/5 border border-white/10 p-6 sm:p-8 rounded-3xl">
          <div className="flex items-center justify-between mb-6 pb-2 border-b border-white/5">
            <h3 className="text-lg font-medium text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#D4AF37]" /> Audit Stream
            </h3>
            <span className="text-[10px] text-zinc-500 font-mono uppercase">Live Log</span>
          </div>

          <div className="space-y-3 max-h-80 overflow-y-auto pr-1 scrollbar-thin">
            {(stats.recentActivity || []).map((act, i) => (
              <div
                key={i}
                className="p-3 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
                  <div>
                    <span className="text-white font-medium">{act.fileTitle}</span>
                    <div className="text-[10px] text-zinc-500">Payload transmission authorized</div>
                  </div>
                </div>
                <span className="text-zinc-500 font-mono text-[10px]">
                  {new Date(act.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
