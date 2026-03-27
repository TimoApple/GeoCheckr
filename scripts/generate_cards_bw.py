#!/usr/bin/env python3
"""
GeoCheckr QR City Cards — B/W PDF for Laser Printer
205 cards, 6cm × 6cm, A4 pages, front + back
All black on white — no color
"""

import json, re, os, sys, math
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm, cm
from reportlab.pdfgen import canvas
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import qrcode

CARD_SIZE = 6 * cm
PAGE_W, PAGE_H = A4
MARGIN_X = 15 * mm
MARGIN_Y_TOP = 20 * mm
MARGIN_Y_BOT = 15 * mm

# B/W Colors
C_BLACK = (0, 0, 0)
C_WHITE = (1, 1, 1)

COLS = 3
ROWS = 4
CARDS_PER_PAGE = COLS * ROWS
CARD_GAP = 2 * mm

# Fonts
FONT_DIR = '/tmp'
pdfmetrics.registerFont(TTFont('SpaceGrotesk-Bold', f'{FONT_DIR}/SpaceGrotesk-Bold.ttf'))
pdfmetrics.registerFont(TTFont('NotoSans-Bold', f'{FONT_DIR}/NotoSans-Bold.ttf'))

# Script fonts (load what exists)
SCRIPT_FONTS = {}
def _reg(name, path):
    try:
        pdfmetrics.registerFont(TTFont(name, path))
        SCRIPT_FONTS[name] = True
    except: pass

for fn in ['NotoSansSC', 'NotoSansArabic', 'NotoSansDevanagari', 'NotoSansThai',
           'NotoSansGeorgian', 'NotoSansArmenian', 'NotoSansEthiopic', 'NotoSansHebrew',
           'NotoSansBengali', 'NotoSansTelugu', 'NotoSansGujarati', 'NotoSansTamil',
           'NotoSansKhmer', 'NotoSansMyanmar', 'NotoSansSinhala', 'NotoSansKannada',
           'NotoSansMalayalam', 'NotoSansOriya', 'NotoSansGurmukhi', 'NotoSansMyanmar']:
    _reg(fn, f'{FONT_DIR}/{fn}-Regular.ttf' if 'SC' not in fn else f'{FONT_DIR}/{fn}-VF.ttf')

def get_local_font(text):
    for ch in text:
        cp = ord(ch)
        if 0x4E00 <= cp <= 0x9FFF or 0x3400 <= cp <= 0x4DBF or 0xF900 <= cp <= 0xFAFF:
            if 'NotoSansSC' in SCRIPT_FONTS: return 'NotoSansSC'
        if 0x3040 <= cp <= 0x309F or 0x30A0 <= cp <= 0x30FF:
            if 'NotoSansSC' in SCRIPT_FONTS: return 'NotoSansSC'
        if 0xAC00 <= cp <= 0xD7AF:
            if 'NotoSansSC' in SCRIPT_FONTS: return 'NotoSansSC'
        if 0x0600 <= cp <= 0x06FF or 0xFB50 <= cp <= 0xFDFF:
            if 'NotoSansArabic' in SCRIPT_FONTS: return 'NotoSansArabic'
        if 0x0900 <= cp <= 0x097F:
            if 'NotoSansDevanagari' in SCRIPT_FONTS: return 'NotoSansDevanagari'
        if 0x0E00 <= cp <= 0x0E7F:
            if 'NotoSansThai' in SCRIPT_FONTS: return 'NotoSansThai'
        if 0x0980 <= cp <= 0x09FF:
            if 'NotoSansBengali' in SCRIPT_FONTS: return 'NotoSansBengali'
        if 0x0C00 <= cp <= 0x0C7F:
            if 'NotoSansTelugu' in SCRIPT_FONTS: return 'NotoSansTelugu'
        if 0x0A80 <= cp <= 0x0AFF:
            if 'NotoSansGujarati' in SCRIPT_FONTS: return 'NotoSansGujarati'
        if 0x0B80 <= cp <= 0x0BFF:
            if 'NotoSansTamil' in SCRIPT_FONTS: return 'NotoSansTamil'
    return 'NotoSans-Bold'

# Load cities
def load_cities():
    path = os.path.join(os.path.dirname(__file__), '..', 'src', 'data', 'panoramaLocations.ts')
    with open(path) as f:
        text = f.read()
    cities = []
    for m in re.finditer(r'"id":\s*(\d+),\s*"city":\s*"([^"]+)",\s*"country":\s*"([^"]+)"', text):
        cities.append({'id': int(m.group(1)), 'city': m.group(2), 'country': m.group(3)})
    return cities

# Load local names
LOCAL_NAMES = {}
local_path = os.path.join(os.path.dirname(__file__), '..', 'src', 'data', 'localNames.json')
try:
    with open(local_path) as f:
        LOCAL_NAMES = json.load(f)
except: pass

def generate_bw_pdf(output_dir):
    os.makedirs(output_dir, exist_ok=True)
    cities = load_cities()
    
    # ── FRONT PDF (all black) ──
    front_path = os.path.join(output_dir, 'GEOCHECKR_CARDS_BW_FRONT.pdf')
    fc = canvas.Canvas(front_path, pagesize=A4)
    
    for idx, city in enumerate(cities):
        page_idx = idx % CARDS_PER_PAGE
        if page_idx == 0 and idx > 0:
            fc.showPage()
        
        col = page_idx % COLS
        row = page_idx // COLS
        x = MARGIN_X + col * (CARD_SIZE + CARD_GAP)
        y = PAGE_H - MARGIN_Y_TOP - (row + 1) * (CARD_SIZE + CARD_GAP) + CARD_GAP
        
        # Card bg: WHITE
        fc.setFillColor(C_WHITE)
        fc.rect(x, y, CARD_SIZE, CARD_SIZE, fill=1, stroke=0)
        
        # City name: BLACK
        fc.setFillColor(C_BLACK)
        fc.setFont('SpaceGrotesk-Bold', 14)
        fc.drawCentredString(x + CARD_SIZE/2, y + CARD_SIZE * 0.58, city['city'])
        
        # Local name: BLACK
        local = LOCAL_NAMES.get(str(city['id']), city['city'])
        if local != city['city']:
            lfont = get_local_font(local)
            fc.setFont(lfont, 14)
            fc.drawCentredString(x + CARD_SIZE/2, y + CARD_SIZE * 0.40, local)
        
        # Number pill: BLACK bg, WHITE text
        pill_w, pill_h = 28, 16
        pill_x = x + CARD_SIZE/2 - pill_w/2
        pill_y = y + 6
        fc.setFillColor(C_BLACK)
        fc.roundRect(pill_x, pill_y, pill_w, pill_h, 4, fill=1, stroke=0)
        fc.setFillColor(C_WHITE)
        fc.setFont('SpaceGrotesk-Bold', 8)
        fc.drawCentredString(x + CARD_SIZE/2, pill_y + 4, f'#{city["id"]:03d}')
    
    fc.save()
    print(f'Front: {front_path}')
    
    # ── BACK PDF (QR black on white) ──
    back_path = os.path.join(output_dir, 'GEOCHECKR_CARDS_BW_BACK.pdf')
    bc = canvas.Canvas(back_path, pagesize=A4)
    
    for idx, city in enumerate(cities):
        page_idx = idx % CARDS_PER_PAGE
        if page_idx == 0 and idx > 0:
            bc.showPage()
        
        # Mirror column for 2-sided printing
        col = (COLS - 1) - (page_idx % COLS)
        row = page_idx // COLS
        x = MARGIN_X + col * (CARD_SIZE + CARD_GAP)
        y = PAGE_H - MARGIN_Y_TOP - (row + 1) * (CARD_SIZE + CARD_GAP) + CARD_GAP
        
        # Card bg: WHITE
        bc.setFillColor(C_WHITE)
        bc.rect(x, y, CARD_SIZE, CARD_SIZE, fill=1, stroke=0)
        
        # QR code: BLACK on WHITE
        qr_data = f'geocheckr://city/{city["id"]}'
        qr = qrcode.QRCode(version=1, error_correction=qrcode.constants.ERROR_CORRECT_M, box_size=4, border=1)
        qr.add_data(qr_data)
        qr.make(fit=True)
        qr_img = qr.make_image(fill_color='black', back_color='white')
        
        qr_path = f'/tmp/qr_bw_{city["id"]}.png'
        qr_img.save(qr_path)
        
        qr_size = CARD_SIZE - 10 * mm
        qr_x = x + 5 * mm
        qr_y = y + 5 * mm
        bc.drawImage(qr_path, qr_x, qr_y, qr_size, qr_size)
        
        # City name below QR: BLACK, small
        bc.setFillColor(C_BLACK)
        bc.setFont('SpaceGrotesk-Bold', 6)
        bc.drawCentredString(x + CARD_SIZE/2, y + 2, city['city'])
    
    bc.save()
    print(f'Back: {back_path}')
    
    # ── COMBINED PDF ──
    from PyPDF2 import PdfMerger
    combined_path = os.path.join(output_dir, 'GEOCHECKR_CARDS_BW_COMBINED.pdf')
    merger = PdfMerger()
    merger.append(front_path)
    merger.append(back_path)
    merger.write(combined_path)
    merger.close()
    print(f'Combined: {combined_path}')

if __name__ == '__main__':
    out = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), '..', 'docs', 'cards')
    generate_bw_pdf(out)
