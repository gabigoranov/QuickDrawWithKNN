import tkinter as tk
from tkinter import ttk
import numpy as np
from PIL import Image, ImageDraw, ImageTk, ImageOps
import random
from utils import draw_image

class DrawingApp(tk.Tk):
    def __init__(self, model, preprocessor, categories):
        super().__init__()

        # Set global ttk style to use a light background
        style = ttk.Style(self)
        style.theme_use('default')  # Use a modifiable theme
        style.configure('.', background='#fafafa')
        style.configure('TLabel', background='#fafafa')
        style.configure('TFrame', background='#fafafa')
        style.configure('TButton', background='#fafafa')

        self.title("QuickDraw Weighted KNN Classifier")
        self.geometry("850x900")
        self.configure(bg="#fafafa")

        self.model = model
        self.preprocessor = preprocessor
        self.categories = categories

        self.strokes = []
        self.last_x, self.last_y = None, None

        self.prediction_interval = 3  # seconds
        self.countdown = self.prediction_interval

        self.target_category = None

        self._build_ui()
        self.new_target()

        self.after(1000, self._countdown_tick)

    def _build_ui(self):
        # Main container frame with horizontal layout
        container = ttk.Frame(self, padding=10)
        container.pack(fill='both', expand=True)

        # Left frame: Drawing and controls
        left_frame = ttk.Frame(container)
        left_frame.pack(side='left', fill='both', expand=True)

        title_label = ttk.Label(left_frame, text="Draw the Target Sketch!", font=("Segoe UI", 22, "bold"), background="#fafafa")
        title_label.pack(pady=(15, 5))

        self.target_label = ttk.Label(left_frame, text="", font=("Segoe UI", 18), background="#fafafa", foreground="#444")
        self.target_label.pack(pady=(0, 15))

        self.canvas_size = 450
        self.canvas = tk.Canvas(left_frame, width=self.canvas_size, height=self.canvas_size, bg='white', highlightthickness=2, highlightbackground="#888")
        self.canvas.pack(pady=10)

        self.canvas.bind("<Button-1>", self.start_draw)
        self.canvas.bind("<B1-Motion>", self.draw)
        self.canvas.bind("<ButtonRelease-1>", self.end_draw)

        self.prediction_label = ttk.Label(left_frame, text="Prediction: ---", font=("Segoe UI", 20), background="#fafafa", foreground="#222")
        self.prediction_label.pack(pady=15)

        self.timer_label = ttk.Label(left_frame, text=f"Next prediction in: {self.countdown} s", font=("Segoe UI", 14, "italic"), background="#fafafa", foreground="#666")
        self.timer_label.pack(pady=(0, 20))

        btn_frame = ttk.Frame(left_frame, padding=10)
        btn_frame.pack()

        self.clear_btn = ttk.Button(btn_frame, text="Clear Drawing", command=self.clear_canvas)
        self.clear_btn.grid(row=0, column=0, padx=10)

        self.try_again_btn = ttk.Button(btn_frame, text="Try Again", command=self.try_again)
        self.try_again_btn.grid(row=0, column=1, padx=10)
        self.try_again_btn.config(state="disabled")

        self.congrats_label = ttk.Label(left_frame, text="", font=("Segoe UI", 18, "bold"), foreground="green", background="#fafafa")
        self.congrats_label.pack(pady=10)

        # Right frame: Processed image preview
        right_frame = ttk.Frame(container, width=200)
        right_frame.pack(side='left', fill='y', padx=(20, 0))

        preview_title = ttk.Label(right_frame, text="Processed Image Preview", font=("Segoe UI", 16, "bold"), background="#fafafa")
        preview_title.pack(pady=(15, 10))

        # Label to hold the pixelated image
        self.image_label = ttk.Label(right_frame, background="#fafafa", borderwidth=2, relief="groove")
        self.image_label.pack(padx=10, pady=10)

        # Initialize with blank image
        blank_img = Image.new("L", (28, 28), 255)
        self.photo_image = ImageTk.PhotoImage(blank_img.resize((200, 200), Image.NEAREST))
        self.image_label.config(image=self.photo_image)

    def start_draw(self, event):
        self.last_x, self.last_y = event.x, event.y
        self.strokes.append([(self.last_x, self.last_y)])

    def draw(self, event):
        x, y = event.x, event.y
        if self.last_x is not None and self.last_y is not None:
            self.canvas.create_line(self.last_x, self.last_y, x, y, fill='black', width=6, capstyle=tk.ROUND, smooth=True)
            self.strokes[-1].append((x, y))
        self.last_x, self.last_y = x, y

    def end_draw(self, event):
        self.last_x, self.last_y = None, None

    def clear_canvas(self):
        self.canvas.delete("all")
        self.strokes = []
        self.prediction_label.config(text="Prediction: ---")
        self.congrats_label.config(text="")
        self.try_again_btn.config(state="disabled")
        self.clear_btn.config(state="normal")
        self.countdown = self.prediction_interval
        self.timer_label.config(text=f"Next prediction in: {self.countdown} s")
        self._update_processed_image(None)  # Clear preview

    def try_again(self):
        self.clear_canvas()
        self.new_target()

    def new_target(self):
        self.target_category = random.choice(self.categories)
        self.target_label.config(text=f"Target: {self.target_category}")

    # def strokes_to_image(self, size=56): old
    #     img = Image.new("L", (size, size), color=255)
    #     draw = ImageDraw.Draw(img)
    #     scale = size / self.canvas_size

    #     for stroke in self.strokes:
    #         if len(stroke) > 1:
    #             scaled_points = [(x * scale, y * scale) for x, y in stroke]
    #             draw.line(scaled_points, fill=0, width=2)

    #     return img  # Return PIL Image for preview and processing

    def strokes_to_image(self, size=56):
        """
        Converts the user's drawing strokes into a grayscale PIL image, formatted to match
        the preprocessing used during model training.

        The method transforms the stroke data from the internal Tkinter format into the
        format expected by the `draw_image` function, which uses matplotlib to render the
        strokes with anti-aliasing and proportional scaling. The resulting NumPy image array 
        is converted to a grayscale PIL Image suitable for model prediction or display.

        Parameters:
            size (int): The width and height (in pixels) of the output square image. 
                        Defaults to 56.

        Returns:
            PIL.Image.Image: A grayscale image ("L" mode) of the rendered drawing, 
                            scaled to the specified size and normalized to 8-bit pixels (0–255).
        """
        formatted_strokes = []
        for stroke in self.strokes:
            if len(stroke) > 1:
                xs, ys = zip(*stroke)
                formatted_strokes.append((xs, ys))

        image_array = draw_image(strokes=formatted_strokes, size=size)
        image_array = (image_array * 255).astype(np.uint8)
        return Image.fromarray(image_array, mode="L")

    def _update_processed_image(self, pil_img):
        if pil_img is None:
            # Blank image
            pil_img = Image.new("L", (56, 56), 255)
        # Resize with NEAREST filter to keep pixelated look
        resized_img = pil_img.resize((200, 200), Image.NEAREST)
        self.photo_image = ImageTk.PhotoImage(resized_img)
        self.image_label.config(image=self.photo_image)
        self.image_label.image = self.photo_image  # keep reference

    def _countdown_tick(self):
        if self.countdown > 0:
            self.countdown -= 1
            self.timer_label.config(text=f"Next prediction in: {self.countdown} s")
            self.after(1000, self._countdown_tick)
        else:
            self._make_prediction()
            self.countdown = self.prediction_interval
            self.timer_label.config(text=f"Next prediction in: {self.countdown} s")
            self.after(1000, self._countdown_tick)

    def _make_prediction(self):
        if not self.strokes:
            self.prediction_label.config(text="Prediction: ---")
            self._update_processed_image(None)
            return

        try:
            pil_img = self.strokes_to_image()
            vec = np.array(pil_img).flatten().reshape(1, -1) / 255.0
            vec_reduced = self.preprocessor.transform(vec)
            pred = self.model.predict_weighted(vec_reduced[0])

            self.prediction_label.config(text=f"Prediction: {pred}")
            self._update_processed_image(pil_img)

            if pred == self.target_category:
                self.congrats_label.config(text="🎉 Congratulations! You drew it correctly! 🎉")
                self.try_again_btn.config(state="normal")
                self.clear_btn.config(state="disabled")
            else:
                self.congrats_label.config(text="")
                self.try_again_btn.config(state="disabled")
                self.clear_btn.config(state="normal")

        except Exception as e:
            self.prediction_label.config(text="Prediction error")
            print(f"Prediction error: {e}")
            self._update_processed_image(None)
