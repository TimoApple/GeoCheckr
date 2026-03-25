# GeoCheckr — Map Vector Data

## SVG Patterns (Ready to Use)
| File | Description | Usage |
|------|-------------|-------|
| `osm-street-pattern.svg` | OSM-style street grid + city blocks | Background texture |
| `topo-contours.svg` | Topographic contour lines + dots | Background texture |
| `coordinate-grid.svg` | Lat/Long grid with labels | Background texture |

## GeoJSON / TopoJSON Data (for rendering)

### Natural Earth — Country Boundaries
- **File:** `world-countries.geojson` (838KB)
- **Resolution:** 1:110m (simplified, great for web)
- **License:** Public Domain (CC0)
- **Contents:** All country boundaries with properties
- **Source:** https://www.naturalearthdata.com/
- **Usage:** Render with D3.js, Leaflet, or convert to SVG

### World Atlas TopoJSON (d3)
- **File:** `world-atlas-110m.json` (107KB)
- **File:** `world-atlas-50m.json` (756KB)
- **License:** MIT
- **Source:** https://github.com/topojson/world-atlas
- **Usage:** Use with d3-geo or topojson-client

## How to Render as SVG

### With D3.js (browser):
```javascript
import * as d3 from 'd3';
import * as topojson from 'topojson-client';

const world = await fetch('world-atlas-110m.json').then(r => r.json());
const countries = topojson.feature(world, world.objects.countries);

const projection = d3.geoNaturalEarth1();
const path = d3.geoPath(projection);

const svg = d3.select('#map')
  .append('svg')
  .attr('viewBox', '0 0 960 500');

svg.selectAll('path')
  .data(countries.features)
  .join('path')
  .attr('d', path)
  .attr('fill', '#1d1e32')
  .attr('stroke', '#bdc2ff')
  .attr('stroke-width', 0.5)
  .attr('stroke-opacity', 0.2);
```

### Convert GeoJSON to SVG:
```bash
# Using mapshaper (npm install -g mapshaper)
mapshaper world-countries.geojson -o format=svg world.svg

# Using ogr2ogr (GDAL)
ogr2ogr -f SVG world.svg world-countries.geojson
```

## OSM Data Sources
- **Geofabrik:** https://download.geofabrik.de/ (country extracts)
- **Overpass API:** https://overpass-api.de/ (query specific features)
- **Planet OSM:** https://planet.openstreetmap.org/ (full dataset)
- **License:** ODbL (requires attribution)
