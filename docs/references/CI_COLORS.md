# GeoCheckr CI — Color Reference
# Source: Timo's Design System (file_297)

## Primary Colors

| Name | Hex | RGB | Usage |
|------|-----|-----|-------|
| **Dark Navy** | `#111225` | 17, 18, 37 | Card backgrounds, main dark |
| **Neon Green** | `#b5ff2e` | 181, 255, 46 | Branding, buttons, accents, scan text |
| **Blue Grey** | `#96a9d4` | 150, 169, 212 | Secondary text, contour lines, "LOCAL NAME" label |
| **White Cream** | `#f5f5f0` | 245, 245, 240 | Main text (city names, coordinates) |
| **Accent Blue** | `#3340ca` | 51, 64, 202 | ID badges, borders, dividers |

## Typography

| Font | Usage |
|------|-------|
| **Space Grotesk Bold** | City names (English), card numbers |
| **Space Grotesk SemiBold** | "SCAN ME" button |
| **Space Grotesk Regular** | Branding, coordinates, labels |
| **Noto Sans** | Local names (Arabic, Cyrillic, CJK, Devanagari, etc.) |

## Card Layout

### Front (QR Side)
- Background: `#111225`
- QR Code: `#f5f5f0` (white modules on dark bg)
- "SCAN ME": `#b5ff2e` Space Grotesk SemiBold
- ID Badge: `#3340ca` background, `#f5f5f0` text
- "GEOCHECKR": `#96a9d4` at bottom

### Back (City Side)
- Background: `#111225`
- Topographic lines: `#96a9d4` (thin, low opacity)
- City name: `#f5f5f0` Space Grotesk Bold
- Country: `#96a9d4` Space Grotesk Regular
- Divider: `#3340ca` thin line
- Local name: `#f5f5f0` Noto Sans
- "LOCAL NAME": `#96a9d4` small
- Coordinates: `#96a9d4` monospace
- ID Badge: semi-transparent `#111225`, `#f5f5f0` text
- "GEOCHECKR": `#96a9d4` at bottom
