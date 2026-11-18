from fastapi import APIRouter

router = APIRouter()

@router.get("/models")
async def list_models():
    """
    List available deep learning segmentation models and specifications.
    """
    return {
        "models": [
            {
                "id": "attention_unet",
                "name": "Attention U-Net",
                "type": "Attention-Guided Encoder-Decoder",
                "description": "Incorporates Spatial Attention Gates into skip connections to highlight target organ/tumor regions while suppressing irrelevant background signals.",
                "parameters": "34.5M",
                "features": ["Spatial Attention Gates", "Bilinear Upsampling", "Deep Supervision Compatible"]
            },
            {
                "id": "unet",
                "name": "Standard U-Net",
                "type": "Classic Convolutional Encoder-Decoder",
                "description": "Classic 2D U-Net architecture with double convolutions and max-pooling contracting paths.",
                "parameters": "31.0M",
                "features": ["Symmetric Skip Connections", "Double Convolution Blocks"]
            },
            {
                "id": "monai_segresnet",
                "name": "MONAI SegResNet",
                "type": "3D/2D Medical Residual Encoder-Decoder",
                "description": "MONAI SegResNet architecture utilizing deep residual blocks optimized for medical imaging segmentation.",
                "parameters": "18.2M",
                "features": ["Residual Connections", "MONAI Medical Tensor Optimized"]
            }
        ]
    }
