from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from pydantic import BaseModel
from typing import Optional, Dict, Any
import numpy as np
import cv2
import io
from PIL import Image
from app.services.inference import inference_engine
from app.services.synthetic_data import MedicalDataGenerator
from app.services.metrics import SegmentationMetrics

router = APIRouter()

class SegmentRequest(BaseModel):
    model_name: str = "attention_unet"
    sample_id: Optional[str] = "brain_mri"
    threshold: float = 0.5
    window_preset: str = "default"
    apply_clahe: bool = False

@router.post("/segment")
async def segment_image(
    model_name: str = Form("attention_unet"),
    sample_id: Optional[str] = Form("brain_mri"),
    threshold: float = Form(0.5),
    window_preset: str = Form("default"),
    apply_clahe: bool = Form(False),
    file: Optional[UploadFile] = File(None)
):
    """
    Run segmentation model on an uploaded file OR a sample synthetic image.
    """
    gt_mask = None
    modality_info = {}

    if file is not None:
        try:
            contents = await file.read()
            pil_img = Image.open(io.BytesIO(contents)).convert('L')
            image_array = np.array(pil_img)
            modality_info = {
                "modality": "Uploaded Scan",
                "target": "Target Lesion / Tumor",
                "description": f"Custom uploaded scan ({file.filename})"
            }
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Invalid image file: {str(e)}")
    else:
        # Load synthetic sample based on sample_id
        if sample_id == "lung_ct":
            sample = MedicalDataGenerator.generate_lung_ct_sample()
        elif sample_id == "abdomen_ct":
            sample = MedicalDataGenerator.generate_abdominal_ct_sample()
        else:
            sample = MedicalDataGenerator.generate_brain_mri_sample()
            
        image_array = sample["image"]
        gt_mask = sample["mask"]
        modality_info = {
            "modality": sample["modality"],
            "target": sample["target"],
            "description": sample["description"]
        }

    # Execute inference
    result = inference_engine.run_inference(
        image_array=image_array,
        model_name=model_name,
        threshold=threshold,
        window_preset=window_preset,
        apply_clahe=apply_clahe
    )

    # Compute evaluation metrics if ground truth mask is present
    metrics = None
    if gt_mask is not None:
        metrics = SegmentationMetrics.compute_all_metrics(
            pred_mask=result["binary_mask"],
            gt_mask=gt_mask,
            threshold=128
        )

    return {
        "success": True,
        "model_name": result["model_name"],
        "threshold": result["threshold"],
        "overlay_b64": result["overlay_b64"],
        "original_b64": result.get("original_b64"),
        "preprocessed_b64": result.get("preprocessed_b64"),
        "orig_stats": result.get("orig_stats"),
        "proc_stats": result.get("proc_stats"),
        "tumor_area_pixels": result["tumor_area_pixels"],
        "modality_info": modality_info,
        "metrics": metrics,
        "prob_stats": {
            "min": result["prob_min"],
            "max": result["prob_max"],
            "mean": result["prob_mean"]
        }
    }
