from PIL import Image

files = [
    'Images/Ascensours/cage/vide.jpg',
    'Images/Ascensours/cage/ouvert 1.png',
    'Images/Ascensours/cage/ouvert 2.png',
    'Images/Ascensours/cage/full.png'
]

for f in files:
    try:
        i = Image.open(f)
        print(f"{f}: {i.mode} {i.size}")
        if i.mode == 'RGBA':
            extrema = i.getextrema()
            print(f"  Alpha extrema: {extrema[3]}")
    except Exception as e:
        print(f"{f}: ERROR {e}")
