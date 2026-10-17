# Cor de fundo do ícone do aplicativo (pedido de 17/10/2026: “azul mais vivo, mais
# diferente do ícone do app de medicamentos”, que é azul-marinho #16325C).
# O ardósia #2F4655 passa a azul vivo #126AE0 (texto branco 5,0:1). Recolore os PNG
# (icon-192, icon-512, icon-maskable-512, apple-touch-icon e o apple-touch-icon
# embutido no index.html) preservando o desenho branco e a suavização das bordas;
# troca também o favicon SVG embutido e a theme_color do manifesto.
# Idempotente. Uso: python3 scripts/icones-cor.py
import base64, io, json, re, sys
from pathlib import Path
from PIL import Image

RAIZ = Path(__file__).resolve().parent.parent
VELHA, NOVA = (0x2F, 0x46, 0x55), (0x12, 0x6A, 0xE0)
NOVA_HEX = '#%02X%02X%02X' % NOVA


def recolore(im):
    im = im.convert('RGBA')
    w, h = im.size
    fundo = im.getpixel((w // 2, 8))[:3]
    if fundo == NOVA:
        return None
    if fundo != VELHA:
        sys.exit('fundo inesperado %s' % (fundo,))
    px = im.load()
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            if not a:
                continue
            # fração de branco sobre o fundo antigo (média dos três canais)
            t = sum((c - v) / (255 - v) for c, v in zip((r, g, b), VELHA)) / 3
            t = min(1, max(0, t))
            px[x, y] = tuple(round(n + t * (255 - n)) for n in NOVA) + (a,)
    return im


for nome in ('icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png'):
    arq = RAIZ / nome
    im = recolore(Image.open(arq))
    if im:
        im.save(arq, optimize=True)
        print('recolorido', nome)

idx = RAIZ / 'index.html'
s = idx.read_text(encoding='utf-8')
m = re.search(r'(<link rel="apple-touch-icon" href="data:image/png;base64,)([^"]+)(")', s)
im = recolore(Image.open(io.BytesIO(base64.b64decode(m.group(2)))))
if im:
    buf = io.BytesIO()
    im.save(buf, 'PNG', optimize=True)
    s = s[:m.start(2)] + base64.b64encode(buf.getvalue()).decode() + s[m.end(2):]
    print('recolorido apple-touch-icon embutido')
s = s.replace("rx='14' fill='%232f4655'", "rx='14' fill='%23" + NOVA_HEX[1:] + "'")
idx.write_text(s, encoding='utf-8')

man = RAIZ / 'manifest.webmanifest'
d = json.loads(man.read_text(encoding='utf-8'))
if d['theme_color'] != NOVA_HEX:
    d['theme_color'] = NOVA_HEX
    man.write_text(json.dumps(d, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print('ícones em', NOVA_HEX)
