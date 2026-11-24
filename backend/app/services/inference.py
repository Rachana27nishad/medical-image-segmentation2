import torch
import torch.nn.functional as F
import numpy as np
import cv2
import base64
import gc
from typing import Dict, Any, Tuple, Optional
from app.models.unet import UNet
from app.models.attention_unet import AttentionUNet
from app.models.monai_models import MONAISegResNetWrapper
from app.services.preprocessing import ImagePreprocessor

class InferenceEngine:
    """Memory-Optimized Multi-model Inference Engine for Cloud Free Tier."""

    def __init__(self):
        self.models = {}
        self.device = torch.device("cpu")  # CPU execution for cloud reliability

    def _get_model(self, model_name: str):
        """Lazy load: Load only the requested model and purge previous memory."""
        if model_name not in self.models:
            self.models.clear()
            gc.collect()

            if model_name == "unet":
                m = UNet(n_channels=1, n_classes=2).to(self.device)
            elif model_name == "monai_segresnet":
                m = MONAISegResNetWrapper(in_channels=1, out_channels=2).to(self.device)
            else:
                m = AttentionUNet(n_channels=1, n_classes=2).to(self.device)
                model_name = "attention_unet"

            m.eval()
            self.models[model_name] = m

        return self.models[model_name]

    def run_inference(
        self,
        image_array: np.ndarray,
        model_name: str = "attention_unet",
        threshold: float = 0.5,
        window_preset: str = "default",
        apply_clahe: bool = False
    ) -> Dict[str, Any]:
        """
        Run segmentation model inference on input image array with low memory footprint.
        """
        model = self._get_model(model_name)

        # 1. Preprocessing
        processed_img = image_array.copy()
        if window_preset != "default":
            processed_img = ImagePreprocessor.apply_ct_window(processed_img, window_preset)
        if apply_clahe:
            processed_img = ImagePreprocessor.apply_clahe(processed_img)

        # Calculate Intensity Statistics (Original vs Preprocessed)
        orig_min = int(image_array.min())
        orig_max = int(image_array.max())
        orig_mean = round(float(image_array.mean()), 2)

        proc_min = int(processed_img.min())
        proc_max = int(processed_img.max())
        proc_mean = round(float(processed_img.mean()), 2)

        # Base64 encodings for Dual-View
        _, orig_buf = cv2.imencode('.jpg', image_array)
        orig_b64 = f"data:image/jpeg;base64,{base64.b64encode(orig_buf).decode('utf-8')}"

        _, proc_buf = cv2.imencode('.jpg', processed_img)
        proc_b64 = f"data:image/jpeg;base64,{base64.b64encode(proc_buf).decode('utf-8')}"

        # Normalize to [0, 1] for tensor input
        norm_img = ImagePreprocessor.normalize_min_max(processed_img)

        # Prepare tensor (Batch=1, Channels=1, H=256, W=256)
        orig_h, orig_w = norm_img.shape[:2]
        resized_img = ImagePreprocessor.resize_image(norm_img, (256, 256))
        tensor_in = torch.from_numpy(resized_img).unsqueeze(0).unsqueeze(0).float().to(self.device)

        # 2. Model Forward Pass
        with torch.no_grad():
            logits = model(tensor_in)
            probs = F.softmax(logits, dim=1)
            target_prob = probs[0, 1].cpu().numpy()

        # Resize probability back to original image size
        target_prob_orig = cv2.resize(target_prob, (orig_w, orig_h), interpolation=cv2.INTER_LINEAR)
        binary_mask = (target_prob_orig >= threshold).astype(np.uint8) * 255

        # 3. Create Color Overlay & Contour Visualization
        overlay, overlay_b64 = self._create_overlay_image(image_array, binary_mask, target_prob_orig)

        del tensor_in, logits, probs
        gc.collect()

        return {
            "model_name": model_name,
            "threshold": threshold,
            "binary_mask": binary_mask,
            "overlay_b64": overlay_b64,
            "original_b64": orig_b64,
            "preprocessed_b64": proc_b64,
            "orig_stats": {"min": orig_min, "max": orig_max, "mean": orig_mean},
            "proc_stats": {"min": proc_min, "max": proc_max, "mean": proc_mean},
            "prob_min": float(target_prob_orig.min()),
            "prob_max": float(target_prob_orig.max()),
            "prob_mean": float(target_prob_orig.mean()),
            "tumor_area_pixels": int(np.sum(binary_mask > 0))
        }

    def _create_overlay_image(self, orig_img: np.ndarray, mask: np.ndarray, prob_map: np.ndarray) -> Tuple[np.ndarray, str]:
        """Generate side-by-side / overlay visualization with color maps."""
        if len(orig_img.shape) == 2:
            base_rgb = cv2.cvtColor(orig_img, cv2.COLOR_GRAY2RGB)
        else:
            base_rgb = orig_img.copy()

        # Highlight segmented mask in bright mint green
        overlay = base_rgb.copy()
        mask_indices = mask > 0
        overlay[mask_indices] = [0, 230, 115]

        # Blend base with overlay (65% base, 35% overlay)
        blended = cv2.addWeighted(base_rgb, 0.65, overlay, 0.35, 0)

        # Draw yellow contour line around mask boundaries
        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        cv2.drawContours(blended, contours, -1, (255, 220, 0), 2)

        # Encode to JPEG Base64 string for immediate frontend rendering
        _, buffer = cv2.imencode('.jpg', cv2.cvtColor(blended, cv2.COLOR_RGB2BGR))
        b64_str = base64.b64encode(buffer).decode('utf-8')

        return blended, f"data:image/jpeg;base64,{b64_str}"

inference_engine = InferenceEngine()
