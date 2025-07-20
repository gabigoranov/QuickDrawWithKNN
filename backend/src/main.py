import os
import numpy as np
import pandas as pd
import joblib
from utils import create_dataset, get_data, draw_image, display_vector_drawing
from sklearn.model_selection import train_test_split
from preprocessor import Preprocessor
from knn import KNN
from evaluation import Evaluator
from config import CACHE_DIR

# ---------------------------
# Load or cache the raw parsed drawings
# ---------------------------
raw_data_cache_path = os.path.join(CACHE_DIR, "datasets_dict.pkl")

if os.path.exists(raw_data_cache_path):
    datasets = joblib.load(raw_data_cache_path)
    print("Loaded cached drawing data.")
else:
    datasets = {
        "house": get_data("house.ndjson", 5000),
        "tree": get_data("tree.ndjson", 5000),
        "clock": get_data("clock.ndjson", 5000),
        "umbrella": get_data("umbrella.ndjson", 5000),
        "ladder": get_data("ladder.ndjson", 5000),
        "lightning": get_data("lightning.ndjson", 5000),
        "spoon": get_data("spoon.ndjson", 5000),
        "airplane": get_data("airplane.ndjson", 5000),
        "campfire": get_data("campfire.ndjson", 5000),
        "sailboat": get_data("sailboat.ndjson", 5000),
        "cactus": get_data("cactus.ndjson", 5000),
        "crown": get_data("crown.ndjson", 5000),
        "scissors": get_data("scissors.ndjson", 5000),
        "fish": get_data("fish.ndjson", 5000),
        "cat": get_data("cat.ndjson", 5000),
        "bicycle": get_data("bicycle.ndjson", 5000),
        "guitar": get_data("guitar.ndjson", 5000),
        "apple": get_data("apple.ndjson", 5000),
        "chair": get_data("chair.ndjson", 5000),
        "sun": get_data("sun.ndjson", 5000),
        "moon": get_data("moon.ndjson", 5000),
        "ice cream": get_data("ice cream.ndjson", 5000),
        "snail": get_data("snail.ndjson", 5000),
        "mug": get_data("mug.ndjson", 5000),
        "key": get_data("key.ndjson", 5000),
        "bowtie": get_data("bowtie.ndjson", 5000),
        "bucket": get_data("bucket.ndjson", 5000),
        "axe": get_data("axe.ndjson", 5000),
        "boomerang": get_data("boomerang.ndjson", 5000),
        "hot air balloon": get_data("hot air balloon.ndjson", 5000),
        "suitcase": get_data("suitcase.ndjson", 5000),
        "snake": get_data("snake.ndjson", 5000),
        "saw": get_data("saw.ndjson", 5000),
        "stairs": get_data("stairs.ndjson", 5000),
        "grass": get_data("grass.ndjson", 5000),
        "envelope": get_data("envelope.ndjson", 5000),
        "dumbbell": get_data("dumbbell.ndjson", 5000),
        "carrot": get_data("carrot.ndjson", 5000),
        "cloud": get_data("cloud.ndjson", 5000),
        "basketball": get_data("basketball.ndjson", 5000),
    }
    joblib.dump(datasets, raw_data_cache_path)
    print("Saved drawing data to cache.")

# ---------------------------
# Load or cache the dataset (X, y)
# ---------------------------
xy_cache_path = os.path.join(CACHE_DIR, "Xy_dataset.npz")

if os.path.exists(xy_cache_path):
    data = np.load(xy_cache_path, allow_pickle=True)
    X, y = data["X"], data["y"]
    print("Loaded cached dataset (X, y).")
else:
    X, y = create_dataset(datasets, samples_per_class=5000)
    np.savez_compressed(xy_cache_path, X=X, y=y)
    print("Saved dataset (X, y) to cache.")

# ---------------------------
# Load or cache the PCA-reduced features
# ---------------------------
reduced_cache_path = os.path.join(CACHE_DIR, "X_reduced.pkl")
preprocessor_cache_path = os.path.join(CACHE_DIR, "preprocessor.pkl")

if os.path.exists(reduced_cache_path) and os.path.exists(preprocessor_cache_path):
    X_reduced = joblib.load(reduced_cache_path)
    preprocessor = joblib.load(preprocessor_cache_path)
    print("Loaded cached PCA-reduced features and preprocessor.")
else:
    preprocessor = Preprocessor(n_components=64)
    X_reduced = pd.DataFrame(preprocessor.fit_transform(X))
    joblib.dump(X_reduced, reduced_cache_path)
    joblib.dump(preprocessor, preprocessor_cache_path)
    print("Saved reduced features and preprocessor to cache.")

# ---------------------------
# Load or cache train/test splits
# ---------------------------
X_train_cache = os.path.join(CACHE_DIR, "X_train.npy")
X_test_cache = os.path.join(CACHE_DIR, "X_test.npy")
y_train_cache = os.path.join(CACHE_DIR, "y_train.npy")
y_test_cache = os.path.join(CACHE_DIR, "y_test.npy")

if all(os.path.exists(path) for path in [X_train_cache, X_test_cache, y_train_cache, y_test_cache]):
    X_train = np.load(X_train_cache)
    X_test = np.load(X_test_cache)
    y_train = np.load(y_train_cache)
    y_test = np.load(y_test_cache)
    print("Loaded cached train/test splits.")
else:
    X_train, X_test, y_train, y_test = train_test_split(
        X_reduced.values if hasattr(X_reduced, 'values') else X_reduced,
        y,
        test_size=0.2,
        random_state=42
    )
    np.save(X_train_cache, X_train)
    np.save(X_test_cache, X_test)
    np.save(y_train_cache, y_train)
    np.save(y_test_cache, y_test)
    print("Saved train/test splits to cache.")

# ---------------------------
# Load or cache the categories
# ---------------------------
categories_cache_path = os.path.join(CACHE_DIR, "categories.npy")

if os.path.exists(categories_cache_path):
    categories = np.load(categories_cache_path)
    print("Loaded cached categories.")
else:
    categories = np.unique(y_train)
    np.save(categories_cache_path, categories)
    print("Saved categories to cache.")


# ---------------------------
# Load or cache the model
# ---------------------------
model_cache_path = os.path.join(CACHE_DIR, "knn_model.pkl")

if os.path.exists(model_cache_path):
    model = joblib.load(model_cache_path)
    print("Loaded cached KNN model.")
else:
    model = KNN.from_data(X_train, y_train, 5, metric="euclidean")
    joblib.dump(model, model_cache_path)
    print("Saved KNN model to cache.")



evaluator = Evaluator()

#evaluator.cross_validate(X=X_train, y=y_train, k_range=range(1,10))

y_pred = KNN.from_data(X_train, y_train, k=5).predict_with_kd_tree_weighted_batch(X_test, batch_size=100)

evaluator.print_classification_report(y_pred=y_pred, y_true=y_test)

# from app import DrawingApp

# model = KNN.from_data(X_train, y_train, 5)
# preprocessor = Preprocessor()
# preprocessor.fit(X)
# app = DrawingApp(model, preprocessor, categories)
# app.mainloop()