import React from 'react';
import { Target, Award, CheckCircle2, Ruler, Percent, BarChart } from 'lucide-react';

export default function MetricsDisplay({ metrics }) {
  if (!metrics) {
    return (
      <div className="glass-panel rounded-2xl p-6 text-center text-slate-400">
        <p className="text-xs">Quantitative metrics will be calculated after segmentation inference.</p>
      </div>
    );
  }

  const metricCards = [
    {
      title: 'Dice Coefficient (DSC)',
      value: metrics.dice,
      unit: '',
      isPercentage: true,
      description: 'Overlap similarity measure',
      icon: Target,
      color: 'from-emerald-500 to-teal-600',
      badge: metrics.dice >= 0.85 ? 'Excellent' : 'Good'
    },
    {
      title: 'IoU (Jaccard Index)',
      value: metrics.iou,
      unit: '',
      isPercentage: true,
      description: 'Intersection over Union',
      icon: Award,
      color: 'from-cyan-500 to-blue-600',
      badge: metrics.iou >= 0.75 ? 'High Precision' : 'Moderate'
    },
    {
      title: 'Precision (PPV)',
      value: metrics.precision,
      unit: '',
      isPercentage: true,
      description: 'Positive predictive accuracy',
      icon: CheckCircle2,
      color: 'from-indigo-500 to-purple-600'
    },
    {
      title: 'Recall (Sensitivity)',
      value: metrics.recall,
      unit: '',
      isPercentage: true,
      description: 'True positive rate for tumors',
      icon: Percent,
      color: 'from-purple-500 to-pink-600'
    },
    {
      title: 'Hausdorff Dist (HD95)',
      value: metrics.hd95,
      unit: ' px',
      isPercentage: false,
      description: '95th percentile boundary error',
      icon: Ruler,
      color: 'from-amber-500 to-orange-600',
      badge: metrics.hd95 < 5.0 ? 'Optimal' : 'Standard'
    },
    {
      title: 'Volumetric Diff',
      value: metrics.volumetric_difference_pct,
      unit: '%',
      isPercentage: false,
      description: 'Volume estimation error',
      icon: BarChart,
      color: 'from-rose-500 to-red-600'
    }
  ];

  return (
    <div className="glass-panel rounded-2xl p-5">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Target className="w-4 h-4 text-cyan-400" />
            Quantitative Evaluation Metrics
          </h3>
          <p className="text-xs text-slate-400">Ground truth comparison & statistical accuracy</p>
        </div>
      </div>

      {/* Grid of Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {metricCards.map((item, idx) => {
          const Icon = item.icon;
          const displayVal = item.isPercentage
            ? `${(item.value * 100).toFixed(1)}%`
            : `${item.value}${item.unit}`;
          
          const progressWidth = item.isPercentage ? item.value * 100 : Math.max(0, 100 - item.value * 5);

          return (
            <div
              key={idx}
              className="bg-slate-900/60 border border-slate-800/80 rounded-xl p-3.5 flex flex-col justify-between transition hover:border-slate-700"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-medium text-slate-400">{item.title}</span>
                <div className={`w-6 h-6 rounded-md bg-gradient-to-tr ${item.color} flex items-center justify-center text-white`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>

              <div className="flex items-baseline gap-1 my-1">
                <span className="text-lg font-extrabold text-white font-mono">{displayVal}</span>
                {item.badge && (
                  <span className="ml-auto text-[10px] font-semibold px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800/60">
                    {item.badge}
                  </span>
                )}
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                <div
                  className={`h-full bg-gradient-to-r ${item.color} rounded-full transition-all duration-500`}
                  style={{ width: `${Math.min(100, Math.max(0, progressWidth))}%` }}
                />
              </div>

              <span className="text-[10px] text-slate-500 mt-1.5 truncate">{item.description}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
