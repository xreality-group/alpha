from pathlib import Path
import re
p=Path('research-group-site.html')
h=p.read_text(encoding='utf-8')
card='''
      <article class="team-card-compact">
        <img src="assets/team/rafaela-timoteo.webp" alt="Rafaela Timóteo" class="team-avatar" width="72" height="72" loading="lazy" decoding="async" />
        <div class="team-name">Rafaela Timóteo</div>
        <div class="team-position">Ph.D. Candidate</div>
        <span class="team-theme-tag">Medical XR</span>
      </article>
'''
if '<div class="team-name">Rafaela Timóteo</div>' not in h:
    h=re.sub(r'(<article class="team-card-compact">\s*<img[^>]+>\s*<div class="team-name">David Pinto, MD</div>.*?</article>)',lambda m:m.group(1)+'\n'+card,h,flags=re.S)
p.write_text(h,encoding='utf-8')
p=Path('optimize-headshots.py');s=p.read_text(encoding='utf-8')
s=s.replace("name=path.stem.replace('_',' ')","name=path.stem.replace('_',' ').replace('-',' ')\n    name={'Daniel Lopes':'Daniel Simões Lopes','David Pinto':'David Pinto, MD','Rafaela Timoteo':'Rafaela Timóteo'}.get(name,name)\n    if f'<div class=\"team-name\">{name}</div>' not in html:\n        print(f'Skipping unmatched headshot: {path.name}')\n        continue")
s=s.replace("slug=unicodedata.normalize('NFKD',name)","slug=unicodedata.normalize('NFKD',path.stem.replace('_',' ').replace('-',' '))")
p.write_text(s,encoding='utf-8')
