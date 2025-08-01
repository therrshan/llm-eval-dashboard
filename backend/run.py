

import os
import sys
import uvicorn
import logging
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(sys.stdout),
        # Only log to file in production, not during development
        # logging.FileHandler('llm_diagnostic.log')
    ]
)

logger = logging.getLogger(__name__)

def main():
    """Main entry point for the application"""
    logger.info("Starting LLM Diagnostic Dashboard Backend...")
    
    # Import config to validate settings
    try:
        from config import settings
        logger.info(f"Configuration loaded successfully")
        logger.info(f"API will run on {settings.API_HOST}:{settings.API_PORT}")
        logger.info(f"Debug mode: {settings.API_DEBUG}")
        logger.info(f"Supported providers: {settings.SUPPORTED_PROVIDERS}")
    except Exception as e:
        logger.error(f"Failed to load configuration: {e}")
        sys.exit(1)
    
    # Check if models cache directory exists
    cache_dir = Path(settings.DEFAULT_CACHE_DIR)
    cache_dir.mkdir(exist_ok=True)
    logger.info(f"Models cache directory: {cache_dir.absolute()}")
    
    # Start the server
    try:
        uvicorn.run(
            "app.main:app",
            host=settings.API_HOST,
            port=settings.API_PORT,
            reload=settings.API_DEBUG,
            reload_excludes=[
                "*.log",
                "*.pyc", 
                "__pycache__/*",
                "models_cache/*",
                ".git/*",
                ".venv/*",
                "*.tmp"
            ],
            log_level="info" if settings.API_DEBUG else "warning",
            access_log=settings.API_DEBUG
        )
    except KeyboardInterrupt:
        logger.info("Shutting down server...")
    except Exception as e:
        logger.error(f"Server error: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main()