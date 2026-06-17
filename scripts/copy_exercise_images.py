import os
import shutil
import glob

brain_dir = r"C:\Users\kuruv\.gemini\antigravity-ide\brain\8e48e693-fefc-4e33-8d34-35f594758d4a"
public_images_dir = r"d:\firstlook projects\notfit\public\images"

# Map prefixes to final filenames for all 16 exercises
mapping = {
    "bench_press": "bench_press.png",
    "incline_dumbbell_press": "incline_dumbbell_press.png",
    "shoulder_press": "shoulder_press.png",
    "lateral_raises": "lateral_raises.png",
    "tricep_pushdowns": "tricep_pushdowns.png",
    "deadlift": "deadlift.png",
    "lat_pulldown": "lat_pulldown.png",
    "barbell_row": "barbell_row.png",
    "bicep_curls": "bicep_curls.png",
    "squats": "squats.png",
    "romanian_deadlift": "romanian_deadlift.png",
    "leg_press": "leg_press.png",
    "hip_thrust": "hip_thrust.png",
    "calf_raises": "calf_raises.png",
    "pull_ups": "pull_ups.png",
    "plank": "plank.png"
}

def copy_images():
    print(f"Creating output directory: {public_images_dir}...")
    os.makedirs(public_images_dir, exist_ok=True)
    
    for prefix, target_name in mapping.items():
        search_pattern = os.path.join(brain_dir, f"{prefix}_*.png")
        matching_files = glob.glob(search_pattern)
        
        # Also check without timestamp suffix just in case
        direct_file = os.path.join(brain_dir, f"{prefix}.png")
        if os.path.exists(direct_file):
            matching_files.append(direct_file)
            
        if matching_files:
            # Sort by modification time to get the newest file
            matching_files.sort(key=os.path.getmtime)
            newest_file = matching_files[-1]
            target_path = os.path.join(public_images_dir, target_name)
            
            try:
                shutil.copy(newest_file, target_path)
                print(f"SUCCESS: Copied {os.path.basename(newest_file)} -> {target_path}")
            except Exception as e:
                print(f"ERROR: Failed to copy {os.path.basename(newest_file)}: {e}")
        else:
            print(f"WARNING: No matching files found for pattern: {search_pattern}")

if __name__ == "__main__":
    copy_images()
