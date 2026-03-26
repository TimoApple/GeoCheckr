#!/usr/bin/env python3
"""
GeoCheckr QR City Cards — Printable PDF Generator (V2)
205 cards, 6cm × 6cm, A4 pages, front + back

TIMO'S SPECS:
- Front (City Name): bg #3340ca, city in Space Grotesk Bold 21pt #c6ff00, local in Noto Sans Bold 21pt #0a0b1f
- Back (QR Code): bg #c6ff00, QR in #3340ca, 0.5cm margin
"""

import json, re, hashlib, os, sys, math
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm, cm
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont

# ── CONFIG ──
CARD_SIZE = 6 * cm  # 6cm × 6cm
PAGE_W, PAGE_H = A4  # 210 × 297 mm
MARGIN_X = 15 * mm
MARGIN_Y_TOP = 20 * mm
MARGIN_Y_BOT = 15 * mm

# Colors (TIMO'S NEW SPECS)
C_BG_DARK = (0x11/255, 0x12/255, 0x25/255)     # #111225 — app bg (not used on cards)
C_BLUE = (0x33/255, 0x40/255, 0xca/255)          # #3340ca — accent blue
C_GREEN = (0xc6/255, 0xff/255, 0x00/255)          # #c6ff00 — neon green
C_DARK = (0x0a/255, 0x0b/255, 0x1f/255)           # #0a0b1f — dark text
C_WHITE = (0xf5/255, 0xf5/255, 0xf0/255)          # #f5f5f0 — white (secondary)

# Grid
COLS = 3
ROWS = 4
CARDS_PER_PAGE = COLS * ROWS  # 12
CARD_GAP = 2 * mm  # small gap between cards so they don't touch

# ── FONTS ──
FONT_DIR = '/tmp'
pdfmetrics.registerFont(TTFont('SpaceGrotesk', f'{FONT_DIR}/SpaceGrotesk-Regular.ttf'))
pdfmetrics.registerFont(TTFont('SpaceGrotesk-Bold', f'{FONT_DIR}/SpaceGrotesk-Bold.ttf'))
pdfmetrics.registerFont(TTFont('SpaceGrotesk-SemiBold', f'{FONT_DIR}/SpaceGrotesk-SemiBold.ttf'))
pdfmetrics.registerFont(TTFont('NotoSans', f'{FONT_DIR}/NotoSans-Regular.ttf'))
pdfmetrics.registerFont(TTFont('NotoSans-Bold', f'{FONT_DIR}/NotoSans-Bold.ttf'))

# Script-specific Noto Sans fonts
SCRIPT_FONTS = {}
def _reg(name, path):
    try:
        pdfmetrics.registerFont(TTFont(name, path))
        SCRIPT_FONTS[name] = True
    except Exception: pass

_reg('NotoSansSC', f'{FONT_DIR}/NotoSansSC-VF.ttf')
_reg('NotoSansSC-Bold', f'{FONT_DIR}/NotoSansSC-Bold.ttf')
_reg('NotoSansArabic', f'{FONT_DIR}/NotoSansArabic-Regular.ttf')
_reg('NotoSansDevanagari', f'{FONT_DIR}/NotoSansDevanagari-Regular.ttf')
_reg('NotoSansThai', f'{FONT_DIR}/NotoSansThai-Regular.ttf')
_reg('NotoSansGeorgian', f'{FONT_DIR}/NotoSansGeorgian-Regular.ttf')
_reg('NotoSansArmenian', f'{FONT_DIR}/NotoSansArmenian-Regular.ttf')
_reg('NotoSansEthiopic', f'{FONT_DIR}/NotoSansEthiopic-Regular.ttf')
_reg('NotoSansHebrew', f'{FONT_DIR}/NotoSansHebrew-Regular.ttf')
_reg('NotoSansBengali', f'{FONT_DIR}/NotoSansBengali-Regular.ttf')
_reg('NotoSansTelugu', f'{FONT_DIR}/NotoSansTelugu-Regular.ttf')
_reg('NotoSansGujarati', f'{FONT_DIR}/NotoSansGujarati-Regular.ttf')
_reg('NotoSansTamil', f'{FONT_DIR}/NotoSansTamil-Regular.ttf')
_reg('NotoSansKhmer', f'{FONT_DIR}/NotoSansKhmer-Regular.ttf')
_reg('NotoSansMyanmar', f'{FONT_DIR}/NotoSansMyanmar-Regular.ttf')
_reg('NotoSansSinhala', f'{FONT_DIR}/NotoSansSinhala-Regular.ttf')


def get_local_font(text):
    """Detect script and return the best font name for local names."""
    for ch in text:
        cp = ord(ch)
        if 0x4E00 <= cp <= 0x9FFF or 0x3400 <= cp <= 0x4DBF or 0xF900 <= cp <= 0xFAFF:
            if 'NotoSansSC' in SCRIPT_FONTS: return 'NotoSansSC'
        if 0x3040 <= cp <= 0x309F or 0x30A0 <= cp <= 0x30FF:
            if 'NotoSansSC' in SCRIPT_FONTS: return 'NotoSansSC'
        if 0xAC00 <= cp <= 0xD7AF or 0x1100 <= cp <= 0x11FF:
            if 'NotoSansSC' in SCRIPT_FONTS: return 'NotoSansSC'
        if 0x0600 <= cp <= 0x06FF or 0xFB50 <= cp <= 0xFDFF:
            if 'NotoSansArabic' in SCRIPT_FONTS: return 'NotoSansArabic'
        if 0x0900 <= cp <= 0x097F:
            if 'NotoSansDevanagari' in SCRIPT_FONTS: return 'NotoSansDevanagari'
        if 0x0980 <= cp <= 0x09FF:
            if 'NotoSansBengali' in SCRIPT_FONTS: return 'NotoSansBengali'
        if 0x0E00 <= cp <= 0x0E7F:
            if 'NotoSansThai' in SCRIPT_FONTS: return 'NotoSansThai'
        if 0x10A0 <= cp <= 0x10FF:
            if 'NotoSansGeorgian' in SCRIPT_FONTS: return 'NotoSansGeorgian'
        if 0x0530 <= cp <= 0x058F:
            if 'NotoSansArmenian' in SCRIPT_FONTS: return 'NotoSansArmenian'
        if 0x1200 <= cp <= 0x137F:
            if 'NotoSansEthiopic' in SCRIPT_FONTS: return 'NotoSansEthiopic'
        if 0x0590 <= cp <= 0x05FF:
            if 'NotoSansHebrew' in SCRIPT_FONTS: return 'NotoSansHebrew'
        if 0x0C00 <= cp <= 0x0C7F:
            if 'NotoSansTelugu' in SCRIPT_FONTS: return 'NotoSansTelugu'
        if 0x0A80 <= cp <= 0x0AFF:
            if 'NotoSansGujarati' in SCRIPT_FONTS: return 'NotoSansGujarati'
        if 0x0B80 <= cp <= 0x0BFF:
            if 'NotoSansTamil' in SCRIPT_FONTS: return 'NotoSansTamil'
        if 0x1780 <= cp <= 0x17FF:
            if 'NotoSansKhmer' in SCRIPT_FONTS: return 'NotoSansKhmer'
        if 0x1000 <= cp <= 0x109F:
            if 'NotoSansMyanmar' in SCRIPT_FONTS: return 'NotoSansMyanmar'
        if 0x0D80 <= cp <= 0x0DFF:
            if 'NotoSansSinhala' in SCRIPT_FONTS: return 'NotoSansSinhala'
    return 'NotoSans'

# ── LOAD LOCATIONS ──
def load_locations():
    with open('/home/donatello/.openclaw/workspace/GeoCheckr_App/src/data/panoramaLocations.ts', 'r') as f:
        content = f.read()
    match = re.search(r'export const panoramaLocations.*?=\s*(\[[\s\S]*?\]);', content)
    arr_str = match.group(1)
    arr_str = re.sub(r',\s*}', '}', arr_str)
    arr_str = re.sub(r',\s*]', ']', arr_str)
    return json.loads(arr_str)

LOCAL_NAMES = {
    "Paris":"Paris","Tokyo":"東京","Cairo":"القاهرة","Berlin":"Berlin",
    "Rome":"Roma","Moscow":"Москва","Seoul":"서울","Bangkok":"กรุงเทพ",
    "Istanbul":"İstanbul","Mumbai":"मुंबई","Beijing":"北京","Shanghai":"上海",
    "Delhi":"दिल्ली","Osaka":"大阪","Kyoto":"京都","Lisbon":"Lisboa",
    "Vienna":"Wien","Prague":"Praha","Budapest":"Budapest","Warsaw":"Warszawa",
    "Athens":"Αθήνα","Copenhagen":"København","Munich":"München",
    "Milan":"Milano","Naples":"Napoli","Venice":"Venezia","Florence":"Firenze",
    "Mexico City":"Ciudad de México","Taipei":"台北","Dubai":"دبي",
    "Riyadh":"الرياض","Saint Petersburg":"Санкт-Петербург","Kyiv":"Київ",
    "Bucharest":"București","Sofia":"София","Belgrade":"Београд",
    "Zagreb":"Zagreb","Bratislava":"Bratislava","Tallinn":"Tallinn",
    "Riga":"Rīga","Vilnius":"Vilnius","Tbilisi":"თბილისი","Yerevan":"Երևան",
    "Brasília":"Brasília","Marrakech":"مراكش","Tunis":"تونس","Algiers":"الجزائر",
    "Addis Ababa":"አዲስ አበባ","Jakarta":"Jakarta","Hanoi":"Hà Nội",
    "Manila":"Maynila","Casablanca":"الدار البيضاء","Baku":"Bakı",
    "Hamburg":"Hamburg","Sarajevo":"Sarajevo","Tirana":"Tirana",
    "Hong Kong":"香港","Kathmandu":"काठमाडौं","Dhaka":"ঢাকা",
    "Tehran":"تهران","Baghdad":"بغداد","Jerusalem":"ירושלים",
    "Colombo":"කොළඹ","Ulaanbaatar":"Улаанбаатар","Doha":"الدوحة",
    "Damascus":"دمشق","Beirut":"بيروت","Islamabad":"اسلام آباد",
    "Accra":"Accra","Dakar":"Dakar","Nairobi":"Nairobi",
    "Kampala":"Kampala","Dar es Salaam":"Dar es Salaam",
    "Kigali":"Kigali","Maputo":"Maputo","Luanda":"Luanda",
    "Kinshasa":"Kinshasa","Lusaka":"Lusaka","Harare":"Harare",
    "Abidjan":"Abidjan","Bamako":"Bamako","Antananarivo":"Antananarivo",
    "Cape Town":"Cape Town","Johannesburg":"Johannesburg",
    "Tripoli":"طرابلس","Khartoum":"الخرطوم","Mombasa":"Mombasa",
    "Zanzibar":"Zanzibar","Djibouti":"Djibouti","Asmara":"Asmara",
    "Mogadishu":"Mogadishu","Libreville":"Libreville",
    "Sydney":"Sydney","Melbourne":"Melbourne","Auckland":"Auckland",
    "Wellington":"Wellington","Brisbane":"Brisbane","Perth":"Perth",
    "New York":"New York","Los Angeles":"Los Angeles","Chicago":"Chicago",
    "Miami":"Miami","San Francisco":"San Francisco","Toronto":"Toronto",
    "Vancouver":"Vancouver","Havana":"La Habana",
    "Buenos Aires":"Buenos Aires","Rio de Janeiro":"Rio de Janeiro",
    "São Paulo":"São Paulo","Bogotá":"Bogotá","Lima":"Lima",
    "Santiago":"Santiago","Caracas":"Caracas","Quito":"Quito",
    "Montevideo":"Montevideo","Medellín":"Medellín","Cusco":"Cusco",
    "Cartagena":"Cartagena","Guayaquil":"Guayaquil",
    "Kraków":"Kraków","Porto":"Porto","Seville":"Sevilla",
    "Salzburg":"Salzburg","Busan":"부산","Chiang Mai":"เชียงใหม่",
    "Jaipur":"जयपुर","Kabul":"کابل","Kochi":"कोची",
    "Canberra":"Canberra","Gold Coast":"Gold Coast",
    "Queenstown":"Queenstown","Christchurch":"Christchurch",
    "Reykjavik":"Reykjavík","Edinburgh":"Edinburgh",
    "Barcelona":"Barcelona","Madrid":"Madrid",
    "Oslo":"Oslo","Stockholm":"Stockholm","Helsinki":"Helsinki",
    "Zurich":"Zürich","Brussels":"Bruxelles","Amsterdam":"Amsterdam",
    "Dublin":"Dublin","London":"London",
    "Ljubljana":"Ljubljana","Kiev":"Київ","Singapore":"新加坡",
    "Kuala Lumpur":"کوالا لمڤور","Amman":"عمّان","Muscat":"مسقط",
    "Kuwait City":"الكويت","Phnom Penh":"ភ្នំពេញ","Vientiane":"ວຽງຈັນ",
    "Yangon":"ရန်ကုန်","Almaty":"Алматы","Tashkent":"Toshkent",
    "Ankara":"Ankara","Lagos":"Lagos","Ouagadougou":"Ouagadougou",
    "Windhoek":"Windhoek","Gaborone":"Gaborone","Lome":"Lomé",
    "Freetown":"Freetown","Monrovia":"Monrovia",
    "Brazzaville":"Brazzaville","N'Djamena":"N'Djamena","Niamey":"Niamey",
    "Conakry":"Conakry","Banjul":"Banjul",
    "Panama City":"Ciudad de Panamá","San Jose":"San José",
    "Guatemala City":"Ciudad de Guatemala",
    "New Orleans":"New Orleans","Seattle":"Seattle","Denver":"Denver",
    "Montreal":"Montréal","Boston":"Boston","Washington DC":"Washington DC",
    "Phoenix":"Phoenix","Honolulu":"Honolulu","Anchorage":"Anchorage",
    "Kingston":"Kingston","Santo Domingo":"Santo Domingo","Nassau":"Nassau",
    "San Juan":"San Juan","Sao Paulo":"São Paulo","Bogota":"Bogotá",
    "Asuncion":"Asunción","La Paz":"La Paz","Medellin":"Medellín",
    "Valparaiso":"Valparaíso","Salvador":"Salvador",
    "Buenaventura":"Buenaventura","Georgetown":"Georgetown",
    "Paramaribo":"Paramaribo","Sucre":"Sucre","Cordoba":"Córdoba",
    "Curitiba":"Curitiba","Mendoza":"Mendoza","Iquique":"Iquique",
    "Adelaide":"Adelaide","Darwin":"Darwin","Hobart":"Hobart",
    "Cairns":"Cairns","Suva":"Suva","Nuku'alofa":"Nukuʻalofa",
    "Port Moresby":"Port Moresby","Noumea":"Nouméa","Apia":"Apia",
    "Ngerulmud":"Ngerulmud","Bissau":"Bissau","Praia":"Praia","Moroni":"Moroni",
}

# ── QR CODE (pre-generated PNGs) ──
import qrcode

QR_DIR = '/tmp/qr_codes'
FRONT_DIR = '/tmp/card_fronts'

# ── DRAW FRONT (CITY NAME) — bg #3340ca, city #c6ff00, local #0a0b1f ──
def draw_front(c, loc, card_x, card_y):
    """Draw the CITY NAME side — using pre-generated high-res PNG (all fonts supported)"""
    lid = f"{loc['id']:03d}"
    front_path = os.path.join(FRONT_DIR, f"front_{lid}.png")
    if os.path.exists(front_path):
        c.drawImage(front_path, card_x, card_y, width=CARD_SIZE, height=CARD_SIZE)
    else:
        # Fallback: solid blue background
        c.setFillColor(C_BLUE)
        c.roundRect(card_x, card_y, CARD_SIZE, CARD_SIZE, 3*mm, fill=1, stroke=0)
        c.setFillColor(C_GREEN)
        c.setFont('SpaceGrotesk-Bold', 18)
        c.drawCentredString(card_x + CARD_SIZE/2, card_y + CARD_SIZE/2, loc['city'])

# ── DRAW BACK (QR CODE) — bg #c6ff00, QR #3340ca, 0.5cm margin ──
def draw_back(c, loc, card_x, card_y):
    """Draw the QR CODE side of a card — green background, blue QR from pre-generated PNG"""
    lid = f"{loc['id']:03d}"

    # Background — neon green, NO rounded corners
    c.setFillColor(C_GREEN)
    c.rect(card_x, card_y, CARD_SIZE, CARD_SIZE, fill=1, stroke=0)

    # QR Code — from pre-generated PNG, 0.5cm margin
    margin = 5 * mm
    qr_size = CARD_SIZE - 2 * margin
    qr_path = os.path.join(QR_DIR, f"qr_{lid}.png")
    if os.path.exists(qr_path):
        c.drawImage(qr_path, card_x + margin, card_y + margin, width=qr_size, height=qr_size, mask='auto')
    else:
        # Fallback: draw placeholder
        c.setFillColor(C_BLUE)
        c.rect(card_x + margin, card_y + margin, qr_size, qr_size, fill=1, stroke=0)

# ── GET CARD POSITIONS ──
def get_card_positions():
    """Calculate card positions on A4 page — with gaps between cards"""
    usable_w = PAGE_W - 2 * MARGIN_X
    usable_h = PAGE_H - MARGIN_Y_TOP - MARGIN_Y_BOT
    gap_x = (usable_w - COLS * CARD_SIZE - (COLS - 1) * CARD_GAP) / (COLS - 1) if COLS > 1 else 0
    gap_y = (usable_h - ROWS * CARD_SIZE - (ROWS - 1) * CARD_GAP) / (ROWS - 1) if ROWS > 1 else 0

    positions = []
    for row in range(ROWS):
        for col in range(COLS):
            x = MARGIN_X + col * (CARD_SIZE + CARD_GAP)
            y = PAGE_H - MARGIN_Y_TOP - (row + 1) * CARD_SIZE - row * CARD_GAP
            positions.append((x, y))
    return positions

# ── MAIN ──
def main():
    locs = load_locations()
    print(f"Loaded {len(locs)} locations")
    
    positions = get_card_positions()
    out_dir = '/home/donatello/.openclaw/workspace/GeoCheckr_App/docs/cards'
    os.makedirs(out_dir, exist_ok=True)
    
    # ── FRONT PDF (City Names) ──
    front_path = os.path.join(out_dir, 'GEOCHECKR_CARDS_FRONT.pdf')
    cf = canvas.Canvas(front_path, pagesize=A4)
    cf.setTitle("GeoCheckr Cards — Front (City Name)")
    cf.setAuthor("GeoCheckr")
    
    for i, loc in enumerate(locs):
        pos_idx = i % CARDS_PER_PAGE
        if pos_idx == 0 and i > 0:
            cf.showPage()
        
        card_x, card_y = positions[pos_idx]
        draw_front(cf, loc, card_x, card_y)
    
    cf.save()
    pages = len(locs) // CARDS_PER_PAGE + (1 if len(locs) % CARDS_PER_PAGE else 0)
    print(f"✅ Front PDF: {front_path} ({pages} pages)")
    
    # ── BACK PDF (QR Codes) ──
    back_path = os.path.join(out_dir, 'GEOCHECKR_CARDS_BACK.pdf')
    cb = canvas.Canvas(back_path, pagesize=A4)
    cb.setTitle("GeoCheckr Cards — Back (QR Code)")
    cb.setAuthor("GeoCheckr")
    
    for i, loc in enumerate(locs):
        pos_idx = i % CARDS_PER_PAGE
        if pos_idx == 0 and i > 0:
            cb.showPage()
        
        card_x, card_y = positions[pos_idx]
        draw_back(cb, loc, card_x, card_y)
    
    cb.save()
    print(f"✅ Back PDF: {back_path} ({pages} pages)")
    
    # ── COMBINED PDF (for double-sided printing) ──
    combined_path = os.path.join(out_dir, 'GEOCHECKR_CARDS_COMBINED.pdf')
    cc = canvas.Canvas(combined_path, pagesize=A4)
    cc.setTitle("GeoCheckr Cards — Combined (Front + Back)")
    cc.setAuthor("GeoCheckr")
    
    for page in range(pages):
        start = page * CARDS_PER_PAGE
        end = min(start + CARDS_PER_PAGE, len(locs))
        
        # Front page
        for i in range(start, end):
            pos_idx = (i - start) % CARDS_PER_PAGE
            card_x, card_y = positions[pos_idx]
            draw_front(cc, locs[i], card_x, card_y)
        cc.showPage()
        
        # Back page (mirrored for double-sided printing)
        for i in range(start, end):
            pos_idx = (i - start) % CARDS_PER_PAGE
            card_x, card_y = positions[pos_idx]
            mirror_x = PAGE_W - card_x - CARD_SIZE
            draw_back(cc, locs[i], mirror_x, card_y)
        cc.showPage()
    
    cc.save()
    print(f"✅ Combined PDF: {combined_path} ({pages*2} pages)")
    print(f"\n🎴 {len(locs)} cards, {pages} sheets, 6×6cm each")

if __name__ == '__main__':
    main()
