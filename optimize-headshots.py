from pathlib import Path
from PIL import Image, ImageOps, ImageDraw
import re, unicodedata
root=Path.cwd()
folder=root/'assets/team'
folder.mkdir(exist_ok=True)
html_path=root/'research-group-site.html'
html=html_path.read_text(encoding='utf-8')
previews=[]
total_before=total_after=0
for path in sorted((root/'team head shots').iterdir()):
    if path.suffix.lower() not in ['.jpg','.jpeg','.png','.webp']: continue
    name=path.stem.replace('_',' ').replace('-',' ')
    name={'Daniel Lopes':'Daniel Simões Lopes','David Pinto':'David Pinto, MD','Rafaela Timoteo':'Rafaela Timóteo'}.get(name,name)
    if f'<div class="team-name">{name}</div>' not in html:
        print(f'Skipping unmatched headshot: {path.name}')
        continue
    slug=unicodedata.normalize('NFKD',path.stem.replace('_',' ').replace('-',' ')).encode('ascii','ignore').decode().lower().replace(' ','-')
    im=ImageOps.exif_transpose(Image.open(path)).convert('RGB')
    w,h=im.size
    # Carlos's source has extra space above his head; crop around his face and shoulders.
    if slug=='david-pinto':
        # Center the face rather than the original off-center portrait.
        im=im.crop((0, 0, 370, 370))
    elif slug=='carlos-silva':
        side=int(w*.80); cx=w*.5; cy=h*.65
        left=max(0,min(w-side,int(cx-side/2))); top=max(0,min(h-side,int(cy-side/2)))
        im=im.crop((left,top,left+side,top+side))
    else:
        side=min(w,h)
        top=int((h-side)*.30)
        im=im.crop(((w-side)//2,top,(w+side)//2,top+side))
    im.thumbnail((216,216),Image.Resampling.LANCZOS)
    out=folder/(slug+'.webp')
    im.save(out,'WEBP',quality=85,method=6)
    pattern=r'<img\b[^>]*class="team-avatar"[^>]*\s*/>\s*(<div class="team-name">'+re.escape(name)+r'</div>)'
    replacement=f'<img src="assets/team/{slug}.webp" alt="{name}" class="team-avatar" width="72" height="72" loading="lazy" decoding="async" />\n        '+r'\1'
    html,count=re.subn(pattern,replacement,html)
    assert count==1,(name,count)
    total_before+=path.stat().st_size;total_after+=out.stat().st_size
    previews.append((name,im.copy()))
    print(f'{name}: {w}x{h} -> {im.width}x{im.height}, {out.stat().st_size} bytes')
html=html.replace('  object-fit: cover;\n  border: 2px solid var(--cyan);','  object-fit: cover;\n  object-position: center;\n  flex-shrink: 0;\n  border: 2px solid var(--cyan);')
html_path.write_text(html,encoding='utf-8')
sheet=Image.new('RGB',(180*len(previews),210),'#151527'); d=ImageDraw.Draw(sheet)
for i,(name,im) in enumerate(previews):
    im=im.resize((144,144),Image.Resampling.LANCZOS)
    mask=Image.new('L',(144,144));ImageDraw.Draw(mask).ellipse((0,0,143,143),fill=255)
    sheet.paste(im,(i*180+18,15),mask)
    d.text((i*180+10,175),name,fill='white')
sheet.save(root/'assets/team-contact-sheet.jpg')
print(f'Total: {total_before} -> {total_after} bytes ({100*(1-total_after/total_before):.1f}% reduction)')
