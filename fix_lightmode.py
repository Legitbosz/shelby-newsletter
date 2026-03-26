import os

path = os.path.join('src', 'styles', 'globals.css')

with open(path, 'r', encoding='utf-8') as f:
    c = f.read()

c = c.replace("  --text: #111111;", "  --text: #000000;")
c = c.replace("  --text-2: #333333;", "  --text-2: #1a1a1a;")
c = c.replace("  --text-3: #666666;", "  --text-3: #444444;")
c = c.replace("  --text-4: #999999;", "  --text-4: #666666;")
c = c.replace("  --accent: #d42060;", "  --accent: #e8005a;")
c = c.replace("  --accent-2: #b81550;", "  --accent-2: #c4004d;")
c = c.replace("  --accent-dim: rgba(212,32,96,0.08);", "  --accent-dim: rgba(232,0,90,0.08);")
c = c.replace("  --accent-border: rgba(212,32,96,0.3);", "  --accent-border: rgba(232,0,90,0.3);")

with open(path, 'w', encoding='utf-8') as f:
    f.write(c)

print('Done!')
