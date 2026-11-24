import React, { useState, useEffect, useRef } from 'react';
import { Eye, EyeOff, Sliders, AlertCircle, Sparkles, Layers, RefreshCw } from 'lucide-react';

export default function MedicalViewer({
  sampleData,
  segmentResult,
  isLoading,
  opacity,
  setOpacity,
  customFilePreview,
  windowPreset = 'default',
  applyClahe = false
}) {
  const [viewMode, setViewMode] = useState('preprocessing'); // 'preprocessing' | 'overlay'
  const [showMask, setShowMask] = useState(true);
  const [processedCanvasUrl, setProcessedCanvasUrl] = useState(null);
  const [stats, setStats] = useState({
    orig: { min: 0, max: 255, mean: 59.24 },
    proc: { min: 0, max: 255, mean: 28.11 }
  });

  const canvasRef = useRef(null);

  // Determine active base image (Uploaded Custom Image > Backend Result > Sample Data)
  const baseImage = customFilePreview || segmentResult?.original_b64 || sampleData?.image_b64;
  const overlayImage = segmentResult?.overlay_b64;
  const modalityInfo = sampleData || segmentResult?.modality_info;

  // Window preset definitions for instant client-side radiometric rendering
  const windowRanges = {
    default: { min: 0, max: 255 },
    brain: { min: 40 - 40, max: 40 + 40 },        // C:40, W:80
    lung: { min: 0, max: 120 },                   // Enhanced lung attenuation
    abdomen: { min: 40 - 80, max: 40 + 120 },     // Soft tissue window
    bone: { min: 100, max: 255 }                  // High density bone window
  };

  // Real-time Radiometric Preprocessing (Client-side Canvas for zero-latency preview)
  useEffect(() => {
    if (!baseImage) return;

    // If backend already returned high-precision processed image and stats, use them
    if (segmentResult?.preprocessed_b64 && segmentResult?.proc_stats) {
      setProcessedCanvasUrl(segmentResult.preprocessed_b64);
      setStats({
        orig: segmentResult.orig_stats || { min: 0, max: 255, mean: 59.24 },
        proc: segmentResult.proc_stats || { min: 0, max: 255, mean: 28.11 }
      });
      return;
    }

    // Otherwise, process in real-time via Canvas
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = baseImage;
    img.onload = () => {
      const canvas = canvasRef.current || document.createElement('canvas');
      canvas.width = img.width || 256;
      canvas.height = img.height || 256;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imgData.data;
      const len = data.length;

      let origSum = 0;
      let origMin = 255;
      let origMax = 0;

      let procSum = 0;
      let procMin = 255;
      let procMax = 0;

      const win = windowRanges[windowPreset] || windowRanges.default;
      const range = Math.max(1, win.max - win.min);

      for (let i = 0; i < len; i += 4) {
        // Grayscale conversion
        const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        origSum += gray;
        if (gray < origMin) origMin = gray;
        if (gray > origMax) origMax = gray;

        // CT Windowing simulation (clamp to window)
        let val = Math.max(win.min, Math.min(win.max, gray));
        val = ((val - win.min) / range) * 255;

        // CLAHE contrast enhancement simulation (S-curve contrast boost)
        if (applyClahe) {
          const norm = val / 255;
          val = 255 / (1 + Math.exp(-6 * (norm - 0.5)));
        }

        val = Math.max(0, Math.min(255, Math.round(val)));

        procSum += val;
        if (val < procMin) procMin = val;
        if (val > procMax) procMax = val;

        data[i] = val;
        data[i + 1] = val;
        data[i + 2] = val;
      }

      ctx.putImageData(imgData, 0, 0);
      setProcessedCanvasUrl(canvas.toDataURL('image/jpeg', 0.9));

      const pixelCount = len / 4;
      setStats({
        orig: {
          min: Math.round(origMin),
          max: Math.round(origMax),
          mean: Number((origSum / pixelCount).toFixed(2))
        },
        proc: {
          min: Math.round(procMin),
          max: Math.round(procMax),
          mean: Number((procSum / pixelCount).toFixed(2))
        }
      });
    };
  }, [baseImage, windowPreset, applyClahe, segmentResult]);

  return (
    <div className="glass-panel rounded-2xl p-5 flex flex-col h-full">
      {/* Hidden processing canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Header Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-md bg-cyan-950/80 border border-cyan-800/50 text-cyan-400 text-xs font-semibold">
            {modalityInfo?.modality || 'Medical Scan'}
          </span>
          <span className="text-xs font-medium text-slate-300">
            Target: <strong className="text-cyan-300">{modalityInfo?.target || 'Lesion / Tumor'}</strong>
          </span>
          {isLoading && (
            <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-950/80 border border-indigo-700/60 text-indigo-300 text-[11px] animate-pulse">
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span>Inference in progress...</span>
            </span>
          )}
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1.5 bg-slate-900/90 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setViewMode('preprocessing')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              viewMode === 'preprocessing'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Preprocessing Studio</span>
          </button>

          <button
            onClick={() => setViewMode('overlay')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition ${
              viewMode === 'overlay'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Segmentation Result</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: PREPROCESSING STUDIO (Original vs After Preprocessing Dual View) */}
      {viewMode === 'preprocessing' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1">
          {/* Left: Original Image Panel */}
          <div className="bg-black/95 rounded-xl border border-slate-800/90 p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2 border-b border-slate-900 pb-2">
              <span className="font-bold text-slate-200">Original</span>
              <span className="font-mono text-slate-400">
                min {stats.orig.min} &bull; max {stats.orig.max} &bull; mean {stats.orig.mean}
              </span>
            </div>
            <div className="flex-1 flex items-center justify-center p-2 min-h-[300px]">
              {baseImage ? (
                <img
                  src={baseImage}
                  alt="Original Medical Scan"
                  className="max-h-[320px] w-auto object-contain rounded select-none shadow-md"
                />
              ) : (
                <div className="text-center p-6 text-slate-500">
                  <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-600" />
                  <p className="text-xs">Upload an image or pick a modality to preview</p>
                </div>
              )}
            </div>
          </div>

          {/* Right: After Preprocessing Panel */}
          <div className="bg-black/95 rounded-xl border border-cyan-900/40 p-3 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2 border-b border-slate-900 pb-2">
              <span className="font-bold text-cyan-400">After preprocessing</span>
              <span className="font-mono text-cyan-300">
                min {stats.proc.min} &bull; max {stats.proc.max} &bull; mean {stats.proc.mean}
              </span>
            </div>
            <div className="flex-1 flex items-center justify-center p-2 min-h-[300px]">
              {processedCanvasUrl ? (
                <img
                  src={processedCanvasUrl}
                  alt="After Preprocessing"
                  className="max-h-[320px] w-auto object-contain rounded select-none shadow-md"
                />
              ) : (
                <div className="text-center p-6 text-slate-600">
                  <p className="text-xs">Applying windowing and filters...</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: SEGMENTATION MASK OVERLAY VIEW */}
      {viewMode === 'overlay' && (
        <div className="relative flex-1 bg-black/90 rounded-xl overflow-hidden flex items-center justify-center min-h-[360px] border border-slate-800/80">
          {baseImage ? (
            <div className="relative w-full h-full flex items-center justify-center p-4">
              <img
                src={baseImage}
                alt="Medical Scan Base"
                className="max-h-[380px] w-auto object-contain rounded select-none"
              />

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

          {/* Visibility Controls Overlay */}
          <div className="absolute top-3 right-3 flex items-center gap-2 bg-slate-900/85 backdrop-blur-md p-1.5 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setShowMask(!showMask)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition ${
                showMask ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              {showMask ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span>{showMask ? 'Hide Mask' : 'Show Mask'}</span>
            </button>
          </div>

          {/* Legend Badge */}
          {segmentResult && (
            <div className="absolute bottom-3 left-3 bg-slate-900/85 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-800 text-[11px] flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                <span className="text-slate-300">Predicted Tumor</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                <span className="text-slate-300">Contour Boundary</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
