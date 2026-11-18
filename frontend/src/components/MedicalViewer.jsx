import React, { useState } from 'react';
import { Eye, EyeOff, Maximize2, Sliders, AlertCircle, Sparkles } from 'lucide-react';

export default function MedicalViewer({
  sampleData,
  segmentResult,
  isLoading,
  opacity,
  setOpacity,
  showContour,
  setShowContour
}) {
  const [showMask, setShowMask] = useState(true);

  if (isLoading) {
    return (
      <div className="glass-panel rounded-2xl p-8 flex flex-col items-center justify-center min-h-[420px] text-center">
        <div className="relative w-16 h-16 mb-4">
          <div className="absolute inset-0 rounded-full border-4 border-cyan-500/20 animate-ping"></div>
          <div className="absolute inset-0 rounded-full border-4 border-t-cyan-400 border-r-indigo-500 border-b-purple-500 border-l-transparent animate-spin"></div>
        </div>
        <h3 className="text-lg font-semibold text-white mb-1">Executing Deep Learning Inference</h3>
        <p className="text-xs text-slate-400 max-w-sm">
          Passing tensor through PyTorch & MONAI architecture... Extracting feature maps and computing segmentation masks.
        </p>
      </div>
    );
  }

  const baseImage = sampleData?.image_b64;
  const overlayImage = segmentResult?.overlay_b64;
  const modalityInfo = sampleData || segmentResult?.modality_info;

  return (
    <div className="glass-panel rounded-2xl p-5 flex flex-col h-full">
      {/* Header Toolbar */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-md bg-cyan-950/80 border border-cyan-800/50 text-cyan-400 text-xs font-semibold">
            {modalityInfo?.modality || 'CT/MRI Scan'}
          </span>
          <span className="text-xs font-medium text-slate-300">
            Target: <strong className="text-cyan-300">{modalityInfo?.target || 'Lesion / Tumor'}</strong>
          </span>
        </div>

        {/* Visibility Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowMask(!showMask)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              showMask ? 'bg-cyan-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            {showMask ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>Overlay Mask</span>
          </button>
        </div>
      </div>

      {/* Main Image Rendering Area */}
      <div className="relative flex-1 bg-black/90 rounded-xl overflow-hidden flex items-center justify-center min-h-[360px] border border-slate-800/80">
        {baseImage ? (
          <div className="relative w-full h-full flex items-center justify-center p-4">
            {/* Original Image Layer */}
            <img
              src={baseImage}
              alt="Medical Scan Base"
              className="max-h-[380px] w-auto object-contain rounded select-none"
            />

            {/* Mask Overlay Layer */}
            {overlayImage && showMask && (
              <img
                src={overlayImage}
                alt="Segmentation Overlay"
                style={{ opacity: opacity }}
                className="absolute inset-0 m-auto max-h-[380px] w-auto object-contain pointer-events-none transition-opacity duration-150 rounded"
              />
            )}
          </div>
        ) : (
          <div className="text-center p-6 text-slate-500">
            <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-600" />
            <p className="text-xs">No medical image loaded</p>
          </div>
        )}

        {/* Legend Badge */}
        {segmentResult && (
          <div className="absolute bottom-3 left-3 bg-slate-900/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 text-[11px] flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              <span className="text-slate-300">Predicted Region</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
              <span className="text-slate-300">Boundary Contour</span>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Controls Bar */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 max-w-xs">
          <Sliders className="w-4 h-4 text-slate-400" />
          <span className="text-xs text-slate-400 font-medium">Mask Opacity:</span>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={opacity}
            onChange={(e) => setOpacity(parseFloat(e.target.value))}
            className="w-full accent-cyan-400 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
          />
          <span className="text-xs font-mono text-cyan-400 w-8">{Math.round(opacity * 100)}%</span>
        </div>

        {segmentResult?.tumor_area_pixels && (
          <div className="text-xs text-slate-400">
            Detected Region: <strong className="text-cyan-400 font-mono">{segmentResult.tumor_area_pixels}</strong> px
          </div>
        )}
      </div>
    </div>
  );
}
