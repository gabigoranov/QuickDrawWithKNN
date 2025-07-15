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
            img = draw_image(item["drawing"], size=56)
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


def draw_image(strokes, size=56, padding=10):
    """
    Renders strokes into a centered, proportionally scaled grayscale image.
    Keeps aspect ratio and uses matplotlib for anti-aliasing.

    Parameters:
        strokes: list of (xs, ys) pairs
        size: final image size in pixels
        padding: percentage (0–50) of space around the drawing

    Returns:
        np.ndarray of shape (size, size) with values in [0, 1]
    """
    fig = Figure(figsize=(1, 1), dpi=size, facecolor='white')
    canvas = FigureCanvas(fig)
    ax = fig.add_axes([0, 0, 1, 1])  # no margins

    # Flatten all points
    all_x = [x for stroke in strokes for x in stroke[0]]
    all_y = [y for stroke in strokes for y in stroke[1]]
    
    if not all_x or not all_y:
        return np.ones((size, size), dtype=np.float32)

    # Bounding box
    min_x, max_x = min(all_x), max(all_x)
    min_y, max_y = min(all_y), max(all_y)
    width = max_x - min_x
    height = max_y - min_y

    # Compute padded drawing area
    longest_side = max(width, height)
    pad = longest_side * padding / 100
    draw_min_x = min_x - (longest_side - width) / 2 - pad
    draw_max_x = max_x + (longest_side - width) / 2 + pad
    draw_min_y = min_y - (longest_side - height) / 2 - pad
    draw_max_y = max_y + (longest_side - height) / 2 + pad

    ax.set_xlim(draw_min_x, draw_max_x)
    ax.set_ylim(draw_min_y, draw_max_y)
    ax.invert_yaxis()
    ax.axis('off')

    for x, y in strokes:
        ax.plot(x, y, color='black', linewidth=3)

    canvas.draw()
    buf = canvas.buffer_rgba()
    image = np.asarray(buf)[:, :, :3]
    grayscale = image.mean(axis=2)
    return grayscale / 255.0


def display_vector_drawing(strokes):
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

def display_pixel_drawing(image):    
    plt.imshow(image, cmap='gray')
    plt.title("Input Drawing")
    plt.axis('off')
    plt.show()