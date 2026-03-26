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

# ── FONTS ──
FONT_DIR = '/tmp'
pdfmetrics.registerFont(TTFont('SpaceGrotesk', f'{FONT_DIR}/SpaceGrotesk-Regular.ttf'))
pdfmetrics.registerFont(TTFont('SpaceGrotesk-Bold', f'{FONT_DIR}/SpaceGrotesk-Bold.ttf'))
pdfmetrics.registerFont(TTFont('SpaceGrotesk-SemiBold', f'{FONT_DIR}/SpaceGrotesk-SemiBold.ttf'))
pdfmetrics.registerFont(TTFont('NotoSans', f'{FONT_DIR}/NotoSans-Regular.ttf'))
pdfmetrics.registerFont(TTFont('NotoSans-Bold', f'{FONT_DIR}/NotoSans-Bold.ttf'))

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
    "Hong Kong":"Hong Kong","Kathmandu":"काठमाडौं","Dhaka":"ঢাকা",
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
}

# ── QR CODE DRAWING ──
def draw_qr(c, data, x, y, size, fg_color=C_BLUE):
    """Draw a QR-code-like pattern — fg_color is the module color"""
    h = hashlib.md5(data.encode()).hexdigest()
    cells = 21
    cs = size / cells
    
    # Dark background for QR area
    pad = 2 * mm
    c.setFillColor(C_DARK)
    c.roundRect(x - pad, y - pad, size + 2*pad, size + 2*pad, 2*mm, fill=1, stroke=0)
    
    # QR finder patterns (7×7 each)
    for fx, fy in [(0,0), (cells-7,0), (0,cells-7)]:
        px = x + fx * cs
        if fy == 0:
            py = y + (cells - 7) * cs if fx == 0 else y + (cells - 7) * cs
        else:
            py = y
        
        if fx == cells-7:
            px_right = x + (cells - 7) * cs
            py_top = y + (cells - 7) * cs
            # Outer
            c.setFillColor(fg_color)
            c.rect(px_right, py_top, 7*cs, 7*cs, fill=1, stroke=0)
            # Inner white
            c.setFillColor(C_DARK)
            c.rect(px_right + cs, py_top + cs, 5*cs, 5*cs, fill=1, stroke=0)
            # Center
            c.setFillColor(fg_color)
            c.rect(px_right + 2*cs, py_top + 2*cs, 3*cs, 3*cs, fill=1, stroke=0)
        elif fx == 0 and fy == cells-7:
            py_bottom = y
            # Outer
            c.setFillColor(fg_color)
            c.rect(px, py_bottom, 7*cs, 7*cs, fill=1, stroke=0)
            # Inner white
            c.setFillColor(C_DARK)
            c.rect(px + cs, py_bottom + cs, 5*cs, 5*cs, fill=1, stroke=0)
            # Center
            c.setFillColor(fg_color)
            c.rect(px + 2*cs, py_bottom + 2*cs, 3*cs, 3*cs, fill=1, stroke=0)
        else:
            # Top-left
            py_tl = y + (cells - 7) * cs
            c.setFillColor(fg_color)
            c.rect(px, py_tl, 7*cs, 7*cs, fill=1, stroke=0)
            c.setFillColor(C_DARK)
            c.rect(px + cs, py_tl + cs, 5*cs, 5*cs, fill=1, stroke=0)
            c.setFillColor(fg_color)
            c.rect(px + 2*cs, py_tl + 2*cs, 3*cs, 3*cs, fill=1, stroke=0)
    
    # Data modules
    c.setFillColor(fg_color)
    idx = 0
    for row in range(cells):
        for col in range(cells):
            if (row < 7 and col < 7) or (row < 7 and col >= cells-7) or (row >= cells-7 and col < 7):
                continue
            if idx < len(h) * 4:
                bit = int(h[idx // 4], 16) >> (idx % 4) & 1
                if bit:
                    px = x + col * cs
                    py = y + (cells - 1 - row) * cs
                    c.rect(px, py, cs, cs, fill=1, stroke=0)
                idx += 1

# ── DRAW FRONT (CITY NAME) — bg #3340ca, city #c6ff00, local #0a0b1f ──
def draw_front(c, loc, card_x, card_y):
    """Draw the CITY NAME side of a card — this is the main design side"""
    city = loc['city']
    local = LOCAL_NAMES.get(city, city)
    lid = f"{loc['id']:03d}"
    
    # Background — accent blue
    c.setFillColor(C_BLUE)
    c.roundRect(card_x, card_y, CARD_SIZE, CARD_SIZE, 3*mm, fill=1, stroke=0)
    
    # City name (English) — Space Grotesk Bold, 21pt, #c6ff00
    c.setFillColor(C_GREEN)
    
    # Dynamic font size based on name length (scale down for long names)
    if len(city) > 14:
        fs = 16
    elif len(city) > 10:
        fs = 18
    else:
        fs = 21
    
    c.setFont('SpaceGrotesk-Bold', fs)
    c.drawCentredString(card_x + CARD_SIZE/2, card_y + CARD_SIZE * 0.62, city)
    
    # Local name — Noto Sans Bold, 21pt, #0a0b1f
    c.setFillColor(C_DARK)
    
    if len(local) > 14:
        local_fs = 16
    elif len(local) > 10:
        local_fs = 18
    else:
        local_fs = 21
    
    c.setFont('NotoSans-Bold', local_fs)
    c.drawCentredString(card_x + CARD_SIZE/2, card_y + CARD_SIZE * 0.42, local)
    
    # ID badge — small, bottom center
    badge_w = 14 * mm
    badge_h = 5 * mm
    badge_x = card_x + (CARD_SIZE - badge_w) / 2
    badge_y = card_y + 4 * mm
    c.setFillColor(C_DARK)
    c.setFillColor((*C_DARK, 0.3))
    c.roundRect(badge_x, badge_y, badge_w, badge_h, 2.5*mm, fill=1, stroke=0)
    c.setFillColor(C_WHITE)
    c.setFont('SpaceGrotesk-Bold', 6)
    c.drawCentredString(card_x + CARD_SIZE/2, badge_y + 1*mm, f"#{lid}")

# ── DRAW BACK (QR CODE) — bg #c6ff00, QR #3340ca, 0.5cm margin ──
def draw_back(c, loc, card_x, card_y):
    """Draw the QR CODE side of a card — green background, blue QR"""
    lid = f"{loc['id']:03d}"
    
    # Background — neon green
    c.setFillColor(C_GREEN)
    c.roundRect(card_x, card_y, CARD_SIZE, CARD_SIZE, 3*mm, fill=1, stroke=0)
    
    # QR Code — centered, 0.5cm margin = 5mm from each edge
    margin = 5 * mm
    qr_size = CARD_SIZE - 2 * margin
    qr_x = card_x + margin
    qr_y = card_y + margin
    draw_qr(c, f"geocheckr:{lid}", qr_x, qr_y, qr_size, fg_color=C_BLUE)

# ── GET CARD POSITIONS ──
def get_card_positions():
    """Calculate card positions on A4 page"""
    usable_w = PAGE_W - 2 * MARGIN_X
    usable_h = PAGE_H - MARGIN_Y_TOP - MARGIN_Y_BOT
    gap_x = (usable_w - COLS * CARD_SIZE) / (COLS - 1) if COLS > 1 else 0
    gap_y = (usable_h - ROWS * CARD_SIZE) / (ROWS - 1) if ROWS > 1 else 0
    
    positions = []
    for row in range(ROWS):
        for col in range(COLS):
            x = MARGIN_X + col * (CARD_SIZE + gap_x)
            y = PAGE_H - MARGIN_Y_TOP - (row + 1) * CARD_SIZE - row * gap_y
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
