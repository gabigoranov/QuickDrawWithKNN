import os
import sys
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

import numpy as np
import matplotlib.pyplot as plt
from sklearn.metrics import accuracy_score
from collections import defaultdict

from knn import KNN
from common.distance_metrics import DistanceMetric
from config import CACHE_DIR

# Load cached test predictions or generate them
X_train = np.load(os.path.join(CACHE_DIR, "X_train.npy"))
X_test = np.load(os.path.join(CACHE_DIR, "X_test.npy"))
y_train = np.load(os.path.join(CACHE_DIR, "y_train.npy"))
y_test = np.load(os.path.join(CACHE_DIR, "y_test.npy"))
categories = np.load(os.path.join(CACHE_DIR, "categories.npy"))

# Predict with model
print("Generating predictions...")
model = KNN.from_data(X_train, y_train, k=5, metric=DistanceMetric.EUCLIDEAN)
y_pred = model.predict_with_kd_tree_weighted_batch(X_test, batch_size=100)

# Compute per-category accuracy
category_correct = defaultdict(int)
category_total = defaultdict(int)

for yt, yp in zip(y_test, y_pred):
    category_total[yt] += 1
    if yt == yp:
        category_correct[yt] += 1

category_accuracy = {
    category: category_correct[category] / category_total[category]
    for category in categories
}

# Sort by accuracy
sorted_items = sorted(category_accuracy.items(), key=lambda x: x[1])
labels, accuracies = zip(*sorted_items)

# Plot
plt.figure(figsize=(12, 6))
plt.barh(labels, accuracies, color='lightcoral')
plt.xlabel("Accuracy")
plt.title("Per-Category Accuracy")
plt.xlim(0, 1)
plt.tight_layout()

# Save
chart_path = os.path.join(CACHE_DIR, "per_category_accuracy_chart.png")
plt.savefig(chart_path)
print(f"Per-category accuracy chart saved to: {chart_path}")
