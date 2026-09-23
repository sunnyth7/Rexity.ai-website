# Lexity Conversion 2.1 — Deutschland

Sprint plan for Rexity Labs · 23 September 2026 · supersedes `Lexity Conversion 2.0.md` on geography, language and offer.

Status: planning document. Nothing in it has been deployed. "Lexity Conversion" is the initiative name; the public company remains Rexity Labs UG (haftungsbeschränkt), Hermannsburg.

## 1. Decision

Rexity acquires clients in **Germany, starting where the proof is: Celle and the Landkreis, then Hannover and the rest of Niedersachsen, then the large German cities** — in that order, and only as evidence for each ring accumulates.

The offer is **Design-and-Build for small and mid-sized businesses**: a usable website or app with the operational system behind it (booking, appointments, automation). UX is how we sell it; engineering is why clients stay.

Language: **German first on every public page.** English stays as the existing DE/EN toggle. No `/en/` migration.

Why this replaces 2.0's India focus:

| Fact | Source |
|---|---|
| All three shipped client projects are in Celle/Hermannsburg (Body & Care, Chara) or German-language products (LevelKraft) | `data/services.json`, `/work` |
| 100 % of search clicks come from Germany; 0 from India | Search Console, 13 Aug–19 Sep 2026 |
| Company, insurance, DSGVO posture, Impressum and existing SEO plan are all German-market | `impressum.html`, `docs/SEO_NIEDERSACHSEN_PLAN.md` |
| Founder capacity is ~5 h/week, not the 21–28 h/week 2.0 assumed | RexDesk handover, 2026-07-13 |

One founder on ~5 h/week cannot run two markets in two languages. Germany has evidence; India has none yet. 2.0's India work is **deferred**, not deleted (see §11).

## 2. What changed from 2.0

| 2.0 | 2.1 |
|---|---|
| Jammu, Delhi NCR, unconfirmed Rajasthan | Celle → Hannover/Niedersachsen → large German cities, expanding only on evidence |
| "UX design" as the primary offer, English-first | Design-and-Build for SMEs, German-first; UX is the sales language |
| Build `/en/` English site | Keep existing DE/EN toggle; no URL migration |
| 21–28 founder hours/week | Planned at **5–7 h/week**; scope cut to match |
| Six sprints × 2 weeks with four roles | Six sprints × 2 weeks, one person (F) plus an AI implementation assistant (I); reviewer role dropped |
| RexDesk / "RexFanks-RexFangs" as future evidence | Names verified: **RexDesk** (local CRM/mini-ERP, working) and **RexFangs** (AI phone/message agent). Both stay off the homepage until a client uses them |
| Indexing "to be checked" | Checked 22 Sep: 16 indexed, 9 business pages pending (§4) |

Kept from 2.0 unchanged: evidence discipline, case-study contract (§7), no cold calling, no new CRM, short enquiry with human qualification, no doorway pages, no fake offices, no invented metrics.

## 3. Evidence register

Sources support the *practice*, not a forecast for Rexity.

| ID | Source, type | Supports | Limit |
|---|---|---|---|
| E1 | thoughtbot business-development playbook — first-party | Referrals + search as main inbound; project form; qualification | No German SME benchmark |
| E3 | Grow & Convert positioning case study — self-reported | Positioning around buyer problems | Different market |
| E7 | Google recrawl guidance — official | URL Inspection + sitemap for discovery | No guarantee, no acceleration by repeating |
| E9 | Google spam policies — official | No doorway / city-swapped pages | — |
| E10 | Google Business Profile eligibility — official | Service-area business with hidden address is eligible when the company genuinely serves those areas | Must not invent branch offices |
| E11 | Body & Care go-live log (bodycare-fitness.de, 14 Sep 2026; 172 bookings first two days) — first-party client data | Real outcome for the booking-website case study | Publish only with the client's written OK |
| E12 | Search Console, rexity.ai, 13 Aug–19 Sep — first-party | 14 clicks / 217 impressions, all brand queries, all German clicks | Baseline only; no demand estimate |

Evidence boundary: headline, page order, posting cadence and city order are judgments, not proven winners.

## 4. Baseline (22 September 2026)

- 24 sitemap URLs, all 200, all business pages `index,follow`, legal pages `noindex` by design.
- **Indexed: 16.** Pending: `/services`, `/web/web-development`, `/web/mobile-apps` (stale July `noindex` crawl), `/automation/whatsapp`, `/marketing/video`, `/testing-support` (discovered, not crawled), `/work/body-and-care`, `/work/chara`, `/work/levelkraft` (published 22 Sep).
- Search: 14 clicks, 217 impressions, avg. position 7.2. Every query is a brand or misspelling ("rexity", "rxity"). No commercial German query yet. Germany 8 clicks / 45 impressions; the rest is foreign brand-collision traffic (Nigeria 91 impressions).
- Vercel Web Analytics live since 22 Sep (cookieless).
- Homepage main content sits inside an iframe (`it-page-anim`) in English, translated client-side → **thin German text for Google on the most important URL.** Known, unfixed.

## 5. Geography — three rings

**Ring 1 — Celle & Landkreis (now).** Hermannsburg, Celle, Bergen, Faßberg, Wietze, Winsen. Where the address, the two client sites and the referral network are. This is where the first 3–5 wins come from.

**Ring 2 — Hannover & Niedersachsen (from Sprint 3).** Hannover, Braunschweig, Wolfsburg, Lüneburg, Göttingen, Osnabrück, Oldenburg. One hub page `/niedersachsen`, city pages only when a real project or genuine local angle exists (per `SEO_NIEDERSACHSEN_PLAN.md`). Hannover is the hard market; automation/booking queries convert before "Webentwicklung Hannover" does.

**Ring 3 — large German cities (after week 12, evidence-gated).** Hamburg, Berlin, Bremen, München, Frankfurt, Köln, Stuttgart. Entry only via **industry pages** ("Kursbuchung für Fitnessstudios", "Terminbuchung für Kfz-Aufbereiter"), never via city pages. A Hamburg gym searching for course-booking finds the industry page; the city is irrelevant to the offer.

Hard rules: one real address (Willighäuser Weg 11, Hermannsburg); Google Business Profile as **service-area business, address hidden**; no "Büro Hannover"; no city-swapped templates.

## 6. Offer and audience

Primary buyer: owner of a local service business (Studio, Werkstatt, Praxis, Salon, Handwerk, Gastronomie) whose customers need to book, enquire or be reached, and whose current website doesn't do that.

Three offers, German names, priced after Sprint 1 costing:

1. **Website-Check** — 60-min review of the existing site and booking/enquiry flow; written findings. Paid, small, the entry product.
2. **Website mit Buchung** — design-and-build: site + online booking/appointments + WhatsApp/phone contact. The Body & Care / Chara package.
3. **Automatisierung** — process/WhatsApp/phone automation on top of an existing site (Chatbot-Kit, RexFangs once verified with a client).

Founder supplies before pricing goes public: minimum project value, weekly delivery hours, response-time promise, and written client permission for names, screens and numbers.

## 7. Website — what changes

Keep the existing German site, `/work`, the DE/EN toggle and the service pages. Changes, in order:

1. **Homepage German-first for Google.** Move the core German copy (offer, three projects, contact) into the main document, not the iframe. The animated iframe stays as visual layer.
2. **`/work`** — done 22 Sep (three real case studies, scroll-through previews, 4 homepage tiles).
3. **`/niedersachsen` hub** — 1200+ words, real content, Sprint 3.
4. **Two industry pages** — "Website mit Online-Kursbuchung für Fitnessstudios" (proof: Body & Care), "Online-Terminbuchung für Kfz-Aufbereiter & Werkstätten" (proof: Chara), Sprint 4.
5. **Enquiry path** — short German form: Name, E-Mail, "Worum geht es?", optional Website/Zeitrahmen/Budget-Band incl. "weiß ich noch nicht". No phone required. Confirmation mail. Lead lands in inbox + RexDesk (already built; no new CRM).
6. **Schema** — Organization + LocalBusiness (service-area) + Service + Breadcrumb + FAQPage on the hub and industry pages.

Not doing: `/en/` migration, framework rewrite, city-page quota.

## 8. Case-study contract (unchanged from 2.0, made concrete)

| Project | Narrative | Proof on hand | Missing |
|---|---|---|---|
| Body & Care Hermannsburg | Kursbuchung ohne Anruf | Live site, real screens, go-live 14.09, first-days log | Client OK for the booking numbers; feedback video |
| Chara Fahrzeugaufbereitung | Termin direkt online | Finished site, real screens | Own-domain go-live; client OK; feedback video |
| LevelKraft | Eigenes Produkt: App + Web | Live in App Store, Play, web | — (own product) |
| RexDesk | Operatives Cockpit | Working app, on your Mac | First external user; until then internal-only mention |
| RexFangs | KI-Telefonassistent | Code + branding exist | First client deployment; **not on the website before that** |

Every case study: Problem, Nutzer, Rolle, Dauer, was gebaut wurde (no tool names), Ergebnis or "nicht gemessen", Grenzen, passendes Angebot. Client delivery, own product and prototype are labelled as such.

## 9. Distribution — no cold calling

1. **Referrals** (Ring 1): Melanie/Body & Care and Aref/Chara each asked for one introduction and one Google review after delivery. A "Website: Rexity Labs" footer credit on both sites, with permission.
2. **Google Business Profile**: create now (HRB 213911 exists). Category Softwareunternehmen; service area = Ring 1 + Ring 2 cities.
3. **Local presence**: IHK Lüneburg-Wolfsburg directory; Das Örtliche, Gelbe Seiten, 11880, Bing Places, Apple Business Connect — identical NAP everywhere. Gründungsnetzwerk Celle, hannoverimpuls.
4. **One press story**: Cellesche Zeitung — new Hermannsburg IT company, first client a local gym, live.
5. **Content**: one substantial German article every two weeks, buyer-question-led ("Was kostet eine Website mit Kursbuchung?", "Terminbuchung online: worauf Werkstätten achten sollten"). One founder LinkedIn post per week reusing the same material. That is the whole cadence.
6. **Chatbot**: keeps routing "Referenzen?" to `/work` (done). Not a qualification channel.

Buyer path: referral / Google / GBP → case study or industry page → offer → short form → founder reply within one working day → Website-Check or discovery → proposal.

## 10. Six sprints, one founder, 5–7 h/week

| Sprint | Work | Gate |
|---|---|---|
| **1** (wk 1–2) | ~~Request indexing for the 9 pending URLs~~ (done 23 Sep). Cost the three offers. ~~Get written permission~~ (contractual, verified 23 Sep). Create Google Business Profile. Fix homepage German-first copy. | Offers priced; GBP submitted; permissions in writing; homepage main-document German text live |
| **2** (wk 3–4) | Enquiry form live → inbox + RexDesk. Add feedback videos / quotes where permission exists. Footer credits on client sites. | Form tested end-to-end incl. failure path; at least one client credit live |
| **3** (wk 5–6) | `/niedersachsen` hub. Schema on hub + `/work`. IHK + directory listings. | Hub live and indexed-requested; NAP identical on all listings |
| **4** (wk 7–8) | Industry page 1 (Fitness/Kursbuchung) + article 1. Ask for the two referrals. Press pitch. | Page + article live; two referral asks sent |
| **5** (wk 9–10) | Industry page 2 (Kfz/Terminbuchung) + article 2. Review GSC: non-brand queries appearing? | Page + article live; GSC reviewed with dated notes |
| **6** (wk 11–12) | Review: leads by source, qualified vs. not, proposals. Decide per channel: keep / deepen / drop. Decide whether Ring 3 industry pages start. | Written review; next-quarter decision |

Minimum launch scope (end of Sprint 2): German-first homepage, `/work`, three priced offers, working enquiry form, GBP, one referral ask. Everything after that is growth, not launch.

If client work eats a sprint, slip the schedule — do not cut the gates.

## 11. Explicitly deferred

India (Jammu, Delhi NCR, Rajasthan) — revisit only with one real Indian client or a named partner there. `/en/` site. RexFangs on the website. Paid ads. City pages without a project. Bulk directories. A/B testing at this traffic level. Custom lead scoring. Any new CRM.

## 12. Measurement

Weekly, 15 minutes: non-brand impressions/clicks (GSC), visits by source (Vercel), form submissions, qualified leads, proposals, wins, hours spent. Compare equal windows; note release dates. Do not read a blended average position as local ranking progress. At week 12, low traffic is not "SEO disproven" — it is 12 weeks on a domain that was invisible until August.

## 13. Open items requiring the founder

1. Minimum project value and weekly hours you will honour.
2. ~~Written OK from Melanie and Aref~~ **Done 23 Sep** — reference use is contractual: Chara Vertrag 2026-005 § 8 (naming + linking on rexity.ai and in offers), Body & Care Vertrag 2026-004 § 10 (5) (reference + portfolio); both signed. Still open by choice: publishing Body & Care's booking numbers, and feedback videos.
3. Chara own-domain go-live date (blocks "live" status and the visit link).
4. Whether RexDesk ever gets an external user — otherwise it stays an internal tool, not a case study.
5. GBP creation (needs your Google account; I can prepare every field).
