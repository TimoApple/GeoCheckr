#!/usr/bin/env python3
"""Generate QR-Only PDF — just QR codes, no city names"""

import json, re, os, sys
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm, cm
from reportlab.pdfgen import canvas
import qrcode

PAGE_W, PAGE_H = A4
MARGIN_X = 15 * mm
MARGIN_Y_TOP = 20 * mm
MARGIN_Y_BOT = 15 * mm
COLS = 5
ROWS = 7
QR_SIZE = 30 * mm
QR_GAP = 5 * mm

def load_cities():
    path = os.path.join(os.path.dirname(__file__), '..', 'src', 'data', 'panoramaLocations.ts')
    with open(path) as f: content = f.read()
    # Find all objects between { and }
    items = re.findall(r'\{\s*"id":\s*(\d+),\s*"city":\s*"([^"]+)",\s*"country":\s*"([^"]+)",\s*"lat":\s*([\d.-]+),\s*"lng":\s*([\d.-]+)', content)
    cities = []
    for id_str, city, country, lat, lng in items:
        cities.append({'id': int(id_str), 'city': city, 'country': country, 'lat': float(lat), 'lng': float(lng)})
    return cities

def gen_qr(data):
    qr = qrcode.QRCode(version=1, error_correction=qrcode.constants.ERROR_CORRECT_M, box_size=8, border=2)
    qr.add_data(data)
    qr.make(fit=True)
    return qr.make_image(fill_color="black", back_color="white")

def main():
    cities = load_cities()
    out_dir = os.path.join(os.path.dirname(__file__), '..', 'docs', 'cards')
    out_path = os.path.join(out_dir, 'GEOCHECKR_QR_ONLY.pdf')
    os.makedirs(out_dir, exist_ok=True)

    c = canvas.Canvas(out_path, pagesize=A4)
    cards_per_page = COLS * ROWS

    for i, city in enumerate(cities):
        page_idx = i % cards_per_page
        col = page_idx % COLS
        row = page_idx // COLS

        if page_idx == 0 and i > 0:
            c.showPage()

        x = MARGIN_X + col * (QR_SIZE + QR_GAP)
        y = PAGE_H - MARGIN_Y_TOP - (row + 1) * (QR_SIZE + QR_GAP) + QR_GAP

        qr_data = f"#{int(city['id']):03d}"
        img = gen_qr(qr_data)
        img_path = f'/tmp/qr_{city["id"]}.png'
        img.save(img_path)

        # QR code
        c.drawImage(img_path, x, y, QR_SIZE, QR_SIZE)

        # ID label below QR
        c.setFont('Helvetica-Bold', 6)
        c.drawCentredString(x + QR_SIZE/2, y - 3*mm, qr_data)

    c.save()
    print(f'Generated: {out_path}')
    print(f'Pages: {(len(cities) - 1) // cards_per_page + 1}')

if __name__ == '__main__':
    main()
