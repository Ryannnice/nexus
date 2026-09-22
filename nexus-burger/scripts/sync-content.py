"""Read the original site without modifying it; exclude non-public HTML comments."""
from pathlib import Path
import re
import json
import html
import shutil

PROJECT = Path(__file__).resolve().parents[1]
ROOT = PROJECT.parent
source = (ROOT / 'index.html').read_text(encoding='utf-8')
visible = re.sub(r'<!--.*?-->', '', source, flags=re.S)

def plain(value):
    return html.unescape(re.sub(r'<[^>]+>', '', value)).strip()

resources = []
for group in re.split(r'<div class="res-group" data-cat="([^"]+)"', visible)[1:][::2]:
    section = visible.split(f'<div class="res-group" data-cat="{group}"', 1)[1].split('<div class="res-group"', 1)[0]
    for card in re.findall(r'<article class="card res-card">(.*?)</article>', section, re.S):
        field = lambda cls: plain(re.search(r'class="' + cls + r'">(.*?)</', card, re.S).group(1))
        resources.append({
            'id': f'{group}-{sum(r["category"] == group for r in resources) + 1:02d}',
            'category': group, 'title': field('res-title'), 'source': field('res-source'),
            'type': field('badge'),
            'url': html.unescape(re.search(r'class="ghost-link" href="([^"]+)"', card).group(1)),
        })

colors = ['#80518c', '#263e73', '#365ca0', '#315496', '#346da2', '#307086', '#ab3e48', '#a9313c', '#34729a', '#bc6d35', '#ba3335', '#cd8640', '#a54045', '#438380', '#345073', '#903d76', '#4976aa', '#43779a', '#963267', '#a64736', '#a47b40', '#39685b']
schools = []
for i, card in enumerate(re.findall(r'<article class="card has-corner member-card">(.*?)</article>', visible, re.S)):
    abbr = plain(re.search(r'class="member-abbr">(.*?)</', card).group(1))
    name = plain(re.search(r'class="member-cn">(.*?)</', card).group(1))
    logo = re.search(r'class="member-logo" src="([^"]+)"', card).group(1)
    count = re.search(r'class="member-count">[×x](\d+)', card)
    dest = PROJECT / 'public' / 'logos' / Path(logo).name
    dest.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(ROOT / logo, dest)
    schools.append({'id': f'school-{i + 1:02d}', 'abbr': abbr, 'name': name,
                    'count': int(count.group(1)) if count else 1,
                    'logo': 'logos/' + dest.name, 'color': colors[i % len(colors)]})

out = PROJECT / 'src' / 'data' / 'content.json'
out.parent.mkdir(parents=True, exist_ok=True)
out.write_text(json.dumps({'resources': resources, 'schools': schools}, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
print(f'Synced {len(resources)} resources, {len(schools)} active institutions/campuses, {sum(s["count"] for s in schools)} members. Original files untouched.')
