import numpy as np
import matplotlib.pyplot as plt
from sklearn.model_selection import KFold
from sklearn.metrics import confusion_matrix, ConfusionMatrixDisplay, classification_report
from collections import defaultdict
from knn import KNN
from tqdm import tqdm
from utils import timeit

class Evaluator:
    """
    Evaluator class for performing cross-validation and evaluation of custom weighted KNN.
    """

    def __init__(self, batch_size=100):
        self.batch_size = batch_size

    @timeit
    def cross_validate(self, X, y, k_range):
        """
        Perform 5-fold cross-validation over a range of k values for weighted KNN.

        Parameters:
        - X (array-like): Feature matrix.
        - y (array-like): Target labels.
        - k_range (iterable): Iterable of k values to evaluate.

        Returns:
        - best_k (int): k value with the highest average cross-validation accuracy.
        """
        kf = KFold(n_splits=5, shuffle=True, random_state=42)
        cv_scores = []
        model = KNN()
        model.fit(X, y)

        X_np = X.values if hasattr(X, 'values') else X
        y_np = y.values if hasattr(y, 'values') else y

        # Outer progress bar over k_range
        for k in tqdm(k_range, desc="Evaluating k values"):
            fold_accuracies = []
            # Inner progress bar over folds
            for train_idx, val_idx in tqdm(kf.split(X_np), desc=f"Folds for k={k}", total=kf.get_n_splits(), leave=False):
                X_train_fold, X_val_fold = X_np[train_idx], X_np[val_idx]
                y_train_fold, y_val_fold = y_np[train_idx], y_np[val_idx]

                model.fit(X_train_fold, y_train_fold, k=k)
                y_pred = model.predict_with_kd_tree_weighted_batch(X_val_fold, k, batch_size=self.batch_size)
                accuracy = np.mean(y_pred == y_val_fold)
                fold_accuracies.append(accuracy)

            avg_acc = np.mean(fold_accuracies)
            cv_scores.append(avg_acc)
            print(f"k={k}, Cross-val Accuracy={avg_acc:.4f}")

        plt.figure(figsize=(8, 5))
        plt.plot(k_range, cv_scores, marker='o')
        plt.title("Custom Weighted k-NN Cross-Validation Accuracy vs k")
        plt.xlabel("Number of Neighbors: k")
        plt.ylabel("Cross-Validated Accuracy")
        plt.grid(True)
        plt.show()

        best_k = k_range[np.argmax(cv_scores)]
        print(f"Best k from cross-validation: {best_k}")
        return best_k


    @timeit
    def display_confusion_matrix(self, y_true, y_pred, labels, title):
        """
        Display a confusion matrix using sklearn's ConfusionMatrixDisplay.

        Parameters:
        - y_true (array-like): True target labels.
        - y_pred (array-like): Predicted labels.
        - labels (list or array-like): List of label names to display.
        - title (str): Title for the confusion matrix plot.
        """
        cm = confusion_matrix(y_true, y_pred)
        disp = ConfusionMatrixDisplay(confusion_matrix=cm, display_labels=labels)
        disp.plot(cmap="Blues")
        plt.title(title)
        plt.grid(False)
        plt.show()

    @timeit
    def print_classification_report(self, y_true, y_pred):
        """
        Prints the classification report.

        Parameters:
        - y_true (array-like): True target labels.
        - y_pred (array-like): Predicted labels.
        """
        print("Classification Report:")
        print(classification_report(y_true, y_pred))
