from pathlib import Path
import zipfile
root=Path(__file__).resolve().parent.parent
def package(name,prefix='',hub=False):
 with zipfile.ZipFile(root/name,'w',zipfile.ZIP_DEFLATED) as z:
  for f in (root/'dist').rglob('*'):
   if f.is_file():z.write(f,prefix+f.relative_to(root/'dist').as_posix())
  if hub:z.write(root/'site/edutech/index.html','edutech/index.html')
package('oracle-and-the-below-upload.zip')
package('edutech-upload.zip','edutech/oracle/',True)
print('Prepared game-only and edutech directory upload packages.')
