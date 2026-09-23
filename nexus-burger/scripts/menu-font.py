"""Subset the OFL ZCOOL KuaiLe font for all public site copy, not private notes."""
import io
from pathlib import Path
from urllib.request import urlopen
from fontTools import subset
from fontTools.ttLib import TTFont

root = Path(__file__).resolve().parent.parent
base = 'https://raw.githubusercontent.com/google/fonts/main/ofl/zcoolkuaile/'
source = ''.join(path.read_text(encoding='utf-8') for path in (root / 'src').rglob('*')
                 if path.suffix in {'.tsx', '.ts', '.json'})
source += (root / 'public/credits.html').read_text(encoding='utf-8')
source += ''.join(chr(n) for n in range(32, 127)) + '↗…×·'
font = TTFont(io.BytesIO(urlopen(base + 'ZCOOLKuaiLe-Regular.ttf').read()))
options = subset.Options()
subsetter = subset.Subsetter(options=options)
subsetter.populate(text=source)
subsetter.subset(font)
names = {1: 'Nexus Round', 2: 'Regular', 3: 'NexusRound-Regular', 4: 'Nexus Round Regular', 6: 'NexusRound-Regular', 16: 'Nexus Round', 17: 'Regular'}
for record in font['name'].names:
    if record.nameID in names:
        record.string = names[record.nameID].encode(record.getEncoding())
font.flavor = 'woff2'
folder = root / 'public/fonts'
font.save(folder / 'Nexus-Round.woff2')
(folder / 'ZCOOLKuaiLe-OFL.txt').write_bytes(urlopen(base + 'OFL.txt').read())
print(f"Saved rounded font: {(folder / 'Nexus-Round.woff2').stat().st_size} bytes")
