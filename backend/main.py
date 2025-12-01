from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import os

from routers import insights, medicines
from database import test_connection

app = FastAPI(
    title="Medicine Data Visualization System",
    description="MDVS - CSE 412 Group 43 Project",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

frontend_path = os.path.join(os.path.dirname(__file__), "..", "frontend")
app.mount("/css", StaticFiles(directory=os.path.join(frontend_path, "css")), name="css")
app.mount("/js", StaticFiles(directory=os.path.join(frontend_path, "js")), name="js")

app.include_router(insights.router, prefix="/api/insights", tags=["Insights - Craig"])
app.include_router(medicines.router, prefix="/api/medicines", tags=["Medicines - Rhea"])

@app.get("/", response_class=FileResponse)
async def serve_index():
    return FileResponse(os.path.join(frontend_path, "index.html"))

@app.get("/health")
async def health_check():
    return {"api": "healthy", "database": test_connection()}