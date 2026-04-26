import os
import shutil
import uuid
import asyncio
from fastapi import FastAPI, UploadFile, File, Form, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, JSONResponse
from pydantic import BaseModel
from typing import Optional, Dict

from ffmpeg_utils import process_video

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "uploads"
OUT_DIR = "outputs"
os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(OUT_DIR, exist_ok=True)

jobs_status: Dict[str, str] = {} 

class RenderRequest(BaseModel):
    video_file: str
    start_time: float
    end_time: float
    audio_file: Optional[str] = None
    audio_volume: float = 1.0
    watermark_file: Optional[str] = None

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    filename = f"{uuid.uuid4()}_{file.filename}"
    filepath = os.path.join(UPLOAD_DIR, filename)
    with open(filepath, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return {"filename": filename, "path": filepath}

@app.get("/stock-audio")
async def get_stock_audio():
    return [
        {"id": "lofi", "name": "Lofi Chill", "file": "lofi.mp3"},
        {"id": "cinematic", "name": "Cinematic Epic", "file": "cinematic.mp3"},
        {"id": "upbeat", "name": "Upbeat Pop", "file": "upbeat.mp3"}
    ]

@app.get("/stock-video")
async def get_stock_video():
    return [
        {"id": "nature", "name": "Nature Video", "url": "https://sample-videos.com/video321/mp4/720/big_buck_bunny_720p_1mb.mp4"}
    ]

async def background_render(job_id: str, req: RenderRequest):
    jobs_status[job_id] = "processing"
    
    video_path = os.path.join(UPLOAD_DIR, req.video_file)
    output_path = os.path.join(OUT_DIR, f"{job_id}.mp4")
    
    audio_path = os.path.join(UPLOAD_DIR, req.audio_file) if req.audio_file else None
    watermark_path = os.path.join(UPLOAD_DIR, req.watermark_file) if req.watermark_file else None
    
    try:
        await process_video(
            job_id=job_id,
            video_path=video_path,
            output_path=output_path,
            start_time=req.start_time,
            end_time=req.end_time,
            audio_path=audio_path,
            audio_volume=req.audio_volume,
            watermark_path=watermark_path
        )
        jobs_status[job_id] = "completed"
    except Exception as e:
        print("Render Exception:", e)
        jobs_status[job_id] = "failed"

@app.post("/render")
async def render_video(req: RenderRequest, background_tasks: BackgroundTasks):
    job_id = str(uuid.uuid4())
    background_tasks.add_task(background_render, job_id, req)
    return {"job_id": job_id, "status": "processing"}

@app.get("/status/{job_id}")
async def get_status(job_id: str):
    status = jobs_status.get(job_id, "not_found")
    return {"job_id": job_id, "status": status, "file": f"{job_id}.mp4" if status == "completed" else None}

@app.get("/download/{filename}")
async def download_file(filename: str):
    file_path = os.path.join(OUT_DIR, filename)
    if os.path.exists(file_path):
        return FileResponse(file_path, media_type="video/mp4", filename=filename)
    return JSONResponse(status_code=404, content={"message": "File not found"})
