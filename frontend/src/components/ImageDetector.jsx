import React, { useState, useRef } from 'react';
import { 
  Upload, 
  Sliders, 
  Download, 
  RotateCcw, 
  CheckCircle, 
  Zap, 
  Maximize2, 
  Eye, 
  FileImage,
  AlertCircle,
  SearchX,
  RefreshCw,
  Info,
  HelpCircle
} from 'lucide-react';

export default function ImageDetector({ modelInfo, onNavigateToModel }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [confidence, setConfidence] = useState(0.25);
  const [iou, setIou] = useState(0.45);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [detectionResult, setDetectionResult] = useState(null);
  const [activeView, setActiveView] = useState('annotated'); // 'annotated' | 'original'
  const fileInputRef = useRef(null);

  const activeClassName = Object.values(modelInfo?.classes || {})[0] || 'cone_shape';

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processSelectedFile(file);
    }
  };

  const processSelectedFile = (file) => {
    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPG, PNG, or WEBP).');
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      setError('File size exceeds 25 MB. Please select a smaller photo.');
      return;
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setDetectionResult(null);
    setError(null);
  };

  const runDetection = async (overrideConf = null) => {
    if (!selectedFile) return;

    setLoading(true);
    setError(null);

    const confToUse = overrideConf !== null ? overrideConf : confidence;
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('conf', confToUse.toString());
    formData.append('iou', iou.toString());

    try {
      const response = await fetch('/api/detect/image', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Inference failed on server.');
      }

      setDetectionResult(data);
      setActiveView('annotated');
    } catch (err) {
      setError(err.message || 'Error executing detection.');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!detectionResult?.annotated_image) return;
    const link = document.createElement('a');
    link.href = detectionResult.annotated_image;
    link.download = `detected_cones_${selectedFile?.name || 'result'}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const resetAll = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setDetectionResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-6">
      {/* Missing weights banner warning */}
      {!modelInfo?.loaded && (
        <div className="bg-amber-950/40 border border-amber-600/50 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
            <p className="text-sm text-amber-200 m-0">
              <strong className="text-amber-100">Action Required:</strong> Model weights <code className="bg-amber-900/50 px-1.5 py-0.5 rounded font-mono">best.pt</code> must be placed in <code className="text-amber-300">backend/weights/</code> before running inference.
            </p>
          </div>
          <button
            onClick={onNavigateToModel}
            className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-semibold text-xs rounded-lg transition cursor-pointer self-start sm:self-auto shrink-0"
          >
            Manage Model
          </button>
        </div>
      )}

      {/* Control & Upload Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left column: Upload & Parameters */}
        <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-sm font-semibold text-white flex items-center space-x-2 m-0">
                <FileImage className="w-4 h-4 text-cyan-400" />
                <span>Upload & Detection Settings</span>
              </h3>
              {selectedFile && (
                <button
                  onClick={resetAll}
                  className="text-xs text-slate-400 hover:text-red-400 flex items-center space-x-1 cursor-pointer transition"
                  title="Clear current image"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              )}
            </div>

            {/* Dropzone */}
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-5 text-center cursor-pointer transition ${
                selectedFile 
                  ? 'border-cyan-500/50 bg-cyan-950/10' 
                  : 'border-slate-700 hover:border-slate-500 bg-slate-900/50'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/bmp"
                onChange={handleFileChange}
                className="hidden"
              />
              <Upload className="w-8 h-8 mx-auto mb-2 text-cyan-400" />
              <p className="text-sm font-medium text-slate-200 m-0">
                {selectedFile ? selectedFile.name : 'Click to browse or drop an image'}
              </p>
              <p className="text-xs text-slate-400 mt-1 m-0">
                Supports JPG, PNG, WEBP (Road scenes, cones)
              </p>
              {selectedFile && (
                <p className="text-[11px] font-mono text-cyan-300 mt-2 m-0">
                  Size: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              )}
            </div>

            {/* Hyperparameter Sliders */}
            <div className="space-y-4 pt-1">
              <div>
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="text-slate-300 font-medium">Confidence Threshold</span>
                  <span className="font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                    {Math.round(confidence * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="0.95"
                  step="0.05"
                  value={confidence}
                  onChange={(e) => setConfidence(parseFloat(e.target.value))}
                  className="w-full accent-cyan-500 bg-slate-800 rounded-lg cursor-pointer h-1.5"
                />
                <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                  <span>Sensitive (5%)</span>
                  <span>Balanced (25%)</span>
                  <span>Strict (75%)</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center text-xs mb-1.5">
                  <span className="text-slate-300 font-medium">NMS IoU Threshold</span>
                  <span className="font-mono text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/40">
                    {Math.round(iou * 100)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.10"
                  max="0.90"
                  step="0.05"
                  value={iou}
                  onChange={(e) => setIou(parseFloat(e.target.value))}
                  className="w-full accent-cyan-500 bg-slate-800 rounded-lg cursor-pointer h-1.5"
                />
                <span className="text-[11px] text-slate-400 block mt-1">
                  Filters overlapping duplicate bounding boxes
                </span>
              </div>
            </div>

            {/* Model Target Info Card */}
            <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl space-y-1 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Target Object Class:</span>
                <span className="font-mono font-semibold text-orange-300 bg-orange-950/60 px-1.5 py-0.5 rounded border border-orange-800/40">
                  {activeClassName}
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-400 text-[11px]">
                <span>Loaded Weights:</span>
                <span className="font-mono text-emerald-400">{modelInfo?.weights_path || 'best.pt'}</span>
              </div>
            </div>
          </div>

          {/* Action button */}
          <button
            onClick={() => runDetection()}
            disabled={!selectedFile || loading}
            className={`w-full py-3 px-4 rounded-xl font-semibold text-sm flex items-center justify-center space-x-2 transition cursor-pointer shadow-lg ${
              !selectedFile || loading
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-orange-500/20'
            }`}
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Running YOLO Inference...</span>
              </>
            ) : (
              <>
                <Zap className="w-4 h-4" />
                <span>Run Cone Detection</span>
              </>
            )}
          </button>
        </div>

        {/* Right column: Image Visualizer & Results */}
        <div className="lg:col-span-2 bg-[#0F172A] border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col justify-between">
          <div>
            {/* Header / Mode Switcher */}
            <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-800 gap-2">
              <div className="flex items-center space-x-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                  Visual Detection Result
                </span>
                {detectionResult && (
                  <div className="flex bg-slate-900 border border-slate-700/60 rounded-lg p-0.5 text-xs">
                    <button
                      onClick={() => setActiveView('annotated')}
                      className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                        activeView === 'annotated'
                          ? 'bg-blue-600 text-white font-medium shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Annotated YOLO
                    </button>
                    <button
                      onClick={() => setActiveView('original')}
                      className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                        activeView === 'original'
                          ? 'bg-blue-600 text-white font-medium shadow-sm'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      Original Image
                    </button>
                  </div>
                )}
              </div>

              {/* Action buttons (Download & Try Another) */}
              {detectionResult && (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-medium text-slate-300 transition cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-slate-400" />
                    <span>Try Another Image</span>
                  </button>

                  <button
                    onClick={handleDownload}
                    className="flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-lg text-xs font-medium transition cursor-pointer shadow-sm"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Annotated</span>
                  </button>
                </div>
              )}
            </div>

            {/* Error message */}
            {error && (
              <div className="mt-4 p-3 bg-red-950/40 border border-red-700/50 rounded-xl text-xs text-red-300 flex items-start space-x-2">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Image Preview Canvas */}
            <div className="mt-4 relative min-h-[380px] bg-slate-950/70 border border-slate-800/80 rounded-xl overflow-hidden flex items-center justify-center">
              {loading && (
                <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-sm z-20 flex flex-col items-center justify-center space-y-3 p-4 text-center">
                  <div className="w-10 h-10 border-4 border-cyan-500/20 border-t-cyan-400 rounded-full animate-spin" />
                  <p className="text-sm font-mono text-cyan-300 m-0">Executing Forward Pass with best.pt...</p>
                  <p className="text-xs text-slate-400 m-0">Scanning bounding boxes and calculating confidence scores</p>
                </div>
              )}

              {detectionResult ? (
                <img
                  src={activeView === 'annotated' ? detectionResult.annotated_image : previewUrl}
                  alt="Detection output"
                  className="max-h-[500px] w-auto max-w-full object-contain rounded-lg shadow-md"
                />
              ) : previewUrl ? (
                <img
                  src={previewUrl}
                  alt="Original upload"
                  className="max-h-[500px] w-auto max-w-full object-contain rounded-lg shadow-md"
                />
              ) : (
                <div className="text-center p-8 text-slate-500">
                  <Maximize2 className="w-12 h-12 mx-auto mb-3 opacity-30 text-slate-400" />
                  <p className="text-sm font-medium m-0">No image loaded</p>
                  <p className="text-xs text-slate-400 mt-1 m-0">Upload a road photo from the left panel to test detection</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Metrics Bar if results available */}
          {detectionResult && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-3 border-t border-slate-800">
              <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-xl">
                <span className="text-[11px] text-slate-400 uppercase font-medium">Objects Found</span>
                <p className="text-xl font-bold text-orange-400 m-0 flex items-center space-x-1.5">
                  <span>{detectionResult.count}</span>
                  <span className="text-xs font-normal text-slate-400 font-sans">
                    {detectionResult.count === 1 ? 'cone' : 'cones'}
                  </span>
                </p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-xl">
                <span className="text-[11px] text-slate-400 uppercase font-medium">Latency</span>
                <p className="text-xl font-bold text-cyan-400 font-mono m-0 flex items-center space-x-1">
                  <span>{detectionResult.inference_time_ms}</span>
                  <span className="text-xs font-normal text-slate-400 font-sans">ms</span>
                </p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-xl">
                <span className="text-[11px] text-slate-400 uppercase font-medium">Resolution</span>
                <p className="text-sm font-semibold text-slate-200 font-mono m-0 mt-1">
                  {detectionResult.image_size?.width} × {detectionResult.image_size?.height}
                </p>
              </div>

              <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded-xl">
                <span className="text-[11px] text-slate-400 uppercase font-medium">Active Weights</span>
                <p className="text-sm font-semibold text-emerald-400 font-mono m-0 mt-1 truncate">
                  {modelInfo?.weights_path || 'best.pt'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Clear No-Detections Notification Card */}
      {detectionResult && detectionResult.count === 0 && (
        <div className="bg-slate-900/90 border border-slate-700/80 rounded-2xl p-6 text-center space-y-3 shadow-xl">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-slate-800 text-slate-400 mx-auto">
            <SearchX className="w-6 h-6 text-amber-400" />
          </div>
          <div>
            <h4 className="text-base font-semibold text-white m-0">No Traffic Cones Detected</h4>
            <p className="text-sm text-slate-300 max-w-lg mx-auto mt-1 m-0">
              The model did not find any objects matching class <code className="text-orange-300 font-mono">{activeClassName}</code> above the <span className="font-semibold text-cyan-300">{Math.round(confidence * 100)}%</span> confidence threshold.
            </p>
          </div>

          <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-xl max-w-md mx-auto text-xs text-slate-400 text-left space-y-1">
            <p className="font-semibold text-slate-300 m-0">Helpful tips:</p>
            <ul className="list-disc pl-4 space-y-0.5 m-0">
              <li>Try lowering the <strong>Confidence Threshold</strong> slider (e.g. to 15% or 20%) to catch smaller or distant cones.</li>
              <li>Make sure the cones are visible and not heavily obscured or out of frame.</li>
            </ul>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            {confidence > 0.15 && (
              <button
                onClick={() => {
                  const newConf = Math.max(0.10, Math.round((confidence - 0.10) * 100) / 100);
                  setConfidence(newConf);
                  runDetection(newConf);
                }}
                className="px-4 py-2 bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/40 text-cyan-300 text-xs font-semibold rounded-lg transition cursor-pointer"
              >
                Retry with Lower Confidence ({Math.max(10, Math.round(confidence * 100) - 10)}%)
              </button>
            )}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-semibold rounded-lg transition cursor-pointer"
            >
              Try Another Image
            </button>
          </div>
        </div>
      )}

      {/* Detection Breakdown Table */}
      {detectionResult && detectionResult.detections.length > 0 && (
        <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between pb-3 border-b border-slate-800 gap-2">
            <h3 className="text-sm font-semibold text-white flex items-center space-x-2 m-0">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>Bounding Box Analysis ({detectionResult.detections.length} Cones Identified)</span>
            </h3>
            <span className="text-xs text-slate-400">
              Real predictions from custom model <code className="text-orange-300">{modelInfo?.weights_path || 'best.pt'}</code>
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-400 uppercase border-b border-slate-800 font-medium">
                <tr>
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Class Label</th>
                  <th className="py-2.5 px-3">Confidence Score</th>
                  <th className="py-2.5 px-3">Bounding Box [Xmin, Ymin, Xmax, Ymax]</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300 font-mono">
                {detectionResult.detections.map((det, index) => (
                  <tr key={index} className="hover:bg-slate-800/40 transition">
                    <td className="py-2.5 px-3 font-semibold text-slate-400">{index + 1}</td>
                    <td className="py-2.5 px-3 font-sans">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-orange-950/60 text-orange-400 border border-orange-700/50">
                        🚧 {det.class_name}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-cyan-300">
                          {det.confidence_pct || `${(det.confidence * 100).toFixed(1)}%`}
                        </span>
                        <div className="w-20 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div 
                            className="bg-cyan-400 h-1.5 rounded-full" 
                            style={{ width: `${Math.min(100, det.confidence * 100)}%` }}
                          />
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">
                      [{det.box.join(', ')}]
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Educational Note about confidence & metrics */}
          <div className="p-3 bg-slate-950/70 border border-slate-800 rounded-xl text-[11px] text-slate-400 flex items-start space-x-2">
            <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <p className="m-0 leading-relaxed">
              <strong>Understanding Confidence Scores:</strong> The percentage represents the model's certainty that a specific bounding box region contains a <code className="text-orange-300">{activeClassName}</code>. In real-world computer vision, high-quality detections typically range between 40% and 95% depending on distance, lighting, and camera angle.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
