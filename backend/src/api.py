from typing import List, Tuple
from fastapi import FastAPI
from pydantic import BaseModel
import joblib
import numpy as np
import os
from fastapi.middleware.cors import CORSMiddleware
import base64
from PIL import Image
import io
import matplotlib.pyplot as plt
from common.indexing_structures import IndexingStructure
from common.distance_metrics import DistanceMetric
from utils import draw_image
from config import CACHE_DIR

app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

model_path = os.path.join(CACHE_DIR, "knn_model.pkl")
preprocessor_path = os.path.join(CACHE_DIR, "preprocessor.pkl")

categories_cache_path = os.path.join(CACHE_DIR, "categories.npy")
categories = []

if os.path.exists(categories_cache_path):
    categories = np.load(categories_cache_path)
    print(categories)
    print("Loaded cached categories.")
else:
    raise ValueError("No cached categories were found.")

model = joblib.load(model_path)
preprocessor = joblib.load(preprocessor_path)


# Set this to True during development to see the input image
SHOW_PREPROCESSED_IMAGE = False

class StrokeRequest(BaseModel):
    strokes: List[List[List[float]]];
    k: int = 5;
    metric: DistanceMetric = DistanceMetric.EUCLIDEAN;
    indexing: str = IndexingStructure.KD_TREE;


@app.post("/predict")
def predict(req: StrokeRequest):

    # 1. Convert strokes to processed 56x56 image using draw_image
    image = draw_image(req.strokes, size=56)
    arr = image.flatten().reshape(1, -1)

    # 2. Optionally display the image
    if SHOW_PREPROCESSED_IMAGE:
        plt.imshow(image, cmap='gray')
        plt.title("Preprocessed Input")
        plt.axis('off')
        plt.show()

    # 3. Normalize and predict
    arr = arr / 1.0  # already normalized by draw_image to [0,1]
    processed = preprocessor.transform(arr)
    prediction = model.adaptive_prediction(test_point=processed, k=req.k, metric=req.metric, indexing=req.indexing,)

    return {"prediction": str(prediction)}

@app.get("/categories")
def get_categories():
    return {"categories": list(categories)}