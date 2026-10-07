from pathlib import Path
from PIL import Image, ImageOps
import re
p=Path('research-group-site.html'); h=p.read_text(encoding='utf-8')
start=h.index('    const dataPaperCards = ['); end=h.index('function renderPublications()',start)
section=h[start:end]
out=Path('assets/publications');out.mkdir(exist_ok=True)
stats=[0,0];missing=[]
def fix(m):
    key,raw=m.group(1),m.group(2)
    source=raw.replace('\\\\','/').replace('\\','/')
    path=Path(source)
    if not path.is_file():
        missing.append(source)
        if key=='pdfFile':return 'pdfFile: ""'
        path=Path('images/coming-soon.png')
    if key=='pdfFile':return f'pdfFile: "{source}"'
    im=ImageOps.exif_transpose(Image.open(path)).convert('RGB')
    im.thumbnail((800,600),Image.Resampling.LANCZOS)
    slug=re.sub(r'[^a-z0-9]+','-',path.stem.lower()).strip('-')
    dest=out/(slug+'.webp'); im.save(dest,'WEBP',quality=85,method=6)
    stats[0]+=path.stat().st_size;stats[1]+=dest.stat().st_size
    return f'graphicalAbstract: "{dest.as_posix()}"'
# Ignore the historical commented-out example.
section=re.sub(r'/\*.*?\*/','',section,flags=re.S)
section=re.sub(r'(graphicalAbstract|pdfFile):\s*"([^"\n]*)"',fix,section)
h=h[:start]+section+h[end:]
h=h.replace('alt="${paper.paperShortInfo}">','alt="${paper.paperShortInfo}" loading="lazy" decoding="async">')
p.write_text(h,encoding='utf-8')
print('Missing assets:\n'+'\n'.join(missing));print('Thumbnail bytes:',stats)
for path in re.findall(r'(?:graphicalAbstract|pdfFile):\s*"([^"]+)"',section):
    assert Path(path).is_file(),path
scripts=re.findall(r'<script>(.*?)</script>',h,re.S)
Path('verify-publications.js').write_text('\n'.join(scripts),encoding='utf-8')
