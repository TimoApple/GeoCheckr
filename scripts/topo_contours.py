#!/usr/bin/env python3
"""
GeoCheckr — Organic Topographic Contour Lines Generator
Generates real-looking terrain contour lines for card backs.
Uses value noise + contour extraction (marching squares lite).
"""

import random
import math

def value_noise_2d(width, height, scale=4, seed=42):
    """Generate 2D value noise grid"""
    rng = random.Random(seed)
    
    # Grid of random values
    gw = int(width / scale) + 3
    gh = int(height / scale) + 3
    grid = [[rng.random() for _ in range(gw)] for _ in range(gh)]
    
    def smoothstep(t):
        return t * t * (3 - 2 * t)
    
    def lerp(a, b, t):
        return a + (b - a) * t
    
    # Sample with bilinear interpolation
    result = []
    for y in range(height):
        row = []
        for x in range(width):
            gx = x / scale
            gy = y / scale
            ix, iy = int(gx), int(gy)
            fx, fy = gx - ix, gy - iy
            fx, fy = smoothstep(fx), smoothstep(fy)
            
            v00 = grid[iy][ix]
            v10 = grid[iy][ix + 1]
            v01 = grid[iy + 1][ix]
            v11 = grid[iy + 1][ix + 1]
            
            v = lerp(lerp(v00, v10, fx), lerp(v01, v11, fx), fy)
            row.append(v)
        result.append(row)
    return result


def multi_octave_noise(width, height, seed=42, octaves=4):
    """Stack multiple noise octaves for more natural terrain"""
    result = [[0.0] * width for _ in range(height)]
    
    for octave in range(octaves):
        scale = max(3, 8 * (2 ** octave) // (2 ** (octaves - 1)))
        amplitude = 0.5 ** octave
        noise = value_noise_2d(width, height, scale=scale, seed=seed + octave * 1000)
        
        for y in range(height):
            for x in range(width):
                result[y][x] += noise[y][x] * amplitude
    
    # Normalize to 0-1
    min_v = min(min(row) for row in result)
    max_v = max(max(row) for row in result)
    rng = max_v - min_v
    if rng == 0:
        rng = 1
    for y in range(height):
        for x in range(width):
            result[y][x] = (result[y][x] - min_v) / rng
    
    return result


def extract_contour_paths(elevation, levels, width, height):
    """
    Extract contour lines at given elevation levels.
    Uses a simple marching approach: scan rows and find threshold crossings.
    Returns list of paths (each path is a list of (x, y) tuples).
    """
    all_paths = []
    
    for level in levels:
        # Find contour segments using horizontal scan
        segments = []
        
        # Horizontal scan
        for y in range(height - 1):
            row_segs = []
            x = 0
            while x < width - 1:
                v0 = elevation[y][x]
                v1 = elevation[y][x + 1]
                
                # Check crossing
                if (v0 <= level and v1 > level) or (v0 > level and v1 <= level):
                    # Interpolate
                    if v1 != v0:
                        t = (level - v0) / (v1 - v0)
                        cx = x + t
                    else:
                        cx = x + 0.5
                    row_segs.append((cx, y))
                x += 1
            
            # Pair up crossings
            for i in range(0, len(row_segs) - 1, 2):
                segments.append((row_segs[i], row_segs[i + 1]))
        
        # Vertical scan
        for x in range(width - 1):
            col_segs = []
            y = 0
            while y < height - 1:
                v0 = elevation[y][x]
                v1 = elevation[y + 1][x]
                
                if (v0 <= level and v1 > level) or (v0 > level and v1 <= level):
                    if v1 != v0:
                        t = (level - v0) / (v1 - v0)
                        cy = y + t
                    else:
                        cy = y + 0.5
                    col_segs.append((x, cy))
                y += 1
            
            for i in range(0, len(col_segs) - 1, 2):
                segments.append((col_segs[i], col_segs[i + 1]))
        
        all_paths.append((level, segments))
    
    return all_paths


def contours_to_svg_paths(elevation, levels, w, h, svg_w, svg_h):
    """
    Convert elevation contours to smooth SVG path data.
    Uses row-by-row connected contour tracing.
    """
    paths = []
    
    for level in levels:
        # Trace contour using connected edge following
        visited = set()
        
        for y in range(h - 1):
            for x in range(w - 1):
                # Check if this cell has a contour crossing
                v00 = elevation[y][x]
                v10 = elevation[y][x + 1]
                v01 = elevation[y + 1][x]
                v11 = elevation[y + 1][x + 1]
                
                # Edges that cross the level
                edges = []
                if (v00 <= level) != (v10 <= level):  # top edge
                    t = (level - v00) / (v10 - v00) if v10 != v00 else 0.5
                    edges.append(('t', x + t, y))
                if (v10 <= level) != (v11 <= level):  # right edge
                    t = (level - v10) / (v11 - v10) if v11 != v10 else 0.5
                    edges.append(('r', x + 1, y + t))
                if (v01 <= level) != (v11 <= level):  # bottom edge
                    t = (level - v01) / (v11 - v01) if v11 != v01 else 0.5
                    edges.append(('b', x + t, y + 1))
                if (v00 <= level) != (v01 <= level):  # left edge
                    t = (level - v00) / (v01 - v00) if v01 != v00 else 0.5
                    edges.append(('l', x, y + t))
                
                if len(edges) >= 2:
                    # Connect first two edge crossings
                    _, x1, y1 = edges[0]
                    _, x2, y2 = edges[1]
                    
                    # Scale to SVG coordinates
                    sx1 = x1 / (w - 1) * svg_w
                    sy1 = y1 / (h - 1) * svg_h
                    sx2 = x2 / (w - 1) * svg_w
                    sy2 = y2 / (h - 1) * svg_h
                    
                    paths.append((sx1, sy1, sx2, sy2))
    
    return paths


def generate_organic_contours_svg(segments, svg_w=400, svg_h=560, 
                                   color="#96a9d4", opacity=0.08, 
                                   stroke_width=0.4):
    """Generate SVG path elements from contour segments"""
    if not segments:
        return ""
    
    # Group nearby segments into continuous paths
    svg_parts = []
    
    for x1, y1, x2, y2 in segments:
        # Use cubic bezier for smoothness
        mx = (x1 + x2) / 2
        my = (y1 + y2) / 2
        dx = x2 - x1
        dy = y2 - y1
        
        # Control point offset perpendicular to line
        cp_ox = -dy * 0.3
        cp_oy = dx * 0.3
        
        svg_parts.append(
            f'M{x1:.1f},{y1:.1f} C{x1 + dx*0.3 + cp_ox*0.5:.1f},{y1 + dy*0.3 + cp_oy*0.5:.1f} '
            f'{x2 - dx*0.3 + cp_ox*0.5:.1f},{y2 - dy*0.3 + cp_oy*0.5:.1f} '
            f'{x2:.1f},{y2:.1f}'
        )
    
    return f'<path d="{" ".join(svg_parts)}" stroke="{color}" stroke-width="{stroke_width}" fill="none" opacity="{opacity}"/>'


def generate_realistic_topo_svg(seed=42, svg_w=400, svg_h=560):
    """
    Generate a complete topographic SVG with organic contour lines.
    Creates a realistic terrain map look.
    """
    rng = random.Random(seed)
    
    # Generate elevation map
    res = 2  # pixels per unit (lower = faster, less smooth)
    w = svg_w // res + 1
    h = svg_h // res + 1
    
    elevation = multi_octave_noise(w, h, seed=seed, octaves=5)
    
    # Add a "mountain peak" or two for more interesting contours
    num_peaks = rng.randint(2, 4)
    peaks = []
    for _ in range(num_peaks):
        px = rng.uniform(0.15, 0.85) * w
        py = rng.uniform(0.15, 0.85) * h
        pr = rng.uniform(w * 0.15, w * 0.35)
        strength = rng.uniform(0.2, 0.5)
        peaks.append((px, py, pr, strength))
    
    for y in range(h):
        for x in range(w):
            for px, py, pr, strength in peaks:
                dist = math.sqrt((x - px) ** 2 + (y - py) ** 2)
                if dist < pr:
                    falloff = 1 - (dist / pr) ** 2
                    elevation[y][x] += strength * falloff
    
    # Normalize again
    min_v = min(min(row) for row in elevation)
    max_v = max(max(row) for row in elevation)
    rng2 = max_v - min_v
    if rng2 == 0:
        rng2 = 1
    for y in range(h):
        for x in range(w):
            elevation[y][x] = (elevation[y][x] - min_v) / rng2
    
    # Generate contour levels (more levels = more detailed)
    num_levels = rng.randint(15, 25)
    levels = [i / num_levels for i in range(1, num_levels)]
    
    # Extract contours
    segments = contours_to_svg_paths(elevation, levels, w, h, svg_w, svg_h)
    
    # Build SVG
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {svg_w} {svg_h}" width="{svg_w}" height="{svg_h}">
  <rect width="{svg_w}" height="{svg_h}" rx="16" fill="#111225"/>
  <g stroke="#96a9d4" fill="none">
'''
    
    # Group segments by proximity into continuous paths
    # For now, draw each segment as a smooth curve
    for x1, y1, x2, y2 in segments:
        dx = x2 - x1
        dy = y2 - y1
        # Perpendicular offset for control point
        length = math.sqrt(dx*dx + dy*dy)
        if length < 2:
            continue
        
        # Vary opacity slightly based on length
        op = 0.04 + 0.06 * min(1.0, length / 100)
        sw = 0.3 + 0.2 * min(1.0, length / 80)
        
        # Smooth cubic bezier
        cp1x = x1 + dx * 0.33 + (-dy) * 0.15
        cp1y = y1 + dy * 0.33 + (dx) * 0.15
        cp2x = x1 + dx * 0.66 + (-dy) * 0.15
        cp2y = y1 + dy * 0.66 + (dx) * 0.15
        
        svg += f'    <path d="M{x1:.1f},{y1:.1f} C{cp1x:.1f},{cp1y:.1f} {cp2x:.1f},{cp2y:.1f} {x2:.1f},{y2:.1f}" stroke-width="{sw:.2f}" opacity="{op:.3f}"/>\n'
    
    svg += '  </g>\n</svg>'
    return svg


def generate_terrain_contours_svg(seed=42, svg_w=400, svg_h=560):
    """
    Better approach: generate actual closed contour loops using noise.
    Creates realistic-looking topographic map.
    """
    rng = random.Random(seed)
    w, h = 100, 140  # resolution
    
    # Generate terrain
    elevation = multi_octave_noise(w, h, seed=seed, octaves=5)
    
    # Add mountain peaks
    num_peaks = rng.randint(2, 5)
    for _ in range(num_peaks):
        px = rng.uniform(0.1, 0.9) * w
        py = rng.uniform(0.1, 0.9) * h
        pr = rng.uniform(w * 0.1, w * 0.3)
        strength = rng.uniform(0.15, 0.45)
        
        for y in range(h):
            for x in range(w):
                dist = math.sqrt((x - px) ** 2 + (y - py) ** 2)
                if dist < pr:
                    falloff = 1 - (dist / pr) ** 1.5
                    elevation[y][x] += strength * max(0, falloff)
    
    # Normalize
    min_v = min(min(row) for row in elevation)
    max_v = max(max(row) for row in elevation)
    rng2 = max_v - min_v
    if rng2 < 0.001:
        rng2 = 1
    for y in range(h):
        for x in range(w):
            elevation[y][x] = (elevation[y][x] - min_v) / rng2
    
    # Trace contours by following level sets
    num_contours = rng.randint(18, 28)
    contour_levels = [(i + 1) / (num_contours + 1) for i in range(num_contours)]
    
    all_svg_paths = []
    
    for level in contour_levels:
        # March through grid and find edge crossings
        points = []
        
        # Horizontal edges
        for y in range(h):
            for x in range(w - 1):
                v0 = elevation[y][x]
                v1 = elevation[y][x + 1]
                if (v0 < level) != (v1 < level):
                    if abs(v1 - v0) > 0.001:
                        t = (level - v0) / (v1 - v0)
                        sx = (x + t) / (w - 1) * svg_w
                        sy = y / (h - 1) * svg_h
                        points.append((sx, sy, 'h'))
        
        # Vertical edges
        for y in range(h - 1):
            for x in range(w):
                v0 = elevation[y][x]
                v1 = elevation[y + 1][x]
                if (v0 < level) != (v1 < level):
                    if abs(v1 - v0) > 0.001:
                        t = (level - v0) / (v1 - v0)
                        sx = x / (w - 1) * svg_w
                        sy = (y + t) / (h - 1) * svg_h
                        points.append((sx, sy, 'v'))
        
        # Convert points to smooth paths
        if len(points) > 3:
            # Sort points to form connected paths
            # Simple approach: chain nearest neighbors
            unused = list(range(len(points)))
            chains = []
            
            while len(unused) > 2:
                chain = [unused.pop(0)]
                
                # Grow chain by finding nearest neighbor
                while unused:
                    last = points[chain[-1]]
                    best_dist = float('inf')
                    best_idx = -1
                    best_pos = None
                    
                    for idx in unused:
                        p = points[idx]
                        d = (p[0] - last[0]) ** 2 + (p[1] - last[1]) ** 2
                        if d < best_dist and d < (svg_w / w) ** 2 * 8:  # max connection distance
                            best_dist = d
                            best_idx = idx
                            best_pos = 'end'
                    
                    if best_idx >= 0:
                        chain.append(best_idx)
                        unused.remove(best_idx)
                    else:
                        break
                
                if len(chain) > 3:
                    chains.append(chain)
            
            # Convert chains to smooth SVG paths
            for chain in chains:
                if len(chain) < 4:
                    continue
                
                pts = [points[i] for i in chain]
                
                # Build smooth path using catmull-rom to bezier conversion
                path_d = f'M{pts[0][0]:.1f},{pts[0][1]:.1f}'
                
                for i in range(1, len(pts) - 2):
                    p0 = pts[i - 1]
                    p1 = pts[i]
                    p2 = pts[i + 1]
                    p3 = pts[min(i + 2, len(pts) - 1)]
                    
                    # Catmull-Rom to cubic Bezier
                    tension = 0.3
                    cp1x = p1[0] + (p2[0] - p0[0]) * tension
                    cp1y = p1[1] + (p2[1] - p0[1]) * tension
                    cp2x = p2[0] - (p3[0] - p1[0]) * tension
                    cp2y = p2[1] - (p3[1] - p1[1]) * tension
                    
                    path_d += f' C{cp1x:.1f},{cp1y:.1f} {cp2x:.1f},{cp2y:.1f} {p2[0]:.1f},{p2[1]:.1f}'
                
                # Vary stroke properties slightly
                sw = rng.uniform(0.25, 0.55)
                op = rng.uniform(0.04, 0.10)
                
                all_svg_paths.append(f'<path d="{path_d}" stroke="#96a9d4" stroke-width="{sw:.2f}" fill="none" opacity="{op:.3f}" stroke-linecap="round"/>')
    
    # Build final SVG
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {svg_w} {svg_h}" width="{svg_w}" height="{svg_h}">
  <rect width="{svg_w}" height="{svg_h}" rx="16" fill="#111225"/>
  <g>
'''
    for p in all_svg_paths:
        svg += f'    {p}\n'
    
    svg += '  </g>\n</svg>'
    return svg


# Test: generate one SVG
if __name__ == '__main__':
    svg = generate_terrain_contours_svg(seed=7, svg_w=400, svg_h=560)
    with open('/tmp/topo_test.svg', 'w') as f:
        f.write(svg)
    print(f"Generated test SVG: {len(svg)} bytes → /tmp/topo_test.svg")
    
    # Generate a few different seeds for variety
    for s in [42, 123, 7, 256]:
        svg = generate_terrain_contours_svg(seed=s, svg_w=400, svg_h=560)
        path = f'/tmp/topo_seed{s}.svg'
        with open(path, 'w') as f:
            f.write(svg)
        print(f"  seed={s}: {len(svg)} bytes")
