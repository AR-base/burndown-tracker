"""Build index.html (standalone page) from src/ and refresh the CSP script hashes in vercel.json and _headers."""
import hashlib, base64, re, json, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
src = (root / 'src' / 'app.html').read_text(encoding='utf-8')
for k, f in [('CORE', 'core.js'), ('IO', 'io.js'), ('DOCGEN', 'docgen.js'), ('SAMPLE', 'sample.js'), ('APP', 'app.js')]:
    src = src.replace('/*%s*/' % k, (root / 'src' / f).read_text(encoding='utf-8').replace('</script', '<\\/script'))
page = ('<!doctype html>\n<html lang="fr">\n<head>\n<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
        '<meta name="description" content="Bilingual FR/EN burndown and Gantt tracker for any project">\n'
        '<style>[hidden]{display:none!important}img{max-width:100%}</style>\n</head>\n<body>\n' + src + '\n</body>\n</html>\n')
(root / 'index.html').write_text(page, encoding='utf-8')
# Vercel serves the 'public' folder (see outputDirectory in vercel.json)
(root / 'public').mkdir(exist_ok=True)
(root / 'public' / 'index.html').write_text(page, encoding='utf-8')
hashes = ' '.join("'sha256-%s'" % base64.b64encode(hashlib.sha256(m.encode()).digest()).decode()
                  for m in re.findall(r'<script>(.*?)</script>', page, re.S))
csp = ("default-src 'none'; script-src " + hashes + "; style-src 'unsafe-inline' https://fonts.googleapis.com; "
       "font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src 'none'; base-uri 'none'; "
       "form-action 'none'; frame-ancestors 'none'")
headers = [
    {"key": "Content-Security-Policy", "value": csp},
    {"key": "X-Content-Type-Options", "value": "nosniff"},
    {"key": "Referrer-Policy", "value": "no-referrer"},
    {"key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()"},
    {"key": "Strict-Transport-Security", "value": "max-age=63072000; includeSubDomains"},
]
(root / 'vercel.json').write_text(json.dumps({"$schema": "https://openapi.vercel.sh/vercel.json", "framework": None, "buildCommand": "python3 src/build.py", "outputDirectory": "public", "cleanUrls": True, "headers": [{"source": "/(.*)", "headers": headers}]}, indent=2) + '\n')
(root / '_headers').write_text('/*\n' + ''.join(f'  {h["key"]}: {h["value"]}\n' for h in headers))
print(f'index.html {len(page)} bytes · CSP updated')
