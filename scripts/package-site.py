from pathlib import Path
import zipfile
root = Path(__file__).resolve().parent.parent
with zipfile.ZipFile(root / 'oracle-and-the-below-upload.zip', 'w', zipfile.ZIP_DEFLATED) as archive:
    for file in (root / 'dist').rglob('*'):
        if file.is_file():
            archive.write(file, file.relative_to(root / 'dist').as_posix())
print('Prepared game-only upload package. Production deploys through Vercel.')
