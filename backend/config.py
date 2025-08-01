
import os
from typing import List, Dict, Any
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Settings(BaseSettings):
    """Application settings"""
    
    # API Configuration
    API_HOST: str = "0.0.0.0"
    API_PORT: int = 8000
    API_DEBUG: bool = True
    
    # CORS settings
    CORS_ORIGINS: List[str] = ["http://localhost:3000", "http://localhost:5173"]
    
    # Model Configuration
    HF_TOKEN: str = os.getenv("HUGGINGFACE_TOKEN", "")
    DEFAULT_CACHE_DIR: str = os.getenv("HF_CACHE_DIR", "./models_cache")
    MAX_MODELS_IN_MEMORY: int = 3
    
    # Inference Settings
    DEFAULT_MAX_LENGTH: int = 512
    DEFAULT_TEMPERATURE: float = 0.7
    DEFAULT_TOP_P: float = 0.9
    INFERENCE_TIMEOUT: int = 60  # seconds
    
    # Test Configuration
    TEST_TIMEOUT: int = 300  # 5 minutes
    MAX_CONCURRENT_TESTS: int = 5
    ENABLE_GPU: bool = True
    
    # Supported model providers
    SUPPORTED_PROVIDERS: List[str] = [
        "huggingface_local",
        "huggingface_api", 
        "ollama"
    ]
    
    # Default test models for quick testing
    DEFAULT_TEST_MODELS: Dict[str, Dict[str, Any]] = {
        "small_chat": {
            "provider": "huggingface_local",
            "model_name": "microsoft/DialoGPT-small",
            "description": "Small conversational model for quick testing"
        },
        "tiny_gpt2": {
            "provider": "huggingface_local", 
            "model_name": "gpt2",
            "description": "Tiny GPT-2 for basic functionality tests"
        }
    }
    
    # Available diagnostic tests
    AVAILABLE_TESTS: Dict[str, Dict[str, Any]] = {
        "hallucination": {
            "name": "Hallucination Detection",
            "description": "Tests for factual accuracy and consistency",
            "estimated_time": "2-5 minutes",
            "requires_internet": True
        },
        "bias": {
            "name": "Bias Analysis", 
            "description": "Evaluates demographic and social biases",
            "estimated_time": "3-7 minutes",
            "requires_internet": False
        },
        "toxicity": {
            "name": "Toxicity & Safety",
            "description": "Tests for harmful or inappropriate content",
            "estimated_time": "2-4 minutes", 
            "requires_internet": False
        },
        "consistency": {
            "name": "Response Consistency",
            "description": "Evaluates output consistency across similar inputs",
            "estimated_time": "1-3 minutes",
            "requires_internet": False
        },
        "performance": {
            "name": "Performance Metrics",
            "description": "General performance and quality metrics",
            "estimated_time": "2-5 minutes",
            "requires_internet": False
        }
    }
    
    # Ollama configuration (if using)
    OLLAMA_HOST: str = "http://localhost:11434"
    OLLAMA_TIMEOUT: int = 30
    
    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FILE: str = "llm_diagnostic.log"
    
    class Config:
        env_file = ".env"
        case_sensitive = True

# Create global settings instance
settings = Settings()

# Model size categories for memory management
MODEL_SIZE_CATEGORIES = {
    "tiny": {"max_params": "1B", "memory_gb": 2},
    "small": {"max_params": "3B", "memory_gb": 4}, 
    "medium": {"max_params": "7B", "memory_gb": 8},
    "large": {"max_params": "13B", "memory_gb": 16},
    "xlarge": {"max_params": "30B+", "memory_gb": 32}
}

# Common model configurations
POPULAR_MODELS = {
    # Chat models
    "llama2-7b-chat": {
        "model_name": "meta-llama/Llama-2-7b-chat-hf",
        "provider": "huggingface_local",
        "size_category": "medium",
        "type": "chat"
    },
    "mistral-7b": {
        "model_name": "mistralai/Mistral-7B-Instruct-v0.1", 
        "provider": "huggingface_local",
        "size_category": "medium",
        "type": "chat"
    },
    "phi-3-mini": {
        "model_name": "microsoft/Phi-3-mini-4k-instruct",
        "provider": "huggingface_local", 
        "size_category": "small",
        "type": "chat"
    },
    
    # Code models
    "codellama-7b": {
        "model_name": "codellama/CodeLlama-7b-Python-hf",
        "provider": "huggingface_local",
        "size_category": "medium", 
        "type": "code"
    },
    
    # Small test models
    "gpt2": {
        "model_name": "gpt2",
        "provider": "huggingface_local",
        "size_category": "tiny",
        "type": "general"
    },
    "distilgpt2": {
        "model_name": "distilgpt2", 
        "provider": "huggingface_local",
        "size_category": "tiny",
        "type": "general"
    }
}