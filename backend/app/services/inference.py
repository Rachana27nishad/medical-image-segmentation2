import torch
import torch.nn.functional as F
import numpy as np
import cv2
import base64
from typing import Dict, Any, Tuple, Optional
from app.models.unet import UNet
from app.models.attention_unet import AttentionUNet
from app.models.monai_models import MONAISegResNetWrapper
from app.services.preprocessing import ImagePreprocessor

class InferenceEngine:
    """Multi-model Inference Engine for Medical Image Segmentation."""

    def __init__(self):
        self.models = {}
        self.device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        self._init_models()

    def _init_models(self):
        """Initialize segmentation model zoo."""
        unet = UNet(n_channels=1, n_classes=2).to(self.device)
        unet.eval()
        self.models["unet"] = unet

        att_unet = AttentionUNet(n_channels=1, n_classes=2).to(self.device)
        att_unet.eval()
        self.models["attention_unet"] = att_unet

        monai_net = MONAISegResNetWrapper(in_channels=1, out_channels=2).to(self.device)
        monai_net.eval()
        self.models["monai_segresnet"] = monai_net

    def run_inference(
        self,
        image_array: np.ndarray,
        model_name: str = "attention_unet",
        threshold: float = 0.5,
        window_preset: str = "default",
        apply_clahe: bool = False
    ) -> Dict[str, Any]:
        """
        Run segmentation model inference on input image array.
        """
        if model_name not in self.models:
            model_name = "attention_unet"
        model = self.models[model_name]

        # 1. Preprocessing
        processed_img = image_array.copy()
        if window_preset != "default":
            processed_img = ImagePreprocessor.apply_ct_window(processed_img, window_preset)
        if apply_clahe:
            processed_img = ImagePreprocessor.apply_clahe(processed_img)

        # Normalize to [0, 1] for tensor input
        norm_img = ImagePreprocessor.normalize_min_max(processed_img)
        
        # Prepare tensor (Batch=1, Channels=1, H, W)
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

        return {
            "model_name": model_name,
            "threshold": threshold,
            "prob_map": target_prob_orig.tolist(),
            "binary_mask": binary_mask,
            "overlay_b64": overlay_b64,
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

        # Highlight segmented mask in bright green
        overlay = base_rgb.copy()
        mask_indices = mask > 0
        overlay[mask_indices] = [0, 230, 115]  # Mint green

        # Blend base with overlay (70% base, 30% overlay)
        blended = cv2.addWeighted(base_rgb, 0.65, overlay, 0.35, 0)

        # Draw yellow contour line around mask boundaries
        contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        cv2.drawContours(blended, contours, -1, (255, 220, 0), 2)  # Bright yellow outline

        # Encode to JPEG Base64 string for immediate frontend visualizer rendering
        _, buffer = cv2.imencode('.jpg', cv2.cvtColor(blended, cv2.COLOR_RGB2BGR))
        b64_str = base64.b64encode(buffer).decode('utf-8')

        return blended, f"data:image/jpeg;base64,{b64_str}"

inference_engine = InferenceEngine()
