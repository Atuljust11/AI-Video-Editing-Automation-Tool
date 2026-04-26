---
description: Start the AI Video Editor application servers
---

This workflow starts the FastAPI backend server and the Vite React frontend development server safely in the background.

// turbo-all

1. Start the FastAPI backend server on port 8000
```powershell
cd backend
.\venv\Scripts\python.exe -m uvicorn main:app --reload --port 8000
```

2. Start the Vite React frontend server on port 5173
```powershell
cd frontend
npm run dev
```

The UI should now be available in your browser at http://localhost:5173.