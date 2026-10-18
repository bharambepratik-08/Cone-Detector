import React, { useState, useRef } from 'react';
import { 
  Cpu, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  BookOpen, 
  Target, 
  Layers, 
  BarChart3, 
  FileCode, 
  HardDrive,
  Info,
  ExternalLink,
  ShieldCheck,
  Award
} from 'lucide-react';

export default function ProjectInfo({ modelInfo, onReloadModel }) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(null);
  const fileInputRef = useRef(null);

  // Optional custom chart upload
  const [evalImage, setEvalImage] = useState(null);
  const evalInputRef = useRef(null);

  const activeClassName = Object.values(modelInfo?.classes || {})[0] || 'cone_shape';

  const handleWeightsUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.pt')) {
      setUploadError('Only PyTorch weights (.pt) are accepted.');
      return;
    }

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/model/upload-weights', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.detail || 'Weights upload failed.');
      }

      setUploadSuccess(`Successfully loaded ${file.name}! Active class: ${activeClassName}.`);
      onReloadModel();
    } catch (err) {
      setUploadError(err.message || 'Failed to upload weights.');
    } finally {
      setUploading(false);
    }
  };

  const handleEvalImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setEvalImage(URL.createObjectURL(file));
    }
  };

  return (
    <div className="space-y-8">
      {/* Verified Model Evaluation Scorecard */}
      <div className="bg-[#0F172A] border border-blue-900/50 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mr-16 -mt-16 w-60 h-60 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none" />
        
        <div className="flex flex-wrap items-center justify-between pb-4 border-b border-slate-800 gap-3">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-gradient-to-tr from-cyan-600 to-blue-600 rounded-xl text-white shadow-md shadow-cyan-500/20">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white m-0">YOLO26n Model Evaluation Report</h3>
                <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950 text-emerald-300 border border-emerald-700/60">
                  Verified Test Metrics
                </span>
              </div>
              <p className="text-xs text-slate-400 m-0">
                Independent evaluation conducted on <strong>73 test images</strong> (<code className="text-orange-300">ConeDetection/cone_shape_detector</code>)
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".pt"
              onChange={handleWeightsUpload}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center space-x-1.5 transition cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5 text-cyan-400" />
              <span>{uploading ? 'Loading best.pt...' : 'Update best.pt'}</span>
            </button>
          </div>
        </div>

        {uploadSuccess && (
          <div className="mt-4 p-3 bg-emerald-950/50 border border-emerald-700/60 rounded-xl text-xs text-emerald-300 flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{uploadSuccess}</span>
          </div>
        )}

        {uploadError && (
          <div className="mt-4 p-3 bg-red-950/50 border border-red-700/60 rounded-xl text-xs text-red-300 flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}

        {/* 4 Core Verified Metrics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl text-center">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block">Precision (P)</span>
            <p className="text-3xl font-extrabold text-cyan-400 font-mono mt-1 m-0">91.27%</p>
            <span className="text-[11px] text-slate-400 mt-1 block">Accuracy of cone predictions</span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl text-center">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block">Recall (R)</span>
            <p className="text-3xl font-extrabold text-emerald-400 font-mono mt-1 m-0">93.18%</p>
            <span className="text-[11px] text-slate-400 mt-1 block">Actual cones captured</span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl text-center">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block">mAP @ 0.50</span>
            <p className="text-3xl font-extrabold text-orange-400 font-mono mt-1 m-0">95.60%</p>
            <span className="text-[11px] text-slate-400 mt-1 block">IoU 0.50 mean average precision</span>
          </div>

          <div className="bg-slate-900/90 border border-slate-800 p-4 rounded-xl text-center">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block">mAP @ 0.50:0.95</span>
            <p className="text-3xl font-extrabold text-indigo-400 font-mono mt-1 m-0">74.85%</p>
            <span className="text-[11px] text-slate-400 mt-1 block">Multi-threshold strict localization</span>
          </div>
        </div>

        {/* Status specs grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-800">
          <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
            <span className="text-[11px] text-slate-400 uppercase">Test Dataset Split</span>
            <p className="text-sm font-semibold text-slate-200 mt-0.5 m-0">73 Test Images</p>
          </div>

          <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
            <span className="text-[11px] text-slate-400 uppercase">Target Object Class</span>
            <p className="text-sm font-semibold text-orange-300 font-mono mt-0.5 m-0">
              {activeClassName} (ID: 0)
            </p>
          </div>

          <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
            <span className="text-[11px] text-slate-400 uppercase">Inference Hardware</span>
            <p className="text-sm font-semibold text-cyan-300 font-mono mt-0.5 m-0">
              {modelInfo?.device || 'CPU'}
            </p>
          </div>

          <div className="bg-slate-900/60 p-3 rounded-lg border border-slate-800/80">
            <span className="text-[11px] text-slate-400 uppercase">Model Architecture</span>
            <p className="text-sm font-semibold text-slate-200 font-mono mt-0.5 m-0 truncate">
              YOLO26n ({modelInfo?.weights_path || 'best.pt'})
            </p>
          </div>
        </div>
      </div>

      {/* Engineering Project Presentation Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Left Card: System & Architecture */}
        <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center space-x-2.5 pb-3 border-b border-slate-800">
            <Layers className="w-5 h-5 text-cyan-400" />
            <h3 className="text-base font-bold text-white m-0">Cone Detection Pipeline & Architecture</h3>
          </div>

          <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
            <div>
              <h4 className="text-sm font-semibold text-slate-100 mb-1">1. Objective & Scope</h4>
              <p className="text-slate-400 m-0">
                The system specializes in detecting cone-shaped markers and cones in real time. General-purpose object detectors trained on broad datasets often struggle with small, rotated, or partially obstructed cones. This custom-trained YOLO26n model specifically targets the single object class <code className="text-orange-300 font-mono font-semibold">{activeClassName}</code>, delivering high confidence and minimal false alarms.
              </p>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-100 mb-1">2. YOLO Single-Stage Detection Pipeline</h4>
              <ul className="list-disc pl-4 space-y-1 text-slate-400">
                <li><strong className="text-slate-200">Backbone:</strong> CSPDarknet feature extractor with spatial pyramid pooling for multi-scale feature maps.</li>
                <li><strong className="text-slate-200">Neck:</strong> Path Aggregation Network (PANet) fusing geometric edge details with high-level semantic context.</li>
                <li><strong className="text-slate-200">Head:</strong> Decoupled anchor-free detection head predicting cone bounding boxes and classification scores.</li>
                <li><strong className="text-slate-200">Loss Functions:</strong> CIoU regression and Distribution Focal Loss for localization accuracy.</li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-slate-100 mb-1">3. Decoupled Web Architecture</h4>
              <p className="text-slate-400 m-0">
                FastAPI runs asynchronous inference using PyTorch and Ultralytics on the backend, streaming coordinates and annotated results to the responsive React UI without blocking browser interactions.
              </p>
            </div>
          </div>
        </div>

        {/* Right Card: Evaluation Methodology & Attached Charts */}
        <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2.5">
              <BarChart3 className="w-5 h-5 text-orange-400" />
              <h3 className="text-base font-bold text-white m-0">Evaluation Methodology</h3>
            </div>
            
            <input
              ref={evalInputRef}
              type="file"
              accept="image/*"
              onChange={handleEvalImageUpload}
              className="hidden"
            />
            <button
              onClick={() => evalInputRef.current?.click()}
              className="text-xs text-slate-400 hover:text-cyan-300 flex items-center space-x-1 cursor-pointer"
            >
              <Upload className="w-3 h-3" />
              <span>Attach Training Plot</span>
            </button>
          </div>

          <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
            <p className="text-slate-400 m-0">
              The model's performance on the 73 test images demonstrates balanced precision and recall:
            </p>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                <span className="font-semibold text-cyan-300 block mb-0.5">Precision (91.27%)</span>
                <span className="text-slate-400 text-[11px]">
                  <code className="text-cyan-200 bg-slate-950 px-1 py-0.5 rounded font-mono text-[10px]">P = TP / (TP + FP)</code>
                  <br />
                  91.3% of detected cones are true cones; low false alarm rate.
                </span>
              </div>

              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                <span className="font-semibold text-emerald-300 block mb-0.5">Recall (93.18%)</span>
                <span className="text-slate-400 text-[11px]">
                  <code className="text-emerald-200 bg-slate-950 px-1 py-0.5 rounded font-mono text-[10px]">R = TP / (TP + FN)</code>
                  <br />
                  93.2% of all actual cones in the test scenes were captured.
                </span>
              </div>

              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                <span className="font-semibold text-orange-300 block mb-0.5">mAP@50 (95.60%)</span>
                <span className="text-slate-400 text-[11px]">
                  High accuracy across the standard 0.50 bounding box overlap threshold.
                </span>
              </div>

              <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
                <span className="font-semibold text-indigo-300 block mb-0.5">mAP@50-95 (74.85%)</span>
                <span className="text-slate-400 text-[11px]">
                  Average across 10 IoU levels (0.50 to 0.95) proving tight bounding box localization.
                </span>
              </div>
            </div>

            {/* Display attached Colab training results plot */}
            {evalImage ? (
              <div className="mt-3 p-2 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-[11px] font-semibold text-slate-400 mb-1 block">
                  Attached Training Plot (<code className="text-orange-300">results.png</code>):
                </span>
                <img
                  src={evalImage}
                  alt="Training metrics chart"
                  className="rounded-lg max-h-60 w-full object-contain mx-auto"
                />
              </div>
            ) : (
              <div className="mt-3 p-3 bg-slate-950/60 rounded-xl border border-dashed border-slate-800 text-center">
                <p className="text-[11px] text-slate-400 m-0">
                  You can click <strong className="text-slate-200">"Attach Training Plot"</strong> to display your Google Colab curves (<code className="text-orange-300">results.png</code> or <code className="text-orange-300">confusion_matrix.png</code>) directly in the presentation view.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
