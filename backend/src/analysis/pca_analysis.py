import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import os
import numpy as np
import matplotlib.pyplot as plt
import joblib
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score

from preprocessor import Preprocessor
from knn import KNN
from common.distance_metrics import DistanceMetric
from config import CACHE_DIR

# Load raw (non-reduced) dataset
xy_cache_path = os.path.join(CACHE_DIR, "Xy_dataset.npz")
data = np.load(xy_cache_path, allow_pickle=True)
X, y = data["X"], data["y"]

# PCA component sizes to evaluate
component_counts = [16, 32, 56, 64, 86, 128]
accuracies = []

for n in component_counts:
    print(f"Evaluating with {n} PCA components...")
    
    # PCA reduction
    preprocessor = Preprocessor(n_components=n)
    X_reduced = preprocessor.fit_transform(X)

    # Train/test split
    X_train, X_test, y_train, y_test = train_test_split(
        X_reduced, y, test_size=0.2, random_state=42
    )

    # Train and evaluate model
    model = KNN.from_data(X_train, y_train, k=5, metric=DistanceMetric.EUCLIDEAN)
    y_pred = model.predict_with_kd_tree_weighted_batch(X_test, batch_size=100)

    acc = accuracy_score(y_test, y_pred)
    accuracies.append(acc)
    print(f"Accuracy for {n} components: {acc:.4f}")

# Plot results
plt.figure(figsize=(8, 5))
plt.bar([str(c) for c in component_counts], accuracies, color='cornflowerblue')
plt.xlabel("Number of PCA Components")
plt.ylabel("Accuracy")
plt.title("Accuracy vs. Number of PCA Components")
plt.ylim(0, 1)
plt.grid(axis='y')
plt.tight_layout()

# Save chart to file
chart_path = os.path.join(CACHE_DIR, "pca_accuracy_comparison.png")
plt.savefig(chart_path)
print(f"Chart saved to: {chart_path}")
