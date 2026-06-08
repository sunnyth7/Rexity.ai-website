# Sprint L — Legal pages parity + multi-domain rollout

Date: 2026-06-06 (rev 2 — post-benchmark update)
Owner: Sunny Thakur
Companion docs: `RPA_SPRINT_PLAN.md`, `Rexity-Compliance-Checklist.docx`

## Why this sprint exists

We benchmarked our legal stack against two reference sites:

1. **[baeckerei-meyer.de](https://baeckerei-meyer.de)** — mature DE GmbH, broad footer (5 links), good baseline for §-references and AEB shape.
2. **[aicx.de](https://www.aicx.de)** — closest peer (small Munich AI agency, KI-Agenten + WhatsApp + voice integration via ElevenLabs), B2B-only, two-part AGB with rich AI-specific clauses.

What that comparison revealed (full matrix in §6 below):

- 🟩 **We win on**: BFSG / Barrierefreiheit, WhatsApp + Voice depth, audit/redaction posture, defensive posture (noindex + banner).
- 🟧 **Real gap #1 — AGB substance**: aicx ships AI-specific clauses (output IP, hallucination disclaimer, training data, telemetry, fair-use limits). We have none.
- 🟧 **Real gap #2 — 3rd-party tool transparency**: aicx names every external tool in Datenschutz (Analytics, Maps, YouTube, Framer, Mailchimp, Zoom, Meet, WhatsApp, ElevenLabs…). We name 2.
- 🟦 **Open formalities**: entity (HRB / USt-IdNr.) blocked on UG-Eintragung; resolves itself.

This rev2 plan keeps everything from rev1 and adds the items needed to close those gaps. Nothing gets left behind, nice-to-haves included.

We do NOT copy text verbatim — copyright + factually-wrong + plagiarism-scanner-bait. We copy structure only.

---

## Phase L0 — DONE (foundation, 2026-06-06)

| # | ID | Task | Status |
|---|---|---|---|
| 1 | L0-T1 | Create `/agb` skeleton (12 §§, Entwurf, IT-Dienstleistungen B2B) | ✅ DONE |
| 2 | L0-T2 | Create `/aeb` skeleton (8 §§, purchasing terms) | ✅ DONE |
| 3 | L0-T3 | Create `/barrierefreiheit` (BFSG, EN 301 549, WCAG 2.1 AA) | ✅ DONE |
| 4 | L0-T4 | Add DSB notice + Server-Log paragraph to `/datenschutz` | ✅ DONE |
| 5 | L0-T5 | Add 5-link footer strip across legal pages | ✅ DONE |
| 6 | L0-T6 | Confirm Vercel clean URLs resolve `/agb`, `/aeb`, `/barrierefreiheit` | ✅ DONE (200 verified) |
| 7 | L0-T7 | Add same package to: asogrove.com, www.levelkraft.de, clevr.social | ⏳ next sprint slice |
| 8 | L0-T8 | Verify all footer links 200 across all 4 domains | ✅ rexity.ai done; 3 others pending L0-T7 |

---

## Phase L0.5 — Substance gap closure  ✅ **DONE (2026-06-06)**

Triggered by aicx.de benchmark. All 10 items shipped in commit `1723d51`.

| # | ID | Task | Status |
|---|---|---|---|
| 1 | L0.5-T1 | **§ 3a Mitwirkungspflichten bei KI-Leistungen** in `/agb` — clean training data, no PII without AVV, customer reviews outputs | ✅ DONE |
| 2 | L0.5-T2 | **§ 6a Spezielle Regelungen für KI-gestützte Leistungen** — (1) Output-IP for customer, (2) Hallucination disclaimer, (3) Telemetry on pseudonymized data, (4) Inputs not used for 3rd-party model training, (5) Fair-use + abuse protection | ✅ DONE |
| 3 | L0.5-T3 | **§ 6b Hoch-Risiko-Themen** — pricing / legal / medical / contract / delivery commitments require human verification | ✅ DONE |
| 4 | L0.5-T4 | **Teil II SaaS placeholder** in `/agb` (mirrors aicx two-part structure) — placeholder text explains activation trigger | ✅ DONE |
| 5 | L0.5-T5 | **3rd-party tool audit** — `/datenschutz` §5.1 active (Vercel, Neon, Analytics, Google Fonts, Tailwind CDN, GitHub), §5.2 planned, §5.3 explicit NOT-used list; PROCESSORS.md mirrored | ✅ DONE |
| 6 | L0.5-T6 | **Cookie/consent strategy** — new §5a in Datenschutz documents no advertising cookies, language-localStorage as § 25 Abs. 2 TTDSG einwilligungsfrei, plan for consent-manager when tracking is added | ✅ DONE |
| 7 | L0.5-T7 | **§ 18 Abs. 2 MStV** "Verantwortlich für Inhalt" already present in Impressum (placeholder pending UG) | ✅ DONE |
| 8 | L0.5-T8 | **TMG §§ 7–10 boilerplate** added to Impressum: Haftung für Inhalte + Haftung für Links + Urheberrecht | ✅ DONE |
| 9 | L0.5-T9 | **Art. 28 DSGVO AVV note** prominent at top of Datenschutz §5 | ✅ DONE |
| 10 | L0.5-T10 | Multi-domain rollout matrix updated to track these new items per domain | ✅ DONE (see §7 below) |

### Sample text for L0.5-T2 (drop-in skeleton)

```
§ 6a Spezielle Regelungen für KI-gestützte Leistungen

(1) Outputs von KI-Modellen, KI-Agenten oder Sprachassistenten,
    die im Rahmen der Leistung erzeugt werden, stehen ausschließlich
    dem Auftraggeber zur unbeschränkten Verwendung zur Verfügung —
    eingeschränkt nur durch zwingende Rechte Dritter.

(2) Die Auftragnehmerin gibt keine Gewähr für die inhaltliche
    Richtigkeit, Vollständigkeit oder Aktualität von Modellausgaben.
    Modellausgaben sind vor produktiver Verwendung durch den
    Auftraggeber zu prüfen.

(3) Zur Qualitätssicherung und Weiterentwicklung der Plattform ist
    die Auftragnehmerin berechtigt, pseudonymisierte Nutzungs- und
    Telemetriedaten zu verarbeiten. Personenbezogene Daten werden
    gemäß /datenschutz §6 redaktioniert.

(4) Bei missbräuchlicher Nutzung (z. B. Umgehung der Rate-Limits,
    Versuche der Modell-Manipulation) ist die Auftragnehmerin zur
    sofortigen Drosselung oder Sperrung berechtigt.

(5) Outputs zu Themen mit hohem Risiko (Preisangaben, rechtliche
    Bewertung, medizinische Auskunft, Vertragsabschlüsse mit Dritten)
    verbleiben in jedem Fall menschlich verifiziert; eine automatische
    KI-Antwort hat insoweit unverbindlichen Charakter.
```

These exact §§ get refined by the IT-Recht specialist; this is the v0.2 draft.

---

## Phase L1 — This week (lawyer review + entity finalization)

| # | ID | Task | Owner |
|---|---|---|---|
| 1 | L1-T1 | Send L0 + L0.5 deliverables to Kaupat (he reviews Impressum, Datenschutz, Barrierefreiheit, AEB; refers AGB) | You |
| 2 | L1-T2 | Send AGB (with L0.5 AI clauses) to IT-Recht specialist | You |
| 3 | L1-T3 | Fill Impressum placeholders (Anschrift, Vertretung, HRB, USt-IdNr.) — depends on UG-Eintragung | You + Kaupat |
| 4 | L1-T4 | Get Kaupat's written opinion on RoPA (Art. 30 DSGVO) requirement at our scale | You + Kaupat |
| 5 | L1-T5 | Get IT-Recht opinion on whether we need a **two-part AGB** (Services vs. Platform) before launching any SaaS feature | You + Specialist |
| 6 | L1-T6 | Confirm with Specialist: is the hallucination disclaimer (§ 6a Abs. 2) actually enforceable under DE consumer / B2B law? | You + Specialist |
| 7 | L1-T7 | Confirm with Specialist: telemetry / training-data licensing clause (§ 6a Abs. 3) — does it survive § 307 BGB AGB-Kontrolle? | You + Specialist |

---

## Phase L2 — Pre-launch (before removing noindex)

| # | ID | Task |
|---|---|---|
| 1 | L2-T1 | Apply lawyer feedback to all legal texts |
| 2 | L2-T2 | Run BIK BITV-Test or WCAG-EM Audit against the live homepage; update Barrierefreiheitserklärung with real gap list |
| 3 | L2-T3 | Confirm AGB is referenced + accepted in: contact form, SOW signing flow, any future signup flow |
| 4 | L2-T4 | Confirm all 4 properties have lawyer-approved final texts |
| 5 | L2-T5 | Remove `noindex,nofollow` meta tags across all 4 domains |
| 6 | L2-T6 | Drop "Review underway" banner |
| 7 | L2-T7 | Update PROCESSORS.md with final entity name (no "i. Gr.") |
| 8 | L2-T8 | Update Word docs for Kaupat / specialist with finalized texts |
| 9 | L2-T9 | **Implement consent management tool** if any tracking has been added by then (Klaro, Cookiebot, Usercentrics, or Framer-equivalent) |
| 10 | L2-T10 | Add `<link rel="canonical">` and `<meta property="og:*">` to each legal page (small SEO hygiene that aicx and Meyer both have) |
| 11 | L2-T11 | Add `/sitemap.xml` entries for all 5 legal pages |
| 12 | L2-T12 | Verify each legal page loads under 1.5s on 3G (BFSG / accessibility-adjacent) |

---

## Phase L3 — Ongoing / recurring (calendar these)

| Cadence | Task |
|---|---|
| **Monthly** | Quick scan of `aicx.de` legal pages — they revise; we don't want to fall behind |
| **Monthly** | Review `npm audit` of frontend deps — Cyber-Versicherung claim posture |
| **Quarterly** | Read DSGVO / TTDSG / UWG / BFSG / AI Act news; update legal texts if any change |
| **Quarterly** | Re-run BITV / WCAG self-test; update Barrierefreiheitserklärung "Stand" date + gap list |
| **Quarterly** | 3rd-party tool audit — anything new in the stack? Add to Datenschutz §5 + PROCESSORS.md within 30 days |
| **Annually** | Lawyer re-review of all 5 legal pages (€200–€500 Pauschale) |
| **Annually** | Rotate `ADMIN_API_TOKEN`, `WHATSAPP_APP_SECRET`, `VOICE_APP_SECRET` |
| **Annually** | Renew insurance policies; benchmark against market |
| **When AGB changes** | Bump version number; archive previous version under `/agb/v[X]`; email active customers if changes affect them |
| **When sub-processor added/removed** | 30-day notice to active customers; update `PROCESSORS.md` and `/datenschutz` §5 |
| **When entity status changes** | Drop "i. Gr." across all pages; update Impressum HRB / USt-IdNr.; update DPAs in our name |

---

## Phase L4 — Nice-to-haves (later, only when triggered)

These don't block launch but should be in our heads.

| # | ID | Task | Trigger |
|---|---|---|---|
| 1 | L4-T1 | Full **Cookie-Consent-Manager** (Klaro / Cookiebot / Usercentrics / Borlabs) | We add any tracking (GA4, Meta Pixel, Hotjar, LinkedIn Insight, etc.) |
| 2 | L4-T2 | **Newsletter Datenschutz-Sektion** + Double-Opt-In flow | We launch newsletter |
| 3 | L4-T3 | **Job-Application Datenschutz-Sektion** | We post a Karriere page |
| 4 | L4-T4 | **Bewerber-Daten-Aufbewahrung** clause (max 6 months unless candidate consents to talent-pool) | Same trigger as L4-T3 |
| 5 | L4-T5 | **DSGVO-Hinweis für Kontaktformular** inline next to submit button (best practice) | Contact form goes live with real backend |
| 6 | L4-T6 | **Verzeichnis von Verarbeitungstätigkeiten (RoPA, Art. 30)** internal doc | >20 employees OR sensitive-data processing |
| 7 | L4-T7 | **Cookie-Banner-Test** with @consentbit / @cookiebot test mode | After L4-T1 |
| 8 | L4-T8 | Convert legal pages to a **versioned record** (`/agb`, `/agb/v1`, `/agb/v2` etc.) so changes are tracked publicly | First contractual change after launch |
| 9 | L4-T9 | **Trust-Center page** (`/trust`) — aggregates: Datenschutz · PROCESSORS · TOMs · Status / Uptime · Vulnerability Reporting | First enterprise prospect asks for "security review" |
| 10 | L4-T10 | **TOM-Beschreibung (Art. 32 DSGVO)** as standalone customer-facing document | First enterprise customer signs AVV |
| 11 | L4-T11 | **Vulnerability Disclosure / `/security.txt`** at `/.well-known/security.txt` | Optional; cheap win |
| 12 | L4-T12 | **AI Act Disclosure Card** — separate page describing risk category (limited risk chatbot) | AI Act enforcement starts hitting agencies (~mid 2026) |
| 13 | L4-T13 | **Customer-facing DPA template** ready to send when prospects ask | First customer asks for an AVV (will happen) |
| 14 | L4-T14 | **EN-language Datenschutz translation** | We start marketing internationally |
| 15 | L4-T15 | **Status page** at `status.rexity.ai` (Better Stack / Statuspage) | First customer SLA requires it |
| 16 | L4-T16 | **Cookie policy as separate page** (instead of inline in Datenschutz) | After L4-T1 |
| 17 | L4-T17 | **`/legal` index page** linking everything | Any time after L0 closes |
| 18 | L4-T18 | **OpenGraph cards** + favicon parity across all 4 domains | Marketing-readiness milestone |

---

## 6. Three-way benchmark matrix (rev 2 reference)

| Dimension | 🥨 Bäckerei Meyer | 🤖 aicx.de | 🟪 Rexity (now) |
|---|---|---|---|
| **Footer link count** | 5 | 3 | **5** ✓ |
| **Entity completeness** | HRB 100142, USt-IdNr., HWK Lüneburg-Stade | HRB 293476 München, USt-IdNr., MD | Placeholders pending UG |
| **Verantwortlich-§55-Line** | ✅ | implicit | ✅ |
| **TMG §§7-10 Liability boilerplate** | ✅ | ✅ | ✅ |
| **DSB section in Datenschutz** | ✅ | ❌ | ✅ |
| **Server-Logs disclosed** | ✅ | 14 days | ✅ 30 days |
| **3rd-party tool transparency** | Facebook Pixel, Matomo, TYPO3 | **12+ tools** | ✅ 6 active + planned + NOT-used list |
| **Cookie consent manager** | ✅ (Facebook + Matomo opt-out) | ✅ Framer | Notice only (no tracking yet; trigger L4-T1 if added) |
| **AGB structure** | 10 §§ bakery | 2-part (Services + Platform) | ✅ 14 §§ + Teil II placeholder |
| **AGB B2B/B2C** | Both | B2B only | B2B only |
| **AI output IP clause** | N/A | ✅ | ✅ § 6a Abs. 1 |
| **Hallucination disclaimer** | N/A | ✅ | ✅ § 6a Abs. 2 |
| **Training-data licensing** | N/A | ✅ | ✅ § 6a Abs. 4 (inputs NOT used for 3rd-party training) |
| **Telemetry clause** | N/A | ✅ | ✅ § 6a Abs. 3 |
| **Fair-use rate limits** | N/A | ✅ | ✅ § 6a Abs. 5 |
| **High-risk topics carve-out** | N/A | ⚠️ partial | ✅ § 6b (6 topic types listed) |
| **AEB** | ✅ food-supplier | ❌ | ✅ generic |
| **Barrierefreiheit (BFSG)** | ✅ | ❌ (risk) | ✅ |
| **WhatsApp specifics** | N/A | listed as tool | full opt-out flow + suppression model |
| **Voice / Sprachassistenz specifics** | N/A | mentions ElevenLabs | full Rexona consent + no-record default |
| **Pseudonymized audit logs** | N/A | telemetry mention | ✅ explicit §6 + redaction rules |
| **DSAR endpoint disclosed** | ❌ | email-only | ✅ endpoint-based |
| **noindex / "Review underway" banner** | ❌ | ❌ | ✅ |

---

## 7. Multi-domain rollout matrix (rev 2)

Each row tracks the full L0 + L0.5 package per property.

| Domain | Banner | Imp. | Daten. | AGB v0.1 | AGB v0.2 (AI §§) | AEB | Barr. | Tool list | TMG §§ boilerplate | Footer 5-strip |
|---|---|---|---|---|---|---|---|---|---|---|
| rexity.ai | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| asogrove.com | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |
| www.levelkraft.de | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |
| clevr.social | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ | ⏳ |

The 3 sister sites get a slimmer footer package (Impressum + Datenschutz only — they're marketing pages with no contract surface). AGB / AEB / Barrierefreiheit aren't strictly needed there because no transactions happen on them. We'll confirm this with Kaupat in L1-T1.

---

## 8. Acceptance criteria for "Sprint L done"

### Hard requirements (no launch without these)
- [ ] All 5 legal pages live on rexity.ai at clean URLs ✅
- [ ] Footer strip on every page (legal pages + homepage) ✅
- [ ] L0.5-T1..T9 substance gap closures shipped as v0.2 drafts
- [ ] Kaupat engaged via written Mandat
- [ ] IT-Recht specialist engaged for AGB (esp. AI clauses)
- [ ] All texts marked "Entwurf zur juristischen Prüfung" until lawyer signoff
- [ ] Specialist confirmation that AI clauses (output IP, hallucination, training data, telemetry, fair-use) pass § 307 BGB AGB-Kontrolle
- [ ] 3rd-party tool inventory complete and reflected in Datenschutz + PROCESSORS.md
- [ ] Impressum placeholders filled (depends on UG-Eintragung)
- [ ] Same minimum package replicated on asogrove.com / levelkraft.de / clevr.social
- [ ] BIK BITV-Test or WCAG-EM Audit completed; Barrierefreiheitserklärung updated with real findings
- [ ] All sprint plan rows above flipped to ✅

### Soft requirements (do before marketing channels open)
- [ ] L4-T11 `/security.txt` published
- [ ] L4-T8 versioned legal pages enabled
- [ ] L4-T13 customer AVV template ready
- [ ] L4-T17 `/legal` index page
- [ ] Insurance policies (Berufsrechtsschutz + IT-Haftpflicht) active per `RPA_SPRINT_PLAN.md`

### Track but don't gate launch
- [ ] L4-T9 Trust-center page
- [ ] L4-T12 AI Act disclosure card
- [ ] L4-T14 EN translation of Datenschutz
- [ ] L4-T15 status page

---

_Rev 2 changes (2026-06-06): added Phase L0.5 (10 substance tasks), Phase L4 (18 nice-to-haves), §6 benchmark matrix, updated rollout matrix._
