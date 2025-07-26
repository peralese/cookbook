# utils.py

import os

def cleanup_old_recipe_file(original_path, new_path):
    """Deletes the original recipe file if the new path is different and original exists."""
    if original_path != new_path and os.path.exists(original_path):
        try:
            os.remove(original_path)
            print(f"Deleted old recipe file: {original_path}")
            return True
        except Exception as e:
            print(f"Failed to delete old recipe file: {e}")
    return False
