"""
Android app icon generation script
"""
from PIL import Image
import os

# Icon sizes
sizes = {
    'mipmap-mdpi': 48,
    'mipmap-hdpi': 72,
    'mipmap-xhdpi': 96,
    'mipmap-xxhdpi': 144,
    'mipmap-xxxhdpi': 192,
}

# Source icon path
source_icon = 'appicon.png'
base_path = 'android/app/src/main/res'

# Open source image
try:
    img = Image.open(source_icon)
    print(f"Source image size: {img.size}")

    # Generate icons for each resolution
    for folder, size in sizes.items():
        # Resize
        resized = img.resize((size, size), Image.Resampling.LANCZOS)

        # Output path
        output_dir = os.path.join(base_path, folder)
        output_path = os.path.join(output_dir, 'ic_launcher.png')

        # Create directory if not exists
        os.makedirs(output_dir, exist_ok=True)

        # Save
        resized.save(output_path, 'PNG')
        print(f"[OK] {folder}/ic_launcher.png ({size}x{size})")

    # Generate round icons
    for folder, size in sizes.items():
        resized = img.resize((size, size), Image.Resampling.LANCZOS)
        output_dir = os.path.join(base_path, folder)
        output_path = os.path.join(output_dir, 'ic_launcher_round.png')
        resized.save(output_path, 'PNG')
        print(f"[OK] {folder}/ic_launcher_round.png ({size}x{size})")

    print("\nAll icons generated successfully!")

except Exception as e:
    print(f"Error: {e}")
