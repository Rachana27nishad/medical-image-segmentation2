import os

try:
    from pydantic_settings import BaseSettings
except ImportError:
    try:
        from pydantic import BaseSettings  # type: ignore
    except ImportError:
        BaseSettings = object  # type: ignore

class Settings(BaseSettings if BaseSettings is not object else object):
    PROJECT_NAME: str = "Medical Image Segmentation API"
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api/v1"
    
    # Model configuration
    DEVICE: str = "cpu"  # default to cpu, fallback to cuda if available
    DEFAULT_IMG_SIZE: tuple = (256, 256)
    
    # Storage settings
    UPLOAD_DIR: str = os.path.join(os.path.dirname(__file__), "..", "..", "storage", "uploads")
    SAMPLES_DIR: str = os.path.join(os.path.dirname(__file__), "..", "..", "storage", "samples")

settings = Settings()
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
os.makedirs(settings.SAMPLES_DIR, exist_ok=True)
