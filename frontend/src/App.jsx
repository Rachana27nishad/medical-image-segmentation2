import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import MedicalViewer from './components/MedicalViewer';
import PreprocessingPanel from './components/PreprocessingPanel';
import ModelSelector from './components/ModelSelector';
import MetricsDisplay from './components/MetricsDisplay';
import ComparativeView from './components/ComparativeView';
import QuantitativeReport from './components/QuantitativeReport';

import { fetchModels, fetchSamples, runSegmentation } from './services/api';

export default function App() {
  const [activeTab, setActiveTab] = useState('diagnostic');
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('attention_unet');
  const [samples, setSamples] = useState([]);
  const [selectedSampleId, setSelectedSampleId] = useState('brain_mri');
  const [customFile, setCustomFile] = useState(null);

  // Preprocessing states
  const [windowPreset, setWindowPreset] = useState('default');
  const [applyClahe, setApplyClahe] = useState(false);
  const [threshold, setThreshold] = useState(0.5);
  const [opacity, setOpacity] = useState(0.7);

  // Result & loading states
  const [segmentResult, setSegmentResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // Load models and samples on mount
  useEffect(() => {
    async function initData() {
      try {
        const mRes = await fetchModels();
        setModels(mRes.models || []);

        const sRes = await fetchSamples();
        setSamples(sRes.samples || []);
        setIsConnected(true);

        // Run initial segmentation for first sample
        if (sRes.samples && sRes.samples.length > 0) {
          executeInference('brain_mri', 'attention_unet', null, 'default', false, 0.5);
        }
      } catch (err) {
        console.warn("Backend API not reachable, running mock fallback", err);
        setIsConnected(false);
      }
    }
    initData();
  }, []);

  const executeInference = async (
    sampleId = selectedSampleId,
    modelName = selectedModel,
    file = customFile,
    wPreset = windowPreset,
    clahe = applyClahe,
    thresh = threshold
  ) => {
    setIsLoading(true);
    try {
      const res = await runSegmentation({
        model_name: modelName,
        sample_id: file ? null : sampleId,
        file: file,
        threshold: thresh,
        window_preset: wPreset,
        apply_clahe: clahe
      });
      setSegmentResult(res);
    } catch (err) {
      console.error("Segmentation error", err);
    } finally {
      setIsLoading(false);
    }
  };

  const currentSample = samples.find(s => s.id === selectedSampleId) || samples[0];

  return (
    <div className="min-h-screen bg-[#0b132b] text-slate-100 flex flex-col font-sans antialiased">
      {/* Top Navigation Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        selectedModel={selectedModel}
        isConnected={isConnected}
      />

      {/* Main App Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {activeTab === 'diagnostic' && (
          <>
            {/* Top Grid: Preprocessing & Controls (Left) | Interactive Medical Viewer (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-5 flex flex-col gap-6">
                <PreprocessingPanel
                  samples={samples}
                  selectedSampleId={selectedSampleId}
                  onSelectSample={(id) => {
                    setSelectedSampleId(id);
                    setCustomFile(null);
                    executeInference(id, selectedModel, null, windowPreset, applyClahe, threshold);
                  }}
                  onFileUpload={(file) => {
                    setCustomFile(file);
                    executeInference(null, selectedModel, file, windowPreset, applyClahe, threshold);
                  }}
                  windowPreset={windowPreset}
                  setWindowPreset={(p) => {
                    setWindowPreset(p);
                    executeInference(selectedSampleId, selectedModel, customFile, p, applyClahe, threshold);
                  }}
                  applyClahe={applyClahe}
                  setApplyClahe={(c) => {
                    setApplyClahe(c);
                    executeInference(selectedSampleId, selectedModel, customFile, windowPreset, c, threshold);
                  }}
                  threshold={threshold}
                  setThreshold={setThreshold}
                  onRunSegmentation={() => executeInference()}
                />
              </div>

              <div className="lg:col-span-7">
                <MedicalViewer
                  sampleData={currentSample}
                  segmentResult={segmentResult}
                  isLoading={isLoading}
                  opacity={opacity}
                  setOpacity={setOpacity}
                />
              </div>
            </div>

            {/* Middle Row: Model Selector Zoo */}
            <ModelSelector
              models={models}
              selectedModel={selectedModel}
              onSelectModel={(id) => {
                setSelectedModel(id);
                executeInference(selectedSampleId, id, customFile, windowPreset, applyClahe, threshold);
              }}
            />

            {/* Bottom Row: Quantitative Metrics Display */}
            <MetricsDisplay metrics={segmentResult?.metrics} />
          </>
        )}

        {activeTab === 'comparative' && (
          <ComparativeView
            sampleData={currentSample}
            selectedModel={selectedModel}
          />
        )}

        {activeTab === 'benchmark' && (
          <QuantitativeReport
            metrics={segmentResult?.metrics}
            sampleData={currentSample}
            selectedModel={selectedModel}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="glass-panel border-t border-slate-800 text-center py-4 px-6 text-xs text-slate-500">
        Medical Image Segmentation Suite &bull; Powered by PyTorch, MONAI, OpenCV &amp; FastAPI
      </footer>
    </div>
  );
}
