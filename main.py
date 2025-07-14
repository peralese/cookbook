import json
import os
import re
from pathlib import Path

# ------------
# User Settings
# ------------

CONTENT_ROOT = Path(r"C:\Users\8A1493897\Development Workspace\python projects\cookbook\content")  # Change this to your real path!

# ------------
# Helper Functions
# ------------

def list_categories(content_root):
    folders = [f for f in content_root.iterdir() if f.is_dir()]
    folders.sort()
    return folders

def prompt_multiline(prompt_text):
    print(prompt_text + " (enter empty line to finish):")
    lines = []
    while True:
        line = input("> ").strip()
        if not line:
            break
        lines.append(line)
    return lines

def get_non_empty_input(prompt_text):
    while True:
        value = input(prompt_text).strip()
        if value:
            return value
        else:
            print("⚠️  This field is required.")

def generate_filename_from_title(title):
    # Remove punctuation, replace spaces with underscores, lowercase
    filename = re.sub(r'[^\w\s-]', '', title)
    filename = filename.strip().replace(' ', '_')
    return filename + ".json"

# ------------
# Main Flow
# ------------

def main():
    print("="*30)
    print("🍳 Add New Recipe")
    print("="*30)
    print()

    # -----------------------
    # 1. List Existing Categories
    # -----------------------
    categories = list_categories(CONTENT_ROOT)
    if not categories:
        print("❌ No category folders found in content directory!")
        return

    print("Available Categories:")
    for idx, folder in enumerate(categories, 1):
        print(f"{idx}) {folder.name}")

    while True:
        try:
            choice = int(input("\nSelect category number: "))
            if 1 <= choice <= len(categories):
                chosen_category = categories[choice - 1]
                break
            else:
                print("⚠️  Invalid choice, try again.")
        except ValueError:
            print("⚠️  Please enter a number.")

    # -----------------------
    # 2. Gather Required Fields
    # -----------------------
    print()
    title = get_non_empty_input("Recipe Title (required): ")

    requires = input("Requires (optional): ").strip()

    print()
    ingredients = prompt_multiline("Enter ingredients (required)")
    while not ingredients:
        print("⚠️  Ingredients are required.")
        ingredients = prompt_multiline("Enter ingredients (required)")

    print()
    instructions = prompt_multiline("Enter instructions (required)")
    while not instructions:
        print("⚠️  Instructions are required.")
        instructions = prompt_multiline("Enter instructions (required)")

    print()
    remarks = input("Remarks (optional): ").strip()
    yield_value = input("Yield (optional): ").strip()
    source = input("Source (optional): ").strip()

    # -----------------------
    # 3. Auto-generate Filename
    # -----------------------
    filename = generate_filename_from_title(title)
    print(f"\n📄 Auto-generated filename: {filename}")

    # -----------------------
    # 4. Compose JSON Structure
    # -----------------------
    recipe_data = {
        "title": title,
        "requires": requires,
        "ingredients": ingredients,
        "instructions": instructions,
        "remarks": remarks,
        "yield": yield_value,
        "source": source,
        "category": chosen_category.name
    }

    # -----------------------
    # 5. Save to File
    # -----------------------
    output_path = chosen_category / filename
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(recipe_data, f, ensure_ascii=False, indent=2)

    print()
    print(f"✅ Recipe saved to: {output_path}")

# ------------
# Entry Point
# ------------

if __name__ == "__main__":
    main()

