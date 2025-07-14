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


app = FastAPI()


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

current_file_path = os.path.abspath(__file__)
CACHE_DIR = os.path.abspath(os.path.join(current_file_path, "..", "..", "cache"))
os.makedirs(CACHE_DIR, exist_ok=True)
print("Cache directory:", CACHE_DIR)

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

class ImageRequest(BaseModel):
    image: str  # base64 PNG


@app.post("/predict")
def predict(req: ImageRequest):
    image_data = base64.b64decode(req.image.split(',')[1])
    image = Image.open(io.BytesIO(image_data)).convert('L').resize((28, 28))
    arr = np.asarray(image).flatten().reshape(1, -1) / 255

    # Display the image using matplotlib (this will open a window on the server)
    # plt.imshow(image, cmap='gray')
    # plt.title("Input Drawing")
    # plt.axis('off')
    # plt.show()

    processed = preprocessor.transform(arr)
    prediction = model.predict_weighted(processed, 5)

    return {"prediction": str(prediction)}

@app.get("/categories")
def get_categories():
    return {"categories": list(categories)}