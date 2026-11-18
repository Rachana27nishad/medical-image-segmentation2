from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert "version" in data

def test_list_models_endpoint():
    response = client.get("/api/v1/models")
    assert response.status_code == 200
    data = response.json()
    assert "models" in data
    assert len(data["models"]) >= 3

def test_samples_endpoint():
    response = client.get("/api/v1/data/samples")
    assert response.status_code == 200
    data = response.json()
    assert "samples" in data
    assert len(data["samples"]) >= 3

def test_segment_endpoint():
    response = client.post(
        "/api/v1/segment",
        data={
            "model_name": "attention_unet",
            "sample_id": "brain_mri",
            "threshold": 0.5,
            "window_preset": "default"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "overlay_b64" in data
    assert "metrics" in data
