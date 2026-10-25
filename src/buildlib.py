"""Shared assembly of the single-page tracker (used by build.py)."""
import hashlib, base64, re, json, sys, os

PARTS = [('CORE', 'core.js'), ('IO', 'io.js'), ('DOCGEN', 'docgen.js'), ('BUDGET', 'budget.js'), ('PM', 'pm.js'), ('KB', 'kb.js'), ('GEN', 'generator.js'),
         ('SAMPLE', 'sample.js'), ('BRAIN', 'brain.js'), ('PMUI', 'pm-ui.js'), ('CLOUD', 'cloud.js'), ('CLOUDUI', 'cloud-ui.js'), ('APP', 'app.js')]
URL_RE = re.compile(r'^https://[a-z0-9-]{6,40}\.supabase\.co$')
KEY_RE = re.compile(r'^[A-Za-z0-9._-]{20,1200}$')

def inline(js):
    return js.replace('</script', '<\\/script')

def assemble(base, config=None):
    src = open(os.path.join(base, 'app.html'), encoding='utf-8').read()
    for k, f in PARTS:
        src = src.replace('/*%s*/' % k, inline(open(os.path.join(base, f), encoding='utf-8').read()))
    cloud = ''
    if config:
        if not URL_RE.match(config['url']) or not KEY_RE.match(config['anonKey']):
            raise SystemExit('cloud config rejected: expected https://<ref>.supabase.co and a public anon key')
        cfg = json.dumps({'url': config['url'], 'anonKey': config['anonKey']}).replace('</', '<\\/')
        vendor = config.get('vendor') or open(os.path.join(base, 'vendor', 'supabase.js'), encoding='utf-8').read()
        cloud = '<script>const CLOUD_CONFIG = %s;</script>\n<script>%s</script>' % (cfg, inline(vendor))
    return src.replace('<!--CLOUDCFG-->', cloud)

def script_hashes(html):
    return ["'sha256-%s'" % base64.b64encode(hashlib.sha256(m.encode('utf-8')).digest()).decode() for m in re.findall(r'<script>(.*?)</script>', html, re.S)]

