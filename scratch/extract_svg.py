import urllib.request
import re
from fontTools.ttLib import TTFont
import io

req = urllib.request.Request('https://fonts.googleapis.com/css2?family=Google+Symbols:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200', headers={'User-Agent': 'Mozilla/4.0'})
css = urllib.request.urlopen(req).read().decode('utf-8')
ttf_url = re.search(r'url\((https://[^\)]+\.ttf)\)', css).group(1)
ttf_data = urllib.request.urlopen(ttf_url).read()
font = TTFont(io.BytesIO(ttf_data))
glyph_set = font.getGlyphSet()
from fontTools.pens.svgPathPen import SVGPathPen
pen = SVGPathPen(glyph_set)
glyph_set['settings_2'].draw(pen)
d = pen.getCommands()
svg = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 960" fill="currentColor"><path transform="translate(0, 800) scale(1, -1)" d="{d}"/></svg>'
with open('scratch/settings_2.svg', 'w') as f:
    f.write(svg)
print('Saved scratch/settings_2.svg, length:', len(d))
