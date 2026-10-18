import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import ImageDetector from './components/ImageDetector';
import VideoDetector from './components/VideoDetector';
import CameraDetector from './components/CameraDetector';
import ProjectInfo from './components/ProjectInfo';
import { 
  ShieldCheck, 
  Cpu, 
  Zap, 
  Terminal, 
  ChevronRight,
  Layers,
  Sparkles,
  BarChart2,
  Award,
  CheckCircle2
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('image'); // 'image' | 'video' | 'camera' | 'model'
  const [modelInfo, setModelInfo] = useState(null);
  const [backendStatus, setBackendStatus] = useState('connecting'); // 'connecting' | 'connected' | 'error'

  const fetchModelInfo = async () => {
    try {
      const response = await fetch('/api/model/info');
      if (response.ok) {
        const data = await response.json();
        setModelInfo(data);
        setBackendStatus('connected');
      } else {
        setBackendStatus('error');
      }
    } catch (err) {
      console.warn('Backend not responding yet:', err);
      setBackendStatus('error');
    }
  };

  useEffect(() => {
    fetchModelInfo();
    const interval = setInterval(fetchModelInfo, 6000); // Heartbeat check every 6s
    return () => clearInterval(interval);
  }, []);

  const activeClassName = Object.values(modelInfo?.classes || {})[0] || 'cone_shape';

  return (
    <div className="min-h-screen bg-[#070D18] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-white">
      
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        modelInfo={modelInfo}
        backendStatus={backendStatus}
        onRefreshStatus={fetchModelInfo}
      />

      {/* Main Content Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Technical Hero Banner (College Presentation Workstation) */}
        <div className="relative overflow-hidden rounded-2xl glass-panel p-6 sm:p-8 shadow-2xl">
          <div className="hud-corner-tl" />
          <div className="hud-corner-tr" />
          <div className="hud-corner-bl" />
          <div className="hud-corner-br" />

          <div className="relative z-10 max-w-4xl space-y-3.5">
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-950/70 border border-blue-700/60 text-xs text-cyan-300 font-medium shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Computer Vision Engineering Presentation • Autonomous Systems</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight m-0">
              Automated Cone Detection System
            </h2>

            <p className="text-sm text-slate-300 leading-relaxed m-0 max-w-3xl">
              An end-to-end computer vision workstation executing real-time object detection for cone-shaped markers and cones using a custom-trained <strong className="text-white">YOLO26n</strong> deep learning pipeline. Targeting the object class <code className="text-orange-300 font-bold bg-slate-900/90 border border-orange-900/50 px-2 py-0.5 rounded font-mono">{activeClassName}</code> across high-resolution imagery, recorded video footage, and live webcams.
            </p>

            {/* Inline Mini-Telemetry Ribbon */}
            <div className="flex flex-wrap items-center gap-2.5 pt-2 text-xs">
              <span className="px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700/80 text-slate-300 flex items-center space-x-1.5 font-mono shadow-sm">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                <span>YOLO26n Single-Stage</span>
              </span>
              <span className="px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700/80 text-slate-300 flex items-center space-x-1.5 font-mono shadow-sm">
                <Award className="w-3.5 h-3.5 text-emerald-400" />
                <span>Precision: <strong className="text-emerald-300">91.3%</strong></span>
              </span>
              <span className="px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700/80 text-slate-300 flex items-center space-x-1.5 font-mono shadow-sm">
                <BarChart2 className="w-3.5 h-3.5 text-orange-400" />
                <span>mAP50: <strong className="text-orange-300">95.6%</strong></span>
              </span>
              <span className="px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700/80 text-slate-300 flex items-center space-x-1.5 font-mono shadow-sm">
                <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                <span>Recall: <strong className="text-cyan-300">93.2%</strong></span>
              </span>
              <span className="px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700/80 text-slate-300 flex items-center space-x-1.5 font-mono shadow-sm">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                <span>73 Test Images</span>
              </span>
            </div>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === 'image' && (
          <ImageDetector
            modelInfo={modelInfo}
            onNavigateToModel={() => setActiveTab('model')}
          />
        )}

        {activeTab === 'video' && (
          <VideoDetector
            modelInfo={modelInfo}
            onNavigateToModel={() => setActiveTab('model')}
          />
        )}

        {activeTab === 'camera' && (
          <CameraDetector
            modelInfo={modelInfo}
            onNavigateToModel={() => setActiveTab('model')}
          />
        )}

        {activeTab === 'model' && (
          <ProjectInfo
            modelInfo={modelInfo}
            onReloadModel={fetchModelInfo}
          />
        )}
      </main>

      {/* Presentation Footer */}
      <footer className="border-t border-slate-800/80 bg-[#050912] py-6 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4">
          <div className="flex items-center space-x-2">
            <span className="text-base">📐</span>
            <span className="font-semibold text-slate-300">Cone Detection System</span>
            <span>•</span>
            <span>YOLO26n Computer Vision Engineering Project</span>
          </div>

          <div className="flex items-center space-x-3 text-slate-400">
            <span>React + Vite</span>
            <span>•</span>
            <span>FastAPI</span>
            <span>•</span>
            <span>Model: <code className="text-orange-400 font-mono">best.pt</code> (cone_shape)</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
