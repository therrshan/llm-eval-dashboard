from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging
from contextlib import asynccontextmanager
from typing import Dict, List, Optional
import asyncio

from app.api.models import router as models_router
from app.api.tests import router as tests_router
# Use minimal model manager until dependencies are fixed
try:
    from app.utils.model_manager import ModelManager
except ImportError as e:
    logger.warning(f"Using minimal model manager due to import error: {e}")
    from app.utils.model_manager_minimal import ModelManager

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global model manager instance
model_manager = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handle application startup and shutdown"""
    global model_manager
    
    # Startup
    logger.info("Starting LLM Diagnostic Dashboard...")
    model_manager = ModelManager()
    await model_manager.initialize()
    
    # Store in app state for access in routes
    app.state.model_manager = model_manager
    
    yield
    
    # Shutdown
    logger.info("Shutting down LLM Diagnostic Dashboard...")
    if model_manager:
        await model_manager.cleanup()

# Create FastAPI app
app = FastAPI(
    title="LLM Diagnostic Dashboard",
    description="A comprehensive diagnostic tool for evaluating Large Language Models",
    version="1.0.0",
    lifespan=lifespan
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # Added Vite port
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(models_router, prefix="/api/models", tags=["models"])
app.include_router(tests_router, prefix="/api/tests", tags=["tests"])

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "LLM Diagnostic Dashboard API",
        "status": "running",
        "version": "1.0.0"
    }

@app.get("/api/health")
async def health_check():
    """Detailed health check"""
    try:
        health_status = {
            "status": "healthy",
            "services": {
                "api": "running",
                "model_manager": "initialized" if model_manager else "not_initialized"
            }
        }
        
        if model_manager:
            loaded_models = await model_manager.get_loaded_models()
            health_status["loaded_models"] = len(loaded_models)
        
        return health_status
        
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return JSONResponse(
            status_code=503,
            content={"status": "unhealthy", "error": str(e)}
        )

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler"""
    logger.error(f"Unhandled exception: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "message": "An unexpected error occurred"
        }
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )