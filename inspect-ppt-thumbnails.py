import zipfile,xml.etree.ElementTree as E
z=zipfile.ZipFile('images/Paper-Thumbnails.pptx');ns={'p':'http://schemas.openxmlformats.org/presentationml/2006/main','a':'http://schemas.openxmlformats.org/drawingml/2006/main'}
slides=sorted([n for n in z.namelist() if n.startswith('ppt/slides/slide') and n.endswith('.xml')],key=lambda n:int(n.split('slide')[-1].split('.')[0]))
for n in slides:
 r=E.fromstring(z.read(n));print(n, 'texts:',[t.text for t in r.findall('.//a:t',ns)])
 for pic in r.findall('.//p:pic',ns):
  print(' PIC',E.tostring(pic,encoding='unicode')[:1800])
 print('groups',len(r.findall('.//p:grpSp',ns)))
