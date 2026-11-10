"""Export the supplied six-petal flower as app icons and a Snake head."""
from pathlib import Path
from PIL import Image, ImageDraw

target = Path(__file__).resolve().parents[1] / "public" / "icons"
target.mkdir(parents=True, exist_ok=True)
def flower(canvas, box, colour="#f3f0e8"):
    draw = ImageDraw.Draw(canvas)
    left, top, size = box
    def circle(x, y, r, fill=None, outline=None, width=1):
        draw.ellipse((left+(x-r)*size/100, top+(y-r)*size/100, left+(x+r)*size/100, top+(y+r)*size/100), fill=fill, outline=outline, width=max(1,round(width*size/100)))
    for x,y in [(50,20),(76,35),(76,65),(50,80),(24,65),(24,35)]: circle(x,y,17.8,outline=colour,width=4.5)
    circle(50,50,19.2,fill=colour)

for name, size in [("danz-180", 180), ("danz-192", 192), ("danz-512", 512), ("danz-maskable-512", 512)]:
    canvas = Image.new("RGB", (size * 3, size * 3), "#101011")
    # The full mark fits inside the maskable safe circle.
    flower(canvas, (size*.42, size*.42, size*2.16))
    exported = canvas.resize((size, size), Image.Resampling.LANCZOS)
    exported.save(target / f"{name}.png", optimize=True)
    exported.save(target / f"{name.replace('danz-', 'danz-flower-')}.png", optimize=True)

head = Image.new("RGBA", (768,768))
flower(head,(0,0,768))
head_target=target.parent/'arcade'/'brand'
head_target.mkdir(parents=True,exist_ok=True)
head.resize((256,256),Image.Resampling.LANCZOS).save(head_target/'danz-flower.png',optimize=True)
