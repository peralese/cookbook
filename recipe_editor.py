# Local-use only: DO NOT deploy this script to public static hosting
# This script is a simple Flask application to add recipes with image upload functionality.
# It allows users to create a recipe by filling out a form and uploading an image.

from flask import Flask, render_template_string, request, redirect
import os
import json
from pathlib import Path
import shutil

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = 'src/images'

# Gather available categories
def get_categories():
    content_dir = Path("content")
    return sorted([d.name for d in content_dir.iterdir() if d.is_dir()])

# Load recipe JSON data
def load_recipe(category, recipe_name):
    filepath = Path("content") / category / f"{recipe_name}.json"
    if filepath.exists():
        with open(filepath, "r", encoding="utf-8") as f:
            return json.load(f)
    return {}

@app.route("/", methods=["GET"])
def index():
    categories = get_categories()
    selected_category = request.args.get("category", categories[0])
    recipes = sorted(
        [f.stem for f in Path(f"content/{selected_category}").glob("*.json")],
        key=lambda x: x.lower()
    )

    selected_recipe = request.args.get("recipe")
    recipe_data = load_recipe(selected_category, selected_recipe) if selected_recipe else {}

    return render_template_string(FORM_TEMPLATE,
                                  categories=categories,
                                  selected_category=selected_category,
                                  selected_recipe=selected_recipe,
                                  recipes=recipes,
                                  recipe_data=recipe_data)

@app.route("/submit", methods=["POST"])
def submit():
    category = request.form["category"]
    title = request.form["title"]
    filename = title.replace(" ", "_")
    data = {
        "title": title,
        "category": category,
        "requires": request.form.get("requires", ""),
        "ingredients": request.form.get("ingredients", "").splitlines(),
        "instructions": request.form.get("instructions", "").splitlines(),
        "remarks": request.form.get("remarks", ""),
        "yield": request.form.get("yield", ""),
        "source": request.form.get("source", "")
    }

    image = request.files.get("image")
    if image and image.filename:
        image_filename = image.filename
        image.save(os.path.join(app.config['UPLOAD_FOLDER'], image_filename))
        data["image"] = image_filename

    out_file = Path("content") / category / f"{filename}.json"
    with open(out_file, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

    return redirect(f"/?category={category}&recipe={filename}")

FORM_TEMPLATE = """
<!doctype html>
<title>Recipe Manager</title>
<h1>{{ 'Edit' if selected_recipe else 'Add' }} Recipe</h1>
<form method="POST" action="/submit" enctype="multipart/form-data">
  <label>Select Category:</label>
  <select name="category" onchange="this.form.submit()">
    {% for cat in categories %}
      <option value="{{ cat }}" {% if cat == selected_category %}selected{% endif %}>{{ cat }}</option>
    {% endfor %}
  </select>

  <label>Select Recipe:</label>
  <select name="recipe" onchange="location.href='/?category={{ selected_category }}&recipe='+this.value">
    <option value="">-- New Recipe --</option>
    {% for name in recipes %}
      <option value="{{ name }}" {% if name == selected_recipe %}selected{% endif %}>{{ name }}</option>
    {% endfor %}
  </select>

  <br><br>
  <label>Title:</label><br>
  <input name="title" value="{{ recipe_data.title or '' }}" required><br><br>

  <label>Requires:</label><br>
  <input name="requires" value="{{ recipe_data.requires or '' }}"><br><br>

  <label>Ingredients:</label><br>
  <textarea name="ingredients" rows="5" cols="60">{{ recipe_data.ingredients | join('\\n') if recipe_data.ingredients }}</textarea><br><br>

  <label>Instructions:</label><br>
  <textarea name="instructions" rows="5" cols="60">{{ recipe_data.instructions | join('\\n') if recipe_data.instructions }}</textarea><br><br>

  <label>Remarks:</label><br>
  <textarea name="remarks" rows="3" cols="60">{{ recipe_data.remarks or '' }}</textarea><br><br>

  <label>Yield:</label><br>
  <input name="yield" value="{{ recipe_data.yield or '' }}"><br><br>

  <label>Source:</label><br>
  <input name="source" value="{{ recipe_data.source or '' }}"><br><br>

  <label>Upload Image:</label><br>
  <input type="file" name="image"><br><br>

  <button type="submit">Save Recipe</button>
</form>
"""

if __name__ == "__main__":
    app.run(debug=True)
