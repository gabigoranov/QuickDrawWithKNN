import os

current_file_path = os.path.abspath(__file__)
CACHE_DIR = os.path.abspath(os.path.join(current_file_path, "..", "..", "cache"))
os.makedirs(CACHE_DIR, exist_ok=True)
print("Cache directory:", CACHE_DIR)