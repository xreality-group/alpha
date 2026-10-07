from pathlib import Path
from PIL import Image,ImageDraw
import zipfile,xml.etree.ElementTree as E, posixpath,io,re,json
root=Path.cwd();z=zipfile.ZipFile(root/'images/Paper-Thumbnails.pptx')
ns={'p':'http://schemas.openxmlformats.org/presentationml/2006/main','a':'http://schemas.openxmlformats.org/drawingml/2006/main','r':'http://schemas.openxmlformats.org/officeDocument/2006/relationships'}
def rels(path):
 return {e.attrib['Id']:posixpath.normpath(posixpath.join(posixpath.dirname(path),e.attrib['Target'])) for e in E.fromstring(z.read(posixpath.dirname(path)+'/_rels/'+posixpath.basename(path)+'.rels'))}
pr=rels('ppt/presentation.xml');pres=E.fromstring(z.read('ppt/presentation.xml'))
slides=[pr[e.attrib['{'+ns['r']+'}id']] for e in pres.findall('p:sldIdLst/p:sldId',ns)]
htmlpath=root/'research-group-site.html';html=htmlpath.read_text(encoding='utf-8')
start=html.index('const dataPaperCards');end=html.index('function renderPublications',start)
section=html[start:end]
titles=re.findall(r'paperShortInfo: "([^"]+)"',section)
assert len(titles)==11 and len(slides)>=12
slugs=['non-gon','arfood','digital-twins','ghost-in-the-vr-shell','xr-numpads','your-face-your-anatomy','implantigraph','breastplus','interact-2023','dentify-2','locomotivr']
out=root/'assets/publications/ppt';out.mkdir(parents=True,exist_ok=True)
W,H=960,600;left,top,fw,fh=1600200,1752600,5760000,3600000
paths=[];thumbs=[]
for index,path in enumerate(slides[1:12]):
 s=E.fromstring(z.read(path));rs=rels(path);canvas=Image.new('RGBA',(W,H),'white')
 # The deck's groups have identity transforms; assert rather than silently misplacing content.
 for x in s.findall('.//p:grpSpPr/a:xfrm',ns):
  off=x.find('a:off',ns);ch=x.find('a:chOff',ns);ext=x.find('a:ext',ns);ce=x.find('a:chExt',ns)
  if off is not None and ch is not None:assert off.attrib==ch.attrib and ext.attrib==ce.attrib
 for pic in s.findall('.//p:pic',ns):
  x=pic.find('p:spPr/a:xfrm',ns);assert not x.get('rot')
  off=x.find('a:off',ns);ext=x.find('a:ext',ns)
  px=round((int(off.get('x'))-left)/fw*W);py=round((int(off.get('y'))-top)/fh*H)
  pw=round(int(ext.get('cx'))/fw*W);ph=round(int(ext.get('cy'))/fh*H)
  blip=pic.find('p:blipFill/a:blip',ns);im=Image.open(io.BytesIO(z.read(rs[blip.get('{'+ns['r']+'}embed')]))).convert('RGBA')
  crop=pic.find('p:blipFill/a:srcRect',ns)
  if crop is not None:
   l,t,r,b=[int(crop.get(k,'0'))/100000 for k in ['l','t','r','b']]
   im=im.crop((round(l*im.width),round(t*im.height),round((1-r)*im.width),round((1-b)*im.height)))
  im=im.resize((pw,ph),Image.Resampling.LANCZOS)
  canvas.alpha_composite(im,(px,py))
 dest=out/(slugs[index]+'.png');canvas.convert('RGB').save(dest,optimize=True)
 paths.append(dest.relative_to(root).as_posix());thumbs.append(canvas.convert('RGB'))
 print(index+2,slugs[index],len(s.findall('.//p:pic',ns)),dest.stat().st_size)
i=iter(paths);section=re.sub(r'graphicalAbstract: "[^"]+"',lambda m:'graphicalAbstract: "'+next(i)+'"',section)
html=html[:start]+section+html[end:];htmlpath.write_text(html,encoding='utf-8')
sheet=Image.new('RGB',(4*320,3*225),'#dddddd');d=ImageDraw.Draw(sheet)
for i,im in enumerate(thumbs):
 x=(i%4)*320;y=(i//4)*225;sheet.paste(im.resize((320,200)),(x,y));d.text((x+5,y+203),f'{i+2}: {slugs[i]}',fill='black')
sheet.save(root/'assets/publications/ppt-extraction-preview.jpg')
(out/'mapping.json').write_text(json.dumps([{'slide':i+2,'publication':t,'thumbnail':paths[i]} for i,t in enumerate(titles)],ensure_ascii=False,indent=2),encoding='utf-8')
