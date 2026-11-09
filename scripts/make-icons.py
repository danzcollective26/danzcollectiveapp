"""Export the temporary DANZ D. wordmark icon; needs Pillow only when regenerated."""
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

target = Path(__file__).resolve().parents[1] / "public" / "icons"
target.mkdir(parents=True, exist_ok=True)
for name, size in [("danz-180", 180), ("danz-192", 192), ("danz-512", 512), ("danz-maskable-512", 512)]:
    canvas = Image.new("RGB", (size * 3, size * 3), "#101011")
    draw = ImageDraw.Draw(canvas)
    # Keep the mark inside the maskable safe circle, including square/round crops.
    font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", round(size * 1.65))
    box = draw.textbbox((0, 0), "D.", font=font)
    x = (size * 3 - (box[2] - box[0])) / 2 - box[0]
    y = (size * 3 - (box[3] - box[1])) / 2 - box[1]
    draw.text((x, y), "D.", font=font, fill="#dbfc58")
    canvas.resize((size, size), Image.Resampling.LANCZOS).save(target / f"{name}.png", optimize=True)
