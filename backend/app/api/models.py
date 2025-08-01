from fastapi import APIRouter, HTTPException, Depends, Request
from pydantic import BaseModel, Field
from typing import Dict, List, Optional, Any
import logging

from app.utils.model_manager import ModelManager

logger = logging.getLogger(__name__)

router = APIRouter()

# Pydantic models for request/response
class LoadModelRequest(BaseModel):
    model_name: str = Field(..., description="Name/path of the model to load")
    provider: str = Field(default="huggingface_local", description="Model provider")
    model_id: Optional[str] = Field(None, description="Custom ID for the model")

class GenerateRequest(BaseModel):
    model_id: str = Field(..., description="ID of the loaded model")
    prompt: str = Field(..., description="Input prompt")
    max_length: Optional[int] = Field(None, description="Maximum generation length")
    temperature: Optional[float] = Field(None, description="Sampling temperature")
    top_p: Optional[float] = Field(None, description="Top-p sampling parameter")

class ModelResponse(BaseModel):
    id: str
    name: str
    provider: str
    size_category: str
    type: str
    is_loaded: bool
    memory_usage_mb: Optional[float] = None
    estimated_memory_gb: Optional[int] = None
    error: Optional[str] = None

class GenerateResponse(BaseModel):
    text: str
    model_id: str
    provider: str
    prompt_length: int
    generated_length: int

# Dependency to get model manager
def get_model_manager(request: Request) -> ModelManager:
    return request.app.state.model_manager

@router.get("/available", response_model=Dict[str, ModelResponse])
async def get_available_models(
    model_manager: ModelManager = Depends(get_model_manager)
):
    """Get all available models"""
    try:
        models = await model_manager.get_available_models()
        
        # Convert to response format
        response = {}
        for model_id, model_data in models.items():
            response[model_id] = ModelResponse(**model_data)
        
        return response
        
    except Exception as e:
        logger.error(f"Error getting available models: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/loaded", response_model=List[str])
async def get_loaded_models(
    model_manager: ModelManager = Depends(get_model_manager)
):
    """Get list of currently loaded model IDs"""
    try:
        return await model_manager.get_loaded_models()
    except Exception as e:
        logger.error(f"Error getting loaded models: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/load")
async def load_model(
    request: LoadModelRequest,
    model_manager: ModelManager = Depends(get_model_manager)
):
    """Load a model"""
    try:
        model_id = await model_manager.load_model(
            model_name=request.model_name,
            provider=request.provider,
            model_id=request.model_id
        )
        
        return {
            "success": True,
            "model_id": model_id,
            "message": f"Successfully loaded model: {model_id}"
        }
        
    except Exception as e:
        logger.error(f"Error loading model: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/unload/{model_id}")
async def unload_model(
    model_id: str,
    model_manager: ModelManager = Depends(get_model_manager)
):
    """Unload a model"""
    try:
        success = await model_manager.unload_model(model_id)
        
        if success:
            return {
                "success": True,
                "message": f"Successfully unloaded model: {model_id}"
            }
        else:
            raise HTTPException(status_code=404, detail=f"Model {model_id} not found or not loaded")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error unloading model: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/generate", response_model=GenerateResponse)
async def generate_text(
    request: GenerateRequest,
    model_manager: ModelManager = Depends(get_model_manager)
):
    """Generate text using a loaded model"""
    try:
        result = await model_manager.generate_text(
            model_id=request.model_id,
            prompt=request.prompt,
            max_length=request.max_length,
            temperature=request.temperature,
            top_p=request.top_p
        )
        
        return GenerateResponse(**result)
        
    except Exception as e:
        logger.error(f"Error generating text: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/info/{model_id}")
async def get_model_info(
    model_id: str,
    model_manager: ModelManager = Depends(get_model_manager)
):
    """Get detailed information about a specific model"""
    try:
        if model_id not in model_manager.loaded_models:
            raise HTTPException(status_code=404, detail=f"Model {model_id} not found")
        
        model_info = model_manager.loaded_models[model_id]
        
        return {
            "id": model_id,
            "name": model_info.name,
            "provider": model_info.provider,
            "model_path": model_info.model_path,
            "is_loaded": model_info.is_loaded,
            "loaded_at": model_info.loaded_at.isoformat() if model_info.loaded_at else None,
            "memory_usage_mb": model_info.memory_usage_mb,
            "size_category": model_info.size_category,
            "model_type": model_info.model_type,
            "error": model_info.error
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting model info: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/system/status")
async def get_system_status(
    model_manager: ModelManager = Depends(get_model_manager)
):
    """Get system status and resource usage"""
    try:
        import psutil
        import torch
        
        # System info
        memory = psutil.virtual_memory()
        cpu_percent = psutil.cpu_percent(interval=1)
        
        # GPU info
        gpu_info = {}
        if torch.cuda.is_available():
            gpu_info = {
                "available": True,
                "device_count": torch.cuda.device_count(),
                "current_device": torch.cuda.current_device(),
                "device_name": torch.cuda.get_device_name(),
                "memory_allocated": torch.cuda.memory_allocated() / 1024**2,  # MB
                "memory_reserved": torch.cuda.memory_reserved() / 1024**2,  # MB
            }
        else:
            gpu_info = {"available": False}
        
        # Model manager status
        loaded_models = await model_manager.get_loaded_models()
        
        return {
            "system": {
                "cpu_percent": cpu_percent,
                "memory": {
                    "total_gb": memory.total / 1024**3,
                    "available_gb": memory.available / 1024**3,
                    "used_percent": memory.percent
                },
                "gpu": gpu_info
            },
            "model_manager": {
                "device": model_manager.device,
                "max_models": model_manager.max_models,
                "loaded_count": len(loaded_models),
                "loaded_models": loaded_models
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting system status: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))