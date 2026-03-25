from reportlab.graphics.shapes import Line
#!/usr/bin/env python3
"""
GeoCheckr QR City Cards — Printable PDF Generator
205 cards, 6cm × 6cm, A4 pages, front + back
Colors: #111225 (bg), #b5ff2e (neon green), #96a9d4 (blue-grey), #f5f5f0 (text)
Fonts: Space Grotesk (English), Noto Sans (local names)
"""

import json, re, hashlib, os, sys
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

# Colors (from Timo's design)
C_BG = (0x11/255, 0x12/255, 0x25/255)      # #111225 — card background
C_GREEN = (0xb5/255, 0xff/255, 0x2e/255)    # #b5ff2e — neon green
C_BLUE = (0x96/255, 0xa9/255, 0xd4/255)     # #96a9d4 — blue-grey
C_WHITE = (0xf5/255, 0xf5/255, 0xf0/255)    # #f5f5f0 — white text
C_DARK_BLUE = (0x33/255, 0x40/255, 0xca/255) # #3340ca — accent blue

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
def draw_qr(c, data, x, y, size):
    """Draw a QR-code-like pattern on the canvas"""
    h = hashlib.md5(data.encode()).hexdigest()
    cells = 21
    cs = size / cells
    c.setFillColor(C_WHITE)
    
    # White rounded rect background
    pad = 3 * mm
    c.setFillColor((0.12, 0.13, 0.22))
    c.roundRect(x - pad, y - pad, size + 2*pad, size + 2*pad, 2*mm, fill=1, stroke=0)
    
    # QR finder patterns
    for fx, fy in [(0,0), (cells-7,0), (0,cells-7)]:
        px = x + fx * cs
        py = y + (cells - 7 - fy) * cs if fy == 0 else y + (cells - fy - 7) * cs
        if fx == 0 and fy == 0:
            py = y + (cells - 7) * cs
        elif fx == cells-7 and fy == 0:
            py = y + (cells - 7) * cs
        elif fx == 0 and fy == cells-7:
            py = y
        
        # Outer
        c.setFillColor(C_WHITE)
        c.rect(px, py, 7*cs, 7*cs, fill=1, stroke=0)
        # Inner dark
        c.setFillColor(C_BG)
        c.rect(px + cs, py + cs, 5*cs, 5*cs, fill=1, stroke=0)
        # Center
        c.setFillColor(C_WHITE)
        c.rect(px + 2*cs, py + 2*cs, 3*cs, 3*cs, fill=1, stroke=0)
    
    # Data modules
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
                    c.setFillColor(C_WHITE)
                    c.rect(px, py, cs, cs, fill=1, stroke=0)
                idx += 1

# ── TOPO LINES ──
def draw_topo(c, x, y, w, h, seed):
    """Draw topographic contour lines"""
    random.seed(seed)
    c.setStrokeColor(C_BLUE)
    c.setLineWidth(0.3)
    lines = 12
    for i in range(lines):
        base_y = y + h * (i + 0.5) / (lines + 1)
        amp = random.uniform(3*mm, 8*mm)
        freq = random.uniform(1.5, 3.0)
        phase = random.uniform(0, 6.28)
        path = c.beginPath()
        for px in range(0, int(w), 2):
            x_pos = x + px
            y_pos = base_y + amp * math.sin(px/w * freq * 6.28 + phase) + random.uniform(-1, 1)*mm
            if px == 0:
                path.moveTo(x_pos, y_pos)
            else:
                path.lineTo(x_pos, y_pos)
        c.drawPath(path)

import math, random

# ── DRAW FRONT (QR) ──
def draw_front(c, loc, card_x, card_y):
    """Draw the QR code side of a card"""
    lid = f"{loc['id']:03d}"
    lat_s = f"{abs(loc['lat']):.4f}°{'N' if loc['lat']>=0 else 'S'}"
    lng_s = f"{abs(loc['lng']):.4f}°{'E' if loc['lng']>=0 else 'W'}"
    
    # Card background
    c.setFillColor(C_BG)
    c.roundRect(card_x, card_y, CARD_SIZE, CARD_SIZE, 3*mm, fill=1, stroke=0)
    
    # Subtle border
    c.setStrokeColor(C_BLUE)
    c.setLineWidth(0.5)
    c.roundRect(card_x, card_y, CARD_SIZE, CARD_SIZE, 3*mm, fill=0, stroke=1)
    
    # QR Code (centered, ~35mm)
    qr_size = 32 * mm
    qr_x = card_x + (CARD_SIZE - qr_size) / 2
    qr_y = card_y + CARD_SIZE * 0.42
    draw_qr(c, f"geocheckr:{lid}", qr_x, qr_y, qr_size)
    
    # "SCAN ME" text
    c.setFillColor(C_GREEN)
    c.setFont('SpaceGrotesk-SemiBold', 5.5)
    c.drawCentredString(card_x + CARD_SIZE/2, card_y + CARD_SIZE * 0.36, "SCAN ME")
    
    # ID badge
    badge_w = 16 * mm
    badge_h = 6 * mm
    badge_x = card_x + (CARD_SIZE - badge_w) / 2
    badge_y = card_y + CARD_SIZE * 0.25
    c.setFillColor(C_DARK_BLUE)
    c.roundRect(badge_x, badge_y, badge_w, badge_h, 3*mm, fill=1, stroke=0)
    c.setFillColor(C_WHITE)
    c.setFont('SpaceGrotesk-Bold', 7)
    c.drawCentredString(card_x + CARD_SIZE/2, badge_y + 1.5*mm, f"#{lid}")
    
    # Bottom branding
    c.setFillColor(C_BLUE)
    c.setFont('SpaceGrotesk', 3.5)
    c.drawCentredString(card_x + CARD_SIZE/2, card_y + 3*mm, "GEOCHECKR")

# ── DRAW BACK (CITY) ──
def draw_back(c, loc, card_x, card_y):
    """Draw the city name side of a card"""
    lid = f"{loc['id']:03d}"
    city = loc['city']
    local = LOCAL_NAMES.get(city, city)
    lat_s = f"{abs(loc['lat']):.4f}°{'N' if loc['lat']>=0 else 'S'}"
    lng_s = f"{abs(loc['lng']):.4f}°{'E' if loc['lng']>=0 else 'W'}"
    
    # Card background
    c.setFillColor(C_BG)
    c.roundRect(card_x, card_y, CARD_SIZE, CARD_SIZE, 3*mm, fill=1, stroke=0)
    
    # Subtle border
    c.setStrokeColor(C_BLUE)
    c.setLineWidth(0.5)
    c.roundRect(card_x, card_y, CARD_SIZE, CARD_SIZE, 3*mm, fill=0, stroke=1)
    
    # Topo lines background
    draw_topo(c, card_x + 2*mm, card_y + 2*mm, CARD_SIZE - 4*mm, CARD_SIZE - 4*mm, loc['id'])
    
    # City name (English) — Space Grotesk Bold
    # Dynamic font size based on name length
    if len(city) > 12:
        city_fs = 9
    elif len(city) > 8:
        city_fs = 11
    else:
        city_fs = 13
    
    c.setFillColor(C_WHITE)
    c.setFont('SpaceGrotesk-Bold', city_fs)
    c.drawCentredString(card_x + CARD_SIZE/2, card_y + CARD_SIZE * 0.68, city)
    
    # Country
    c.setFillColor(C_BLUE)
    c.setFont('SpaceGrotesk', 5)
    c.drawCentredString(card_x + CARD_SIZE/2, card_y + CARD_SIZE * 0.60, loc['country'])
    
    # Divider line
    div_w = CARD_SIZE * 0.5
    c.setStrokeColor(C_DARK_BLUE)
    c.setLineWidth(0.4)
    c.line(card_x + (CARD_SIZE - div_w)/2, card_y + CARD_SIZE * 0.55,
           card_x + (CARD_SIZE + div_w)/2, card_y + CARD_SIZE * 0.55)
    
    # Local name — Noto Sans (supports all scripts)
    # Dynamic font size
    if len(local) > 10:
        local_fs = 7
    elif len(local) > 6:
        local_fs = 8.5
    else:
        local_fs = 10
    
    c.setFillColor(C_WHITE)
    c.setFont('NotoSans', local_fs)
    c.drawCentredString(card_x + CARD_SIZE/2, card_y + CARD_SIZE * 0.46, local)
    
    # "LOCAL NAME" label
    c.setFillColor(C_BLUE)
    c.setFont('SpaceGrotesk', 3)
    c.drawCentredString(card_x + CARD_SIZE/2, card_y + CARD_SIZE * 0.40, "LOCAL NAME")
    
    # Coordinates
    c.setFillColor(C_BLUE)
    c.setFont('SpaceGrotesk', 4)
    c.drawCentredString(card_x + CARD_SIZE/2, card_y + CARD_SIZE * 0.28, f"{lat_s}  {lng_s}")
    
    # ID badge
    badge_w = 16 * mm
    badge_h = 6 * mm
    badge_x = card_x + (CARD_SIZE - badge_w) / 2
    badge_y = card_y + CARD_SIZE * 0.14
    c.setFillColor(C_DARK_BLUE)
    c.setFillColor((*C_BG, 0.5))
    c.roundRect(badge_x, badge_y, badge_w, badge_h, 3*mm, fill=1, stroke=0)
    c.setFillColor(C_WHITE)
    c.setFont('SpaceGrotesk-Bold', 7)
    c.drawCentredString(card_x + CARD_SIZE/2, badge_y + 1.5*mm, f"#{lid}")
    
    # Bottom branding
    c.setFillColor(C_BLUE)
    c.setFont('SpaceGrotesk', 3.5)
    c.drawCentredString(card_x + CARD_SIZE/2, card_y + 3*mm, "GEOCHECKR")

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
    
    # ── FRONT PDF ──
    front_path = os.path.join(out_dir, 'GEOCHECKR_CARDS_FRONT.pdf')
    cf = canvas.Canvas(front_path, pagesize=A4)
    cf.setTitle("GeoCheckr QR Cards — Front (QR Code)")
    cf.setAuthor("GeoCheckr")
    
    for i, loc in enumerate(locs):
        pos_idx = i % CARDS_PER_PAGE
        if pos_idx == 0 and i > 0:
            # Page number
            cf.setFillColor(C_BLUE)
            cf.setFont('SpaceGrotesk', 6)
            cf.drawCentredString(PAGE_W/2, 8*mm, f"Front — Page {i // CARDS_PER_PAGE}")
            cf.showPage()
        
        card_x, card_y = positions[pos_idx]
        draw_front(cf, loc, card_x, card_y)
    
    # Last page number
    page_num = len(locs) // CARDS_PER_PAGE + (1 if len(locs) % CARDS_PER_PAGE else 0)
    cf.setFillColor(C_BLUE)
    cf.setFont('SpaceGrotesk', 6)
    cf.drawCentredString(PAGE_W/2, 8*mm, f"Front — Page {page_num}")
    cf.save()
    print(f"✅ Front PDF: {front_path} ({page_num} pages)")
    
    # ── BACK PDF ──
    back_path = os.path.join(out_dir, 'GEOCHECKR_CARDS_BACK.pdf')
    cb = canvas.Canvas(back_path, pagesize=A4)
    cb.setTitle("GeoCheckr QR Cards — Back (City Name)")
    cb.setAuthor("GeoCheckr")
    
    for i, loc in enumerate(locs):
        pos_idx = i % CARDS_PER_PAGE
        if pos_idx == 0 and i > 0:
            cb.setFillColor(C_BLUE)
            cb.setFont('SpaceGrotesk', 6)
            cb.drawCentredString(PAGE_W/2, 8*mm, f"Back — Page {i // CARDS_PER_PAGE}")
            cb.showPage()
        
        card_x, card_y = positions[pos_idx]
        draw_back(cb, loc, card_x, card_y)
    
    page_num = len(locs) // CARDS_PER_PAGE + (1 if len(locs) % CARDS_PER_PAGE else 0)
    cb.setFillColor(C_BLUE)
    cb.setFont('SpaceGrotesk', 6)
    cb.drawCentredString(PAGE_W/2, 8*mm, f"Back — Page {page_num}")
    cb.save()
    print(f"✅ Back PDF: {back_path} ({page_num} pages)")
    
    # ── COMBINED PDF (front then back, for manual duplex) ──
    combined_path = os.path.join(out_dir, 'GEOCHECKR_CARDS_COMBINED.pdf')
    cc = canvas.Canvas(combined_path, pagesize=A4)
    cc.setTitle("GeoCheckr QR Cards — Combined (Front + Back)")
    cc.setAuthor("GeoCheckr")
    
    total_pages = len(locs) // CARDS_PER_PAGE + (1 if len(locs) % CARDS_PER_PAGE else 0)
    
    for page in range(total_pages):
        # Front page
        start = page * CARDS_PER_PAGE
        end = min(start + CARDS_PER_PAGE, len(locs))
        for i in range(start, end):
            pos_idx = (i - start) % CARDS_PER_PAGE
            card_x, card_y = positions[pos_idx]
            draw_front(cc, locs[i], card_x, card_y)
        cc.setFillColor(C_BLUE)
        cc.setFont('SpaceGrotesk', 6)
        cc.drawCentredString(PAGE_W/2, 8*mm, f"Front — Page {page+1}/{total_pages}")
        cc.showPage()
        
        # Back page (MIRROR horizontally for double-sided printing)
        for i in range(start, end):
            pos_idx = (i - start) % CARDS_PER_PAGE
            card_x, card_y = positions[pos_idx]
            # Mirror X for back side
            mirror_x = PAGE_W - card_x - CARD_SIZE
            draw_back(cc, locs[i], mirror_x, card_y)
        cc.setFillColor(C_BLUE)
        cc.setFont('SpaceGrotesk', 6)
        cc.drawCentredString(PAGE_W/2, 8*mm, f"Back — Page {page+1}/{total_pages}")
        cc.showPage()
    
    cc.save()
    print(f"✅ Combined PDF: {combined_path} ({total_pages*2} pages)")
    
    print(f"\n🎴 Total: {len(locs)} cards, {total_pages} sheets")
    print(f"   Each card: 6cm × 6cm")
    print(f"   Layout: 3×4 per A4 page (12 cards/page)")

if __name__ == '__main__':
    main()
