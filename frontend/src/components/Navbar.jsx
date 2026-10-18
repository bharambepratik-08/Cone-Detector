import React from 'react';
import { 
  Camera, 
  Video, 
  Eye, 
  Cpu, 
  CheckCircle2, 
  AlertTriangle, 
  ServerCrash,
  Sparkles,
  Layers,
  Activity,
  ShieldCheck
} from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, modelInfo, backendStatus, onRefreshStatus }) {
  const activeClassName = Object.values(modelInfo?.classes || {})[0] || 'cone_shape';

  return (
    <header className="sticky top-0 z-50 bg-[#070D18]/90 backdrop-blur-xl border-b border-slate-800/80 shadow-2xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Brand & Identity */}
          <div className="flex items-center space-x-3.5">
            <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-tr from-orange-600 via-amber-500 to-orange-400 shadow-lg shadow-orange-500/25 border border-orange-400/30">
              <span className="text-xl select-none">📐</span>
              <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
              </span>
            </div>
            
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-white m-0 flex items-center gap-1.5">
                  <span>Cone</span>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">Detection</span>
                  <span className="text-slate-400 font-normal hidden sm:inline">System</span>
                </h1>
                <span className="inline-flex items-center px-2 py-0.5 text-[11px] font-bold rounded-md bg-blue-950/80 text-cyan-300 border border-cyan-800/50 font-mono shadow-sm">
                  YOLO26n
                </span>
              </div>
              <p className="text-[11px] text-slate-400 m-0 hidden sm:block">
                Autonomous Computer Vision System • Target Class: <code className="text-orange-300 font-mono font-medium">{activeClassName}</code>
              </p>
            </div>
          </div>

          {/* Model Status Pill & Telemetry */}
          <div className="hidden lg:flex items-center space-x-3">
            {backendStatus === 'error' ? (
              <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-red-950/70 border border-red-700/60 text-red-300 text-xs font-medium shadow-md">
                <ServerCrash className="w-3.5 h-3.5 text-red-400 animate-pulse" />
                <span>Backend Offline (Port 8000)</span>
              </div>
            ) : modelInfo?.loaded ? (
              <div className="flex items-center space-x-2.5 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-emerald-500/30 text-xs shadow-md">
                <div className="flex items-center space-x-1.5 text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span className="font-mono font-bold">{modelInfo.weights_path || 'best.pt'}</span>
                </div>
                <span className="text-slate-600">•</span>
                <span className="text-cyan-300 font-mono font-medium">{modelInfo.device}</span>
                <span className="text-slate-600">•</span>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-950/70 text-orange-300 border border-orange-800/50 font-mono">
                  {activeClassName}
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-300 font-mono text-[11px]">mAP50: <strong className="text-emerald-400">95.6%</strong></span>
              </div>
            ) : (
              <button 
                onClick={() => setActiveTab('model')}
                className="flex items-center space-x-2 px-3 py-1.5 rounded-full bg-amber-950/70 border border-amber-600/70 text-amber-300 hover:bg-amber-900/50 transition text-xs font-medium cursor-pointer"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400 animate-bounce" />
                <span>Weights Pending (Click to link best.pt)</span>
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 border-t border-slate-800/80 pt-2 pb-2.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab('image')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
              activeTab === 'image'
                ? 'bg-gradient-to-r from-blue-600/30 to-cyan-600/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Camera className="w-4 h-4 text-cyan-400" />
            <span>Image Detection</span>
          </button>

          <button
            onClick={() => setActiveTab('video')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
              activeTab === 'video'
                ? 'bg-gradient-to-r from-blue-600/30 to-cyan-600/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Video className="w-4 h-4 text-cyan-400" />
            <span>Video Processing</span>
          </button>

          <button
            onClick={() => setActiveTab('camera')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
              activeTab === 'camera'
                ? 'bg-gradient-to-r from-blue-600/30 to-cyan-600/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Eye className="w-4 h-4 text-cyan-400" />
            <span>Real-Time Camera</span>
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
          </button>

          <button
            onClick={() => setActiveTab('model')}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer ${
              activeTab === 'model'
                ? 'bg-gradient-to-r from-blue-600/30 to-cyan-600/20 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
            }`}
          >
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span>Model & Evaluation</span>
            <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-950 text-emerald-300 border border-emerald-800/40">
              95.6%
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
