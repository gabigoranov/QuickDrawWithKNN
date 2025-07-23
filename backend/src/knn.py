import numpy as np
import pandas as pd
from collections import defaultdict
from sklearn.model_selection import KFold
import matplotlib.pyplot as plt
from sklearn.neighbors import BallTree
from common.distance_metrics import DistanceMetric
from common.indexing_structures import IndexingStructure
from utils import timeit
from sklearn.neighbors import KDTree
import cupy as cp


class KNN:
    """
    A simple implementation of the weighted K-Nearest Neighbors (KNN) classifier.
    """

    def __init__(self, best_k=3):
        """
        Initializes the KNN classifier.

        Parameters:
        - best_k (int): Default number of neighbors to consider during prediction.
        """
        self.training_features = None
        self.training_labels = None
        self.best_k = best_k
        self.ball_trees = {}
        self.kd_tree = None

    def adaptive_prediction(self, test_point, k = 5, metric=DistanceMetric.EUCLIDEAN, indexing=IndexingStructure.KD_TREE):
        matches = {
            IndexingStructure.KD_TREE: lambda: self.predict_with_kd_tree_weighted(test_point=test_point, k=k, metric=metric),
            IndexingStructure.BALL_TREE: lambda: self.predict_with_ball_tree_weighted(test_point=test_point, k=k, metric=metric),
            IndexingStructure.BRUTE_FORCE: lambda: self.predict_weighted(test_point=test_point, k=k, metric=metric),
        }

        indexing_enum = IndexingStructure(indexing)
        return matches[indexing_enum]()

    @timeit
    def eucledean_distances_fast(self, test_point):
        """
        Calculates the distances between the test_point and the training_features.

        Parameters:
        - test_point (np.ndarray): The input feature vector to classify.

        Returns:
        - Distances between test_point and each training_feature.
        """
        return np.linalg.norm(self.training_features - test_point, axis=1)

    @timeit
    def predict_weighted(self, test_point, k=None, epsilon=1e-5, metric=DistanceMetric.EUCLIDEAN):
        """
        Predicts the label for a single test point using weighted KNN.

        Parameters:
        - test_point (np.ndarray): The input feature vector to classify.
        - k (int, optional): The number of neighbors to consider. Defaults to self.best_k.
        - epsilon (float): A small constant to avoid division by zero in weight calculation.

        Returns:
        - Predicted label based on weighted majority voting.
        """
        if k is None:
            k = self.best_k

        if metric == DistanceMetric.EUCLIDEAN:
            dists = np.linalg.norm(self.training_features - test_point, axis=1)
        elif metric == DistanceMetric.MANHATTAN:
            dists = np.sum(np.abs(self.training_features - test_point), axis=1)
        else:
            raise ValueError(f"Unsupported distance metric: {metric}")
        
        knn_indices = np.argsort(dists)[:k]

        weights = defaultdict(float)
        for idx in knn_indices:
            label = self.training_labels[idx]
            weight = 1 / (dists[idx] + epsilon)
            weights[label] += weight

        return max(weights.items(), key=lambda x: x[1])[0]
    
    @timeit
    def predict_weighted_batch(self, testing_points, X_train=None, y_train=None, k=None, batch_size=100):
        """
        Predicts labels for a batch of test points using weighted K-Nearest Neighbors.

        For each test point, the method computes EUCLIDEAN distances to all training points,
        finds the `k` closest neighbors, and performs weighted voting based on the inverse
        of distances to determine the predicted label.

        Parameters:
        - testing_points (np.ndarray): A 2D array of shape (n_samples, n_features) containing test data.
        - k (int, optional): Number of neighbors to use. Defaults to `self.best_k` if not specified.
        - batch_size (int): Number of test points to process in a single batch to reduce memory usage.

        Returns:
        - np.ndarray: Predicted labels for each test point in the input array.
        """
        if X_train is None:
            X_train = self.training_features
        if y_train is None:
            y_train = self.training_labels
        if k is None:
            k = self.best_k

        predictions = []

        for start in range(0, len(testing_points), batch_size):
            end = min(start + batch_size, len(testing_points))
            X_batch = testing_points[start:end]

            # Compute all pairwise distances between test batch and training points
            dists = np.sqrt(
                np.sum((X_batch[:, np.newaxis, :] - X_train[np.newaxis, :, :]) ** 2, axis=2)
            )

            # Get indices of the k nearest neighbors for each test point
            knn_indices = np.argpartition(dists, kth=k, axis=1)[:, :k]

            # Predict label for each point in the batch
            for i in range(len(X_batch)):
                neighbor_idxs = knn_indices[i]
                neighbor_labels = y_train[neighbor_idxs]
                neighbor_dists = dists[i][neighbor_idxs]
                weights = 1 / (neighbor_dists + 1e-8)

                votes = defaultdict(float)
                for lbl, w in zip(neighbor_labels, weights):
                    votes[lbl] += w

                pred = max(votes.items(), key=lambda x: x[1])[0]
                predictions.append(pred)

        return np.array(predictions)

    @timeit
    def predict_weighted_gpu(self, test_point, k=None, epsilon=1e-5):
        if k is None:
            k = self.best_k

        # Convert to CuPy arrays
        test_point = cp.asarray(test_point)
        train_data = cp.asarray(self.training_features)  # np -> cp
        labels = self.training_labels  # stay on CPU

        # Compute distances
        dists = cp.sqrt(cp.sum((train_data - test_point) ** 2, axis=1))

        # k nearest neighbors
        knn_indices = cp.asnumpy(cp.argsort(dists)[:k])

        weights = defaultdict(float)
        for idx in knn_indices:
            label = labels[idx]
            weight = 1 / (float(dists[idx].get()) + epsilon)
            weights[label] += weight

        return max(weights.items(), key=lambda x: x[1])[0]
    
    
    @timeit
    def predict_weighted_batch_gpu(self, testing_points, X_train=None, y_train=None, k=None, batch_size=100):
        if X_train is None:
            X_train = cp.asarray(self.training_features)  # np -> cp
        else:
            X_train = cp.asarray(X_train)

        if y_train is None:
            y_train = self.training_labels  # CPU
        if k is None:
            k = self.best_k

        testing_points = cp.asarray(testing_points)  # np -> cp
        predictions = []

        for start in range(0, len(testing_points), batch_size):
            end = min(start + batch_size, len(testing_points))
            X_batch = testing_points[start:end]

            # EUCLIDEAN distance on GPU
            dists = cp.sqrt(cp.sum((X_batch[:, cp.newaxis, :] - X_train[cp.newaxis, :, :]) ** 2, axis=2))

            # Get top k indices
            knn_indices = cp.asnumpy(cp.argpartition(dists, kth=k, axis=1)[:, :k])

            for i in range(len(X_batch)):
                neighbor_idxs = knn_indices[i]
                neighbor_labels = y_train[neighbor_idxs]
                neighbor_dists = cp.asnumpy(dists[i][neighbor_idxs])
                weights = 1 / (neighbor_dists + 1e-8)

                votes = defaultdict(float)
                for lbl, w in zip(neighbor_labels, weights):
                    votes[lbl] += w

                pred = max(votes.items(), key=lambda x: x[1])[0]
                predictions.append(pred)

        return np.array(predictions)
    
    @timeit
    def predict_with_ball_tree_weighted(self, test_point: np.ndarray, k=None, epsilon=1e-5, metric=DistanceMetric.EUCLIDEAN):
        """
        Predicts the label using a Ball Tree-based weighted KNN.

        Parameters:
        - test_point (np.ndarray): The input feature vector to classify.
        - k (int, optional): Number of neighbors to consider. Defaults to self.best_k.
        - epsilon (float): Small constant to avoid division by zero in weight calculation.

        Returns:
        - Predicted label.
        """
        if k is None:
            k = self.best_k

        if metric not in [DistanceMetric.EUCLIDEAN, DistanceMetric.MANHATTAN]:
            raise ValueError(f"BallTree only supports EUCLIDEAN and MANHATTAN distances, got {metric}.")

        # Query BallTree for k nearest neighbors
        dists, indices = self.ball_trees[metric].query(test_point.reshape(1, -1), k=k)
        dists = dists.flatten()
        indices = indices.flatten()

        weights = defaultdict(float)
        for dist, idx in zip(dists, indices):
            label = self.training_labels[idx]
            weight = 1 / (dist + epsilon)
            weights[label] += weight

        return max(weights.items(), key=lambda x: x[1])[0]
    
    @timeit
    def predict_with_ball_tree_weighted_batch(self, testing_points, k=None, batch_size=100, epsilon=1e-5):
        """
        Predicts labels for a batch of test points using Ball Tree-based weighted KNN.

        Parameters:
        - testing_points (np.ndarray): A 2D array of shape (n_samples, n_features) containing test data.
        - k (int, optional): Number of neighbors to consider. Defaults to self.best_k.
        - batch_size (int): Number of test points to process per batch.
        - epsilon (float): Small constant to avoid division by zero in weight calculation.

        Returns:
        - np.ndarray: Predicted labels for each test point in the input array.
        """
        if k is None:
            k = self.best_k

        predictions = []

        for start in range(0, len(testing_points), batch_size):
            end = min(start + batch_size, len(testing_points))
            batch = testing_points[start:end]

            # Query the ball tree for k neighbors for the whole batch
            dists, indices = self.ball_tree.query(batch, k=k)

            for i in range(len(batch)):
                votes = defaultdict(float)
                for dist, idx in zip(dists[i], indices[i]):
                    label = self.training_labels[idx]
                    weight = 1 / (dist + epsilon)
                    votes[label] += weight

                pred = max(votes.items(), key=lambda x: x[1])[0]
                predictions.append(pred)

        return np.array(predictions)
    
    @timeit
    def predict_with_kd_tree_weighted(self, test_point: np.ndarray, k=None, epsilon=1e-5, metric=DistanceMetric.EUCLIDEAN):
        """
        Predicts the label using a KD Tree-based weighted KNN.

        Parameters:
        - test_point (np.ndarray): The input feature vector to classify.
        - k (int, optional): Number of neighbors to consider. Defaults to self.best_k.
        - epsilon (float): Small constant to avoid division by zero in weight calculation.

        Returns:
        - Predicted label.
        """
        if metric != DistanceMetric.EUCLIDEAN:
            raise ValueError(f"KD_Tree only supports the EUCLIDEAN distance metric, got {metric.value}")

        if k is None:
            k = self.best_k

        dists, indices = self.kd_tree.query(test_point.reshape(1, -1), k=k)
        dists = dists.flatten()
        indices = indices.flatten()

        weights = defaultdict(float)
        for dist, idx in zip(dists, indices):
            label = self.training_labels[idx]
            weight = 1 / (dist + epsilon)
            weights[label] += weight

        return max(weights.items(), key=lambda x: x[1])[0]

    @timeit
    def predict_with_kd_tree_weighted_batch(self, testing_points, k=None, batch_size=100, epsilon=1e-5):
        """
        Predicts labels for a batch of test points using KD Tree-based weighted KNN.

        Parameters:
        - testing_points (np.ndarray): A 2D array of shape (n_samples, n_features) containing test data.
        - k (int, optional): Number of neighbors to consider. Defaults to self.best_k.
        - batch_size (int): Number of test points to process per batch.
        - epsilon (float): Small constant to avoid division by zero in weight calculation.

        Returns:
        - np.ndarray: Predicted labels for each test point in the input array.
        """
        if k is None:
            k = self.best_k

        predictions = []

        for start in range(0, len(testing_points), batch_size):
            end = min(start + batch_size, len(testing_points))
            batch = testing_points[start:end]

            dists, indices = self.kd_tree.query(batch, k=k)

            for i in range(len(batch)):
                votes = defaultdict(float)
                for dist, idx in zip(dists[i], indices[i]):
                    label = self.training_labels[idx]
                    weight = 1 / (dist + epsilon)
                    votes[label] += weight

                pred = max(votes.items(), key=lambda x: x[1])[0]
                predictions.append(pred)

        return np.array(predictions)



    def fit(self, features, labels, k=3, metric=DistanceMetric.EUCLIDEAN):
        """
        Stores the training data and builds internal search structures (BallTree/KDTree) 
        for the KNN classifier.

        Parameters:
        - features (array-like): A 2D array of shape (n_samples, n_features) representing 
                                the training feature vectors.
        - labels (array-like): A 1D array of shape (n_samples,) representing class labels.
        - k (int, optional): Number of neighbors to consider (default: 3).
        - metric (str, optional): Distance metric to use. Supported values for BallTree include:
            - 'EUCLIDEAN' (L2)
            - 'manhattan' (L1)
            - 'chebyshev'
            - 'minkowski'
            - 'hamming'
            - 'cosine'
            - etc.
        Note: KDTree only supports 'EUCLIDEAN'.

        Raises:
        - ValueError: If inputs are invalid or mismatched in shape.
        """
        if features is None or labels is None:
            raise ValueError("Features and labels must not be None.")

        features = np.asarray(features)
        labels = np.asarray(labels)

        if features.ndim != 2:
            raise ValueError("Features must be a 2D array of shape (n_samples, n_features).")

        if labels.ndim != 1:
            raise ValueError("Labels must be a 1D array of shape (n_samples,).")

        if features.shape[0] != labels.shape[0]:
            raise ValueError(f"Number of feature vectors ({features.shape[0]}) "
                            f"does not match number of labels ({labels.shape[0]}).")

        self.training_features = features
        self.training_labels = labels
        self.best_k = k

        # Create BallTree with chosen metric
        self.ball_trees[DistanceMetric.EUCLIDEAN] = BallTree(self.training_features, metric=DistanceMetric.EUCLIDEAN.value)
        self.ball_trees[DistanceMetric.MANHATTAN] = BallTree(self.training_features, metric=DistanceMetric.MANHATTAN.value)

        # Only build KDTree if metric is 'EUCLIDEAN'
        if metric == DistanceMetric.EUCLIDEAN:
            self.kd_tree = KDTree(self.training_features)
        else:
            self.kd_tree = None


    @timeit
    def predict_weighted_manhattan(self, test_point, k=None, epsilon=1e-5):
        """
        Predicts the label for a single test point using weighted KNN with Manhattan distance.

        Manhattan distance is the sum of absolute differences across features, 
        which can be more effective in high-dimensional, sparse data like QuickDraw.

        Parameters:
        - test_point (np.ndarray): The input feature vector to classify.
        - k (int, optional): The number of neighbors to consider. Defaults to self.best_k.
        - epsilon (float): A small constant to avoid division by zero in weight calculation.

        Returns:
        - Predicted label based on weighted majority voting.
        """
        if k is None:
            k = self.best_k

        # Compute Manhattan (L1) distances
        dists = np.sum(np.abs(self.training_features - test_point), axis=1)
        knn_indices = np.argsort(dists)[:k]

        weights = defaultdict(float)
        for idx in knn_indices:
            label = self.training_labels[idx]
            weight = 1 / (dists[idx] + epsilon)
            weights[label] += weight

        return max(weights.items(), key=lambda x: x[1])[0]
    
    @timeit
    def predict_weighted_batch_manhattan(self, testing_points, X_train=None, y_train=None, k=None, batch_size=100):
        """
        Predicts labels for a batch of test points using weighted KNN with Manhattan distance.

        For each test point, the method computes Manhattan distances to all training points,
        finds the `k` closest neighbors, and performs weighted voting based on the inverse
        of distances to determine the predicted label.

        Parameters:
        - testing_points (np.ndarray): A 2D array of shape (n_samples, n_features) containing test data.
        - X_train (np.ndarray, optional): Training feature vectors. Defaults to self.training_features.
        - y_train (np.ndarray, optional): Training labels. Defaults to self.training_labels.
        - k (int, optional): Number of neighbors to use. Defaults to self.best_k.
        - batch_size (int): Number of test points to process per batch to manage memory usage.

        Returns:
        - np.ndarray: Predicted labels for each test point in the input array.
        """
        if X_train is None:
            X_train = self.training_features
        if y_train is None:
            y_train = self.training_labels
        if k is None:
            k = self.best_k

        predictions = []

        for start in range(0, len(testing_points), batch_size):
            end = min(start + batch_size, len(testing_points))
            X_batch = testing_points[start:end]

            # Compute Manhattan distances between test batch and training points
            dists = np.sum(np.abs(X_batch[:, np.newaxis, :] - X_train[np.newaxis, :, :]), axis=2)

            # Get indices of the k nearest neighbors for each test point
            knn_indices = np.argpartition(dists, kth=k, axis=1)[:, :k]

            for i in range(len(X_batch)):
                neighbor_idxs = knn_indices[i]
                neighbor_labels = y_train[neighbor_idxs]
                neighbor_dists = dists[i][neighbor_idxs]
                weights = 1 / (neighbor_dists + 1e-8)

                votes = defaultdict(float)
                for lbl, w in zip(neighbor_labels, weights):
                    votes[lbl] += w

                pred = max(votes.items(), key=lambda x: x[1])[0]
                predictions.append(pred)

        return np.array(predictions)

    @classmethod
    def from_data(cls, features, labels, k=3, metric="EUCLIDEAN"):
        """
        Factory method to create and fit a KNN instance.

        Parameters:
        - features (array-like): Training feature matrix.
        - labels (array-like): Training labels.
        - k (int): Number of neighbors to use.

        Returns:
        - KNN: A fitted KNN instance.
        """
        instance = cls(best_k=k)
        instance.fit(features, labels, k=k, metric=metric)
        return instance

