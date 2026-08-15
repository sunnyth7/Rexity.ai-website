# Niedersachsen Local-SEO Sprint — Implementation Plan

Owner: Rexity Labs UG (haftungsbeschränkt) i. G. · Willighäuser Weg 11, 29320 Südheide
Status: planned (not yet built). Prereq shipped: indexing unblocked, commit `43215bf`.

## Ground rules

Rexity has **one real address** (Südheide, Landkreis Celle) and **no branch offices**.
Everything below is built as a **service-area** business, not as fake locations.

- No doorway pages. A city page ships only when it has genuinely unique content —
  a real project, a named local reference, a regional angle. If we cannot write
  800+ words a human would actually read, the page does not ship.
- No fake NAP. Google Business Profile uses the Südheide address with a declared
  service area. No "office" in Hannover we do not have.
- No city-name-swapped templates. Google classifies those as spam and they drag
  down the whole domain.

## Target queries

| Query | Intent | Target page | Difficulty |
|---|---|---|---|
| IT-Dienstleister Niedersachsen | commercial | `/niedersachsen` (hub) | medium |
| Softwareentwicklung Niedersachsen | commercial | `/niedersachsen` | medium |
| Webentwicklung Hannover | commercial | `/niedersachsen/hannover` | high |
| App-Entwicklung Hannover | commercial | `/niedersachsen/hannover` | high |
| Prozessautomatisierung Niedersachsen | commercial | `/automation` + hub | low-medium |
| KI-Automatisierung für Unternehmen | commercial | `/automation/chatbots` | medium |
| SaaS-Entwicklung Deutschland | commercial | `/web/saas` | high |

Hannover is the hardest — established agencies with years of links. Expect
Prozessautomatisierung and KI-Automatisierung to convert first: lower competition,
and they match what Rexity actually sells to Mittelstand.

## Site architecture

```
/niedersachsen                        ← authoritative regional hub
├── /niedersachsen/hannover           ← tier 1 (largest market)
├── /niedersachsen/braunschweig       ← tier 2
├── /niedersachsen/wolfsburg          ← tier 2 (automotive/industrial angle)
├── /niedersachsen/goettingen         ← tier 3
├── /niedersachsen/osnabrueck         ← tier 3
└── /niedersachsen/oldenburg          ← tier 3
```

The hub links down to all six and across to `/web`, `/automation`, `/marketing`.
Each city page links back up to the hub and across to two service pages.
Case studies live at `/work` and are linked from every city page.

**Ship order matters.** Hub first, alone, for 2–4 weeks. Then Hannover. Then the
rest in pairs. Publishing seven pages on one day from a new domain looks generated.

## Per-page content contract

Every city page must contain all of these or it does not ship:

1. **Why this city** — a real paragraph on the local economy and what software
   problems its businesses actually have (Wolfsburg: automotive supply chain and
   shift-planning; Göttingen: university spin-offs and research tooling;
   Osnabrück: logistics and food industry; Oldenburg: energy and healthcare).
2. **Services relevant to that market** — not the full service list, the 3–4 that fit.
3. **A genuine case study** — Clevr, LevelKraft or Fresh&Save, written up with the
   actual problem, approach and outcome. Never invented metrics.
4. **Local FAQ** — 4–6 questions in German that a buyer there would really ask
   ("Arbeiten Sie remote oder vor Ort?", "Wie läuft ein Projekt ab?",
   "Was kostet eine Prozessautomatisierung?").
5. **Service-area honesty** — one line stating Rexity works remote from Südheide
   and travels for workshops. This is a trust signal, not a weakness.
6. **Conversion CTA** — phone, mail, and the contact form. Tracked (see below).

## Schema

| Page | Schema |
|---|---|
| all | `Organization` (once, homepage), `BreadcrumbList` |
| `/niedersachsen` + city pages | `LocalBusiness` with `areaServed`, `Service` |
| service pages | `Service` with `provider` → Organization |
| `/work` entries | `CreativeWork` / case-study markup |
| FAQ blocks | `FAQPage` |

`LocalBusiness` carries the **real** Südheide address plus `areaServed` listing the
cities. It must never claim an address we do not hold.

## Link acquisition — legitimate only

- IHK Lüneburg-Wolfsburg and IHK Hannover member directories (we are a member/eligible).
- Handwerkskammer and regional Unternehmensverbände where membership is real.
- Startup networks: hannoverimpuls, Startup-Zentrum Niedersachsen, Gründungsnetzwerk Celle.
- Regional press with a genuine story — the UG founding, a client launch.
  Pitch the story, do not buy the placement.
- Client backlinks: a "built by Rexity" credit on delivered sites (with consent).
- Legitimate directories only: Google Business Profile, Bing Places, Apple Business
  Connect, kununu/North Data where accurate. **No** paid link networks, no PBNs.

## Google Business Profile

- Category: *Softwareunternehmen* (primary), *Webdesigner* + *Unternehmensberater* (secondary).
- Address: Willighäuser Weg 11, 29320 Südheide — **hidden**, service-area shown instead.
- Service area: Hannover, Braunschweig, Wolfsburg, Göttingen, Osnabrück, Oldenburg, Celle.
- Blocked until the UG is in the Handelsregister — GBP verification wants a real entity.
- Reviews: ask real clients only, after delivery, never incentivised.

## Lead tracking

Fire events on: `tel:` clicks, `mailto:` clicks, contact-form submit, chatbot
conversation start, and scroll-depth 75% on city pages. Route to a
privacy-friendly setup (self-hosted Plausible or GA4 with IP anonymisation and a
DSGVO-compliant consent gate — the site is currently cookie-free, keep it that way).
Tag city-page leads with the city so we can see which pages actually earn revenue.

## 30 / 60 / 90

### Days 1–30 — foundation
1. Search Console verified, sitemap submitted, the 10 priority URLs inspected. *(blocked on Phase 3, see report)*
2. Ship `/niedersachsen` hub — the single best page, 1200+ words, real content.
3. Add `Organization` + `BreadcrumbList` + `Service` schema across existing pages.
4. Write up Clevr, LevelKraft and Fresh&Save as proper case studies on `/work`.
5. Stand up lead tracking before traffic arrives, not after.
6. Claim GBP if HRB registration lands; otherwise queue it.
7. Baseline: rankings for all 7 target queries, so month 3 is measurable.

### Days 31–60 — the hard market
8. Ship `/niedersachsen/hannover` with a real case study and local FAQ.
9. Ship Braunschweig + Wolfsburg.
10. `LocalBusiness` + `FAQPage` schema on all live city pages.
11. IHK and startup-network listings submitted.
12. Two genuinely useful German articles (e.g. "Prozessautomatisierung im
    Mittelstand: was sich rechnet") — these earn links Hannover pages cannot.
13. Review GSC coverage: fix anything reported as excluded.

### Days 61–90 — expand and compound
14. Ship Göttingen, Osnabrück, Oldenburg.
15. Client backlink outreach on delivered projects.
16. Regional press pitch, one real story.
17. First conversion review: which city pages produced leads, which produced nothing.
    Prune or rewrite the dead ones — do not let thin pages accumulate.
18. Decide expansion: either deepen Hannover or add Bremen/Hamburg.

## Honest expectations

A domain that has been `noindex` until today has no ranking history. Indexing takes
days to weeks; competitive Hannover terms take **6–12 months** and depend far more
on real links and real case studies than on on-page work. The automation and
KI queries are where results should appear first.

The Search Console Google account is for **ownership and reporting only**. It has
no effect on rankings.
