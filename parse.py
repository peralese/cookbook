import os
import json
from pathlib import Path
from docx import Document

# --------------------------------------------
# USER CONFIGURATION
# --------------------------------------------
SOURCE_DIR = r"D:\Temp\Recipies_DOCX"   # Your converted .DOCX folder
OUTPUT_DIR = r"D:\Temp\Recipies_JSON"   # Where you want the JSON to go
EXCLUDE_FOLDERS = {"Book Covers", "Advice and Information", "Cookbooks", "Not Converted", "desktop"}

# --------------------------------------------
# RECIPE PARSER FUNCTION
# --------------------------------------------

def parse_recipe_docx(file_path):
    try:
        doc = Document(file_path)
    except Exception as e:
        print(f"ERROR opening {file_path}: {e}")
        return None

    # Read all non-empty lines
    lines = [p.text.strip() for p in doc.paragraphs if p.text.strip()]
    if not lines:
        return None

    result = {
        "title": "",
        "requires": "",
        "ingredients": [],
        "instructions": [],
        "remarks": "",
        "yield": "",
        "source": ""
    }

    SECTIONS = {"requires", "ingredients", "instructions", "remarks", "yield", "source"}
    current_section = None
    title_lines = []

    for line in lines:
        norm = line.lower().strip().rstrip(':').strip()
        if norm in SECTIONS:
            current_section = norm
            continue

        if current_section is None:
            title_lines.append(line)
        elif current_section == "requires":
            result["requires"] += line + " "
        elif current_section == "ingredients":
            result["ingredients"].append(line)
        elif current_section == "instructions":
            result["instructions"].append(line)
        elif current_section == "remarks":
            result["remarks"] += line + " "
        elif current_section == "yield":
            result["yield"] += line + " "
        elif current_section == "source":
            result["source"] += line + " "

    # Title cleanup
    result["title"] = " ".join(title_lines).strip() or file_path.stem
    for key in ["requires", "remarks", "yield", "source"]:
        result[key] = result[key].strip()

    return result

# --------------------------------------------
# SAVE JSON FUNCTION
# --------------------------------------------

def save_json(recipe, output_path):
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(recipe, f, ensure_ascii=False, indent=2)

# --------------------------------------------
# MAIN CONVERSION LOOP
# --------------------------------------------

def main():
    source = Path(SOURCE_DIR)
    output = Path(OUTPUT_DIR)
    output.mkdir(parents=True, exist_ok=True)

    for root, dirs, files in os.walk(source):
        relative = Path(root).relative_to(source)

        # Skip excluded folders
        if any(part in EXCLUDE_FOLDERS for part in relative.parts):
            continue

        # Use first folder part as category
        category = relative.parts[0] if relative.parts else "Uncategorized"
        out_category_dir = output / category
        out_category_dir.mkdir(parents=True, exist_ok=True)

        for file in files:
            if not file.lower().endswith(".docx"):
                continue

            file_path = Path(root) / file
            print(f"Processing: {file_path}")

            try:
                recipe = parse_recipe_docx(file_path)
                if recipe:
                    recipe["category"] = category
                    out_file = out_category_dir / (file_path.stem + ".json")
                    save_json(recipe, out_file)
                    print(f"✅ Saved: {out_file}")
                else:
                    print(f"⚠️  Skipped (no content): {file_path}")
            except Exception as e:
                print(f"❌ ERROR processing {file_path}: {e}")

if __name__ == "__main__":
    main()

