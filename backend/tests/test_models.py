import torch
import pytest
from app.models.unet import UNet
from app.models.attention_unet import AttentionUNet
from app.models.monai_models import MONAISegResNetWrapper

def test_unet_forward():
    model = UNet(n_channels=1, n_classes=2)
    x = torch.randn(2, 1, 128, 128)
    out = model(x)
    assert out.shape == (2, 2, 128, 128), f"Expected shape (2, 2, 128, 128), got {out.shape}"

def test_attention_unet_forward():
    model = AttentionUNet(n_channels=1, n_classes=2)
    x = torch.randn(2, 1, 128, 128)
    out = model(x)
    assert out.shape == (2, 2, 128, 128), f"Expected shape (2, 2, 128, 128), got {out.shape}"

def test_monai_wrapper_forward():
    model = MONAISegResNetWrapper(in_channels=1, out_channels=2)
    x = torch.randn(2, 1, 128, 128)
    out = model(x)
    assert out.shape == (2, 2, 128, 128), f"Expected shape (2, 2, 128, 128), got {out.shape}"
