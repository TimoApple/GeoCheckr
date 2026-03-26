#!/usr/bin/env python3
"""
GeoCheckr — Card Front Image Generator (Pillow)
Generates high-res PNG card fronts for all 205 cities.
Supports ALL scripts via OTF/TTF fonts.
"""
import json, re, os
from PIL import Image, ImageDraw, ImageFont

# ── CONFIG ──
CARD_PX = 708  # 6cm at 300 DPI
DPI = 300
BG_COLOR = (0x33, 0x40, 0xca)  # #3340ca
TEXT_GREEN = (0xc6, 0xff, 0x00)  # #c6ff00
TEXT_DARK = (0x0a, 0x0b, 0x1f)   # #0a0b1f
BADGE_BG = (0x11, 0x12, 0x25)    # #111225 dark
BADGE_TEXT = (0xc6, 0xff, 0x00)  # #c6ff00 green like background
CORNER_RADIUS = 0  # NO rounded corners!

# ── FONTS ──
FONT_DIR = '/tmp'

# Font cache
_fonts = {}

def get_font(name, size):
    key = f"{name}_{size}"
    if key not in _fonts:
        _fonts[key] = ImageFont.truetype(name, size)
    return _fonts[key]

# Space Grotesk Bold for English
FONT_SG_BOLD = f'{FONT_DIR}/SpaceGrotesk-Bold.ttf'

# Script-specific fonts (Bold where available)
SCRIPT_FONTS = {
    'arabic': f'{FONT_DIR}/NotoSansArabic-Bold.ttf',
    'devanagari': f'{FONT_DIR}/NotoSansDevanagari-Bold.ttf',
    'bengali': f'{FONT_DIR}/NotoSansBengali-Bold.ttf',
    'thai': f'{FONT_DIR}/NotoSansThai-Bold.ttf',
    'hebrew': f'{FONT_DIR}/NotoSansHebrew-Bold.ttf',
    'georgian': f'{FONT_DIR}/NotoSansGeorgian-Regular.ttf',
    'armenian': f'{FONT_DIR}/NotoSansArmenian-Regular.ttf',
    'ethiopic': f'{FONT_DIR}/NotoSansEthiopic-Regular.ttf',
    'telugu': f'{FONT_DIR}/NotoSansTelugu-Regular.ttf',
    'gujarati': f'{FONT_DIR}/NotoSansGujarati-Regular.ttf',
    'tamil': f'{FONT_DIR}/NotoSansTamil-Regular.ttf',
    'khmer': f'{FONT_DIR}/NotoSansKhmer-Regular.ttf',
    'myanmar': f'{FONT_DIR}/NotoSansMyanmar-Regular.ttf',
    'sinhala': f'{FONT_DIR}/NotoSansSinhala-Regular.ttf',
    'cjk': f'{FONT_DIR}/NotoSansSC-Bold.otf',  # Chinese, Japanese, Korean!
    'korean': f'{FONT_DIR}/NotoSansKR-Bold.otf',
    'latin': f'{FONT_DIR}/NotoSans-Bold.ttf',  # Cyrillic, Greek too
}

def get_script_font(text):
    """Detect script and return font path."""
    for ch in text:
        cp = ord(ch)
        if 0xAC00 <= cp <= 0xD7AF or 0x1100 <= cp <= 0x11FF or 0x3130 <= cp <= 0x318F:
            if os.path.exists(SCRIPT_FONTS['korean']): return SCRIPT_FONTS['korean']
        if 0x4E00 <= cp <= 0x9FFF or 0x3400 <= cp <= 0x4DBF or 0xF900 <= cp <= 0xFAFF:
            if os.path.exists(SCRIPT_FONTS['cjk']): return SCRIPT_FONTS['cjk']
        if 0x3040 <= cp <= 0x309F or 0x30A0 <= cp <= 0x30FF:
            if os.path.exists(SCRIPT_FONTS['cjk']): return SCRIPT_FONTS['cjk']
        if 0x0600 <= cp <= 0x06FF or 0xFB50 <= cp <= 0xFDFF:
            if os.path.exists(SCRIPT_FONTS['arabic']): return SCRIPT_FONTS['arabic']
        if 0x0900 <= cp <= 0x097F:
            if os.path.exists(SCRIPT_FONTS['devanagari']): return SCRIPT_FONTS['devanagari']
        if 0x0980 <= cp <= 0x09FF:
            if os.path.exists(SCRIPT_FONTS['bengali']): return SCRIPT_FONTS['bengali']
        if 0x0E00 <= cp <= 0x0E7F:
            if os.path.exists(SCRIPT_FONTS['thai']): return SCRIPT_FONTS['thai']
        if 0x0590 <= cp <= 0x05FF:
            if os.path.exists(SCRIPT_FONTS['hebrew']): return SCRIPT_FONTS['hebrew']
        if 0x10A0 <= cp <= 0x10FF:
            if os.path.exists(SCRIPT_FONTS['georgian']): return SCRIPT_FONTS['georgian']
        if 0x0530 <= cp <= 0x058F:
            if os.path.exists(SCRIPT_FONTS['armenian']): return SCRIPT_FONTS['armenian']
        if 0x1200 <= cp <= 0x137F:
            if os.path.exists(SCRIPT_FONTS['ethiopic']): return SCRIPT_FONTS['ethiopic']
        if 0x0C00 <= cp <= 0x0C7F:
            if os.path.exists(SCRIPT_FONTS['telugu']): return SCRIPT_FONTS['telugu']
        if 0x0A80 <= cp <= 0x0AFF:
            if os.path.exists(SCRIPT_FONTS['gujarati']): return SCRIPT_FONTS['gujarati']
        if 0x0B80 <= cp <= 0x0BFF:
            if os.path.exists(SCRIPT_FONTS['tamil']): return SCRIPT_FONTS['tamil']
        if 0x1780 <= cp <= 0x17FF:
            if os.path.exists(SCRIPT_FONTS['khmer']): return SCRIPT_FONTS['khmer']
        if 0x1000 <= cp <= 0x109F:
            if os.path.exists(SCRIPT_FONTS['myanmar']): return SCRIPT_FONTS['myanmar']
        if 0x0D80 <= cp <= 0x0DFF:
            if os.path.exists(SCRIPT_FONTS['sinhala']): return SCRIPT_FONTS['sinhala']
    return SCRIPT_FONTS['latin']


def draw_rounded_rect(draw, xy, radius, fill):
    """Draw a rounded rectangle."""
    x0, y0, x1, y1 = xy
    draw.rectangle([x0 + radius, y0, x1 - radius, y1], fill=fill)
    draw.rectangle([x0, y0 + radius, x1, y1 - radius], fill=fill)
    draw.pieslice([x0, y0, x0 + 2*radius, y0 + 2*radius], 180, 270, fill=fill)
    draw.pieslice([x1 - 2*radius, y0, x1, y0 + 2*radius], 270, 360, fill=fill)
    draw.pieslice([x0, y1 - 2*radius, x0 + 2*radius, y1], 90, 180, fill=fill)
    draw.pieslice([x1 - 2*radius, y1 - 2*radius, x1, y1], 0, 90, fill=fill)


def generate_card_front(loc, out_path):
    """Generate a single card front PNG — exactly matching Timo's specs."""
    city = loc['city']
    local = LOCAL_NAMES.get(city, city)
    lid = f"{loc['id']:03d}"

    # Create image — no rounded corners
    img = Image.new('RGBA', (CARD_PX, CARD_PX), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Background — straight rectangle, no rounded corners
    draw.rectangle([0, 0, CARD_PX, CARD_PX], fill=BG_COLOR)

    # City name (English) — Space Grotesk Bold, centered
    if len(city) > 14:
        city_size = 56
    elif len(city) > 10:
        city_size = 63
    else:
        city_size = 74

    city_font = get_font(FONT_SG_BOLD, city_size)
    bbox = draw.textbbox((0, 0), city, font=city_font)
    tw = bbox[2] - bbox[0]
    city_x = (CARD_PX - tw) / 2
    city_y = CARD_PX * 0.30  # centered vertically
    draw.text((city_x, city_y), city, fill=TEXT_GREEN, font=city_font)

    # Local name — script-specific bold font, RIGHT BELOW city name
    local_font_path = get_script_font(local)
    if len(local) > 14:
        local_size = 48
    elif len(local) > 10:
        local_size = 56
    else:
        local_size = 74

    local_font = get_font(local_font_path, local_size)
    bbox2 = draw.textbbox((0, 0), local, font=local_font)
    lw = bbox2[2] - bbox2[0]
    local_x = (CARD_PX - lw) / 2
    local_y = city_y + city_size + 10  # 10px gap — close together
    draw.text((local_x, local_y), local, fill=TEXT_DARK, font=local_font)

    # ID badge — pill shape, sized to text, perfectly centered
    badge_text = f"#{lid}"
    badge_font = get_font(FONT_SG_BOLD, 24)
    bbox3 = draw.textbbox((0, 0), badge_text, font=badge_font)
    btw = bbox3[2] - bbox3[0]
    bth = bbox3[3] - bbox3[1]
    pad_x = 24
    pad_y = 12
    badge_w = btw + 2 * pad_x
    badge_h = bth + 2 * pad_y
    badge_x = (CARD_PX - badge_w) / 2
    badge_y = CARD_PX - 80
    # Pill = rounded rect with radius = height/2
    draw.rounded_rectangle([badge_x, badge_y, badge_x + badge_w, badge_y + badge_h],
                          radius=badge_h // 2, fill=BADGE_BG)
    # Text centered in pill
    draw.text((badge_x + pad_x, badge_y + pad_y), badge_text, fill=BADGE_TEXT, font=badge_font)

    # Save
    img.save(out_path, 'PNG', dpi=(DPI, DPI))


# ── LOAD DATA ──
# Load LOCAL_NAMES from PDF generator
with open('/home/donatello/.openclaw/workspace/GeoCheckr_App/scripts/generate_cards_pdf.py') as f:
    pdf_content = f.read()
match_ln = re.search(r'(LOCAL_NAMES\s*=\s*\{.*?\n\})', pdf_content, re.DOTALL)
if match_ln:
    exec(match_ln.group(1))
else:
    LOCAL_NAMES = {}

# Load locations
with open('/home/donatello/.openclaw/workspace/GeoCheckr_App/src/data/panoramaLocations.ts') as f:
    content = f.read()
match = re.search(r'export const panoramaLocations.*?=\s*(\[[\s\S]*?\]);', content)
arr_str = match.group(1)
arr_str = re.sub(r',\s*}', '}', arr_str)
arr_str = re.sub(r',\s*]', ']', arr_str)
locations = json.loads(arr_str)


if __name__ == '__main__':
    out_dir = '/tmp/card_fronts'
    os.makedirs(out_dir, exist_ok=True)

    for loc in locations:
        lid = f"{loc['id']:03d}"
        out_path = os.path.join(out_dir, f"front_{lid}.png")
        generate_card_front(loc, out_path)
        if loc['id'] % 50 == 0:
            print(f"  Generated {loc['id']}/205...")

    print(f"✅ Generated {len(locations)} card fronts in {out_dir}")
