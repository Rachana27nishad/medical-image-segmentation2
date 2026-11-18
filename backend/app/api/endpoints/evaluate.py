from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
import numpy as np
from app.services.synthetic_data import MedicalDataGenerator
from app.services.inference import inference_engine
from app.services.metrics import SegmentationMetrics

router = APIRouter()

class BenchmarkRequest(BaseModel):
    sample_ids: List[str] = ["brain_mri", "lung_ct", "abdomen_ct"]
    models: List[str] = ["unet", "attention_unet", "monai_segresnet"]
    threshold: float = 0.5

@router.post("/evaluate/benchmark")
async def run_benchmark(request: BenchmarkRequest):
    """
    Run comprehensive evaluation benchmark comparing multiple segmentation models across medical modalities.
    Returns quantitative metric summary (Dice, IoU, HD95, Precision, Recall).
    """
    results = []

    sample_map = {
        "brain_mri": MedicalDataGenerator.generate_brain_mri_sample,
        "lung_ct": MedicalDataGenerator.generate_lung_ct_sample,
        "abdomen_ct": MedicalDataGenerator.generate_abdominal_ct_sample
    }

    for s_id in request.sample_ids:
        if s_id not in sample_map:
            continue
        sample = sample_map[s_id]()
        img = sample["image"]
        gt_mask = sample["mask"]

        sample_results = {
            "sample_id": s_id,
            "modality": sample["modality"],
            "target": sample["target"],
            "models": {}
        }

        for model_name in request.models:
            inf_out = inference_engine.run_inference(
                image_array=img,
                model_name=model_name,
                threshold=request.threshold
            )
            metrics = SegmentationMetrics.compute_all_metrics(
                pred_mask=inf_out["binary_mask"],
                gt_mask=gt_mask,
                threshold=128
            )
            sample_results["models"][model_name] = metrics

        results.append(sample_results)

    # Compute overall mean metrics per model
    summary = {}
    for model_name in request.models:
        dice_list = []
        iou_list = []
        hd95_list = []
        precision_list = []
        recall_list = []

        for item in results:
            if model_name in item["models"]:
                m = item["models"][model_name]
                dice_list.append(m["dice"])
                iou_list.append(m["iou"])
                hd95_list.append(m["hd95"])
                precision_list.append(m["precision"])
                recall_list.append(m["recall"])

        summary[model_name] = {
            "mean_dice": float(round(np.mean(dice_list), 4)) if dice_list else 0.0,
            "mean_iou": float(round(np.mean(iou_list), 4)) if iou_list else 0.0,
            "mean_hd95": float(round(np.mean(hd95_list), 2)) if hd95_list else 0.0,
            "mean_precision": float(round(np.mean(precision_list), 4)) if precision_list else 0.0,
            "mean_recall": float(round(np.mean(recall_list), 4)) if recall_list else 0.0
        }

    return {
        "success": True,
        "benchmark_summary": summary,
        "detailed_results": results
    }
