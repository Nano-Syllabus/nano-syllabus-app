import re, sys, os, glob
os.chdir(os.path.dirname(os.path.abspath(__file__)))
M = {'dmSans': 'DM Sans', 'dmMono': 'DM Mono', 'manrope': 'Manrope', 'inter': 'Inter', 'poppins': 'Poppins', 'outfit': 'Outfit'}
tok = re.compile(r"(?<![\w-])(" + "|".join(M) + r")(?![\w-])")
def fam(m):
    return m.group(1) + tok.sub(lambda t: M[t.group(1)], m.group(2))
os.makedirs('fig', exist_ok=True)
for f in sorted(glob.glob('out/*.html')):
    h = open(f).read()
    h = re.sub(r'(font-family:\s*)([^;"}]*)', fam, h)
    # @font-face family names may be quoted with ' inside <style>
    h = re.sub(r"(font-family:\s*')([^']*)(')", lambda m: m.group(1) + tok.sub(lambda t: M[t.group(1)], m.group(2)) + m.group(3), h)
    # glyphs Figma's fallback fonts lack: give them a symbol font Figma has
    h = re.sub(r'>([^<]*?)([▶⏭⏯⏸⏵])', lambda m: '>' + m.group(1) + '<span style="font-family:\'Noto Sans Symbols 2\', \'DM Sans Fallback\'">' + m.group(2) + '</span>', h)
    open('fig/' + os.path.basename(f), 'w').write(h)
print(len(glob.glob('fig/*.html')))
