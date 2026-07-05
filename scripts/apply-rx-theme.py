#!/usr/bin/env python3
"""Apply the Rexity re-theme to the legacy Workspace-IT page export.
- Recolors the copied vendor CSS + inline styles/scripts to the Rexity palette.
- Swaps Poppins/Open Sans/Lato/Source Sans Pro for Space Grotesk/Inter
  (font-usage rules only — @font-face files in google-fonts.css are untouched,
  so the old font binaries simply stop being requested).
- Replaces every WSIT-origin image reference with the owned rx/ SVG art set.
- Swaps the WSIT-logo favicons for the Rexity brand set.
- Removes the two sections carrying WSIT's real client testimonials.
- Links the self-hosted font CSS + rexity-theme.css after the vendor CSS.
Idempotent: running twice yields the same result."""
import re, os, sys

ROOT = os.path.join(os.path.dirname(__file__), "..", "rexity-omi")
HTML = os.path.join(ROOT, "omi", "it-page-anim.html")
CSS_DIR = os.path.join(ROOT, "assets", "vendor", "css")
SWEEP_CSS = ["universal.css", "45.css", "10.css", "1569.css", "oxygen.css",
             "contact-form-7.css", "formidable.css"]

COLORS = {
    "#00b057": "#6456E8",   # WSIT green -> violet
    "#00B057": "#6456E8",
    "#1e73be": "#6456E8",   # WSIT blue -> violet
    "#1E73BE": "#6456E8",
    "#004a89": "#37309F",   # WSIT deep blue -> deep violet
    "#004A89": "#37309F",
    "#1e2432": "#121110",   # WSIT navy -> warm ink
    "#1E2432": "#121110",
    "#F9F9F9": "#F7F7F4",   # WSIT off-white -> Rexity paper
    "#f9f9f9": "#F7F7F4",
    "#f6f8ff": "#F7F7F4",
}
FONTS = {
    "'Poppins'": "'Space Grotesk'",
    '"Poppins"': '"Space Grotesk"',
    "Poppins,": "'Space Grotesk',",
    "'Open Sans'": "'Inter'",
    '"Open Sans"': '"Inter"',
    "'Source Sans Pro'": "'Inter'",
    "'Lato'": "'Inter'",
}
IMAGES = {
    "expert-it": "rx-hero",
    "Digital-Workspaces-1": "rx-web",
    "End-User-Device-Management-1": "rx-apps-wide",
    "End-User-Device-Management": "rx-apps",
    "Application-Management-Service": "rx-automation",
    "Digital-Employee-Experience": "rx-voice",
    "syshealth": "rx-qa",
    "Workspace-IT-Managed-IT-Services-End-User-Device-Management": "rx-seo",
    "Proactive-Innovation": "rx-flow",
    "christina-wocintechchat-com-0Nfqp0WiJqc-unsplash-1": "rx-studio-1",
    "getty-images-K-MQKeVplP0-unsplash": "rx-studio-2",
    "Col-e_1": "rx-avatar-2",
    "DanG_1": "rx-avatar-3",
    "Janet_NewPic_Scaled": "rx-avatar-4",
    "wit-tick": "rx-tick",
}

def sweep(text):
    for old, new in COLORS.items():
        text = text.replace(old, new)
    for old, new in FONTS.items():
        text = text.replace(old, new)
    return text

for name in SWEEP_CSS:
    p = os.path.join(CSS_DIR, name)
    src = open(p, encoding="utf-8", errors="replace").read()
    out = sweep(src)
    if out != src:
        open(p, "w", encoding="utf-8").write(out)
        print(f"recolored {name}")

h = open(HTML, encoding="utf-8", errors="replace").read()
orig_len = len(h)
h = sweep(h)

# image swaps (covers plain src and every -WxH srcset variant)
for base, new in IMAGES.items():
    h = re.sub(
        re.escape("assets/it/img/" + base) + r"(-\d+x\d+)?\.(jpg|jpeg|png)",
        "assets/rx/" + new + ".svg",
        h,
    )

# favicons: WSIT logo -> Rexity brand set
h = h.replace("assets/it/img/cropped-wit-logo-1-1-32x32.png", "assets/brand/final/favicon-32.png")
h = h.replace("assets/it/img/cropped-wit-logo-1-1-192x192.png", "assets/brand/final/web-app-icon-192.png")
h = h.replace("assets/it/img/cropped-wit-logo-1-1-180x180.png", "assets/brand/final/apple-touch-icon.png")
h = h.replace("assets/it/img/cropped-wit-logo-1-1-270x270.png", "assets/brand/final/web-app-icon-192.png")

# drop the sections that still carry WSIT's real client testimonials
start = h.find('<section id="section-71-1569"')
if start != -1:
    footer = h.find("<!-- WP_FOOTER -->")
    end = h.rindex("</section>", start, footer) + len("</section>")
    h = h[:start] + h[end:]
    print(f"removed testimonial sections ({end - start} bytes)")

# theme CSS after the last vendor stylesheet so it wins the cascade
UNIVERSAL = "<link rel='stylesheet' id='oxygen-universal-styles-css' href='/rexity-omi/assets/vendor/css/universal.css' media='all' />"
THEME_LINKS = (
    UNIVERSAL
    + "\n<link rel='stylesheet' id='rx-inter-css' href='/rexity-omi/assets/vendor/css/inter.css' media='all' />"
    + "\n<link rel='stylesheet' id='rx-space-grotesk-css' href='/rexity-omi/assets/vendor/css/space-grotesk.css' media='all' />"
    + "\n<link rel='stylesheet' id='rx-theme-css' href='/rexity-omi/assets/vendor/css/rexity-theme.css' media='all' />"
)
if "rexity-theme.css" not in h:
    if UNIVERSAL not in h:
        sys.exit("ERROR: universal.css link not found — cannot anchor theme CSS")
    h = h.replace(UNIVERSAL, THEME_LINKS)
    print("linked fonts + rexity-theme.css")

open(HTML, "w", encoding="utf-8").write(h)
print(f"it-page-anim.html rewritten ({orig_len} -> {len(h)} bytes)")

leftovers = sorted(set(re.findall(r"assets/it/img/[\w./-]+", h)))
print("remaining assets/it/img refs:")
for r in leftovers:
    print(" ", r)
