import urllib.request
import re
from fontTools.ttLib import TTFont
import io

req = urllib.request.Request('https://fonts.googleapis.com/css2?family=Google+Symbols:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200', headers={'User-Agent': 'Mozilla/4.0'})
css = urllib.request.urlopen(req).read().decode('utf-8')
ttf_url = re.search(r'url\((https://[^\)]+\.ttf)\)', css).group(1)
ttf_data = urllib.request.urlopen(ttf_url).read()
font = TTFont(io.BytesIO(ttf_data))

gsub = font['GSUB'].table
found = False
for lookup in gsub.LookupList.Lookup:
    for subtable in lookup.SubTable:
        if hasattr(subtable, 'ligatures'):
            for first, ligs in subtable.ligatures.items():
                for lig in ligs:
                    if lig.LigGlyph == 'settings_2':
                        chars = first + ''.join(lig.Component)
                        print(f"Found ligature for settings_2: '{chars}' -> '{lig.LigGlyph}'")
                        found = True
if not found:
    print("No ligature found for settings_2 directly via ligatures")
