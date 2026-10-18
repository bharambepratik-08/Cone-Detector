import React, { useState, useRef } from 'react';
import { 
  Video, 
  Upload, 
  Play, 
  Download, 
  RotateCcw, 
  Film, 
  Clock, 
  Activity, 
  BarChart3, 
  AlertCircle,
  CheckCircle2,
  FileVideo
} from 'lucide-react';

export default function VideoDetector({ modelInfo, onNavigateToModel }) {
  const [selectedVideo, setSelectedVideo] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);
  const [confidence, setConfidence] = useState(0.25);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [videoResult, setVideoResult] = useState(null);
  const [processingStatus, setProcessingStatus] = useState('');
  const fileInputRef = useRef(null);

  const handleVideoSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('video/') && !file.name.match(/\.(mp4|avi|mov|mkv|webm)$/i)) {
        setError('Please select a valid video format (MP4, AVI, MOV, WEBM).');
        return;
      }
      setSelectedVideo(file);
      setVideoPreview(URL.createObjectURL(file));
      setVideoResult(null);
      setError(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      setSelectedVideo(file);
      setVideoPreview(URL.createObjectURL(file));
      setVideoResult(null);
      setError(null);
    }
  };

  const runVideoProcessing = async () => {
    if (!selectedVideo) return;

    setLoading(true);
    setError(null);
    setProcessingStatus('Uploading video to backend...');

    const formData = new FormData();
    formData.append('file', selectedVideo);
    formData.append('conf', confidence.toString());

    try {
      setProcessingStatus('Running frame-by-frame YOLO cone detection & H.264 video encoding...');

      const response = await fetch('/api/detect/video', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Video processing failed.');
      }

      setVideoResult(data);
      setProcessingStatus('Processing complete!');
    } catch (err) {
      setError(err.message || 'Error processing video.');
    } finally {
      setLoading(false);
    }
  };

  const resetAll = () => {
    setSelectedVideo(null);
    setVideoPreview(null);
    setVideoResult(null);
    setError(null);
    setProcessingStatus('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Missing weights banner warning */}
      {!modelInfo?.loaded && (
        <div className="bg-amber-950/40 border border-amber-600/50 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
            <p className="text-sm text-amber-200 m-0">
              <strong className="text-amber-100">Action Required:</strong> Model weights <code className="bg-amber-900/50 px-1.5 py-0.5 rounded font-mono">best.pt</code> must be placed in <code className="text-amber-300">backend/weights/</code> before running video analysis.
            </p>
          </div>
          <button
            onClick={onNavigateToModel}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs rounded-lg transition cursor-pointer"
          >
            Manage Model
          </button>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Upload & Settings */}
        <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-semibold text-white flex items-center space-x-2 m-0">
                <FileVideo className="w-4 h-4 text-cyan-400" />
                <span>Video Input & Settings</span>
              </h3>
              {selectedVideo && (
                <button
                  onClick={resetAll}
                  className="text-xs text-slate-400 hover:text-red-400 flex items-center space-x-1 cursor-pointer transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset</span>
                </button>
              )}
            </div>

            {/* Video Dropzone */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition ${
                selectedVideo
                  ? 'border-cyan-500/50 bg-cyan-950/10'
                  : 'border-slate-700 hover:border-slate-500 bg-slate-900/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="video/*"
                onChange={handleVideoSelect}
                className="hidden"
              />
              <Video className="w-8 h-8 mx-auto mb-2 text-cyan-400" />
              <p className="text-sm font-medium text-slate-200 m-0">
                {selectedVideo ? selectedVideo.name : 'Select or drop video footage'}
              </p>
              <p className="text-xs text-slate-400 mt-1 m-0">
                Dashcam, robot camera, or roadside footage (MP4, AVI, MOV)
              </p>
              {selectedVideo && (
                <div className="mt-2 text-xs font-mono text-cyan-300">
                  Size: {(selectedVideo.size / (1024 * 1024)).toFixed(2)} MB
                </div>
              )}
            </div>

            {/* Confidence Slider */}
            <div className="pt-2">
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="text-slate-300 font-medium">Detection Confidence</span>
                <span className="font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                  {Math.round(confidence * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0.10"
                max="0.90"
                step="0.05"
                value={confidence}
                onChange={(e) => setConfidence(parseFloat(e.target.value))}
                className="w-full accent-cyan-500 bg-slate-800 rounded-lg cursor-pointer h-1.5"
              />
              <span className="text-[11px] text-slate-400">
                Threshold for cone_shape classification
              </span>
            </div>

            {/* Note on video size */}
            <div className="p-3 bg-blue-950/30 border border-blue-800/40 rounded-xl text-xs text-slate-300 space-y-1">
              <p className="font-semibold text-blue-300 m-0">Presentation Tip:</p>
              <p className="text-slate-400 m-0">
                For rapid live presentation demonstrations, clips between 5 to 30 seconds process in just a few seconds on CPU/GPU.
              </p>
            </div>
          </div>

          {/* Action button */}
          <button
            onClick={runVideoProcessing}
            disabled={!selectedVideo || loading}
            className={`w-full py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center space-x-2 transition cursor-pointer shadow-lg ${
              !selectedVideo || loading
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-orange-500/20'
            }`}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Processing Frames...</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Process Video with YOLO</span>
              </>
            )}
          </button>
        </div>

        {/* Right Column: Video Playback & Metrics */}
        <div className="lg:col-span-2 bg-[#0F172A] border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Film className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-semibold text-white">
                  {videoResult ? 'Annotated Output Video' : 'Video Preview'}
                </span>
              </div>

              {videoResult && (
                <a
                  href={videoResult.download_url}
                  download
                  className="flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg text-xs font-semibold shadow-md transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Annotated Video</span>
                </a>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-4 p-3 bg-red-950/40 border border-red-700/50 rounded-xl text-xs text-red-300 flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Video Player */}
            <div className="mt-4 relative min-h-[360px] bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex items-center justify-center">
              {loading && (
                <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-6 text-center space-y-4">
                  <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin" />
                  <div>
                    <p className="text-base font-semibold text-white m-0">Processing Video Footage</p>
                    <p className="text-xs text-cyan-300 font-mono mt-1 m-0">{processingStatus}</p>
                  </div>
                  <div className="w-64 bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div className="bg-gradient-to-r from-cyan-500 to-orange-500 h-2 rounded-full w-full animate-pulse" />
                  </div>
                </div>
              )}

              {videoResult ? (
                <video
                  src={videoResult.stream_url}
                  controls
                  autoPlay
                  loop
                  playsInline
                  className="max-h-[480px] w-full rounded-lg shadow-2xl bg-black"
                />
              ) : videoPreview ? (
                <video
                  src={videoPreview}
                  controls
                  playsInline
                  className="max-h-[480px] w-full rounded-lg bg-black"
                />
              ) : (
                <div className="text-center p-8 text-slate-500">
                  <Video className="w-12 h-12 mx-auto mb-3 opacity-30 text-slate-400" />
                  <p className="text-sm font-medium m-0">No video loaded</p>
                  <p className="text-xs text-slate-400 mt-1 m-0">Upload a road video to test real-time object tracking</p>
                </div>
              )}
            </div>
          </div>

          {/* Video Metrics Cards */}
          {videoResult && (
            <div className="mt-6 pt-4 border-t border-slate-800">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                Computer Vision Video Analysis Report
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl">
                  <div className="flex items-center space-x-1.5 text-slate-400 text-xs mb-1">
                    <BarChart3 className="w-3.5 h-3.5 text-orange-400" />
                    <span>Total Cone Hits</span>
                  </div>
                  <p className="text-2xl font-bold text-orange-400 m-0">
                    {videoResult.total_cones_detected}
                  </p>
                  <span className="text-[11px] text-slate-400">across all frames</span>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl">
                  <div className="flex items-center space-x-1.5 text-slate-400 text-xs mb-1">
                    <Activity className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Peak Density</span>
                  </div>
                  <p className="text-2xl font-bold text-cyan-400 m-0">
                    {videoResult.max_cones_in_frame}
                  </p>
                  <span className="text-[11px] text-slate-400">max cones in single frame</span>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl">
                  <div className="flex items-center space-x-1.5 text-slate-400 text-xs mb-1">
                    <Film className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Frames Analyzed</span>
                  </div>
                  <p className="text-xl font-bold text-white font-mono m-0 mt-0.5">
                    {videoResult.total_frames}
                  </p>
                  <span className="text-[11px] text-slate-400">
                    {videoResult.duration_seconds}s @ {videoResult.fps} FPS
                  </span>
                </div>

                <div className="bg-slate-900/90 border border-slate-800 p-3 rounded-xl">
                  <div className="flex items-center space-x-1.5 text-slate-400 text-xs mb-1">
                    <Clock className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Throughput</span>
                  </div>
                  <p className="text-xl font-bold text-emerald-400 font-mono m-0 mt-0.5">
                    {videoResult.processing_fps} <span className="text-xs font-normal">FPS</span>
                  </p>
                  <span className="text-[11px] text-slate-400">
                    {videoResult.processing_time_seconds}s total time
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
