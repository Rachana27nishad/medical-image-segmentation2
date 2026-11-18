# Deep Learning-Based Medical Image Segmentation for Organ and Tumor Detection

An end-to-end, AI-powered medical image segmentation platform developed using **PyTorch**, **MONAI**, **OpenCV**, **FastAPI**, and **React**. Designed to automatically detect organs, tumors, lesions, and abnormal tissue regions across multi-modal medical images (**Brain MRI**, **Chest CT**, **Abdominal CT**, and **Retinal Scans**), complete with quantitative evaluation metrics and interactive web-based visualization.

---

## Key Features & Capabilities

- **Deep Learning Model Zoo**:
  - **Standard U-Net**: Classic 2D convolutional encoder-decoder with symmetric skip connections.
  - **Attention U-Net**: Integrates Spatial Attention Gates into skip connections to focus network attention on small organ and tumor boundaries while suppressing non-relevant background signals.
  - **MONAI SegResNet Integration**: Residual encoder-decoder architecture optimized for medical imaging tensor formats.
- **Image Preprocessing & Augmentation Pipeline**:
  - **CT Hounsfield Unit (HU) Windowing**: Brain (40 WW), Lung (-600 WW), Abdomen (40 WW), Bone (400 WW), and Liver windowing presets.
  - **CLAHE**: Contrast Limited Adaptive Histogram Equalization for enhanced boundary feature visibility.
  - **Normalization**: Z-score (zero mean, unit variance) and Min-Max scaling.
- **Comprehensive Quantitative Evaluation Suite**:
  - **Dice Similarity Coefficient (DSC)**
  - **Intersection over Union (IoU / Jaccard Index)**
  - **Precision (Positive Predictive Value)**
  - **Recall / Sensitivity (True Positive Rate)**
  - **Specificity (True Negative Rate)**
  - **95th Percentile Hausdorff Distance (HD95 & Max HD)**
  - **Volumetric Difference Percentage**
- **Interactive Web Application & Visualization Dashboard**:
  - Multi-layer Canvas viewer with colorized mask overlays, boundary contour extraction, zoom/pan controls, and opacity adjustments.
  - Side-by-side comparative views comparing ground truth vs Attention U-Net vs Standard U-Net.
  - Publication-ready quantitative diagnostic report generator with print export capability.
- **Synthetic Multi-Modal Data Generator**:
  - Built-in dataset generator producing simulated Brain MRI (Glioma tumors), Lung CT (Pulmonary nodules), and Abdominal CT (Liver lesions) scans with ground truth annotations.

---

## Project Structure

```
medical-image-segmentation/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   ├── endpoints/
│   │   │   │   ├── segment.py       # FastAPI segmentation inference endpoint
│   │   │   │   ├── evaluate.py      # Benchmark evaluation & metrics endpoint
│   │   │   │   ├── models.py        # Model zoo specifications
│   │   │   │   └── data.py          # Sample data & ground truth endpoint
│   │   │   └── router.py
│   │   ├── core/
│   │   │   └── config.py            # App settings & directory setup
│   │   ├── models/
│   │   │   ├── unet.py              # Standard 2D PyTorch U-Net
│   │   │   ├── attention_unet.py    # Attention U-Net with Attention Gates
│   │   │   └── monai_models.py      # MONAI SegResNet wrapper
│   │   ├── services/
│   │   │   ├── preprocessing.py     # CT Windowing, CLAHE, Normalization
│   │   │   ├── metrics.py           # Dice, IoU, HD95, Precision/Recall
│   │   │   ├── synthetic_data.py    # Multi-modal medical sample generator
│   │   │   └── inference.py         # Multi-model inference engine
│   │   └── main.py                  # FastAPI application entry point
│   ├── tests/
│   │   ├── test_models.py           # Model tensor shape tests
│   │   ├── test_metrics.py          # Quantitative metrics unit tests
│   │   └── test_api.py              # API endpoint integration tests
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.jsx           # Top navigation bar
│   │   │   ├── MedicalViewer.jsx    # Interactive Canvas viewer with overlays
│   │   │   ├── MetricsDisplay.jsx   # Quantitative metrics cards
│   │   │   ├── ModelSelector.jsx    # Model zoo selector
│   │   │   ├── PreprocessingPanel.jsx# CT Windowing & CLAHE controls
│   │   │   ├── QuantitativeReport.jsx# Printable diagnostic report
│   │   │   └── ComparativeView.jsx  # Side-by-side comparative studio
│   │   ├── services/
│   │   │   └── api.js               # Frontend REST client
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── nginx.conf
│   └── Dockerfile
├── docker-compose.yml
├── run_demo.py                      # Verification & demo script
└── README.md
```

---

## Quick Start & Verification

### 1. Verification Script
Run the verification script to validate PyTorch tensor output shapes, synthetic medical image generation, multi-model inference, and quantitative metrics calculations:

```bash
python run_demo.py
```

### 2. Backend Server (FastAPI)

```bash
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
Interactive API Documentation will be available at `http://localhost:8000/docs`.

### 3. Frontend Web Dashboard (React + Vite)

```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000` in your web browser.

### 4. Docker Deployment

Launch both backend and frontend services via Docker Compose:

```bash
docker-compose up --build
```
Access the application at `http://localhost:3000`.

---

## Evaluation Metrics Formulas

$$\text{Dice Similarity Coefficient (DSC)} = \frac{2 \times |P \cap G|}{|P| + |G|}$$

$$\text{Intersection over Union (IoU)} = \frac{|P \cap G|}{|P \cup G|}$$

$$\text{Hausdorff Distance (95th Percentile)} = \max \left( P_{95\%} d(p, G), P_{95\%} d(g, P) \right)$$
