import json
import numpy as np
import matplotlib.pyplot as plt
from matplotlib.figure import Figure
from matplotlib.backends.backend_agg import FigureCanvasAgg as FigureCanvas
import os

def create_dataset(datasets_dict, samples_per_class=1000):
    """
    Converts raw drawing data into flattened image arrays and labels.

    Parameters:
    - datasets_dict (dict): Dictionary mapping labels to lists of drawing items.
    - samples_per_class (int): Number of samples to use per label/class.

    Returns:
    - X (np.ndarray): Array of flattened grayscale images.
    - y (np.ndarray): Array of corresponding labels.
    """
    X = []
    y = []
    
    for label, drawings in datasets_dict.items():
        for item in drawings[:samples_per_class]:
            img = draw_image(item["drawing"])
            X.append(img.flatten())  # Flatten 28x28 image to 1D array
            y.append(label)
    
    return np.array(X), np.array(y)

def get_data(filename, max_items):
    """
    Reads a newline-delimited JSON file and extracts recognized items up to max_items.

    Parameters:
    - filepath (str): Path to the JSON file.
    - max_items (int): Maximum number of items to read.

    Returns:
    - data (list): List of JSON objects representing recognized drawings.
    """

    base_dir = os.path.dirname(os.path.dirname(__file__))  # goes from src/ → backend/
    file_path = os.path.join(base_dir, "data", "raw", filename)

    data = []
    with open(file_path, 'r') as f:
        for line in f:
            if len(data) >= max_items:
                break
            item = json.loads(line)
            if item.get("recognized", False):
                data.append(item)
    return data

def draw_image(strokes, size=28):
    """
    Renders a list of strokes into a grayscale image array.

    Parameters:
    - strokes (list): List of stroke coordinate pairs [[x_points], [y_points], ...].
    - size (int): Size (width and height) of the output image in pixels.

    Returns:
    - image (np.ndarray): Normalized grayscale image array of shape (size, size) with values in [0, 1].
    """
    fig = Figure(figsize=(1, 1), dpi=size, facecolor='white')  # White background
    canvas = FigureCanvas(fig)
    ax = fig.add_axes([0, 0, 1, 1])  # Fill whole canvas, no padding

    for x, y in strokes:
        ax.plot(x, y, color='black', linewidth=3)  # Draw black strokes

    ax.set_xlim(0, 255)
    ax.set_ylim(0, 255)
    ax.axis('off')
    ax.invert_yaxis()  # Invert y-axis to match image orientation (top-down)

    canvas.draw()
    buf = canvas.buffer_rgba()
    image = np.asarray(buf)[:, :, :3]  # Drop alpha channel

    # Convert RGB to grayscale by averaging channels
    image = image.mean(axis=2)

    # Normalize pixel values to [0, 1]
    return image / 255.0


def display_drawing(strokes):
    """
    Displays a single drawing using Matplotlib.

    Parameters:
    - strokes (list): List of stroke coordinate pairs [[x_points], [y_points], ...].
    """
    plt.figure(figsize=(3, 3))
    for x, y in strokes:
        plt.plot(x, y, color='black', linewidth=3)
    plt.xlim(0, 255)
    plt.ylim(0, 255)
    plt.gca().invert_yaxis()
    plt.axis('off')
    plt.show()