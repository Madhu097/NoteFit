import os
import shutil

# Paths of obsolete directories to remove
directories_to_remove = [
    r"d:\firstlook projects\notfit\src\app\(app)\history\[id]",
    r"d:\firstlook projects\notfit\src\app\(app)\workout\[id]",
    r"d:\firstlook projects\notfit\.next"
]

def cleanup():
    print("Starting cleanup of obsolete directories...")
    for directory in directories_to_remove:
        if os.path.exists(directory):
            try:
                shutil.rmtree(directory)
                print(f"SUCCESS: Removed obsolete directory -> {directory}")
            except Exception as e:
                print(f"ERROR: Failed to remove {directory}: {e}")
        else:
            print(f"INFO: Directory already removed or not found -> {directory}")
    print("Cleanup completed.")

if __name__ == "__main__":
    cleanup()
