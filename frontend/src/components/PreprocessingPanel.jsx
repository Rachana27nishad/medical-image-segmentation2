import React from 'react';
import { Sliders, Upload, Image as ImageIcon, Sparkles, RefreshCw } from 'lucide-react';

export default function PreprocessingPanel({
  samples,
  selectedSampleId,
  onSelectSample,
  onFileUpload,
  windowPreset,
  setWindowPreset,
  applyClahe,
  setApplyClahe,
  threshold,
  setThreshold,
  onRunSegmentation
}) {
  const windowPresets = [
    { id: 'default', label: 'Raw / Default' },
    { id: 'brain', label: 'Brain (40 WW)' },
    { id: 'lung', label: 'Lung (-600 WW)' },
    { id: 'abdomen', label: 'Abdomen (40 WW)' },
    { id: 'bone', label: 'Bone (400 WW)' },
  ];

  return (
    <div className="glass-panel rounded-2xl p-5 flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              Dataset & Preprocessing Controls
            </h3>
            <p className="text-xs text-slate-400">Modalities, windowing & contrast filters</p>
          </div>
        </div>

        {/* Sample Datasets Selector */}
        <div className="mb-5">
          <label className="text-xs font-semibold text-slate-300 mb-2 block">
            Select Medical Scan Modality:
          </label>
          <div className="grid grid-cols-3 gap-2">
            {samples.map((s) => (
              <button
                key={s.id}
                onClick={() => onSelectSample(s.id)}
                className={`p-2.5 rounded-xl border text-left transition ${
                  selectedSampleId === s.id
                    ? 'bg-cyan-950/80 border-cyan-500 text-white'
                    : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                <div className="text-xs font-bold truncate">{s.modality}</div>
                <div className="text-[10px] text-slate-400 truncate">{s.target}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Upload Button */}
        <div className="mb-5">
          <label className="text-xs font-semibold text-slate-300 mb-1.5 block">
            Or Upload Custom Scan (DICOM/PNG/JPEG):
          </label>
          <label className="flex items-center justify-center gap-2 p-3 rounded-xl border border-dashed border-slate-700 bg-slate-900/40 hover:bg-slate-900/80 hover:border-cyan-500/60 cursor-pointer transition text-xs text-slate-300">
            <Upload className="w-4 h-4 text-cyan-400" />
            <span>Browse Image File...</span>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  onFileUpload(e.target.files[0]);
                }
              }}
              className="hidden"
            />
          </label>
        </div>

        {/* CT Windowing Presets */}
        <div className="mb-5">
          <label className="text-xs font-semibold text-slate-300 mb-2 block">
            CT Hounsfield Unit (HU) Window Preset:
          </label>
          <div className="flex flex-wrap gap-1.5">
            {windowPresets.map((win) => (
              <button
                key={win.id}
                onClick={() => setWindowPreset(win.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                  windowPreset === win.id
                    ? 'bg-cyan-600 text-white shadow'
                    : 'bg-slate-900/60 border border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {win.label}
              </button>
            ))}
          </div>
        </div>

        {/* CLAHE & Threshold Sliders */}
        <div className="space-y-4 pt-3 border-t border-slate-800">
          <div className="flex items-center justify-between">
            <label className="text-xs font-medium text-slate-300">
              Apply CLAHE Contrast Enhancement
            </label>
            <button
              onClick={() => setApplyClahe(!applyClahe)}
              className={`w-11 h-6 rounded-full transition-colors relative ${
                applyClahe ? 'bg-cyan-600' : 'bg-slate-800'
              }`}
            >
              <span
                className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                  applyClahe ? 'left-6' : 'left-1'
                }`}
              />
            </button>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1 text-xs">
              <span className="font-medium text-slate-300">Decision Threshold:</span>
              <span className="font-mono text-cyan-400">{threshold}</span>
            </div>
            <input
              type="range"
              min="0.1"
              max="0.9"
              step="0.05"
              value={threshold}
              onChange={(e) => setThreshold(parseFloat(e.target.value))}
              className="w-full accent-cyan-400 bg-slate-800 h-1.5 rounded-lg cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Run Button */}
      <button
        onClick={onRunSegmentation}
        className="w-full mt-6 py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-cyan-950/50 flex items-center justify-center gap-2 transition"
      >
        <RefreshCw className="w-4 h-4" />
        <span>Run Model Inference</span>
      </button>
    </div>
  );
}
