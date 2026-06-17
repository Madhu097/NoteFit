import os
from PIL import Image

# Absolute paths
logo_path = r"C:\Users\kuruv\.gemini\antigravity-ide\brain\8e48e693-fefc-4e33-8d34-35f594758d4a\notefit_icon_1781522102160.png"
public_dir = r"d:\firstlook projects\notfit\public"

# Target file paths & dimensions
targets = {
    "icon-192.png": (192, 192),
    "icon-512.png": (512, 512),
    "icon-apple.png": (180, 180),
    "icon-favicon.png": (48, 48),
    "icon-maskable.png": (512, 512),
}

def generate_icons():
    if not os.path.exists(logo_path):
        print(f"Error: Original logo not found at {logo_path}")
        print("Please verify the path or run with a custom path.")
        return

    try:
        # Load the source high-res image
        img = Image.open(logo_path)
        print(f"Loaded logo successfully from {logo_path} ({img.size[0]}x{img.size[1]})")
        
        # Ensure public directory exists
        os.makedirs(public_dir, exist_ok=True)
        
        # Resize and save images
        for name, size in targets.items():
            out_path = os.path.join(public_dir, name)
            resized_img = img.resize(size, Image.Resampling.LANCZOS)
            resized_img.save(out_path, "PNG")
            print(f"Generated {name} ({size[0]}x{size[1]}) -> {out_path}")
            
        print("\nAll PWA icons generated successfully!")
    except Exception as e:
        print(f"Failed to generate icons: {e}")

if __name__ == "__main__":
    generate_icons()
