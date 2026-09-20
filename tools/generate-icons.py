# tools/generate-icons.py
# Gera todas as resoluções de ícones PNG a partir de icon.svg e icon-maskable.svg
import os
import subprocess
from PIL import Image

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ICONS_DIR = os.path.join(BASE_DIR, 'public', 'icons')
SCRATCH_DIR = os.path.join(BASE_DIR, 'tools')
EDGE_PATH = r'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'

def render_svg_to_png(svg_path, output_png_path, size=1024):
    with open(svg_path, 'r', encoding='utf-8') as f:
        svg_code = f.read()

    html_content = f"""<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  * {{ margin: 0; padding: 0; box-sizing: border-box; }}
  html, body {{ width: {size}px; height: {size}px; overflow: hidden; background: transparent; }}
  svg {{ width: {size}px; height: {size}px; display: block; }}
</style>
</head>
<body>
{svg_code}
</body>
</html>"""

    temp_html = os.path.join(SCRATCH_DIR, f'temp_render_{size}.html')
    with open(temp_html, 'w', encoding='utf-8') as f:
        f.write(html_content)

    html_url = 'file:///' + temp_html.replace('\\', '/')
    cmd = [
        EDGE_PATH,
        '--headless',
        '--disable-gpu',
        f'--screenshot={output_png_path}',
        f'--window-size={size},{size}',
        '--default-background-color=00000000',
        html_url
    ]
    subprocess.run(cmd, check=True)

    if os.path.exists(temp_html):
        os.remove(temp_html)

# 1. Renderizar master 1024x1024 standard
master_std = os.path.join(ICONS_DIR, 'temp_master_std.png')
render_svg_to_png(os.path.join(ICONS_DIR, 'icon.svg'), master_std, 1024)

# 2. Renderizar master 1024x1024 maskable
master_mask = os.path.join(ICONS_DIR, 'temp_master_mask.png')
render_svg_to_png(os.path.join(ICONS_DIR, 'icon-maskable.svg'), master_mask, 1024)

# 3. Carregar masters
im_std = Image.open(master_std)
im_mask = Image.open(master_mask)

# Garantir RGBA
if im_std.mode != 'RGBA':
    im_std = im_std.convert('RGBA')
if im_mask.mode != 'RGBA':
    im_mask = im_mask.convert('RGBA')

# Se houver qualquer discrepância no tamanho da captura de janela, cortar/redimensionar exatamente para 1024
im_std = im_std.crop((0, 0, 1024, 1024))
im_mask = im_mask.crop((0, 0, 1024, 1024))

# 4. Gerar variações do ícone padrão
resolucoes_std = [
    (512, 'icon-512.png'),
    (192, 'icon-192.png'),
    (180, 'apple-touch-icon.png'),
    (144, 'icon-144.png'),
    (96, 'icon-96.png'),
    (72, 'icon-72.png'),
    (48, 'icon-48.png'),
    (32, 'favicon-32x32.png'),
    (16, 'favicon-16x16.png'),
]

for size, filename in resolucoes_std:
    resized = im_std.resize((size, size), Image.Resampling.LANCZOS)
    resized.save(os.path.join(ICONS_DIR, filename), format='PNG', optimize=True)
    print(f"[OK] {filename} ({size}x{size})")

# 5. Gerar icon-maskable-512.png
mask_512 = im_mask.resize((512, 512), Image.Resampling.LANCZOS)
mask_512.save(os.path.join(ICONS_DIR, 'icon-maskable-512.png'), format='PNG', optimize=True)
print("[OK] icon-maskable-512.png (512x512)")

# Limpar masters temporários
if os.path.exists(master_std):
    os.remove(master_std)
if os.path.exists(master_mask):
    os.remove(master_mask)

print("Todos os icones foram gerados com sucesso!")
