# 🚧 Cone Detection System (YOLO26n Computer Vision Application)

## 📌 Project Overview

An end-to-end computer vision web application built with **React, FastAPI, and Ultralytics YOLO26n** for traffic cone detection and analysis across images, videos, and live webcam feeds.

The application uses a custom-trained object detection model to identify cones, generate bounding boxes, display confidence scores, and provide detection analytics through an interactive web interface. It combines machine learning, computer vision, and full-stack development into a single application.

## 🎯 Project Context

This project was developed as part of the technical selection process for **Team Matrix**. It provided an opportunity to apply machine learning and computer vision concepts by training and evaluating a YOLO26n model and integrating it into a React and FastAPI web application.

The project contributed to my selection for the club and reflects my interest in developing practical AI-powered systems.

---

## 📊 Model Specifications & Test Evaluation Results

The application uses a custom-trained **YOLO26n** model targeting the object class `cone_shape`.

The model was evaluated on **73 test images**, containing 157 evaluated cone instances, achieving the following results:

| Metric | Result | Description |
| :--- | :---: | :--- |
| **Precision (P)** | **91.27%** | Proportion of predicted detections that were correct under the evaluation settings |
| **Recall (R)** | **93.18%** | Proportion of ground-truth cone instances successfully detected |
| **mAP @ 0.50** | **95.60%** | Mean Average Precision at an IoU threshold of 0.50 |
| **mAP @ 0.50–0.95** | **74.85%** | Mean Average Precision averaged across IoU thresholds from 0.50 to 0.95 |
| **Target Class** | `cone_shape` | Single-class cone detector |
| **Model Weights** | `best.pt` | Trained checkpoint loaded by the backend for inference |

*Note: These metrics reflect performance on the test dataset and do not guarantee identical performance in real-world conditions.*

---

## 📁 Project Structure

```text
Cone_Detector/
├── backend/
│   ├── main.py              # FastAPI server and inference endpoints
│   ├── requirements.txt     # Python backend dependencies
│   ├── weights/
│   │   └── best.pt          # Trained model weights
│   ├── uploads/             # Temporary uploaded files
│   └── outputs/             # Generated detection outputs
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── ImageDetector.jsx
│   │   │   ├── VideoDetector.jsx
│   │   │   ├── CameraDetector.jsx
│   │   │   └── ProjectInfo.jsx
│   │   ├── App.jsx
│   │   └── index.css
│   ├── package.json
│   └── vite.config.js
├── run_backend.bat          # Windows backend launcher
├── run_frontend.bat         # Windows frontend launcher
└── README.md
```

*The structure above summarizes the main project files. Temporary and generated files may vary.*

---

## ⚡ Quick Start Guide (Windows)

### Step 1: Place the Model

Ensure the trained model checkpoint is available at:

```text
Cone_Detector\backend\weights\best.pt
```

If the checkpoint is stored elsewhere, copy it to this location or update the model path in the backend configuration.

### Step 2: Start the Backend (FastAPI)

Open a terminal in the project root and run:

```powershell
cd backend
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Alternatively, double-click `run_backend.bat` if it is configured for your environment.

The backend should be available at:

`http://127.0.0.1:8000`

### Step 3: Start the Frontend (React + Vite)

Open a second terminal in the project root and run:

```powershell
cd frontend
npm install
npm run dev
```

Alternatively, double-click `run_frontend.bat`.

Open the local URL shown in the terminal. For a typical Vite development server, this is:

`http://localhost:5173`

**Note:** These commands assume the FastAPI application instance is named `app` in `backend/main.py` and the frontend uses the standard Vite development configuration.

---

## 🎯 Features

### 1. Dashboard and Model Status

- Displays model status and relevant model information.
- Shows the target class and inference device where supported by the implementation.

### 2. Image Detection

- Supports JPG, JPEG, and PNG images.
- Generates bounding boxes, confidence scores, and detection counts.
- Handles images where no cones are detected.
- Supports downloading annotated images.

### 3. Video Processing

- Supports video formats including MP4, AVI, MOV, and WEBM, subject to backend codec support.
- Processes video frames for cone detection.
- Generates annotated video output and detection analytics where supported.

### 4. Real-Time Webcam Detection

- Uses a webcam feed for cone detection.
- Displays detection counts and latency where implemented.
- Supports saving detection snapshots.

### 5. Model Evaluation

- Presents model evaluation metrics: Precision, Recall, mAP@0.50, and mAP@0.50–0.95.
- Provides information about the trained model and its target class.

---

## 🛠️ Technologies Used

- **Python** — backend development and model inference
- **FastAPI** — API development
- **React** — frontend user interface
- **Vite** — frontend development and build tooling
- **Ultralytics YOLO26n** — object detection
- **PyTorch** — deep learning framework
- **OpenCV** — image and video processing, if used by the implementation

---

## 🚀 Future Improvements

- Evaluate the model on a larger and more diverse dataset.
- Improve robustness under different lighting, weather, and camera conditions.
- Test detection performance on distant, occluded, and visually similar objects.
- Optimize inference speed and deployment resource usage.
- Explore integration with robotics and live camera systems.

---

## 👨‍💻 Author

**Pratik Bharambe**

GitHub: [bharambepratik-08](https://github.com/bharambepratik-08)

---

*This project is intended for educational and experimental use. Model predictions should not be used as the sole basis for road-safety decisions.*
