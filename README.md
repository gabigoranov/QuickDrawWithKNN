# QuickDraw Weighted KNN Classifier

![QuickDraw Logo](https://quickdraw.withgoogle.com/static/shareimg.png)  
**Draw sketches and get real-time predictions using a custom weighted k-Nearest Neighbors (KNN) model powered by FastAPI and a Tkinter GUI!**

---

## Table of Contents

- [Project Overview](#project-overview)
- [Features](#features)
- [Technology Stack](#technology-stack)
- [Installation](#installation)
- [Usage](#usage)
  - [API](#api)
  - [GUI Application](#gui-application)
- [Project Structure](#project-structure)
- [Caching and Data Handling](#caching-and-data-handling)
- [Model Training and Evaluation](#model-training-and-evaluation)
- [Contributing](#contributing)
- [License](#license)

---

## Project Overview

This project implements a **QuickDraw sketch classifier** using a **weighted k-NN algorithm** with dimensionality reduction via PCA. It provides:

- A **FastAPI backend** for serving predictions from base64-encoded sketch images.
- A **Tkinter desktop app** for drawing sketches interactively and receiving live predictions.
- Utilities for **data loading, preprocessing, training, and evaluation** of the model.
- Caching mechanisms to speed up data loading and model reuse.

---

## Features

- Real-time sketch classification with weighted k-NN.
- PCA-based feature reduction for efficient and accurate predictions.
- REST API endpoint for sketch prediction from base64 PNG images.
- Interactive Tkinter GUI to draw sketches and see predictions.
- Dataset loading and caching from QuickDraw `.ndjson` files.
- Cross-validation and evaluation tools with confusion matrix and classification reports.
- Modular, clean Python codebase for easy extension.

---

## Technology Stack

| Component          | Technology / Library          |
|--------------------|------------------------------|
| Backend API        | FastAPI                      |
| Data Validation    | Pydantic                     |
| Machine Learning   | NumPy, scikit-learn (PCA)   |
| Model Persistence  | joblib                       |
| Image Processing   | PIL (Pillow)                 |
| GUI                | Tkinter                     |
| Plotting           | Matplotlib                   |
---

# 🚀 Installation Guide

Follow these steps to set up the project on your local machine.

---

### 1. 📂 Clone the Repository

```bash
git clone https://github.com/yourusername/quickdraw-knn.git
cd quickdraw-knn
```

---

### 2. 🐍 Set Up a Virtual Environment (Recommended)

**Linux/macOS:**

```bash
python -m venv venv
source venv/bin/activate
```

**Windows:**

```cmd
python -m venv venv
venv\Scripts\activate
```

---

### 3. 📦 Install Dependencies

```bash
pip install -r requirements.txt
```

---

### 4. 🗃️ Prepare Data and Cache

Make sure your cache directory and data files are structured correctly as expected by the project.

---


## Usage

### API

Run the FastAPI server:

uvicorn api:app --reload

text

- POST `/predict`  
  Accepts JSON payload with a base64-encoded PNG image of a sketch and returns the predicted category.

- GET `/categories`  
  Returns the list of sketch categories supported by the model.

Example request payload for `/predict`:

{
"image": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA..."
}

text

### GUI Application

Run the Tkinter drawing app:

python app.py

text

- Draw the target sketch shown at the top.
- The app predicts your drawing every 3 seconds.
- Clear or try again buttons to reset or get a new target.
- See a pixelated preview of your processed sketch.

---

# 🧱 Project Structure Overview

```
.
├── backend/                           # 🧠 Python-based backend logic and model code
│   ├── cache/                         # 💾 Cached datasets, PCA models, and preprocessed files
│   ├── data/                          # 📂 Raw and processed QuickDraw data
│   ├── notebooks/                     # 📓 Jupyter notebooks for experimentation and testing
│   └── src/                           # 🧩 Source code for backend API and utilities
│       ├── api.py                     # 🌐 FastAPI route definitions
│       ├── app.py                     # 🚀 FastAPI application factory
│       ├── evaluation.py              # 📊 Model evaluation and cross-validation logic
│       ├── knn.py                     # 🧮 Custom Weighted KNN implementation
│       ├── main.py                    # 🔧 Entry point for running the backend service
│       ├── preprocessor.py            # 🔄 PCA transformation and scaling logic
│       ├── utils.py                   # 🛠️ Helper functions for loading, drawing, and data processing
|       ├── config.py                  # ⚙️ Configuration file containing common directory paths and etc.

├── frontend/                          # 🎨 Frontend client built with React + TypeScript
│   ├── node_modules/                  # 📦 Installed NPM packages
│   ├── public/                        # 🌐 Static assets (e.g. index.html, favicon)
│   ├── src/                           # 🧠 Application source code
│   │   ├── assets/                    # 🖼️ Images and media files
│   │   ├── components/                # 🧩 Reusable UI components
│   │   ├── styles/                    # 🎨 Global and component-specific CSS
│   │   ├── App.tsx                    # 🧭 Root application component
│   │   ├── index.css                  # 📄 Base styling sheet
│   │   ├── main.tsx                   # 🚪 Entry point for rendering the app
│   │   ├── vite-env.d.ts              # ✍️ Vite environment type declarations
│   ├── Other config files             # ⚙️ Vite, TypeScript, and package configuration

├── .gitignore                         # 🙈 Git ignored files and directories
├── README.md                          # 📘 Project README

```

---


## Caching and Data Handling

- Raw drawing data is loaded from `.ndjson` files and cached as `datasets_dict.pkl`.
- Dataset arrays `(X, y)` are cached as `Xy_dataset.npz`.
- PCA-reduced features and preprocessor are cached as `X_reduced.pkl` and `preprocessor.pkl`.
- Train/test splits are cached as `.npy` files.
- Categories and the trained KNN model are cached for fast reuse.

---

## Model Training and Evaluation

- The `Preprocessor` class handles scaling and PCA dimensionality reduction.
- The `KNN` class implements a weighted k-NN classifier with batch prediction support.
- The `Evaluator` class provides cross-validation over k values, confusion matrix visualization, and classification reports.
- Model training and evaluation scripts load cached data or generate caches if missing.

---

## Contributing

Contributions are welcome! Please open issues or submit pull requests for improvements, bug fixes, or new features.

---

## License

This project is licensed under the MIT License.

---

# Requirements.txt

fastapi
uvicorn
pydantic
joblib
numpy
pillow
matplotlib
scikit-learn
tk