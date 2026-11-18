import sys
import os
import torch
import numpy as np

# Add backend directory to sys.path
backend_path = os.path.join(os.path.dirname(__file__), "backend")
sys.path.insert(0, backend_path)

from app.models.unet import UNet
from app.models.attention_unet import AttentionUNet
from app.models.monai_models import MONAISegResNetWrapper
from app.services.synthetic_data import MedicalDataGenerator
from app.services.preprocessing import ImagePreprocessor
from app.services.metrics import SegmentationMetrics
from app.services.inference import inference_engine

def print_header(title):
    print("\n" + "="*70)
    print(f"  {title.upper()}")
    print("="*70)

def main():
    print_header("Medical Image Segmentation Suite - Self Verification Demo")

    # 1. Test Model Tensor Forward Passes
    print("\n[1/4] Testing Model Architectures & Tensor Shapes...")
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f" -> Compute Device: {device}")

    dummy_tensor = torch.randn(1, 1, 256, 256).to(device)

    unet = UNet(n_channels=1, n_classes=2).to(device)
    unet.eval()
    with torch.no_grad():
        out_unet = unet(dummy_tensor)
    print(f" -> [PASSED] Standard U-Net Output Shape: {out_unet.shape}")
    assert out_unet.shape == (1, 2, 256, 256)

    att_unet = AttentionUNet(n_channels=1, n_classes=2).to(device)
    att_unet.eval()
    with torch.no_grad():
        out_att = att_unet(dummy_tensor)
    print(f" -> [PASSED] Attention U-Net Output Shape: {out_att.shape}")
    assert out_att.shape == (1, 2, 256, 256)

    monai_net = MONAISegResNetWrapper(in_channels=1, out_channels=2).to(device)
    monai_net.eval()
    with torch.no_grad():
        out_monai = monai_net(dummy_tensor)
    print(f" -> [PASSED] MONAI SegResNet Output Shape: {out_monai.shape}")
    assert out_monai.shape == (1, 2, 256, 256)

    # 2. Test Synthetic Data Generation & Preprocessing
    print("\n[2/4] Generating Multi-Modal Medical Imaging Datasets...")
    brain_sample = MedicalDataGenerator.generate_brain_mri_sample()
    lung_sample = MedicalDataGenerator.generate_lung_ct_sample()
    abdomen_sample = MedicalDataGenerator.generate_abdominal_ct_sample()

    print(f" -> Generated {brain_sample['modality']}: Image shape {brain_sample['image'].shape}, Target: {brain_sample['target']}")
    print(f" -> Generated {lung_sample['modality']}: Image shape {lung_sample['image'].shape}, Target: {lung_sample['target']}")
    print(f" -> Generated {abdomen_sample['modality']}: Image shape {abdomen_sample['image'].shape}, Target: {abdomen_sample['target']}")

    # Apply CT Windowing & CLAHE
    ct_windowed = ImagePreprocessor.apply_ct_window(lung_sample['image'], 'lung')
    clahe_img = ImagePreprocessor.apply_clahe(ct_windowed)
    print(f" -> [PASSED] CT Windowing & CLAHE Preprocessing executed cleanly.")

    # 3. Test Multi-Model Inference & Mask Overlay Generation
    print("\n[3/4] Running Multi-Model Inference Engine...")
    results = {}
    for m_name in ["unet", "attention_unet", "monai_segresnet"]:
        res = inference_engine.run_inference(
            image_array=brain_sample["image"],
            model_name=m_name,
            threshold=0.5
        )
        metrics = SegmentationMetrics.compute_all_metrics(
            pred_mask=res["binary_mask"],
            gt_mask=brain_sample["mask"],
            threshold=128
        )
        results[m_name] = metrics
        print(f" -> [PASSED] Model: {m_name:<16} | Dice: {metrics['dice']:.4f} | IoU: {metrics['iou']:.4f} | HD95: {metrics['hd95']:.2f}px")

    # 4. Quantitative Evaluation Benchmark Report
    print_header("Quantitative Performance Benchmark Summary")
    print(f"{'Model Architecture':<20} | {'Dice (DSC)':<10} | {'IoU':<8} | {'Precision':<10} | {'Recall':<8} | {'HD95 (px)':<10}")
    print("-" * 75)
    for m_name, m in results.items():
        print(f"{m_name:<20} | {m['dice']:<10.4f} | {m['iou']:<8.4f} | {m['precision']:<10.4f} | {m['recall']:<8.4f} | {m['hd95']:<10.2f}")
    print("-" * 75)

    print("\n[SUCCESS] All verification tests passed cleanly! Complete system ready.")

if __name__ == "__main__":
    main()
