"""Build the small, self-hosted menu font from the OFL Noto Sans SC source."""
import io
import re
from pathlib import Path
from urllib.request import urlopen

from fontTools import subset
from fontTools.ttLib import TTFont
from fontTools.varLib.instancer import instantiateVariableFont

root = Path(__file__).resolve().parent.parent
base = "https://raw.githubusercontent.com/google/fonts/main/ofl/notosanssc/"
source = (root / "src/data/index.ts").read_text(encoding="utf-8")
source += (root / "src/App.tsx").read_text(encoding="utf-8")
labels = "".join(re.findall(r"[\u4e00-\u9fff]", source))
labels += "0123456789 /"
font = TTFont(io.BytesIO(urlopen(base + "NotoSansSC%5Bwght%5D.ttf").read()))
instantiateVariableFont(font, {"wght": 600}, inplace=True)
options = subset.Options()
subsetter = subset.Subsetter(options=options)
subsetter.populate(text=labels)
subsetter.subset(font)
names = {1: 'Nexus Menu', 2: 'SemiBold', 3: 'NexusMenu-Semibold', 4: 'Nexus Menu SemiBold', 6: 'NexusMenu-Semibold', 16: 'Nexus Menu', 17: 'SemiBold'}
for record in font['name'].names:
    if record.nameID in names:
        record.string = names[record.nameID].encode(record.getEncoding())
font.flavor = "woff2"
folder = root / "public/fonts"
font.save(folder / "Nexus-Menu-Semibold.woff2")
(folder / "NotoSansSC-OFL.txt").write_bytes(urlopen(base + "OFL.txt").read())
print(f"Saved menu font: {(folder / 'Nexus-Menu-Semibold.woff2').stat().st_size} bytes")
