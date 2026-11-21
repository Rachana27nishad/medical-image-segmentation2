const BACKEND_URL = import.meta.env.VITE_API_URL || 'https://medical-image-segmentation2.onrender.com';
const API_BASE = `${BACKEND_URL}/api/v1`;

export async function fetchModels() {
  try {
    const res = await fetch(`${API_BASE}/models`);
    if (!res.ok) throw new Error('Failed to load models list');
    return await res.json();
  } catch (err) {
    console.warn("Backend unaccessible, returning fallback models list", err);
    return {
      models: [
        {
          id: "attention_unet",
          name: "Attention U-Net",
          type: "Attention-Guided Encoder-Decoder",
          description: "Incorporates Spatial Attention Gates into skip connections to highlight target organ/tumor regions.",
          parameters: "34.5M",
          features: ["Spatial Attention Gates", "Bilinear Upsampling", "Deep Supervision"]
        },
        {
          id: "unet",
          name: "Standard U-Net",
          type: "Classic Convolutional Encoder-Decoder",
          description: "Classic 2D U-Net architecture with double convolutions.",
          parameters: "31.0M",
          features: ["Symmetric Skip Connections", "Double Conv Blocks"]
        },
        {
          id: "monai_segresnet",
          name: "MONAI SegResNet",
          type: "Medical Residual Encoder-Decoder",
          description: "MONAI SegResNet architecture utilizing deep residual blocks.",
          parameters: "18.2M",
          features: ["Residual Blocks", "MONAI Medical Tensor Optimized"]
        }
      ]
    };
  }
}

export async function fetchSamples() {
  try {
    const res = await fetch(`${API_BASE}/data/samples`);
    if (!res.ok) throw new Error('Failed to load sample dataset');
    return await res.json();
  } catch (err) {
    console.error(err);
    throw err;
  }
}

export async function runSegmentation({ model_name, sample_id, file, threshold, window_preset, apply_clahe }) {
  const formData = new FormData();
  formData.append('model_name', model_name || 'attention_unet');
  formData.append('threshold', threshold || 0.5);
  formData.append('window_preset', window_preset || 'default');
  formData.append('apply_clahe', apply_clahe ? 'true' : 'false');
  
  if (file) {
    formData.append('file', file);
  } else if (sample_id) {
    formData.append('sample_id', sample_id);
  }

  const res = await fetch(`${API_BASE}/segment`, {
    method: 'POST',
    body: formData
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ detail: 'Segmentation request failed' }));
    throw new Error(errorData.detail || 'Segmentation failed');
  }

  return await res.json();
}

export async function runBenchmark(sample_ids, models, threshold = 0.5) {
  const res = await fetch(`${API_BASE}/evaluate/benchmark`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sample_ids: sample_ids || ["brain_mri", "lung_ct", "abdomen_ct"],
      models: models || ["unet", "attention_unet", "monai_segresnet"],
      threshold: threshold
    })
  });

  if (!res.ok) throw new Error('Benchmark execution failed');
  return await res.json();
}
