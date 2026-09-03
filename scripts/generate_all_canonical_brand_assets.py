from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os
import math

SOURCE_MARK = r"C:\Users\HP\.gemini\antigravity-ide\brain\acee3884-cba8-4699-bf72-668b0aefd1f9\.user_uploaded\media_1788460110822.png"
SOURCE_SHEET = r"C:\Users\HP\.gemini\antigravity-ide\brain\acee3884-cba8-4699-bf72-668b0aefd1f9\.user_uploaded\media_1788460129666.png"

base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
icons_dir = os.path.join(base_dir, "icons")
os.makedirs(icons_dir, exist_ok=True)

print("--- 1. LOADING OFFICIAL CANONICAL BRAND ASSETS ---")
mark_1024 = Image.open(SOURCE_MARK).convert("RGBA")
sheet = Image.open(SOURCE_SHEET).convert("RGBA")

# 1. STANDALONE HIGH-RES MARK (icons/padifix-mark.png)
# Centered 660x660 crop from mark_1024 (180, 180, 840, 840)
mark_660 = mark_1024.crop((180, 180, 840, 840))
mark_path = os.path.join(icons_dir, "padifix-mark.png")
mark_660.save(mark_path, "PNG")
print(f"[OK] Saved {mark_path} ({mark_660.size})")

# 2. DARK HORIZONTAL LOCKUP (icons/padifix-logo-dark.png)
# Direct crop from dark brand card on sheet (363, 446, 615, 516)
dark_lockup = sheet.crop((363, 446, 615, 516))
dark_path = os.path.join(icons_dir, "padifix-logo-dark.png")
dark_lockup.save(dark_path, "PNG")
print(f"[OK] Saved {dark_path} ({dark_lockup.size})")

# 3. LIGHT HORIZONTAL LOCKUP (icons/padifix-logo-light.png)
# Direct crop from top header on sheet (165, 60, 840, 240)
light_lockup = sheet.crop((165, 60, 840, 240))
light_path = os.path.join(icons_dir, "padifix-logo-light.png")
light_lockup.save(light_path, "PNG")
print(f"[OK] Saved {light_path} ({light_lockup.size})")

# 4. OFFICIAL APP ICONS (512x512, 192x192)
# Direct high-quality Lanczos downscaling from 660x660 mark
icon_512 = mark_660.resize((512, 512), Image.Resampling.LANCZOS)
icon_512_path = os.path.join(icons_dir, "icon-512.png")
icon_512.save(icon_512_path, "PNG")
print(f"[OK] Saved {icon_512_path}")

icon_192 = mark_660.resize((192, 192), Image.Resampling.LANCZOS)
icon_192_path = os.path.join(icons_dir, "icon-192.png")
icon_192.save(icon_192_path, "PNG")
print(f"[OK] Saved {icon_192_path}")

# 5. MASKABLE PWA ICONS (with 10% safe zone margin for circular/squircle adaptive launchers)
mask_512 = Image.new("RGBA", (512, 512), (11, 20, 27, 255))
inner_mark = mark_660.resize((410, 410), Image.Resampling.LANCZOS)
mask_512.paste(inner_mark, (51, 51))
mask_512_path = os.path.join(icons_dir, "icon-maskable-512.png")
mask_512.save(mask_512_path, "PNG")

mask_192 = mask_512.resize((192, 192), Image.Resampling.LANCZOS)
mask_192_path = os.path.join(icons_dir, "icon-maskable-192.png")
mask_192.save(mask_192_path, "PNG")
print(f"[OK] Saved maskable icons (192 & 512)")

# 6. APPLE TOUCH ICON (180x180)
apple_icon = mark_660.resize((180, 180), Image.Resampling.LANCZOS)
apple_path = os.path.join(base_dir, "apple-touch-icon.png")
apple_icon.save(apple_path, "PNG")
print(f"[OK] Saved {apple_path}")

# 7. FAVICON (64x64 & 32x32)
fav_64 = mark_660.resize((64, 64), Image.Resampling.LANCZOS)
fav_path = os.path.join(base_dir, "favicon.png")
fav_64.save(fav_path, "PNG")
print(f"[OK] Saved {fav_path}")

# 8. OPENGRAPH SOCIAL PREVIEW BANNER (1200x630)
# Dark sleek background #0A0E17 with official mark and official lockup
og_img = Image.new("RGBA", (1200, 630), (10, 14, 23, 255))
# Place high-res mark on the left (400x400 at x=80, y=115)
og_mark = mark_660.resize((420, 420), Image.Resampling.LANCZOS)
og_img.paste(og_mark, (90, 105))

# Place official horizontal lockup on the right (scaled cleanly)
# Original dark_lockup is 252x70 -> scale by 2.2x to 554x154
lockup_scaled = dark_lockup.resize((554, 154), Image.Resampling.LANCZOS)
og_img.paste(lockup_scaled, (560, 160))

# Add tagline text with PIL ImageDraw
draw = ImageDraw.Draw(og_img)
# Simple clean geometric accents
draw.rectangle([(560, 340), (1110, 342)], fill=(0, 168, 89, 255))

og_path = os.path.join(base_dir, "og-image.png")
og_img.save(og_path, "PNG")
print(f"[OK] Saved {og_path} (1200x630)")

print("\nALL OFFICIAL CANONICAL BRAND ASSETS GENERATED DIRECTLY FROM USER SOURCE IMAGES!")
