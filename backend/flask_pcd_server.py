from flask_cors import CORS
from flask import Flask, send_file, send_from_directory
import os
import argparse
import glob

app = Flask(__name__, static_folder="../frontend")
CORS(app)

# Set your base directory for point clouds
BASE_DIR = "/home/ekirby/scania/ekirby/logen-experiments/"

navigator = None

class ExamplesNavigator:
    def __init__(self, originals_paths):
        self.originals_paths = originals_paths
        self.current_index = 0

    def next(self):
        if self.current_index < len(self.originals_paths):
            self.current_index += 1
    
    def prev(self):
        if self.current_index > 0:
            self.current_index -= 1
    
    def __getitem__(self, index):
        return self.originals_paths[index]


@app.route("/example/<index>")
def get_point_cloud(index):
    original_path = navigator[int(index)]
    scene_path = os.path.dirname(original_path)
    gen_0 = os.path.join(scene_path, "generated_0.txt")
    gen_1 = os.path.join(scene_path, "generated_1.txt")
    if os.path.exists(original_path):
        return send_file(original_path, mimetype='text/plain')
    else:
        print("No file found")
    return {"error": "File not found"}, 404

@app.route("/<path:filename>")
def serve_static(filename):
    return send_from_directory(app.static_folder, filename)

@app.route("/")
def get_index():
    return send_from_directory(app.static_folder, "index.html")

def parse_arguments():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--experiment", type=str, default="2_28_28_distances_all_val"
    )
    parser.add_argument(
        "--model", type=str
    )
    parser.add_argument(
        "--class_name", type=str
    )
    return parser.parse_args()

def main():
    args = parse_arguments()
    data_path = os.path.join(BASE_DIR, args.experiment, args.model)
    all_originals_path = os.path.join(data_path, "*", args.class_name, "*", "original_0.txt")
    print("globbing files")
    all_originals = glob.glob(all_originals_path)
    print("globbing done")

    global navigator
    navigator = ExamplesNavigator(all_originals)
    app.run(host="0.0.0.0", port=5000, debug=True)


if __name__ == "__main__":
    main()
