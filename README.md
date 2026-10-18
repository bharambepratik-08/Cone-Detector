# 🚧 Cone Detection System (YOLO26n Computer Vision Application)

An end-to-end Computer Vision web application built with **React**, **FastAPI**, and **Ultralytics YOLO** for real-time cone detection and analysis.

---

## 📊 Model Specifications & Test Evaluation Results

The application runs a custom-trained **YOLO26n** model targeting the object class `cone_shape`.
The model was evaluated on **73 independent test images** (`ConeDetection/cone_shape_detector`), achieving:

| Metric | Result | Description |
| :--- | :---: | :--- |
| **Precision (P)** | **91.27%** | High certainty; low rate of false alarms |
| **Recall (R)** | **93.18%** | Captures over 93% of ground-truth cones in test scenes |
| **mAP @ 0.50** | **95.60%** | Mean Average Precision at IoU 0.50 threshold |
| **mAP @ 0.50–0.95** | **74.85%** | Strict localization metric across 10 IoU intervals |
| **Target Class** | `cone_shape` | Dedicated single-class detector |
| **Model Weights** | `best.pt` | Loaded dynamically on server boot |

---

## 📁 Project Structure

```text
Cone_Detector/
├── backend/
│   ├── main.py              # FastAPI server (Inference endpoints, validation, CORS)
│   ├── requirements.txt     # Python dependencies (FastAPI, Ultralytics, PyTorch, OpenCV, ImageIO)
│   ├── weights/             # 📍 Model weights: best.pt
│   ├── uploads/             # Temporary processing storage (auto-cleaned)
│   └── outputs/             # Output annotated videos (auto-cleaned)
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx          # Live model status badge & tab navigation
│   │   │   ├── ImageDetector.jsx   # Image upload, bounding boxes, zero-detection handling, download
│   │   │   ├── VideoDetector.jsx   # Video processing, H.264 stream encoding, analytics report
│   │   │   ├── CameraDetector.jsx  # Real-time webcam feed with live cone counter & snapshot
│   │   │   └── ProjectInfo.jsx     # YOLO26n architecture, verified evaluation scorecard & metrics
│   │   ├── App.jsx                 # Main application dashboard
│   │   └── index.css               # Professional dark navy and blue computer-vision theme
│   ├── package.json
│   └── vite.config.js              # Vite server & API proxy
├── run_backend.bat          # 1-click Windows backend runner
├── run_frontend.bat         # 1-click Windows frontend runner
└── README.md
```

---

## ⚡ Quick Start Guide (Windows)

### Step 1: Model Placement
The trained weights file `best.pt` is stored at:
```text
Cone_Detector\backend\weights\best.pt
```
*(If you have updated weights from Google Drive, copy `best.pt` to this folder or upload it through the web UI under the **Model & Evaluation** tab).*

---

### Step 2: Start the Backend (FastAPI)
Open a terminal in the project folder and run:
```powershell
cd backend
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```
*Or double-click `run_backend.bat`.*

The backend initializes at: `http://127.0.0.1:8000`

---

### Step 3: Start the Frontend (React + Vite)
Open a second terminal and run:
```powershell
cd frontend
npm run dev
```
*Or double-click `run_frontend.bat`.*

Open your browser and navigate to:
```text
http://localhost:5173
```

---

## 🎯 Verification & Features

1. **Dashboard & Status Indicator**: Live model verification confirming your custom `best.pt`, target class (`cone_shape`), and device (CUDA / CPU).
2. **Image Detection**:
   - Supports JPG, JPEG, and PNG images with safety validation (file extension, size check, safe downscaling for huge images).
   - Real-time YOLO inference returning labeled bounding boxes, total detections, and confidence scores.
   - Distinct **"No Cones Detected"** state with suggestions when objects are below threshold.
   - 1-click download of the annotated image.
3. **Video Processing**:
   - Supports MP4, AVI, MOV, WEBM.
   - Frame-by-frame YOLO inference with detection density overlay.
   - Encodes to standard H.264 MP4 for instant browser playback.
4. **Real-Time Webcam Detection**:
   - Live camera stream with live cone counter and latency (ms).
   - "Save Snapshot" button to capture and download any live frame.
5. **Verified Evaluation Scorecard**:
   - Displays real test evaluation metrics: **Precision 91.27%**, **Recall 93.18%**, **mAP50 95.60%**, and **mAP50–95 74.85%**.
