"""Build the deployable site.
   - index.html and public/index.html: the full page (Vercel serves public/)
   - vercel.json and _headers: security headers, with the exact SHA-256 of every inline script
   Cloud mode (accounts, workspaces, live saving) switches on when cloud.config.json exists at the repo root:
   {"url": "https://<project-ref>.supabase.co", "anonKey": "<public anon key>"}  (never the service_role key)
   python3 src/build.py --test-cloud   also writes tests/test-cloud.html for the account tests."""
import json, pathlib, sys
sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
from buildlib import assemble, script_hashes

root = pathlib.Path(__file__).resolve().parent.parent
cfg_file = root / 'cloud.config.json'
config = json.loads(cfg_file.read_text(encoding='utf-8')) if cfg_file.exists() else None
if config and ('service_role' in json.dumps(config) or 'secret' in json.dumps(config).lower()):
    raise SystemExit('cloud.config.json must contain the public anon key only, never a service_role or secret key')

body = assemble(str(root / 'src'), config)
page = ('<!doctype html>\n<html lang="fr">\n<head>\n<meta charset="utf-8">\n'
        '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n'
        '<meta name="description" content="Bilingual FR/EN project tracker: burndown, Gantt, budget, team workspaces and documents for any project">\n'
        '<style>[hidden]{display:none!important}img{max-width:100%}</style>\n</head>\n<body>\n' + body + '\n</body>\n</html>\n')
(root / 'index.html').write_text(page, encoding='utf-8')
(root / 'public').mkdir(exist_ok=True)
(root / 'public' / 'index.html').write_text(page, encoding='utf-8')

connect = "'none'" if not config else '%s %s' % (config['url'], config['url'].replace('https://', 'wss://'))
csp = ("default-src 'none'; script-src " + ' '.join(script_hashes(page)) + "; style-src 'unsafe-inline' https://fonts.googleapis.com; "
       "font-src https://fonts.gstatic.com; img-src 'self' data:; connect-src " + connect + "; base-uri 'none'; "
       "form-action 'none'; frame-ancestors 'none'")
headers = [
    {"key": "Content-Security-Policy", "value": csp},
    {"key": "X-Content-Type-Options", "value": "nosniff"},
    {"key": "Referrer-Policy", "value": "no-referrer"},
    {"key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()"},
    {"key": "Strict-Transport-Security", "value": "max-age=63072000; includeSubDomains"},
]
(root / 'vercel.json').write_text(json.dumps({"$schema": "https://openapi.vercel.sh/vercel.json", "framework": None, "buildCommand": "python3 src/build.py",
    "outputDirectory": "public", "cleanUrls": True, "headers": [{"source": "/(.*)", "headers": headers}]}, indent=2) + '\n')
(root / '_headers').write_text('/*\n' + ''.join(f'  {h["key"]}: {h["value"]}\n' for h in headers))
print(f'index.html {len(page)} bytes · cloud {"ON (" + config["url"] + ")" if config else "off (local demo)"} · CSP updated')

if '--test-cloud' in sys.argv:
    test = assemble(str(root / 'src'), {'url': 'https://abcdefghijkl.supabase.co', 'anonKey': 'eyJhbGciOiJIUzI1NiJ9.test-anon-key',
                                        'vendor': 'window.supabase = window.__fakeSupabase;'})
    (root / 'tests' / 'test-cloud.html').write_text(test, encoding='utf-8')
