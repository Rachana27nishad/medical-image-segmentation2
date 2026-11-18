from fastapi import APIRouter
from app.api.endpoints import segment, evaluate, models, data

api_router = APIRouter()
api_router.include_router(segment.router, tags=["Segmentation"])
api_router.include_router(evaluate.router, tags=["Evaluation & Benchmark"])
api_router.include_router(models.router, tags=["Model Zoo"])
api_router.include_router(data.router, tags=["Medical Data"])
