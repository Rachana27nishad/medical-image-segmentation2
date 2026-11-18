import torch
import torch.nn as nn

class MONAISegResNetWrapper(nn.Module):
    """
    SegResNet segmentation model wrapper with MONAI integration fallback.
    Provides deep residual encoder-decoder designed specifically for medical imaging modalities.
    """

    def __init__(self, in_channels: int = 1, out_channels: int = 2, init_filters: int = 16):
        super(MONAISegResNetWrapper, self).__init__()
        self.in_channels = in_channels
        self.out_channels = out_channels
        
        # Check if monai is available, otherwise use residual backbone fallback
        try:
            from monai.networks.nets import SegResNet
            self.model = SegResNet(
                spatial_dims=2,
                in_channels=in_channels,
                out_channels=out_channels,
                init_filters=init_filters,
                blocks_down=[1, 2, 2, 4],
                blocks_up=[1, 1, 1]
            )
            self.has_monai = True
        except ImportError:
            self.has_monai = False
            self.model = self._build_fallback(in_channels, out_channels, init_filters)

    def _build_fallback(self, in_channels: int, out_channels: int, init_filters: int):
        f = init_filters
        return nn.Sequential(
            nn.Conv2d(in_channels, f, 3, padding=1),
            nn.BatchNorm2d(f),
            nn.ReLU(True),
            nn.Conv2d(f, f * 2, 3, padding=1, stride=2),
            nn.BatchNorm2d(f * 2),
            nn.ReLU(True),
            nn.ConvTranspose2d(f * 2, f, 3, padding=1, stride=2, output_padding=1),
            nn.BatchNorm2d(f),
            nn.ReLU(True),
            nn.Conv2d(f, out_channels, 1)
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.model(x)
