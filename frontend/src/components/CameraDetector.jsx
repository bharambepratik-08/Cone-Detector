import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Camera, 
  CameraOff, 
  Play, 
  Square, 
  Zap, 
  Download, 
  Sliders, 
  AlertCircle, 
  Video, 
  Activity,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';

export default function CameraDetector({ modelInfo, onNavigateToModel }) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [confidence, setConfidence] = useState(0.25);
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState('');
  const [error, setError] = useState(null);
  
  // Real-time telemetry
  const [liveConesCount, setLiveConesCount] = useState(0);
  const [inferenceTime, setInferenceTime] = useState(0);
  const [fps, setFps] = useState(0);
  const [annotatedFrameUrl, setAnnotatedFrameUrl] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const isDetectingRef = useRef(false);
  const frameCounterRef = useRef({ count: 0, lastTime: Date.now() });

  // Enumerate video devices
  const getCameraDevices = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
        setError('Media devices API is not supported in this browser environment.');
        return;
      }
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoInputs = allDevices.filter(d => d.kind === 'videoinput');
      setDevices(videoInputs);
      if (videoInputs.length > 0 && !selectedDeviceId) {
        setSelectedDeviceId(videoInputs[0].deviceId);
      }
    } catch (err) {
      console.warn('Could not enumerate cameras:', err);
    }
  };

  useEffect(() => {
    getCameraDevices();
    return () => {
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    setError(null);
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      const constraints = {
        video: selectedDeviceId ? { deviceId: { exact: selectedDeviceId } } : { width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current.play();
          setIsStreaming(true);
          startInferenceLoop();
        };
      }
    } catch (err) {
      console.error('Camera error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Camera permission was denied. Please allow camera access in your browser address bar.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError('No camera device detected on your computer.');
      } else {
        setError(`Failed to open camera: ${err.message}`);
      }
      setIsStreaming(false);
    }
  };

  const stopCamera = () => {
    isDetectingRef.current = false;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
    setLiveConesCount(0);
    setFps(0);
    setAnnotatedFrameUrl(null);
  };

  // Inference loop using requestAnimationFrame + flow control
  const startInferenceLoop = () => {
    isDetectingRef.current = true;
    let inFlight = false;

    const detectLoop = async () => {
      if (!isDetectingRef.current) return;

      if (!inFlight && videoRef.current && canvasRef.current && videoRef.current.readyState >= 2) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        
        // Match canvas to video dimensions (downscaled for quick inference)
        const targetW = 640;
        const targetH = Math.round((video.videoHeight / video.videoWidth) * 640) || 480;
        canvas.width = targetW;
        canvas.height = targetH;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, targetW, targetH);
        
        const base64Data = canvas.toDataURL('image/jpeg', 0.7);

        inFlight = true;
        try {
          const res = await fetch('/api/detect/frame', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              image: base64Data,
              conf: confidence
            })
          });

          if (res.ok) {
            const data = await res.json();
            setLiveConesCount(data.count);
            setInferenceTime(data.inference_time_ms);
            setAnnotatedFrameUrl(data.annotated_image);

            // FPS calculation
            frameCounterRef.current.count += 1;
            const now = Date.now();
            if (now - frameCounterRef.current.lastTime >= 1000) {
              setFps(frameCounterRef.current.count);
              frameCounterRef.current.count = 0;
              frameCounterRef.current.lastTime = now;
            }
          }
        } catch (err) {
          // Gracefully swallow network frame dropouts
        } finally {
          inFlight = false;
        }
      }

      if (isDetectingRef.current) {
        // Run next frame with a gentle throttle (approx 15-20 FPS)
        setTimeout(() => {
          requestAnimationFrame(detectLoop);
        }, 50);
      }
    };

    requestAnimationFrame(detectLoop);
  };

  const captureSnapshot = () => {
    if (!annotatedFrameUrl) return;
    const a = document.createElement('a');
    a.href = annotatedFrameUrl;
    a.download = `live_cone_detection_${Date.now()}.jpg`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Missing weights banner warning */}
      {!modelInfo?.loaded && (
        <div className="bg-amber-950/40 border border-amber-600/50 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
            <p className="text-sm text-amber-200 m-0">
              <strong className="text-amber-100">Action Required:</strong> Load <code className="bg-amber-900/50 px-1.5 py-0.5 rounded font-mono">best.pt</code> to enable real-time camera object detection.
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
        
        {/* Controls */}
        <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-semibold text-white flex items-center space-x-2 m-0">
                <Camera className="w-4 h-4 text-cyan-400" />
                <span>Live Feed Configuration</span>
              </h3>
              {devices.length > 0 && (
                <button
                  onClick={getCameraDevices}
                  className="text-xs text-slate-400 hover:text-slate-200 flex items-center space-x-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Refresh</span>
                </button>
              )}
            </div>

            {/* Camera Selector */}
            {devices.length > 0 && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Select Video Device
                </label>
                <select
                  disabled={isStreaming}
                  value={selectedDeviceId}
                  onChange={(e) => setSelectedDeviceId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 disabled:opacity-50"
                >
                  {devices.map((device, idx) => (
                    <option key={device.deviceId || idx} value={device.deviceId}>
                      {device.label || `Camera ${idx + 1}`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Confidence Slider */}
            <div className="pt-2">
              <div className="flex justify-between items-center text-xs mb-1.5">
                <span className="text-slate-300 font-medium">Confidence Threshold</span>
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
                Real-time filter for traffic cone bounding boxes
              </span>
            </div>

            {/* Live Stats Pill if streaming */}
            {isStreaming && (
              <div className="p-3.5 bg-slate-900/90 border border-slate-800 rounded-xl space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Model Pipeline:</span>
                  <span className="font-mono text-emerald-400 font-medium">YOLOv8 best.pt</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Inference Latency:</span>
                  <span className="font-mono text-cyan-300">{inferenceTime} ms</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Display Stream:</span>
                  <span className="font-mono text-slate-200">{fps} FPS</span>
                </div>
              </div>
            )}
          </div>

          {/* Camera Buttons */}
          <div className="space-y-2 pt-4">
            {!isStreaming ? (
              <button
                onClick={startCamera}
                disabled={!modelInfo?.loaded}
                className={`w-full py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center space-x-2 transition cursor-pointer shadow-lg ${
                  !modelInfo?.loaded
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white shadow-emerald-500/20'
                }`}
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Start Real-time Camera</span>
              </button>
            ) : (
              <div className="space-y-2">
                <button
                  onClick={stopCamera}
                  className="w-full py-3 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl font-semibold text-sm flex items-center justify-center space-x-2 transition cursor-pointer shadow-lg shadow-red-600/20"
                >
                  <Square className="w-4 h-4 fill-white" />
                  <span>Stop Camera</span>
                </button>

                <button
                  onClick={captureSnapshot}
                  disabled={!annotatedFrameUrl}
                  className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl text-xs font-medium text-slate-200 flex items-center justify-center space-x-1.5 transition cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Save Frame Snapshot</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Video Canvas Viewport */}
        <div className="lg:col-span-2 bg-[#0F172A] border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <span className="flex h-2.5 w-2.5 relative">
                  {isStreaming ? (
                    <>
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                    </>
                  ) : (
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-slate-600"></span>
                  )}
                </span>
                <span className="text-sm font-semibold text-white">
                  {isStreaming ? 'Live YOLO Object Stream' : 'Camera Standby'}
                </span>
              </div>

              {isStreaming && (
                <div className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-1.5 border ${
                  liveConesCount > 0 
                    ? 'bg-orange-950/80 border-orange-500 text-orange-300 animate-pulse' 
                    : 'bg-slate-800/80 border-slate-700 text-slate-400'
                }`}>
                  <span>🚧</span>
                  <span>{liveConesCount} Cones in View</span>
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="mt-4 p-3 bg-red-950/40 border border-red-700/50 rounded-xl text-xs text-red-300 flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Viewport Frame */}
            <div className="mt-4 relative min-h-[380px] bg-slate-950 border border-slate-800 rounded-xl overflow-hidden flex items-center justify-center">
              {/* Hidden raw video element */}
              <video
                ref={videoRef}
                playsInline
                muted
                className="hidden"
              />
              
              {/* Hidden rendering canvas */}
              <canvas
                ref={canvasRef}
                className="hidden"
              />

              {isStreaming && annotatedFrameUrl ? (
                <img
                  src={annotatedFrameUrl}
                  alt="Live YOLO detection feed"
                  className="max-h-[480px] w-auto max-w-full object-contain rounded-lg shadow-2xl"
                />
              ) : isStreaming ? (
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs text-slate-400">Initializing video stream...</p>
                </div>
              ) : (
                <div className="text-center p-8 text-slate-500">
                  <CameraOff className="w-12 h-12 mx-auto mb-3 opacity-30 text-slate-400" />
                  <p className="text-sm font-medium m-0">Camera is turned off</p>
                  <p className="text-xs text-slate-400 mt-1 m-0">Click "Start Real-time Camera" to demo live detection</p>
                </div>
              )}
            </div>
          </div>

          {/* Real-time stats footer */}
          <div className="grid grid-cols-3 gap-3 mt-4 pt-3 border-t border-slate-800 text-center">
            <div className="bg-slate-900/80 border border-slate-800 p-2 rounded-xl">
              <span className="text-[11px] text-slate-400">Detection Status</span>
              <p className="text-sm font-semibold text-emerald-400 m-0 mt-0.5">
                {isStreaming ? 'Live Tracking' : 'Standby'}
              </p>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 p-2 rounded-xl">
              <span className="text-[11px] text-slate-400">Target Class</span>
              <p className="text-sm font-semibold text-orange-400 font-mono m-0 mt-0.5">
                {Object.values(modelInfo?.classes || {})[0] || 'cone_shape'}
              </p>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 p-2 rounded-xl">
              <span className="text-[11px] text-slate-400">Frame Latency</span>
              <p className="text-sm font-semibold text-cyan-400 font-mono m-0 mt-0.5">
                {inferenceTime ? `${inferenceTime} ms` : '--'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
