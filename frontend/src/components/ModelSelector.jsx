import React from 'react';
import { Cpu, CheckCircle, Info, Sparkles } from 'lucide-react';

export default function ModelSelector({ models, selectedModel, onSelectModel }) {
  return (
    <div className="glass-panel rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            Segmentation Model Zoo
          </h3>
          <p className="text-xs text-slate-400">Select PyTorch & MONAI network backbones</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {models.map((model) => {
          const isSelected = selectedModel === model.id;
          return (
            <button
              key={model.id}
              onClick={() => onSelectModel(model.id)}
              className={`p-3.5 rounded-xl border text-left transition flex flex-col justify-between ${
                isSelected
                  ? 'bg-gradient-to-b from-cyan-950/80 to-slate-900 border-cyan-500 shadow-lg shadow-cyan-950/50'
                  : 'bg-slate-900/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-900'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    {model.name}
                    {model.id === 'attention_unet' && (
                      <span className="px-1.5 py-0.2 rounded bg-indigo-900/80 text-indigo-300 text-[10px]">
                        Recommended
                      </span>
                    )}
                  </span>
                  {isSelected && <CheckCircle className="w-4 h-4 text-cyan-400" />}
                </div>

                <p className="text-[11px] text-slate-400 line-clamp-2 mb-3">{model.description}</p>
              </div>

              <div className="pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400">
                <span>Params: <strong className="text-slate-200">{model.parameters}</strong></span>
                <span className="font-mono text-cyan-400">{model.type.split(' ')[0]}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
