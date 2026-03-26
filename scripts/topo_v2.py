#!/usr/bin/env python3
"""
GeoCheckr — Organic Topographic Contour Lines
Direct approach: generate smooth Bezier curves that look like real terrain contours.
No marching squares — just well-crafted organic curves.
"""

import random
import math


def generate_topo_svg(seed=42, w=400, h=560):
    """
    Generate organic topographic contour lines as SVG.
    Creates smooth, flowing lines that look like real elevation contours.
    """
    rng = random.Random(seed)
    
    # Generate "terrain centers" (peaks/ridges)
    features = []
    for _ in range(rng.randint(3, 6)):
        fx = rng.uniform(w * 0.1, w * 0.9)
        fy = rng.uniform(h * 0.1, h * 0.9)
        ftype = rng.choice(['peak', 'ridge'])
        if ftype == 'peak':
            features.append({'type': 'peak', 'x': fx, 'y': fy, 
                           'radius': rng.uniform(80, 200)})
        else:
            angle = rng.uniform(0, math.pi)
            features.append({'type': 'ridge', 'x': fx, 'y': fy,
                           'angle': angle, 'length': rng.uniform(100, 250),
                           'width': rng.uniform(40, 100)})
    
    svg_paths = []
    
    # For each terrain feature, generate concentric contour lines
    for feat in features:
        if feat['type'] == 'peak':
            # Concentric rings around peak — like topographic mountain contours
            num_rings = rng.randint(6, 12)
            for i in range(num_rings):
                r = feat['radius'] * (i + 1) / num_rings
                
                # Organic distortion
                num_pts = rng.randint(20, 35)
                points = []
                for j in range(num_pts):
                    angle = 2 * math.pi * j / num_pts
                    # Base circle + noise
                    noise_r = r + rng.uniform(-r * 0.3, r * 0.3)
                    # Smooth distortion based on angle
                    noise_r += r * 0.15 * math.sin(angle * 3 + seed)
                    noise_r += r * 0.1 * math.cos(angle * 5 + seed * 2)
                    noise_r = max(r * 0.3, noise_r)
                    
                    px = feat['x'] + math.cos(angle) * noise_r
                    py = feat['y'] + math.sin(angle) * noise_r
                    points.append((px, py))
                
                # Close the loop
                points.append(points[0])
                
                # Convert to smooth SVG path
                path_d = smooth_closed_path(points)
                
                sw = rng.uniform(0.3, 0.5)
                op = rng.uniform(0.04, 0.09)
                svg_paths.append(f'<path d="{path_d}" stroke="#96a9d4" stroke-width="{sw:.2f}" fill="none" opacity="{op:.3f}" stroke-linecap="round"/>')
        
        elif feat['type'] == 'ridge':
            # Parallel curves along ridge direction
            num_lines = rng.randint(8, 15)
            cos_a = math.cos(feat['angle'])
            sin_a = math.sin(feat['angle'])
            
            for i in range(num_lines):
                offset = (i - num_lines / 2) * (feat['width'] * 2 / num_lines)
                
                num_pts = rng.randint(15, 25)
                points = []
                for j in range(num_pts):
                    t = j / (num_pts - 1) - 0.5  # -0.5 to 0.5
                    along = t * feat['length']
                    
                    # Base position along ridge
                    bx = feat['x'] + cos_a * along
                    by = feat['y'] + sin_a * along
                    
                    # Perpendicular offset
                    px = bx - sin_a * offset
                    py = by + cos_a * offset
                    
                    # Organic noise
                    px += rng.uniform(-8, 8)
                    py += rng.uniform(-8, 8)
                    
                    # Curve the line ends inward
                    end_falloff = 1 - min(1, abs(t) * 2.5) ** 2
                    px += sin_a * offset * (1 - end_falloff) * 0.5
                    py -= cos_a * offset * (1 - end_falloff) * 0.5
                    
                    points.append((px, py))
                
                path_d = smooth_open_path(points)
                
                sw = rng.uniform(0.25, 0.45)
                op = rng.uniform(0.03, 0.08)
                svg_paths.append(f'<path d="{path_d}" stroke="#96a9d4" stroke-width="{sw:.2f}" fill="none" opacity="{op:.3f}" stroke-linecap="round"/>')
    
    # Add some free-flowing contour lines that span the full card
    # These fill the gaps between terrain features
    num_flow_lines = rng.randint(5, 10)
    for _ in range(num_flow_lines):
        start_y = rng.uniform(h * 0.05, h * 0.95)
        num_pts = rng.randint(25, 40)
        points = []
        
        amp = rng.uniform(15, 50)
        freq = rng.uniform(0.5, 2.0)
        phase = rng.uniform(0, math.pi * 2)
        
        for j in range(num_pts):
            t = j / (num_pts - 1)
            x = t * w
            y = start_y + amp * math.sin(t * freq * math.pi * 2 + phase)
            # Add organic noise
            x += rng.uniform(-3, 3)
            y += rng.uniform(-5, 5)
            # Smooth fade at edges
            edge_fade = min(1, t * 5, (1 - t) * 5)
            points.append((x, y))
        
        path_d = smooth_open_path(points)
        sw = rng.uniform(0.2, 0.4)
        op = rng.uniform(0.03, 0.06)
        svg_paths.append(f'<path d="{path_d}" stroke="#96a9d4" stroke-width="{sw:.2f}" fill="none" opacity="{op:.3f}" stroke-linecap="round"/>')
    
    # Build SVG
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}">
  <rect width="{w}" height="{h}" rx="16" fill="#111225"/>
  <g>
'''
    for p in svg_paths:
        svg += f'    {p}\n'
    svg += '  </g>\n</svg>'
    
    return svg


def smooth_closed_path(points):
    """Convert list of (x,y) points into a smooth closed SVG path using cubic beziers."""
    if len(points) < 4:
        return ''
    
    # Start
    path = f'M{points[0][0]:.1f},{points[0][1]:.1f}'
    
    for i in range(len(points) - 1):
        p0 = points[i - 1] if i > 0 else points[-2]
        p1 = points[i]
        p2 = points[i + 1]
        p3 = points[min(i + 2, len(points) - 1)]
        
        # Smooth curve using Catmull-Rom to Bezier conversion
        tension = 0.25
        cp1x = p1[0] + (p2[0] - p0[0]) * tension
        cp1y = p1[1] + (p2[1] - p0[1]) * tension
        cp2x = p2[0] - (p3[0] - p1[0]) * tension
        cp2y = p2[1] - (p3[1] - p1[1]) * tension
        
        path += f' C{cp1x:.1f},{cp1y:.1f} {cp2x:.1f},{cp2y:.1f} {p2[0]:.1f},{p2[1]:.1f}'
    
    return path + 'Z'


def smooth_open_path(points):
    """Convert list of (x,y) points into a smooth open SVG path using cubic beziers."""
    if len(points) < 4:
        return ''
    
    path = f'M{points[0][0]:.1f},{points[0][1]:.1f}'
    
    for i in range(len(points) - 1):
        p0 = points[i - 1] if i > 0 else points[i]
        p1 = points[i]
        p2 = points[i + 1]
        p3 = points[min(i + 2, len(points) - 1)]
        
        tension = 0.25
        cp1x = p1[0] + (p2[0] - p0[0]) * tension
        cp1y = p1[1] + (p2[1] - p0[1]) * tension
        cp2x = p2[0] - (p3[0] - p1[0]) * tension
        cp2y = p2[1] - (p3[1] - p1[1]) * tension
        
        path += f' C{cp1x:.1f},{cp1y:.1f} {cp2x:.1f},{cp2y:.1f} {p2[0]:.1f},{p2[1]:.1f}'
    
    return path


if __name__ == '__main__':
    # Generate test SVGs with different seeds
    for seed in [7, 42, 123, 256, 500]:
        svg = generate_topo_svg(seed=seed)
        path = f'/tmp/topo_v2_seed{seed}.svg'
        with open(path, 'w') as f:
            f.write(svg)
        print(f"seed={seed}: {len(svg)} bytes → {path}")
