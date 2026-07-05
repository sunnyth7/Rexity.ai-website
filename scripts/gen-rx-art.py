#!/usr/bin/env python3
"""Generate the Rexity abstract artwork set (assets/rx/).
Replaces the Workspace-IT photography with an owned, on-brand SVG art family:
cream field, warm-ink line work, soft violet aurora glows. Deterministic output."""
import math, os

OUT = os.path.join(os.path.dirname(__file__), "..", "rexity-omi", "assets", "rx")
os.makedirs(OUT, exist_ok=True)

PAPER = "#F7F7F4"
INK = "#121110"
VIOLET = "#6456E8"
VIOLET_DEEP = "#37309F"

def defs(dark=False):
    glow_op = ".55" if dark else ".38"
    return f'''<defs>
<radialGradient id="glow" cx="50%" cy="50%" r="50%">
  <stop offset="0%" stop-color="{VIOLET}" stop-opacity="{glow_op}"/>
  <stop offset="55%" stop-color="{VIOLET}" stop-opacity=".14"/>
  <stop offset="100%" stop-color="{VIOLET}" stop-opacity="0"/>
</radialGradient>
<linearGradient id="ribbon" x1="0%" y1="0%" x2="100%" y2="100%">
  <stop offset="0%" stop-color="{VIOLET}" stop-opacity=".9"/>
  <stop offset="100%" stop-color="{VIOLET_DEEP}" stop-opacity=".65"/>
</linearGradient>
<linearGradient id="fade" x1="0%" y1="0%" x2="100%" y2="0%">
  <stop offset="0%" stop-color="{VIOLET}" stop-opacity="0"/>
  <stop offset="50%" stop-color="{VIOLET}" stop-opacity=".8"/>
  <stop offset="100%" stop-color="{VIOLET}" stop-opacity="0"/>
</linearGradient>
</defs>'''

def dots(w, h, gap=56, r=1.1, color=None, op=".16"):
    color = color or INK
    out = [f'<g fill="{color}" opacity="{op}">']
    y = gap
    while y < h - gap / 2:
        x = gap
        while x < w - gap / 2:
            out.append(f'<circle cx="{x}" cy="{y}" r="{r}"/>')
            x += gap
        y += gap
    out.append("</g>")
    return "".join(out)

def waves(w, h, n, y0, amp, color, width=1.6, op=".5", drift=0.0):
    """n stacked sine-ish bezier ribbons."""
    paths = []
    for i in range(n):
        y = y0 + i * (amp * 0.55)
        a = amp * (1 - i * 0.08)
        d = f"M {-w*0.05:.0f} {y:.0f} "
        seg = w / 3.0
        for s in range(4):
            x1 = -w*0.05 + seg * (s + 0.35) + drift * i
            x2 = -w*0.05 + seg * (s + 0.75) + drift * i
            xe = -w*0.05 + seg * (s + 1)
            dy = a if s % 2 == 0 else -a
            d += f"C {x1:.0f} {y+dy:.0f} {x2:.0f} {y-dy:.0f} {xe:.0f} {y:.0f} "
        o = float(op) * (1 - i / (n + 2))
        paths.append(f'<path d="{d}" fill="none" stroke="{color}" stroke-width="{width}" opacity="{o:.2f}"/>')
    return "".join(paths)

def svg(name, w, h, body, dark=False):
    bg = INK if dark else PAPER
    doc = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" '
           f'role="img" aria-label="Abstract Rexity artwork">'
           f'{defs(dark)}<rect width="{w}" height="{h}" fill="{bg}"/>{body}</svg>')
    with open(os.path.join(OUT, name), "w") as f:
        f.write(doc)
    print(name, len(doc))

def frame(w, h, dark=False):
    c = PAPER if dark else INK
    return f'<rect x="1" y="1" width="{w-2}" height="{h-2}" fill="none" stroke="{c}" opacity=".12" stroke-width="2"/>'

# ---- hero (1600x893, dark) ----------------------------------------------
body = f'<ellipse cx="1180" cy="300" rx="640" ry="430" fill="url(#glow)"/>'
body += dots(1600, 893, gap=64, color=PAPER, op=".10")
body += waves(1600, 893, 9, 380, 130, PAPER, width=1.4, op=".38", drift=26)
body += f'<path d="M -60 640 C 320 470 620 780 980 600 C 1260 460 1420 560 1680 430" fill="none" stroke="url(#ribbon)" stroke-width="4"/>'
body += f'<circle cx="1180" cy="300" r="7" fill="{VIOLET}"/><circle cx="1180" cy="300" r="17" fill="none" stroke="{VIOLET}" opacity=".5"/><circle cx="1180" cy="300" r="30" fill="none" stroke="{VIOLET}" opacity=".22"/>'
svg("rx-hero.svg", 1600, 893, body, dark=True)

# ---- service cards (445x370 family, rendered 890x740) --------------------
CW, CH = 890, 740
def card(name, motif):
    b = f'<ellipse cx="640" cy="180" rx="420" ry="300" fill="url(#glow)"/>'
    b += dots(CW, CH, gap=58, op=".13")
    b += motif
    b += frame(CW, CH)
    svg(name, CW, CH, b)

# web: browser window + flowing content lines
m = f'<rect x="165" y="150" width="560" height="420" rx="22" fill="none" stroke="{INK}" stroke-width="2.5" opacity=".82"/>'
m += f'<line x1="165" y1="226" x2="725" y2="226" stroke="{INK}" stroke-width="2" opacity=".4"/>'
m += f'<circle cx="205" cy="188" r="7" fill="{VIOLET}"/><circle cx="233" cy="188" r="7" fill="{INK}" opacity=".3"/><circle cx="261" cy="188" r="7" fill="{INK}" opacity=".3"/>'
m += waves(560, 260, 4, 120, 44, INK, op=".45", drift=18).replace('<path d="M -28', '<path transform="translate(193,190)" d="M -28')
m += f'<path transform="translate(193,190)" d="M -10 210 C 130 150 250 260 400 180 C 480 140 520 170 560 150" fill="none" stroke="url(#ribbon)" stroke-width="3.5"/>'
card("rx-web.svg", m)

# apps: two phone outlines
m = f'<rect x="270" y="140" width="200" height="420" rx="34" fill="none" stroke="{INK}" stroke-width="2.5" opacity=".82"/>'
m += f'<rect x="470" y="230" width="180" height="380" rx="30" fill="none" stroke="{INK}" stroke-width="2" opacity=".45"/>'
m += f'<line x1="330" y1="180" x2="410" y2="180" stroke="{INK}" stroke-width="3" opacity=".5" stroke-linecap="round"/>'
m += f'<circle cx="370" cy="500" r="16" fill="none" stroke="{VIOLET}" stroke-width="2.5"/>'
m += f'<path d="M 300 300 C 340 260 400 340 440 300" fill="none" stroke="url(#fade)" stroke-width="3"/>'
m += f'<path d="M 300 360 C 340 320 400 400 440 360" fill="none" stroke="url(#fade)" stroke-width="3" opacity=".6"/>'
card("rx-apps.svg", m)

# automation: node graph
nodes = [(230, 420), (400, 250), (400, 540), (600, 380), (720, 220)]
m = ""
for (x1, y1), (x2, y2) in [(nodes[0], nodes[1]), (nodes[0], nodes[2]), (nodes[1], nodes[3]), (nodes[2], nodes[3]), (nodes[3], nodes[4])]:
    mx = (x1 + x2) / 2
    m += f'<path d="M {x1} {y1} C {mx} {y1} {mx} {y2} {x2} {y2}" fill="none" stroke="{INK}" stroke-width="2" opacity=".5"/>'
for i, (x, y) in enumerate(nodes):
    if i == 3:
        m += f'<circle cx="{x}" cy="{y}" r="15" fill="{VIOLET}"/><circle cx="{x}" cy="{y}" r="28" fill="none" stroke="{VIOLET}" opacity=".4" stroke-width="2"/>'
    else:
        m += f'<circle cx="{x}" cy="{y}" r="11" fill="none" stroke="{INK}" stroke-width="2.5" opacity=".8"/>'
card("rx-automation.svg", m)

# voice: waveform bars + arcs
m = ""
heights = [40, 90, 150, 220, 160, 260, 190, 120, 200, 150, 90, 60]
for i, hgt in enumerate(heights):
    x = 210 + i * 42
    m += f'<rect x="{x}" y="{360-hgt/2:.0f}" width="8" height="{hgt}" rx="4" fill="{INK if i%3 else VIOLET}" opacity="{".85" if i%3==0 else ".55"}"/>'
m += f'<path d="M 180 360 A 260 260 0 0 1 700 360" fill="none" stroke="{INK}" opacity=".25" stroke-width="1.8"/>'
m += f'<path d="M 240 360 A 200 200 0 0 1 640 360" fill="none" stroke="{INK}" opacity=".18" stroke-width="1.8"/>'
card("rx-voice.svg", m)

# qa: concentric rings + check
m = f'<circle cx="445" cy="360" r="190" fill="none" stroke="{INK}" stroke-width="2" opacity=".7"/>'
m += f'<circle cx="445" cy="360" r="150" fill="none" stroke="{INK}" stroke-width="1.6" opacity=".4"/>'
m += f'<circle cx="445" cy="360" r="230" fill="none" stroke="{INK}" stroke-width="1.4" opacity=".22"/>'
m += f'<path d="M 385 360 L 430 408 L 515 310" fill="none" stroke="{VIOLET}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>'
m += f'<circle cx="640" cy="212" r="6" fill="{VIOLET}"/>'
card("rx-qa.svg", m)

# apps-wide (900x749): dashboard tiles
b = f'<ellipse cx="650" cy="200" rx="430" ry="300" fill="url(#glow)"/>' + dots(900, 749, gap=58, op=".13")
b += f'<rect x="150" y="170" width="360" height="240" rx="20" fill="none" stroke="{INK}" stroke-width="2.5" opacity=".8"/>'
b += f'<rect x="540" y="170" width="210" height="240" rx="20" fill="none" stroke="{INK}" stroke-width="2" opacity=".45"/>'
b += f'<rect x="150" y="440" width="600" height="140" rx="20" fill="none" stroke="{INK}" stroke-width="2" opacity=".45"/>'
b += f'<path d="M 180 350 C 250 290 320 380 480 300" fill="none" stroke="url(#ribbon)" stroke-width="3.5"/>'
b += f'<circle cx="645" cy="290" r="34" fill="none" stroke="{VIOLET}" stroke-width="3"/><circle cx="645" cy="290" r="6" fill="{VIOLET}"/>'
b += waves(560, 100, 2, 500, 26, INK, op=".5", drift=12).replace('<path d="M -28', '<path transform="translate(208,10)" d="M -28')
b += frame(900, 749)
svg("rx-apps-wide.svg", 900, 749, b)

# seo (1297x634): rising curve + bars
b = f'<ellipse cx="960" cy="170" rx="480" ry="280" fill="url(#glow)"/>' + dots(1297, 634, gap=60, op=".13")
for i, hgt in enumerate([90, 140, 200, 270, 350]):
    x = 260 + i * 130
    b += f'<rect x="{x}" y="{520-hgt}" width="14" height="{hgt}" rx="7" fill="{INK}" opacity="{.28+i*.12:.2f}"/>'
b += f'<path d="M 220 470 C 420 430 560 360 760 280 C 900 224 1000 190 1100 150" fill="none" stroke="url(#ribbon)" stroke-width="4"/>'
b += f'<circle cx="1100" cy="150" r="8" fill="{VIOLET}"/><circle cx="1100" cy="150" r="20" fill="none" stroke="{VIOLET}" opacity=".45" stroke-width="2"/>'
b += frame(1297, 634)
svg("rx-seo.svg", 1297, 634, b)

# flow (1920x1438): large soothing aurora
b = f'<ellipse cx="1400" cy="420" rx="800" ry="560" fill="url(#glow)"/>'
b += dots(1920, 1438, gap=72, op=".12")
b += waves(1920, 1438, 12, 560, 170, INK, width=1.5, op=".4", drift=30)
b += f'<path d="M -80 1000 C 420 780 820 1160 1280 900 C 1580 730 1760 820 2000 660" fill="none" stroke="url(#ribbon)" stroke-width="5"/>'
b += frame(1920, 1438)
svg("rx-flow.svg", 1920, 1438, b)

# studio-1 (1920x1282, dark)
b = f'<ellipse cx="620" cy="900" rx="760" ry="520" fill="url(#glow)"/>'
b += dots(1920, 1282, gap=68, color=PAPER, op=".10")
b += waves(1920, 1282, 10, 500, 150, PAPER, width=1.4, op=".34", drift=24)
b += f'<path d="M -80 820 C 480 640 900 960 1380 760 C 1660 645 1800 700 2000 580" fill="none" stroke="url(#ribbon)" stroke-width="4.5"/>'
svg("rx-studio-1.svg", 1920, 1282, b, dark=True)

# studio-2 (1920x1278): cream arcs
b = f'<ellipse cx="960" cy="500" rx="820" ry="560" fill="url(#glow)"/>' + dots(1920, 1278, gap=68, op=".12")
for i in range(7):
    r = 220 + i * 95
    b += f'<path d="M {960-r} 700 A {r} {r} 0 0 1 {960+r} 700" fill="none" stroke="{INK}" stroke-width="1.8" opacity="{.5-i*.055:.2f}"/>'
b += f'<path d="M 500 700 A 460 460 0 0 1 1420 700" fill="none" stroke="url(#fade)" stroke-width="4"/>'
b += f'<circle cx="960" cy="240" r="7" fill="{VIOLET}"/>'
b += frame(1920, 1278)
svg("rx-studio-2.svg", 1920, 1278, b)

# avatars (800x800): abstract duotone orbs
def avatar(name, seed):
    b = f'<rect width="800" height="800" fill="{INK}"/>'
    cx, cy = 400 + seed * 40 - 80, 340 + (seed % 2) * 60
    b += f'<ellipse cx="{cx}" cy="{cy}" rx="430" ry="380" fill="url(#glow)"/>'
    b += dots(800, 800, gap=62, color=PAPER, op=".09")
    for i in range(5):
        r = 120 + i * 62
        rot = seed * 28 + i * 14
        b += (f'<circle cx="400" cy="420" r="{r}" fill="none" stroke="{PAPER}" '
              f'stroke-width="1.6" opacity="{.4-i*.06:.2f}" stroke-dasharray="{60+seed*30} {90+i*40}" '
              f'transform="rotate({rot} 400 420)"/>')
    b += f'<circle cx="400" cy="420" r="66" fill="{VIOLET}" opacity=".9"/>'
    b += f'<circle cx="400" cy="420" r="96" fill="none" stroke="{VIOLET}" opacity=".45" stroke-width="2"/>'
    svg(name, 800, 800, b, dark=True)

avatar("rx-avatar-2.svg", 1)
avatar("rx-avatar-3.svg", 2)
avatar("rx-avatar-4.svg", 3)

# tick (100x100)
b = f'<circle cx="50" cy="50" r="46" fill="{VIOLET}"/>'
b += f'<path d="M 30 51 L 44 66 L 72 36" fill="none" stroke="{PAPER}" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>'
svg("rx-tick.svg", 100, 100, b)

print("done ->", os.path.abspath(OUT))
