import numpy as np
import pandas as pd
from sklearn.preprocessing import StandardScaler
from sklearn.decomposition import PCA

class Preprocessor:
    """
    Preprocessor for scaling and dimensionality reduction using StandardScaler and PCA.

    Methods:
    - fit(X): Fits the scaler and PCA to the input data.
    - transform(X): Applies the fitted scaler and PCA to transform the input data.
    - fit_transform(X): Fits and transforms the input data.
    - inverse_transform(X_reduced): Reconstructs the original (scaled) data from reduced form.
    - transform_only_scale(X): Applies only the fitted scaler (no PCA).
    """

    def __init__(self, n_components=64):
        """
        Initializes the Preprocessor.

        Parameters:
        - n_components (int): Number of principal components to keep in PCA.
        """
        self.scaler = StandardScaler()
        self.pca = PCA(n_components=n_components)
        self.fitted = False

    def fit(self, X):
        """
        Fits the scaler and PCA to the input data.

        Parameters:
        - X (array-like): Input features to fit on.
        """
        X_scaled = self.scaler.fit_transform(X)
        self.pca.fit(X_scaled)
        self.fitted = True

    def transform(self, X):
        """
        Transforms the input data using the fitted scaler and PCA.

        Parameters:
        - X (array-like): Input features to transform.

        Returns:
        - np.ndarray: Scaled and reduced features.
        """
        if not self.fitted:
            raise RuntimeError("Preprocessor must be fitted before calling transform.")
        print("gonna scale")
        X_scaled = self.scaler.transform(X)
        print("scaled")
        return self.pca.transform(X_scaled)

    def fit_transform(self, X):
        """
        Fits the scaler and PCA, then transforms the input data.

        Parameters:
        - X (array-like): Input features to fit and transform.

        Returns:
        - np.ndarray: Scaled and reduced features.
        """
        X_scaled = self.scaler.fit_transform(X)
        self.fitted = True
        return self.pca.fit_transform(X_scaled)

    def inverse_transform(self, X_reduced):
        """
        Reconstructs the scaled data from the PCA-reduced data.

        Parameters:
        - X_reduced (array-like): Data in PCA-reduced space.

        Returns:
        - np.ndarray: Approximation of the scaled data before PCA.
        """
        if not self.fitted:
            raise RuntimeError("Preprocessor must be fitted before calling inverse_transform.")
        return self.pca.inverse_transform(X_reduced)

    def transform_only_scale(self, X):
        """
        Applies only the scaler (no PCA) to the input data.

        Parameters:
        - X (array-like): Input features.

        Returns:
        - np.ndarray: Scaled features without PCA.
        """
        if not self.fitted:
            raise RuntimeError("Preprocessor must be fitted before calling transform_only_scale.")
        return self.scaler.transform(X)
