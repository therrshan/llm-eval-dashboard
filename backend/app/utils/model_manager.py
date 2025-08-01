import asyncio
import logging
import torch
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import dataclass
from transformers import (
    AutoTokenizer, 
    AutoModelForCausalLM, 
    pipeline,
    Pipeline
)
import gc
import psutil
import httpx
from datetime import datetime

from config import settings, POPULAR_MODELS, MODEL_SIZE_CATEGORIES

logger = logging.getLogger(__name__)

@dataclass
class ModelInfo:
    """Information about a loaded model"""
    name: str
    provider: str
    model_path: str
    tokenizer: Optional[Any] = None
    model: Optional[Any] = None
    pipeline: Optional[Pipeline] = None
    loaded_at: Optional[datetime] = None
    memory_usage_mb: float = 0.0
    size_category: str = "unknown"
    model_type: str = "general"
    is_loaded: bool = False
    error: Optional[str] = None

class ModelManager:
    """Manages loading, unloading, and inference for multiple LLM models"""
    
    def __init__(self):
        self.loaded_models: Dict[str, ModelInfo] = {}
        self.device = self._determine_device()
        self.max_models = settings.MAX_MODELS_IN_MEMORY
        logger.info(f"ModelManager initialized with device: {self.device}")
    
    def _determine_device(self) -> str:
        """Determine the best device for inference"""
        if settings.ENABLE_GPU and torch.cuda.is_available():
            return "cuda"
        elif hasattr(torch.backends, 'mps') and torch.backends.mps.is_available():
            return "mps"  # Apple Silicon
        else:
            return "cpu"
    
    async def initialize(self):
        """Initialize the model manager"""
        logger.info("Initializing ModelManager...")
        
        # Load default test models if specified
        for model_key, model_config in settings.DEFAULT_TEST_MODELS.items():
            try:
                logger.info(f"Pre-loading default model: {model_key}")
                await self.load_model(
                    model_name=model_config["model_name"],
                    provider=model_config["provider"],
                    model_id=model_key
                )
            except Exception as e:
                logger.warning(f"Failed to pre-load {model_key}: {str(e)}")
    
    async def get_available_models(self) -> Dict[str, Dict[str, Any]]:
        """Get list of available models from various sources"""
        available_models = {}
        
        # Add popular models from config
        for model_id, config in POPULAR_MODELS.items():
            available_models[model_id] = {
                "id": model_id,
                "name": config["model_name"],
                "provider": config["provider"],
                "size_category": config["size_category"],
                "type": config["type"],
                "is_loaded": model_id in self.loaded_models and self.loaded_models[model_id].is_loaded,
                "estimated_memory_gb": MODEL_SIZE_CATEGORIES[config["size_category"]]["memory_gb"]
            }
        
        # Add any custom loaded models
        for model_id, model_info in self.loaded_models.items():
            if model_id not in available_models:
                available_models[model_id] = {
                    "id": model_id,
                    "name": model_info.name,
                    "provider": model_info.provider,
                    "size_category": model_info.size_category,
                    "type": model_info.model_type,
                    "is_loaded": model_info.is_loaded,
                    "memory_usage_mb": model_info.memory_usage_mb
                }
        
        return available_models
    
    async def get_loaded_models(self) -> List[str]:
        """Get list of currently loaded model IDs"""
        return [
            model_id for model_id, model_info in self.loaded_models.items() 
            if model_info.is_loaded
        ]
    
    def _get_memory_usage(self) -> float:
        """Get current memory usage in MB"""
        process = psutil.Process()
        return process.memory_info().rss / 1024 / 1024
    
    async def _free_memory_if_needed(self):
        """Free memory by unloading least recently used models"""
        loaded_count = len([m for m in self.loaded_models.values() if m.is_loaded])
        
        if loaded_count >= self.max_models:
            # Sort by loaded_at time and unload oldest
            loaded_models = [
                (k, v) for k, v in self.loaded_models.items() 
                if v.is_loaded and v.loaded_at
            ]
            loaded_models.sort(key=lambda x: x[1].loaded_at)
            
            # Unload oldest model
            if loaded_models:
                model_to_unload = loaded_models[0][0]
                logger.info(f"Unloading model {model_to_unload} to free memory")
                await self.unload_model(model_to_unload)
    
    async def load_model(
        self, 
        model_name: str, 
        provider: str = "huggingface_local",
        model_id: Optional[str] = None
    ) -> str:
        """Load a model and return its ID"""
        if model_id is None:
            model_id = model_name.replace("/", "_").replace("-", "_")
        
        # Check if already loaded
        if model_id in self.loaded_models and self.loaded_models[model_id].is_loaded:
            logger.info(f"Model {model_id} already loaded")
            return model_id
        
        # Free memory if needed
        await self._free_memory_if_needed()
        
        logger.info(f"Loading model: {model_name} (provider: {provider})")
        
        try:
            memory_before = self._get_memory_usage()
            
            if provider == "huggingface_local":
                model_info = await self._load_huggingface_local(model_name, model_id)
            elif provider == "huggingface_api":
                model_info = await self._load_huggingface_api(model_name, model_id)
            elif provider == "ollama":
                model_info = await self._load_ollama_model(model_name, model_id)
            else:
                raise ValueError(f"Unsupported provider: {provider}")
            
            memory_after = self._get_memory_usage()
            model_info.memory_usage_mb = memory_after - memory_before
            model_info.loaded_at = datetime.now()
            model_info.is_loaded = True
            
            self.loaded_models[model_id] = model_info
            
            logger.info(f"Successfully loaded {model_id}. Memory usage: {model_info.memory_usage_mb:.1f}MB")
            return model_id
            
        except Exception as e:
            error_msg = f"Failed to load model {model_name}: {str(e)}"
            logger.error(error_msg)
            
            # Store error info
            if model_id not in self.loaded_models:
                self.loaded_models[model_id] = ModelInfo(
                    name=model_name,
                    provider=provider,
                    model_path=model_name,
                    is_loaded=False,
                    error=error_msg
                )
            else:
                self.loaded_models[model_id].error = error_msg
                self.loaded_models[model_id].is_loaded = False
            
            raise Exception(error_msg)
    
    async def _load_huggingface_local(self, model_name: str, model_id: str) -> ModelInfo:
        """Load a HuggingFace model locally"""
        
        # Load tokenizer
        tokenizer = AutoTokenizer.from_pretrained(
            model_name,
            cache_dir=settings.DEFAULT_CACHE_DIR,
            token=settings.HF_TOKEN if settings.HF_TOKEN else None
        )
        
        # Add pad token if missing
        if tokenizer.pad_token is None:
            tokenizer.pad_token = tokenizer.eos_token
        
        # Load model with appropriate settings
        model_kwargs = {
            "cache_dir": settings.DEFAULT_CACHE_DIR,
            "token": settings.HF_TOKEN if settings.HF_TOKEN else None,
            "torch_dtype": torch.float16 if self.device == "cuda" else torch.float32,
            "device_map": "auto" if self.device == "cuda" else None,
            "low_cpu_mem_usage": True
        }
        
        model = AutoModelForCausalLM.from_pretrained(model_name, **model_kwargs)
        
        # Move to device if not using device_map
        if self.device != "cuda":
            model = model.to(self.device)
        
        # Create pipeline for easier inference
        pipe = pipeline(
            "text-generation",
            model=model,
            tokenizer=tokenizer,
            device=0 if self.device == "cuda" else -1,
            torch_dtype=torch.float16 if self.device == "cuda" else torch.float32
        )
        
        # Determine model category
        size_category = "unknown"
        model_type = "general"
        for pop_model_id, config in POPULAR_MODELS.items():
            if config["model_name"] == model_name:
                size_category = config["size_category"]
                model_type = config["type"]
                break
        
        return ModelInfo(
            name=model_name,
            provider="huggingface_local",
            model_path=model_name,
            tokenizer=tokenizer,
            model=model,
            pipeline=pipe,
            size_category=size_category,
            model_type=model_type
        )
    
    async def _load_huggingface_api(self, model_name: str, model_id: str) -> ModelInfo:
        """Load a HuggingFace model via API"""
        # This would use HF Inference API
        # For now, just create a placeholder
        return ModelInfo(
            name=model_name,
            provider="huggingface_api", 
            model_path=model_name,
            size_category="api",
            model_type="general"
        )
    
    async def _load_ollama_model(self, model_name: str, model_id: str) -> ModelInfo:
        """Load an Ollama model"""
        # Test Ollama connection
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(f"{settings.OLLAMA_HOST}/api/tags")
                if response.status_code != 200:
                    raise Exception("Ollama server not available")
            except Exception as e:
                raise Exception(f"Cannot connect to Ollama: {str(e)}")
        
        return ModelInfo(
            name=model_name,
            provider="ollama",
            model_path=model_name,
            size_category="unknown",
            model_type="general"
        )
    
    async def unload_model(self, model_id: str) -> bool:
        """Unload a model to free memory"""
        if model_id not in self.loaded_models:
            return False
        
        model_info = self.loaded_models[model_id]
        
        try:
            # Clear references
            if model_info.pipeline:
                del model_info.pipeline
            if model_info.model:
                del model_info.model
            if model_info.tokenizer:
                del model_info.tokenizer
            
            # Force garbage collection
            gc.collect()
            if self.device == "cuda":
                torch.cuda.empty_cache()
            
            model_info.is_loaded = False
            model_info.pipeline = None
            model_info.model = None
            model_info.tokenizer = None
            
            logger.info(f"Successfully unloaded model: {model_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error unloading model {model_id}: {str(e)}")
            return False
    
    async def generate_text(
        self,
        model_id: str,
        prompt: str,
        max_length: int = None,
        temperature: float = None,
        top_p: float = None,
        **kwargs
    ) -> Dict[str, Any]:
        """Generate text using a loaded model"""
        if model_id not in self.loaded_models:
            raise ValueError(f"Model {model_id} not found")
        
        model_info = self.loaded_models[model_id]
        
        if not model_info.is_loaded:
            raise ValueError(f"Model {model_id} is not loaded")
        
        # Set default parameters
        max_length = max_length or settings.DEFAULT_MAX_LENGTH
        temperature = temperature or settings.DEFAULT_TEMPERATURE
        top_p = top_p or settings.DEFAULT_TOP_P
        
        try:
            if model_info.provider == "huggingface_local":
                return await self._generate_huggingface_local(
                    model_info, prompt, max_length, temperature, top_p, **kwargs
                )
            elif model_info.provider == "ollama":
                return await self._generate_ollama(
                    model_info, prompt, max_length, temperature, top_p, **kwargs
                )
            else:
                raise ValueError(f"Generation not implemented for provider: {model_info.provider}")
                
        except Exception as e:
            logger.error(f"Error generating text with {model_id}: {str(e)}")
            raise
    
    async def _generate_huggingface_local(
        self, 
        model_info: ModelInfo, 
        prompt: str, 
        max_length: int,
        temperature: float,
        top_p: float,
        **kwargs
    ) -> Dict[str, Any]:
        """Generate text using HuggingFace local model"""
        
        generation_kwargs = {
            "max_new_tokens": min(max_length, 512),  # Limit for memory
            "temperature": temperature,
            "top_p": top_p,
            "do_sample": True,
            "pad_token_id": model_info.tokenizer.eos_token_id,
            "return_full_text": False
        }
        
        # Generate in a thread to avoid blocking
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            None,
            lambda: model_info.pipeline(prompt, **generation_kwargs)
        )
        
        return {
            "text": result[0]["generated_text"] if result else "",
            "model_id": model_info.name,
            "provider": model_info.provider,
            "prompt_length": len(prompt),
            "generated_length": len(result[0]["generated_text"]) if result else 0
        }
    
    async def _generate_ollama(
        self,
        model_info: ModelInfo,
        prompt: str,
        max_length: int,
        temperature: float,
        top_p: float,
        **kwargs
    ) -> Dict[str, Any]:
        """Generate text using Ollama"""
        async with httpx.AsyncClient(timeout=settings.OLLAMA_TIMEOUT) as client:
            payload = {
                "model": model_info.name,
                "prompt": prompt,
                "options": {
                    "temperature": temperature,
                    "top_p": top_p,
                    "num_predict": max_length
                }
            }
            
            response = await client.post(
                f"{settings.OLLAMA_HOST}/api/generate",
                json=payload
            )
            
            if response.status_code != 200:
                raise Exception(f"Ollama API error: {response.status_code}")
            
            result = response.json()
            
            return {
                "text": result.get("response", ""),
                "model_id": model_info.name,
                "provider": model_info.provider,
                "prompt_length": len(prompt),
                "generated_length": len(result.get("response", ""))
            }
    
    async def cleanup(self):
        """Clean up all loaded models"""
        logger.info("Cleaning up ModelManager...")
        
        for model_id in list(self.loaded_models.keys()):
            await self.unload_model(model_id)
        
        self.loaded_models.clear()
        
        # Final cleanup
        gc.collect()
        if self.device == "cuda":
            torch.cuda.empty_cache()
        
        logger.info("ModelManager cleanup complete")