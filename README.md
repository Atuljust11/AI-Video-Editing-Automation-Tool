# AI Video Editing & Automation Tool (Phase 1 MVP)

This is a web-based video editing tool that allows you to upload, trim, watermark, and mix background audio into a video entirely using FFmpeg and FastAPI on the backend, with a visually premium React frontend.

## Prerequisites
- **Python 3.10+**
- **Node.js 18+** 
- **FFmpeg**: Must be fully installed and accessible in your system's PATH.

---

## 🚀 How to Run the Application

Because this uses a split architecture, you need to run two separate terminals (one for the Backend API, and one for the Frontend UI).

### 1. Start the Backend (FastAPI)
Open your first terminal (PowerShell) and run:
```powershell
cd "C:\dev2\AI Video Editing & Automation Tool\backend"

# Activate the virtual environment
.\venv\Scripts\Activate.ps1

# Start the Python server
uvicorn main:app --reload --port 8000
```
*The backend API will now be running on `http://localhost:8000`.*

### 2. Start the Frontend (Vite + React)
Open a **new** terminal window and run:
```powershell
cd "C:\dev2\AI Video Editing & Automation Tool\frontend"

# Start the Vite development server
npm run dev
```
*The frontend UI will now be running on `http://localhost:5173`. Open this URL in your web browser!*


---

## 🧪 Testing the Video Editor
To ensure everything works end-to-end:
1. Go to `http://localhost:5173` in your browser.
2. Select and upload a short sample `.mp4` video.
3. Configure your trim times (e.g., Start: `0`, End: `5`).
4. Upload a small `.png` file as a watermark.
5. Upload a `.mp3` file for background music and adjust the volume slider.
6. Click **"Export Final Video"** at the bottom right.
7. Once the loading spinner completes, download the generated video and check if all effects were applied correctly!
