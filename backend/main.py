import os
import io
import time
import uuid
import glob
import base64
import logging
from typing import Optional, List, Dict, Any
from pathlib import Path

from fastapi import FastAPI, File, UploadFile, Form, HTTPException, BackgroundTasks, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
import numpy as np
from PIL import Image
import cv2

# Ultralytics YOLO import
try:
    from ultralytics import YOLO
    import torch
except ImportError:
    YOLO = None
    torch = None

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("cone-detector-backend")

# Base paths
BASE_DIR = Path(__file__).resolve().parent
WEIGHTS_DIR = BASE_DIR / "weights"
UPLOADS_DIR = BASE_DIR / "uploads"
OUTPUTS_DIR = BASE_DIR / "outputs"

# Ensure directories exist
WEIGHTS_DIR.mkdir(parents=True, exist_ok=True)
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)
OUTPUTS_DIR.mkdir(parents=True, exist_ok=True)

app = FastAPI(
    title="Cone Detection API",
    description="High-performance backend for custom YOLO cone_shape detection",
    version="1.0.0"
)

# Enable CORS for React frontend (Vite default: http://localhost:5173)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins during presentation & local testing
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global model state
loaded_model: Optional[Any] = None
current_weights_path: Optional[str] = None

def find_weights_file() -> Optional[Path]:
    """
    Search for 'best.pt' in likely paths:
    1. backend/weights/best.pt
    2. backend/best.pt
    3. project root (../best.pt)
    4. Any .pt file in backend/weights/
    """
    candidates = [
        WEIGHTS_DIR / "best.pt",
        BASE_DIR / "best.pt",
        BASE_DIR.parent / "best.pt",
        BASE_DIR.parent / "weights" / "best.pt",
    ]
    for p in candidates:
        if p.is_file():
            return p
            
    # Check if there is any .pt file in WEIGHTS_DIR
    pt_files = list(WEIGHTS_DIR.glob("*.pt"))
    if pt_files:
        return pt_files[0]
        
    return None

def load_yolo_model(weights_path: Optional[Path] = None) -> bool:
    """Load or reload the YOLO model from the specified or discovered path."""
    global loaded_model, current_weights_path
    
    if YOLO is None:
        logger.error("Ultralytics YOLO is not installed in current Python environment.")
        return False
        
    target_path = weights_path or find_weights_file()
    if target_path and target_path.is_file():
        try:
            logger.info(f"Loading YOLO model weights from: {target_path}")
            model = YOLO(str(target_path))
            loaded_model = model
            current_weights_path = str(target_path)
            logger.info(f"Model successfully loaded! Classes: {model.names}")
            return True
        except Exception as e:
            logger.error(f"Failed to load YOLO model from {target_path}: {e}")
            loaded_model = None
            current_weights_path = None
            return False
    else:
        logger.warning("No 'best.pt' weights file found yet.")
        loaded_model = None
        current_weights_path = None
        return False

# Attempt initial model load
load_yolo_model()

def get_active_model():
    """Ensure model is loaded or attempt to find it if newly added."""
    global loaded_model
    if loaded_model is None:
        if not load_yolo_model():
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Trained model 'best.pt' not found. Please place your 'best.pt' file into the 'backend/weights/' directory or upload it via the dashboard."
            )
    return loaded_model

def cleanup_old_files(directory: Path, max_age_seconds: int = 7200):
    """Safely remove temporary uploads and outputs older than max_age_seconds (default 2 hours)."""
    now = time.time()
    try:
        for file_path in directory.glob("*"):
            if file_path.is_file():
                if now - file_path.stat().st_mtime > max_age_seconds:
                    try:
                        file_path.unlink()
                        logger.info(f"Cleaned up old temporary file: {file_path.name}")
                    except Exception as e:
                        logger.warning(f"Could not remove {file_path.name}: {e}")
    except Exception as e:
        logger.warning(f"Error during directory cleanup: {e}")

class FrameDetectionRequest(BaseModel):
    image: str  # Base64 data URL or raw base64 string
    conf: Optional[float] = 0.25
    iou: Optional[float] = 0.45

@app.get("/api/health")
def health_check():
    return {"status": "ok", "timestamp": time.time()}

@app.get("/api/model/info")
def get_model_info():
    """Return status of YOLO model, classes, hardware accelerator, etc."""
    global loaded_model, current_weights_path
    
    # Try finding again if not loaded
    if loaded_model is None:
        load_yolo_model()
        
    device = "CUDA (GPU)" if (torch and torch.cuda.is_available()) else "CPU"
    gpu_name = torch.cuda.get_device_name(0) if (torch and torch.cuda.is_available()) else None
    
    if loaded_model is not None:
        names = loaded_model.names if hasattr(loaded_model, "names") else {}
        return {
            "status": "ready",
            "loaded": True,
            "weights_path": os.path.basename(current_weights_path) if current_weights_path else "best.pt",
            "classes": names,
            "num_classes": len(names),
            "device": device,
            "gpu_name": gpu_name,
            "torch_version": torch.__version__ if torch else "N/A"
        }
    else:
        return {
            "status": "missing_weights",
            "loaded": False,
            "weights_path": None,
            "classes": {},
            "num_classes": 0,
            "device": device,
            "gpu_name": gpu_name,
            "message": "Weights file 'best.pt' not found. Please place 'best.pt' in 'backend/weights/' or upload it."
        }

@app.post("/api/model/upload-weights")
async def upload_weights(file: UploadFile = File(...)):
    """Allow user to directly upload their best.pt file through the UI."""
    if not file.filename.endswith(".pt"):
        raise HTTPException(status_code=400, detail="Only PyTorch .pt model files are supported.")
        
    save_path = WEIGHTS_DIR / "best.pt"
    try:
        with open(save_path, "wb") as buffer:
            while chunk := await file.read(1024 * 1024):  # 1MB chunks
                buffer.write(chunk)
                
        # Reload model
        success = load_yolo_model(save_path)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to initialize YOLO model from the uploaded file.")
            
        return {
            "success": True,
            "message": f"Successfully loaded '{file.filename}' as active model.",
            "classes": loaded_model.names,
            "device": "CUDA" if (torch and torch.cuda.is_available()) else "CPU"
        }
    except Exception as e:
        logger.error(f"Error handling weights upload: {e}")
        raise HTTPException(status_code=500, detail=f"Error saving model weights: {str(e)}")

@app.post("/api/detect/image")
async def detect_image(
    file: UploadFile = File(...),
    conf: float = Form(0.25),
    iou: float = Form(0.45),
    background_tasks: BackgroundTasks = None
):
    """
    Perform inference on an uploaded image.
    Validates file format, checks dimensions, runs YOLO, and returns detection count,
    bounding boxes, confidence percentages, and an annotated image (base64).
    """
    model = get_active_model()
    
    # 1. Validate file extension
    ext = os.path.splitext(file.filename or "")[1].lower()
    allowed_extensions = [".jpg", ".jpeg", ".png", ".webp", ".bmp"]
    if ext and ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type '{ext}'. Please upload an image in JPG, PNG, or WEBP format."
        )

    # 2. Read image contents and validate length
    contents = await file.read()
    if not contents or len(contents) == 0:
        raise HTTPException(status_code=400, detail="The uploaded file is empty. Please select a valid image.")
        
    if len(contents) > 25 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Image file exceeds the 25 MB limit. Please upload a smaller image.")
        
    # 3. Decode image
    try:
        pil_image = Image.open(io.BytesIO(contents)).convert("RGB")
    except Exception as e:
        raise HTTPException(status_code=400, detail="Could not decode image. The file may be corrupted or not a valid image.")

    orig_width, orig_height = pil_image.size

    # 4. Safe downscaling if image is excessively large (>2560px) to prevent OOM
    max_dim = max(orig_width, orig_height)
    if max_dim > 2560:
        scale = 2560.0 / max_dim
        new_w = int(orig_width * scale)
        new_h = int(orig_height * scale)
        pil_image = pil_image.resize((new_w, new_h), Image.Resampling.LANCZOS)
        logger.info(f"Downscaled image from {orig_width}x{orig_height} to {new_w}x{new_h} for inference safety.")

    image_np = np.array(pil_image)
    img_height, img_width = image_np.shape[:2]
    
    # 5. Run YOLO inference
    start_time = time.perf_counter()
    try:
        results = model.predict(source=image_np, conf=conf, iou=iou, verbose=False)
    except Exception as e:
        logger.error(f"Inference error: {e}")
        raise HTTPException(status_code=500, detail=f"Inference execution failed: {str(e)}")
    inference_time_ms = round((time.perf_counter() - start_time) * 1000, 1)
    
    result = results[0]
    detections = []
    
    if result.boxes is not None and len(result.boxes) > 0:
        for box in result.boxes:
            xyxy = box.xyxy[0].tolist()
            confidence_val = float(box.conf[0])
            cls_id = int(box.cls[0])
            cls_name = model.names.get(cls_id, f"class_{cls_id}")
            
            detections.append({
                "class_id": cls_id,
                "class_name": cls_name,
                "confidence": round(confidence_val, 4),
                "confidence_pct": f"{confidence_val * 100:.1f}%",
                "box": [round(coord, 1) for coord in xyxy]  # [x1, y1, x2, y2]
            })
            
    # 6. Generate annotated image
    # If no detections, plot() still cleanly returns the original frame
    annotated_bgr = result.plot()
    annotated_rgb = cv2.cvtColor(annotated_bgr, cv2.COLOR_BGR2RGB)
    
    buffered = io.BytesIO()
    Image.fromarray(annotated_rgb).save(buffered, format="JPEG", quality=90)
    annotated_base64 = "data:image/jpeg;base64," + base64.b64encode(buffered.getvalue()).decode("utf-8")
    
    count = len(detections)
    message = (
        f"Successfully detected {count} cone{'s' if count != 1 else ''}."
        if count > 0 else
        f"No cone-shaped objects detected at confidence threshold {int(conf * 100)}%."
    )

    return {
        "success": True,
        "count": count,
        "message": message,
        "detections": detections,
        "inference_time_ms": inference_time_ms,
        "image_size": {"width": img_width, "height": img_height},
        "annotated_image": annotated_base64
    }

@app.post("/api/detect/frame")
async def detect_frame(request: FrameDetectionRequest):
    """
    Real-time webcam single-frame detection endpoint.
    Receives base64 image, returns count, detections, and annotated base64 frame.
    """
    model = get_active_model()
    
    # Extract base64 content
    img_data = request.image
    if "," in img_data:
        img_data = img_data.split(",", 1)[1]
        
    try:
        image_bytes = base64.b64decode(img_data)
        nparr = np.frombuffer(image_bytes, np.uint8)
        frame_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        if frame_bgr is None:
            raise ValueError("Could not decode image")
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Invalid base64 frame: {str(e)}")
        
    start_time = time.perf_counter()
    results = model.predict(source=frame_bgr, conf=request.conf, iou=request.iou, verbose=False)
    inference_time_ms = round((time.perf_counter() - start_time) * 1000, 1)
    
    result = results[0]
    detections = []
    
    if result.boxes is not None and len(result.boxes) > 0:
        for box in result.boxes:
            xyxy = box.xyxy[0].tolist()
            confidence = float(box.conf[0])
            cls_id = int(box.cls[0])
            cls_name = model.names.get(cls_id, f"class_{cls_id}")
            
            detections.append({
                "class_id": cls_id,
                "class_name": cls_name,
                "confidence": round(confidence, 3),
                "box": [round(c, 1) for c in xyxy]
            })
            
    # Annotate frame
    annotated_bgr = result.plot()
    _, buffer = cv2.imencode('.jpg', annotated_bgr, [int(cv2.IMWRITE_JPEG_QUALITY), 85])
    annotated_base64 = "data:image/jpeg;base64," + base64.b64encode(buffer).decode("utf-8")
    
    return {
        "success": True,
        "count": len(detections),
        "detections": detections,
        "inference_time_ms": inference_time_ms,
        "annotated_image": annotated_base64
    }

@app.post("/api/detect/video")
async def detect_video(
    file: UploadFile = File(...),
    conf: float = Form(0.25),
    iou: float = Form(0.45),
    background_tasks: BackgroundTasks = None
):
    """
    Process an uploaded video file, annotate every frame with bounding boxes,
    and produce a downloadable and streamable browser-compatible MP4.
    """
    model = get_active_model()
    
    # Validate extension
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".mp4", ".avi", ".mov", ".mkv", ".webm"]:
        raise HTTPException(status_code=400, detail=f"Unsupported video format '{ext}'. Please upload MP4, AVI, MOV, or WEBM.")
        
    unique_id = str(uuid.uuid4())[:8]
    temp_input_path = UPLOADS_DIR / f"{unique_id}_input{ext}"
    output_filename = f"{unique_id}_annotated.mp4"
    output_path = OUTPUTS_DIR / output_filename
    
    # Stream write uploaded video to disk
    try:
        with open(temp_input_path, "wb") as buffer:
            while chunk := await file.read(1024 * 1024):  # 1MB chunk
                buffer.write(chunk)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save uploaded video: {str(e)}")
        
    # Open video capture
    cap = cv2.VideoCapture(str(temp_input_path))
    if not cap.isOpened():
        temp_input_path.unlink(missing_ok=True)
        raise HTTPException(status_code=400, detail="Could not open video file. Please check video codec.")
        
    orig_width = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    orig_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    fps = cap.get(cv2.CAP_PROP_FPS)
    if fps <= 0 or np.isnan(fps):
        fps = 25.0
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    
    # Scale down very high-res 4K videos if needed to keep processing fast
    target_width = orig_width
    target_height = orig_height
    max_dimension = 1280
    if max(orig_width, orig_height) > max_dimension:
        scale = max_dimension / max(orig_width, orig_height)
        target_width = int(orig_width * scale)
        target_height = int(orig_height * scale)
        # Ensure dimensions are even for video encoders
        target_width = target_width if target_width % 2 == 0 else target_width - 1
        target_height = target_height if target_height % 2 == 0 else target_height - 1

    # Setup video writer
    # Attempt using imageio for standard H.264 browser compatibility
    writer = None
    use_imageio = False
    try:
        import imageio
        writer = imageio.get_writer(
            str(output_path),
            fps=fps,
            codec='libx264',
            format='FFMPEG',
            pixelformat='yuv420p',
            output_params=['-preset', 'fast', '-crf', '23']
        )
        use_imageio = True
        logger.info("Using imageio-ffmpeg H.264 writer for video processing.")
    except Exception as img_err:
        logger.warning(f"imageio-ffmpeg setup fallback to cv2.VideoWriter: {img_err}")
        fourcc = cv2.VideoWriter_fourcc(*'mp4v')
        writer = cv2.VideoWriter(str(output_path), fourcc, fps, (target_width, target_height))
        use_imageio = False

    # Processing loop
    frame_idx = 0
    total_detections_sum = 0
    max_cones_in_frame = 0
    frames_with_cones = 0
    start_time = time.perf_counter()
    
    try:
        while True:
            ret, frame = cap.read()
            if not ret:
                break
                
            frame_idx += 1
            if (target_width, target_height) != (orig_width, orig_height):
                frame = cv2.resize(frame, (target_width, target_height))
                
            # Run YOLO on frame
            results = model.predict(source=frame, conf=conf, iou=iou, verbose=False)
            result = results[0]
            
            cone_count = 0
            if result.boxes is not None:
                cone_count = len(result.boxes)
                
            total_detections_sum += cone_count
            if cone_count > max_cones_in_frame:
                max_cones_in_frame = cone_count
            if cone_count > 0:
                frames_with_cones += 1
                
            # Annotate frame
            annotated_frame = result.plot()
            
            # Add technical stats banner overlay at top-left
            cv2.rectangle(annotated_frame, (10, 10), (320, 60), (15, 23, 42), -1)
            cv2.rectangle(annotated_frame, (10, 10), (320, 60), (2, 132, 199), 1)
            cv2.putText(
                annotated_frame,
                f"Cones in Frame: {cone_count} | Peak: {max_cones_in_frame}",
                (20, 34),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.55,
                (240, 240, 240),
                1,
                cv2.LINE_AA
            )
            cv2.putText(
                annotated_frame,
                f"Frame: {frame_idx}/{total_frames} | Model: YOLO custom",
                (20, 52),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.45,
                (56, 189, 248),
                1,
                cv2.LINE_AA
            )
            
            if use_imageio:
                # imageio expects RGB
                rgb_frame = cv2.cvtColor(annotated_frame, cv2.COLOR_BGR2RGB)
                writer.append_data(rgb_frame)
            else:
                writer.write(annotated_frame)
                
    finally:
        cap.release()
        if writer is not None:
            if use_imageio:
                writer.close()
            else:
                writer.release()
        # Clean up original uploaded file
        try:
            temp_input_path.unlink(missing_ok=True)
        except Exception:
            pass

    proc_time_sec = round(time.perf_counter() - start_time, 2)
    duration_sec = round(frame_idx / fps, 2) if fps > 0 else 0
    
    # Schedule cleanup of temp files in background
    if background_tasks:
        background_tasks.add_task(cleanup_old_files, UPLOADS_DIR)
        background_tasks.add_task(cleanup_old_files, OUTPUTS_DIR)

    return {
        "success": True,
        "video_id": output_filename,
        "stream_url": f"/api/video/stream/{output_filename}",
        "download_url": f"/api/video/download/{output_filename}",
        "total_frames": frame_idx,
        "fps": round(fps, 1),
        "duration_seconds": duration_sec,
        "total_cones_detected": total_detections_sum,
        "max_cones_in_frame": max_cones_in_frame,
        "frames_with_cones": frames_with_cones,
        "processing_time_seconds": proc_time_sec,
        "processing_fps": round(frame_idx / proc_time_sec, 1) if proc_time_sec > 0 else 0
    }

@app.get("/api/video/stream/{filename}")
def stream_video(filename: str):
    """Stream processed video for inline HTML5 video player."""
    safe_filename = os.path.basename(filename)
    file_path = OUTPUTS_DIR / safe_filename
    if not file_path.is_file():
        raise HTTPException(status_code=404, detail="Processed video not found.")
    return FileResponse(path=file_path, media_type="video/mp4")

@app.get("/api/video/download/{filename}")
def download_video(filename: str):
    """Download annotated video as an attachment."""
    safe_filename = os.path.basename(filename)
    file_path = OUTPUTS_DIR / safe_filename
    if not file_path.is_file():
        raise HTTPException(status_code=404, detail="Processed video not found.")
    return FileResponse(
        path=file_path,
        media_type="video/mp4",
        filename=f"annotated_cone_detection_{safe_filename}"
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
