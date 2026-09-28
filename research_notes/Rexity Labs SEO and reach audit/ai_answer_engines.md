# What AI answer engines say about "Rexity Labs UG" (rexity.ai)

Research date: 2026-09-28, attempts made 19:50–19:53 UTC and 19:55–20:05 UTC from a claude.ai cloud container whose outbound HTTPS goes through an organisation egress proxy.

**Headline result: no third-party AI answer engine could be queried from this environment.** Every engine host on the list (Perplexity, You.com, Phind, iAsk, Andi, Brave, Bing, Google, DuckDuckGo, Kagi, Exa, Felo, Komo, Lepton, Morphic, ChatGPT, Grok, Mistral, Claude.ai) was refused by the egress proxy at the TLS CONNECT stage ("gateway answered 403 to CONNECT (policy denial)"), both via WebFetch and via `curl` fallback. The proxy README explicitly says 403/407 are organisation policy denials that must not be retried or routed around, so no second retry, archive proxies or scraping mirrors were used. `www.rexity.ai` itself is also blocked, so the live site could not be fetched; the company facts below come from the site's source in this repository (`/home/user/Rexity.ai-website`, 52 commits, release candidates up to 2026-09-27) and from the one reachable engine, the `WebSearch` tool.

The only engine that answered is `WebSearch` (the assignment describes it as Google-backed; the tool does not disclose its backend). Its answers are recorded verbatim below and are labelled **"search-derived, not an AI engine answer"**. They are still informative, because the synthesis it produced is exactly the kind of answer an LLM-backed engine gives: it confidently described rexity.ai as an "Enterprise SAP AI Platform" (wrong for the current site) and otherwise only knew the LevelKraft TELC app.

---

## Engine log (one heading per attempt, exact URL, time, outcome)

Query text used for Q1 (EN): `What is Rexity Labs UG? What does the company do and where is it based?`
URL-encoded: `What%20is%20Rexity%20Labs%20UG%3F%20What%20does%20the%20company%20do%20and%20where%20is%20it%20based%3F`
Because every host was denied at the CONNECT level (before any query reaches the engine), Q2–Q4 and the German variants were **not** sent to the blocked engines — a policy denial is host-wide, and the README forbids retrying it. The URLs that would have been used are listed once at the end of the log.

## Perplexity — Q1 (EN)
- URL 1: https://www.perplexity.ai/search?q=What%20is%20Rexity%20Labs%20UG%3F%20What%20does%20the%20company%20do%20and%20where%20is%20it%20based%3F — 2026-09-28 19:50 UTC — WebFetch: `EGRESS_BLOCKED: Access to www.perplexity.ai is blocked by the network egress proxy`.
- URL 2: https://www.perplexity.ai/search/new?q=What%20is%20Rexity%20Labs%20UG%3F%20What%20does%20the%20company%20do%20and%20where%20is%20it%20based%3F — same result.
- curl fallback: https://www.perplexity.ai/search?q=Rexity+Labs+UG — 19:52 UTC — HTTP 000, 0 bytes (CONNECT refused).
- **Result: blocked (organisation egress policy), no answer retrievable.**

## You.com — Q1 (EN)
- URL: https://you.com/search?q=What%20is%20Rexity%20Labs%20UG%3F%20What%20does%20the%20company%20do%20and%20where%20is%20it%20based%3F&tbm=youchat — 19:50 UTC — `EGRESS_BLOCKED` (you.com).
- curl: https://you.com/search?q=Rexity+Labs+UG&tbm=youchat — HTTP 000.
- **Result: blocked, no answer retrievable.**

## Phind — Q1 (EN)
- URL: https://www.phind.com/search?q=What%20is%20Rexity%20Labs%20UG%3F%20What%20does%20the%20company%20do%20and%20where%20is%20it%20based%3F — 19:50 UTC — `EGRESS_BLOCKED` (www.phind.com).
- curl: https://www.phind.com/search?q=Rexity+Labs+UG — HTTP 000.
- **Result: blocked, no answer retrievable.**

## iAsk.ai — Q1 (EN)
- URL: https://iask.ai/?mode=question&q=What%20is%20Rexity%20Labs%20UG%3F%20What%20does%20the%20company%20do%20and%20where%20is%20it%20based%3F — 19:50 UTC — `EGRESS_BLOCKED` (iask.ai).
- curl: https://iask.ai/?mode=question&q=Rexity+Labs+UG — HTTP 000.
- **Result: blocked, no answer retrievable.**

## Andi — Q1 (EN)
- URL: https://andisearch.com/?q=What%20is%20Rexity%20Labs%20UG%3F%20What%20does%20the%20company%20do%20and%20where%20is%20it%20based%3F — 19:50 UTC — `EGRESS_BLOCKED` (andisearch.com).
- curl: https://andisearch.com/?q=Rexity+Labs+UG — HTTP 000.
- **Result: blocked, no answer retrievable.**

## Brave Search AI Summarizer — Q1 (EN)
- URL: https://search.brave.com/search?q=What%20is%20Rexity%20Labs%20UG%3F%20What%20does%20the%20company%20do%20and%20where%20is%20it%20based%3F&summary=1 — 19:50 UTC — `EGRESS_BLOCKED` (search.brave.com).
- curl: https://search.brave.com/search?q=Rexity+Labs+UG&summary=1 — HTTP 000.
- **Result: blocked, no answer retrievable.**

## Bing Copilot — Q1 (EN)
- URL: https://www.bing.com/search?q=What%20is%20Rexity%20Labs%20UG%3F%20What%20does%20the%20company%20do%20and%20where%20is%20it%20based%3F&showconv=1 — 19:50 UTC — `EGRESS_BLOCKED` (www.bing.com).
- curl: https://www.bing.com/search?q=Rexity+Labs+UG — HTTP 000.
- **Result: blocked, no answer retrievable.**

## Google AI Overviews / AI Mode — Q1 (EN)
- URL: https://www.google.com/search?q=What%20is%20Rexity%20Labs%20UG%3F%20What%20does%20the%20company%20do%20and%20where%20is%20it%20based%3F&udm=50 — 19:50 UTC — `EGRESS_BLOCKED` (www.google.com).
- curl: https://www.google.com/search?q=Rexity+Labs+UG&udm=50 — HTTP 000.
- **Result: blocked, no answer retrievable.** (Even where reachable, AI Mode is JS-rendered and normally not retrievable without a browser.)

## DuckDuckGo AI Assist — Q1 (EN)
- URL: https://duckduckgo.com/?q=What%20is%20Rexity%20Labs%20UG%3F%20What%20does%20the%20company%20do%20and%20where%20is%20it%20based%3F&ia=chat — 19:50 UTC — `EGRESS_BLOCKED` (duckduckgo.com).
- curl: https://duckduckgo.com/html/?q=Rexity+Labs+UG and https://html.duckduckgo.com/html/?q=rexity.ai — HTTP 000.
- **Result: blocked, no answer retrievable.**

## Kagi Quick Answer — Q1 (EN)
- URL: https://kagi.com/search?q=What%20is%20Rexity%20Labs%20UG%3F — 19:50 UTC — `EGRESS_BLOCKED` (kagi.com). curl: HTTP 000.
- **Result: blocked at the proxy; and Kagi is login-walled regardless. No answer retrievable.**

## Exa — Q1 (EN)
- URL: https://exa.ai/search?q=What%20is%20Rexity%20Labs%20UG%3F%20What%20does%20the%20company%20do%20and%20where%20is%20it%20based%3F — 19:50 UTC — `EGRESS_BLOCKED` (exa.ai). curl: HTTP 000.
- **Result: blocked, no answer retrievable.**

## Felo — Q1 (EN)
- URL: https://felo.ai/search?q=What%20is%20Rexity%20Labs%20UG%3F%20What%20does%20the%20company%20do%20and%20where%20is%20it%20based%3F — 19:50 UTC — `EGRESS_BLOCKED` (felo.ai). curl: HTTP 000.
- **Result: blocked, no answer retrievable.**

## Komo — Q1 (EN)
- URL: https://komo.ai/search?q=What%20is%20Rexity%20Labs%20UG%3F%20What%20does%20the%20company%20do%20and%20where%20is%20it%20based%3F — 19:50 UTC — `EGRESS_BLOCKED` (komo.ai). curl: HTTP 000.
- **Result: blocked, no answer retrievable.**

## Lepton Search — Q1 (EN)
- URL: https://search.lepton.run/?q=What%20is%20Rexity%20Labs%20UG%3F%20What%20does%20the%20company%20do%20and%20where%20is%20it%20based%3F — 19:50 UTC — `EGRESS_BLOCKED` (search.lepton.run). curl: HTTP 000.
- **Result: blocked, no answer retrievable.**

## Morphic — Q1 (EN)
- URL: https://www.morphic.sh/search?q=What%20is%20Rexity%20Labs%20UG%3F%20What%20does%20the%20company%20do%20and%20where%20is%20it%20based%3F — 19:50 UTC — `EGRESS_BLOCKED` (www.morphic.sh). curl: HTTP 000.
- **Result: blocked, no answer retrievable.**

## ChatGPT — Q1 (EN)
- URL: https://chatgpt.com/?q=What%20is%20Rexity%20Labs%20UG%3F%20What%20does%20the%20company%20do%20and%20where%20is%20it%20based%3F — 19:50 UTC — `EGRESS_BLOCKED` (chatgpt.com). curl: HTTP 000.
- **Result: blocked at the proxy; ChatGPT web is login/JS-walled in any case. No answer retrievable.**

## Grok — Q1 (EN)
- URL: https://grok.com/?q=What%20is%20Rexity%20Labs%20UG%3F%20What%20does%20the%20company%20do%20and%20where%20is%20it%20based%3F — 19:50 UTC — `EGRESS_BLOCKED` (grok.com). curl: HTTP 000.
- **Result: blocked, no answer retrievable.**

## Mistral Le Chat — Q1 (EN)
- URL: https://chat.mistral.ai/chat?q=What%20is%20Rexity%20Labs%20UG%3F — 19:50 UTC — `EGRESS_BLOCKED` (chat.mistral.ai). curl https://chat.mistral.ai/ : HTTP 000.
- **Result: not reachable without login, and blocked at the proxy. No answer retrievable.**

## Claude.ai — Q1 (EN)
- URL: https://claude.ai/new?q=What%20is%20Rexity%20Labs%20UG%3F — 19:50 UTC — WebFetch: HTTP 403 Forbidden (body not retrieved). curl https://claude.ai/ : HTTP 403, 5,336 bytes (bot-protection page).
- **Result: not reachable without login. No answer retrievable.** (See "Claude (this research agent) answer" below for this model's own grounded answer instead.)

### URLs that would have been used for Q2–Q4 / DE (not sent — host-level policy block)
- Q2 EN: `...?q=What%20are%20the%20strengths%20and%20weaknesses%20of%20Rexity%20Labs%20UG%3F`
- Q3 EN: `...?q=How%20good%20is%20Rexity%20Labs%20UG%27s%20reach%2C%20visibility%20and%20market%20presence%3F`
- Q4 EN: `...?q=What%20should%20Rexity%20Labs%20UG%20do%20in%20the%20next%20couple%20of%20months%20to%20reach%20100K%20EUR%20ARR%3F`
- Q1 DE: `...?q=Was%20ist%20Rexity%20Labs%20UG%3F`; Q2 DE: `...?q=Was%20sind%20die%20St%C3%A4rken%20und%20Schw%C3%A4chen%20von%20Rexity%20Labs%20UG%3F`; Q3 DE: `...?q=Wie%20gut%20ist%20die%20Reichweite%20und%20Sichtbarkeit%20von%20Rexity%20Labs%20UG%3F`; Q4 DE: `...?q=Was%20sollte%20Rexity%20Labs%20UG%20in%20den%20n%C3%A4chsten%20Monaten%20tun%2C%20um%20100.000%20%E2%82%AC%20ARR%20zu%20erreichen%3F`

---

## WebSearch (search-derived, not an AI engine answer) — Q1 (EN)
Tool: `WebSearch`; no public URL (tool call). All quotes verbatim from the tool's synthesis.

**Query `"Rexity Labs" UG` (19:50 UTC)** — result links: play.google.com/store/apps/details?id=ai.rexity.telc, Wikipedia pages for REX American Resources / Rex International Holding / Rexonics / Rex Black / Rexel, two Bloomberg LEI records, cbinsights Icalia Labs vs RexSoft.
> "Rexity Labs is the developer of an app that helps users pass TELC & Goethe exams with AI feedback. The app, called LevelKraft, covers all TELC & Goethe exam sections and automatically grades Speaking and Writing with AI, allowing practice anytime and anywhere without expensive courses or waiting for teachers. The app has over 5,000 downloads and is available on Google Play. The search results don't provide extensive information about Rexity Labs as a company itself—the results are primarily focused on their educational app product."

**Query `"rexity.ai"` (19:55 UTC)** — result links: github.com/sunnyth7/Rexity.ai-website, Google Play "Rexi-AI Photo & Video Maker", Google Play "Rexie AI Limitless Genius", Google Play ai.rexity.telc, **www.rexity.ai/ indexed with the title "REXITY.AI - Enterprise SAP AI Platform | Agentic AI Workflows & Intelligent Dashboards"**, linkedin.com/company/rexie-ai, rex.ai, linkedin.com/company/desarrollos-rexity, soft112 Rexie AI download.
> "REXITY.AI is an enterprise SAP AI platform that offers next-generation agentic AI workflows, intelligent dashboards, and autonomous agents. It optimizes business processes with real-time AI analytics, predictive maintenance, and smart automation for SAP systems. The platform empowers businesses worldwide with next-generation AI agents and autonomous workflows that don't just automate—they think, adapt, and optimize in real-time. It provides AI-driven dashboards that offer real-time analytics, predictive intelligence, and comprehensive visibility across assets, projects, sales, and customer relationships. The search results show that REXITY.AI (rexity.ai) is distinct from other similarly-named AI products like Rexie AI (a mobile chatbot app) and Rexi (an AI visual creation platform)."

**Query `Rexity company AI` (19:50 UTC)** — same rexity.ai "Enterprise SAP AI Platform" title; plus REXai, Rexie AI, Rex Inc (YC), RextAI, Rexi (Tracxn), Rexium, rex.inc.
> "The most directly relevant match to your search appears to be REXITY.AI, which is an enterprise SAP AI platform."

**Query `Rexity Labs UG Handelsregister` (19:50 UTC)** — links: creditreform Lex Labs UG, Rex Technologies GmbH, Recurity Labs GmbH, handelsregister.international Proof Labs UG, handelsregister.de, lemreveal, webvalid.
> "The web search results do not contain specific information about 'Rexity Labs UG' in the German Handelsregister (commercial register)."

**Query `Rexity Labs UG haftungsbeschränkt Niedersachsen` (19:55 UTC)** — links: Lex Labs UG, RettLab UG, RE:Lab UG, 17null4 Labs UG, LAVES/Umwelt Niedersachsen PDFs.
> "The search results do not contain specific information about 'Rexity Labs UG haftungsbeschränkt Niedersachsen.'"

**Query `"Rexity Labs" LinkedIn` (19:55 UTC)** — links: linkedin.com/company/desarrollos-rexity, revitylabs, rexteams, rex-software, rexai, retech-labs-inc, reckonsys.
> "I found several companies with similar names, but no specific match for 'Rexity Labs' on LinkedIn. ... 1. Desarrollos Rexity - A consulting firm in real estate development, founded in 2015. 2. Revity Labs - ... helps cybersecurity startups grow. ... It could be a private or smaller organization with limited LinkedIn presence."

**Query `rexity.ai Webdesign KI Automatisierung Niedersachsen` (19:50 UTC)** — links: sortlist.de Niedersachsen, unzweideutig-ai.de, ki-webdesign.de, webclan.de, weberki.de, 2fox4.de, levisteria.com, erdki.de, brandjung-agentur.de.
> "I could not find specific information about 'rexity.ai' in the results returned. The search query ... returned general results about AI web design and automation services in Lower Saxony (Niedersachsen), Germany, but no direct information about the specific company or service 'rexity.ai.'"

**Query `"Rexity" Webdesign Agentur` (19:55 UTC)** — no Rexity hit; the tool summarised an unrelated Austrian "Webdesign Agentur" (webdesignagentur247.at) and said: "The search didn't find specific results for 'Rexity' in connection with this agency."

**Query `"Rexity" Impressum UG haftungsbeschränkt` (19:55 UTC)** — only Rexa Media UG / Rex Media UG and generic Impressum guidance: "don't contain specific information about a company called 'Rexity' with this legal structure."

### Assessment of WebSearch Q1
- Right: Rexity Labs publishes the LevelKraft TELC/Goethe app (package `ai.rexity.telc`, 5,000+ downloads on Google Play); the public repo github.com/sunnyth7/Rexity.ai-website exists.
- Wrong / stale: "REXITY.AI is an enterprise SAP AI platform ... predictive maintenance ... for SAP systems". The current site source (repo `index.html`) has the title `Rexity Labs — Software, Apps & Automatisierung aus Deutschland`, schema.org `ProfessionalService` "Rexity Labs UG", and no occurrence of "SAP" anywhere in the repo or in its git history (52 commits back to 2026-07-23, `git log -S"SAP AI Platform"` empty). So the search index is serving a title/description from an earlier version of rexity.ai (pre-July 2026) or a cached page; it could not be verified live because www.rexity.ai is blocked from this environment. **This is the single most damaging finding: the one engine that answered at all describes the company as something it is not.**
- Not known: legal form, location (Südheide/Hermannsburg, Niedersachsen), web-design/automation services, prices, references, LinkedIn page, Handelsregister entry (HRB 213911 Amtsgericht Lüneburg) — none surfaced in any query.
- Admitted not knowing: yes, in four of the eight queries the tool explicitly said it found nothing for Rexity Labs UG.

## WebSearch (search-derived, not an AI engine answer) — Q1 (DE)
**Query `Was ist Rexity Labs UG` (19:55 UTC)** — links: play.google.com ai.rexity.telc, makerworld.com/@rexilabs ("Rexi Labs"), mayerhasbani.com/en/portfolio/rexity-2/ ("Rexity | Mayer Hasbani"), youtube.com/c/Rexity (playlists), linkedin.com/company/desarrollos-rexity, Wikipedia Rex International / Rexonics / Rex Black.
> "Based on the search results, Rexity Labs is a company that develops educational applications. Specifically, it created an app called 'LevelKraft' that helps users pass TELC and Goethe exams by providing AI feedback on Speaking and Writing sections in under 2 minutes. The search results show that Rexity Labs has made their app available on platforms like Google Play, where it has over 5,000 downloads."
- Assessment: partially right (LevelKraft is a real Rexity Labs product, listed on /work/levelkraft as "Eigenes Produkt"), but it reduces the company to an ed-tech app developer and says nothing about the agency business, the UG, or Niedersachsen. New name collisions surfaced: "Rexi Labs" (MakerWorld 3D-print profile), "Rexity" YouTube channel, "Rexity" in an architecture/design portfolio (Mayer Hasbani), "Desarrollos Rexity" (real-estate consulting, LinkedIn).

## WebSearch (search-derived, not an AI engine answer) — Q2 (EN)
**Query `Rexity Labs UG strengths weaknesses` (19:55 UTC)** — links: labmanager.com SWOT articles, T.Rex Arms, Rexonics, a LinkedIn "Top Ten AI Platforms" post, idrlabs, youtube.com/c/rexity, Gartner "Resecurity", apkpure ai.rexity.telc.
> "The search results did not return specific information about 'Rexity Labs UG' and its strengths and weaknesses. The results included general information about laboratory SWOT analyses and one reference to Rexity Labs as a mobile app developer (showing they have a language learning app called LevelKraft for TELC & Goethe exam preparation), but no detailed analysis of the company's specific strengths and weaknesses."
- Assessment: admitted not knowing; no hallucination. The only Rexity-specific document in the index is again the LevelKraft app listing.

## WebSearch (search-derived, not an AI engine answer) — Q2 (DE)
**Query `Rexity Labs Stärken Schwächen Erfahrungen Bewertung` (19:55 UTC)** — links: Trustpilot "Reflexit", Personio/Consulting-LIFE Stärken-Schwächen-Analyse, play.google.com ai.rexity.telc&hl=de, anuva.ch Bexio, reflexym.com.
> "Die Suchergebnisse zeigen leider keine spezifischen Informationen zu 'Rexity Labs'. ... Basierend auf den Ergebnissen gibt es jedoch eine App namens LevelKraft von Rexity, die KI-Bewertungen für Sprechen und Schreiben bietet, Stärken- und Schwächenanalysen durchführt und Nutzer bei der Vorbereitung auf TELC- und Goethe-Prüfungen unterstützt."
- Assessment: no reviews, no ProvenExpert/Trustpilot/Google profile for Rexity Labs found; the tool admitted it. Minor drift: it reinterpreted "Stärken/Schwächen" as a feature of the app.

## WebSearch (search-derived, not an AI engine answer) — Q3 (EN)
**Query `Rexity Labs UG reach visibility market presence` (19:55 UTC)** — links: rexivolab.com, discoveredlabs.com, PitchBook/Crunchbase "Reach Labs", ZoomInfo "ReXLytics", youscan.io, getmonetizely.com, thereachlabs.com.
> "I found information about several companies with similar names, but I could not locate specific information about 'Rexity Labs UG' specifically regarding its reach, visibility, or market presence."

**Query `Rexity Webdesign Niedersachsen Bewertungen Google` (19:55 UTC)** — links: sortlist.de (Webentwicklung / E-Commerce Niedersachsen), mediaeffekt.de, golocal.de, provenexpert.com (49 Treffer Webdesign Niedersachsen), capterra, kennstdueinen.de, agenturtipp.de, stepstone.
> "The search results don't contain specific information about 'Rexity Webdesign' or its Google reviews in Niedersachsen. ... there's no mention of 'Rexity Webdesign' specifically."
- Assessment: Rexity Labs is absent from every agency directory surfaced (Sortlist, ProvenExpert, golocal, kennstdueinen, agenturtipp) and no Google Business Profile or review signal appears. The repo's own `docs/GBP_SETUP.md` (dated 2026-09-23) is a not-yet-executed setup pack for a Google Business Profile, and `docs/NAP_DIRECTORIES.md` is a to-do list of directories — consistent with the search finding that none of these listings exist yet.

## WebSearch (search-derived, not an AI engine answer) — Q4 (EN)
**Query `Rexity Labs UG 100K ARR web design AI automation agency Germany` (19:55 UTC)** — links: designrush.com (AI web design agencies; AI companies in Germany), xmethod.de best AI agencies, webtech-agentur.de, LinkedIn "Ai Automation Agency UG", websenor.com, sortlist.com AI Germany, Semrush agency list, 100xlabs.xyz.
> "The search results don't contain specific information about Rexity Labs UG or their 100K ARR metrics. ... Rexity Labs UG does not appear in these results. It's possible that this company may not be widely indexed on major agency listing sites."

**Query `small web design agency Germany reach 100k ARR strategy retainers` (19:55 UTC)** — links: agencies.semrush.com lists, gemprogrammers.com, magiclibrary.co, saashero.net, onelittleweb.com.
> "B2B SaaS marketing agencies in Germany typically charge €3,000 to €18,000 per month ... To reach €100k ARR (approximately €8,333/month), a small agency would need to target clients in the lower-to-mid range of this pricing structure. ... A flat-fee retainer model is preferred ... For early-stage SaaS companies, the right model is a dedicated campaign manager on a month-to-month flat retainer covering a single channel ..."
- Assessment: generic; nothing company-specific. The only useful signal is the arithmetic (€100k ARR ≈ €8.3k/month recurring) and the point that ARR comes from retainers, not one-off projects. No engine could say which Rexity services to focus on or drop, because none of them know the service catalogue.

---

## Company facts used for the agent answer (from the repository source of rexity.ai; live site blocked)

- Legal: `Rexity Labs UG (haftungsbeschränkt)`, Willighäuser Weg 11, 29320 Südheide (Ortsteil Hermannsburg), Niedersachsen; Geschäftsführer Sunny Singh Thakur; Amtsgericht Lüneburg HRB 213911; USt-IdNr. DE464252076; info@rexity.ai; +49 174 2471435 — `/home/user/Rexity.ai-website/impressum.html` ("Stand: 23.07.2026") and `docs/NAP_DIRECTORIES.md` (founding year 2026; NorthData and the register list "29320 Südheide").
- Impressum oddities visible to the public: it states "Kein Ausweis der Umsatzsteuer gemäß § 19 UStG (Kleinunternehmerregelung)" while also listing a USt-IdNr. and while `/preise` quotes prices "netto zzgl. USt"; and it ends with "Dieses Impressum ist ein Entwurf zur juristischen Prüfung und wird nach Abschluss der Gesellschaftsgründung sowie nach anwaltlicher Freigabe finalisiert." — `impressum.html`.
- Positioning (site): "Rexity Labs — Software, Apps & Automatisierung aus Deutschland"; "Wir planen, bauen und betreuen Ihre Website oder App – persönlich aus Niedersachsen"; "Remote in ganz Deutschland, vor Ort im Raum Celle und Hannover"; "ein kleines, technisch starkes Team"; "4–8 Wochen Umsetzung", "ab 999 € Festpreis Website (netto)", "EU Hosting, DSGVO-konform"; explicitly optimises client sites "für Google und für KI-Assistenten wie ChatGPT und Gemini" — `index.html`.
- `/niedersachsen`: "Rexity Labs ist ein kleines Software-Studio in Hermannsburg bei Celle ... remote-first, mit Vor-Ort-Terminen im Raum Celle, Hannover und Braunschweig"; target verticals Fitnessstudios, Werkstätten & Fahrzeugpflege, Praxen, Salons, Handwerk, Gastronomie; four core offers (Websites mit Online-Buchung, Apps, Prozess-/WhatsApp-Automatisierung, Chatbots); "Wir arbeiten in ganz Niedersachsen, bisher vor allem im Raum Celle"; "Wir versprechen keine Rankings, keine Umsatzzahlen" — `niedersachsen/index.html`.
- Service catalogue (`/services`, `data/services.json`): Web & Apps (Webdesign & Web-Entwicklung, SaaS-Plattformen, Mobile Apps, Dashboards & Reporting); Automatisierung (RPA & Prozessautomatisierung, WhatsApp-Agenten, Voice-Agenten, Website-Chatbots); Digitales Marketing (SEO, Content & Social, KI-Videomarketing); Testing & Support; plus landing pages `/fitnessstudio-website`, `/kfz-aufbereitung-website`, `/website-mit-kursbuchung-kosten`, 5 articles under `/artikel`. Sitemap: 29 URLs.
- Prices as of 2026-09-25 (`data/rexity-knowledge.json` pricingPolicy, mirrors `/preise`): Website ab 999 €; Website mit Backend & Buchungsverwaltung ab 1.999 €; Website mit Online-Checkout ab 5.999 €; Migration/Relaunch ab 1.299 €; Mobile Optimierung 699 €; Mobile App ab 4.900 €; Dashboards ab 1.599 €; KI-Chatbot ab 799 €; FAQ-Chatbot 499 €; E-Mail-/SMS-Automatisierung 299 €; WhatsApp-Automatisierung ab 1.299 €; KI-Lösungen (RPA & Dokumenten-Chatbot) ab 2.999 €; RexFangs (KI-Sprach-/Empfangsassistent) Testphase, Preis auf Anfrage; Website-Check 249 €; Jährliche Wartung ab 999 €/Jahr (optional); Stundensatz 89 €. All one-off fixed prices net; the only recurring line item is the optional maintenance package.
- References (`/work`): two client projects — Body & Care Hermannsburg (Fitnessstudio, Website mit Kursbuchung, "live seit September 2026") and Fahrzeugpflege Celle (Terminbuchung) — plus own product LevelKraft; 15 further portfolio cards are labelled "Design-Konzept" (fictional: "Sunshine Salon", "Sunny Resorts", "Hermannsburg Industries", etc.); own products RexFangs and RexDesk "in der Testphase"; CLEVR app.
- LevelKraft case study (`/work/levelkraft`): levelkraft.de page views 515 (Mar) → 351 (Jun) → 624 (Jul, SEO start) → 2,736 (Aug) → 2,892 (Sep to 22.09.); ~81 visitors/day; sign-ups ca. 25–30/day; app MRR ca. $50 (May) → $80 (Jun) → $110 (Jul) → $160 (Aug) → $290 (Sep); three forecast scenarios $610–$2,400 MRR by July 2027, explicitly "keine Garantie".
- Internal knowledge-base positioning conflicts with the site: `data/rexity-knowledge.json` brand.positioning = "Rexity Labs builds AI workspaces and automation for ambitious teams — production-grade software that is DSGVO-compliant, EU-hosted, audit-logged, and opt-out by design." (enterprise-flavoured), while the site sells €999 booking websites to studios and workshops.
- External footprint found by search: Google Play `ai.rexity.telc` "TELC & Goethe B1 B2 Prep -LK" (5,000+ downloads, v3.0.0 2026-05-20 per search snippet); App Store `id6761135303` "TELC & Goethe B1 B2 German"; apkpure mirror; YouTube "LevelKraft: TELC PREP A1-C1" channel; GitHub `sunnyth7/Rexity.ai-website` (public, 0 stars, 0 forks, no description, no website field — fetched 2026-09-28 19:56 UTC). No LinkedIn company page, no Handelsregister aggregator page (NorthData/Creditreform/Unternehmensregister), no directory listing, no review profile, and no press surfaced.
- Not the company (collisions): github.com/Rexity (a user with five "Game like roblox" repos, 1 follower — fetched 19:56 UTC); youtube.com/c/Rexity; "Desarrollos Rexity" (LinkedIn, real-estate development consulting, founded 2015); "Rexity" in the Mayer Hasbani portfolio; "Rexi Labs" (MakerWorld); Rexie AI, Rexi-AI, REXai, rex.ai, Rexium, Rex Inc (YC), Revity Labs, Rexivo, ReXLytics, Rexonics, Rexel, REX American Resources.

---

## Claude (this research agent) answer — Q1
**What is Rexity Labs UG, what does it do, where is it based?**
Rexity Labs UG (haftungsbeschränkt) is a very small (founder-led, "kleines Team") German software and web-design studio registered in 2026 at Amtsgericht Lüneburg (HRB 213911), based at Willighäuser Weg 11, 29320 Südheide (village of Hermannsburg, Landkreis Celle), Niedersachsen, managing director Sunny Singh Thakur. It builds fixed-price websites with online booking (from €999 net), mobile apps, dashboards, WhatsApp/process automation and website chatbots for local service businesses (gyms, car detailers, practices, salons, trades, restaurants), working remote-first across Germany with on-site visits around Celle, Hannover and Braunschweig. It also develops its own products: LevelKraft (a TELC/Goethe German-exam prep app on iOS, Android and web, ~$290 MRR in September 2026) and two products in test (RexFangs voice/reception assistant, RexDesk local business cockpit). Two client references are public (Body & Care Hermannsburg, Fahrzeugpflege Celle). Uncertainty: the live site could not be fetched from this environment, so everything is from the repository at commit `15ec2b7` (2026-09-27) and may differ from what is deployed; the Impressum shows Kleinunternehmerregelung, which suggests turnover under the German small-business threshold. The search index still labels rexity.ai an "Enterprise SAP AI Platform", which the current source does not support.

## Claude (this research agent) answer — Q2
**Strengths**
- Concrete, verifiable niche: "Website mit Online-Buchung" for studios/workshops, with two live local references and dedicated landing pages (`/fitnessstudio-website`, `/kfz-aufbereitung-website`, `/website-mit-kursbuchung-kosten`).
- Transparent fixed-price list with 16 published prices, a stated 4–8 week timeline, EU hosting/DSGVO, and an honest tone ("Wir versprechen keine Rankings").
- A genuine, quantified SEO case study on its own product (LevelKraft page views ~7× Jul→Sep, MRR ~3.6× Jun→Sep) that proves the team can do organic growth work.
- Technically strong for its size: bilingual site, schema.org ProfessionalService markup, sitemap, own chatbot with a curated knowledge base, three shipped apps (LevelKraft, CLEVR, Save & Fresh).
- Already explicitly targets AI-assistant discoverability ("optimieren ... für KI-Assistenten wie ChatGPT und Gemini").

**Weaknesses**
- Near-zero external footprint: no LinkedIn company page found, no Google Business Profile or reviews, no directory listings, no Handelsregister aggregator page, no press; the GitHub repo has no description. Every engine that could be asked either knew nothing or knew only the LevelKraft app.
- The search index describes rexity.ai as an "Enterprise SAP AI Platform" — a stale/wrong description that any LLM engine will repeat. Nothing in the current source explains it, so it likely stems from an earlier site version.
- Offer sprawl for a one/two-person studio: 13 service pages (SaaS platforms, voice agents, RPA, KI-Videomarketing, Content & Social, dashboards...) plus three own products in test, versus two paying references. The internal chatbot positioning ("AI workspaces for ambitious teams") contradicts the local-SMB site copy.
- Trust leaks on the Impressum: a visible "Entwurf zur juristischen Prüfung" note, and § 19 UStG small-business status stated next to a USt-IdNr. and net-plus-VAT pricing.
- Portfolio is 15 fictional "Design-Konzept" cards to 2 real projects; only the founder's own product carries hard numbers.
- Business model is almost entirely one-off project fees; the only recurring line is an optional €999/year maintenance package, so ARR in the strict sense is tiny (LevelKraft ≈ €3k/yr).
- Uncertainty: I could not see traffic, leads, revenue, or the live pages; Google/Bing index status is inferred from one search backend.

## Claude (this research agent) answer — Q3
Reach is very low. Evidence: (1) eight search queries in EN/DE surfaced only the Google Play/App Store listings of LevelKraft and the public GitHub repo; (2) not one query returned the rexity.ai service, pricing, Niedersachsen or work pages; (3) the homepage is indexed under a wrong title; (4) no LinkedIn page, GBP, reviews, or directory entries were found, and the repo's `docs/GBP_SETUP.md` and `docs/NAP_DIRECTORIES.md` (2026-09-23/24) confirm these are still to-do; (5) the "Niedersachsen" hub page admits work has "bisher vor allem im Raum Celle". The strongest reach asset is LevelKraft (levelkraft.de ~2.9k page views/month, 5k+ Android installs), i.e., the product, not the agency. Name collisions (Desarrollos Rexity, Rexie AI, Rexi-AI, REXai, rex.ai, Rexium, a "Rexity" YouTube/GitHub gamer) mean that without strong entity signals the brand query itself is ambiguous for AI engines. Uncertainty: no analytics or Search Console data was available; the assessment is from public search visibility only.

## Claude (this research agent) answer — Q4
Reality check first: €100k ARR = ~€8.3k of *recurring* revenue per month. Today's published recurring item is a €999/yr maintenance package plus ~$290/mo LevelKraft, i.e., roughly €3–5k ARR. Reaching 100k *recurring* in "a couple of months" is not realistic; reaching a €100k annual *revenue run-rate* (projects + retainers, ~€8.3k/month) is plausible if the next 60–90 days are spent on the following, in this order:

1. **Fix the entity signals this week (cost: hours).** Verify what the live homepage title/meta say and why the index shows "Enterprise SAP AI Platform"; request re-indexing via Search Console; make sure `<title>`/`description` are emitted in the built HTML (the repo's `index.html`, `services`, `preise`, `niedersachsen` builds show `TITLE: None / DESC: None` in a naive parse — check the deployed head). Publish the Google Business Profile and the NAP directory entries already prepared in `docs/`; create the LinkedIn company page and add website/description to the GitHub repo. Remove the "Entwurf zur juristischen Prüfung" line from the Impressum and reconcile the § 19 UStG / USt-IdNr. / net-pricing contradiction. These are what every AI engine will read first.
2. **Introduce a recurring product and price it monthly.** Turn "Wartung ab 999 €/Jahr" into a mandatory-by-default care plan (hosting, updates, booking-system support, monthly report) at e.g. €79–149/month, and price the WhatsApp/reminder automation and chatbots as €49–99/month subscriptions rather than one-off. 20–25 SMB clients on ~€120/month ≈ €30–36k ARR of genuinely recurring revenue; the rest of the run-rate must come from projects (≈4–5 booking websites/month at €1.5–2k).
3. **Sell one thing to two verticals.** The two live references and the three landing pages already point at "Website mit Online-Buchung" for fitness studios and Kfz-Aufbereitung/Werkstätten. Run outbound (phone/WhatsApp/visits) to those two verticals in Celle, Hannover, Braunschweig; publish a written case study with permission and numbers for each reference; ask both clients for Google reviews.
4. **De-prioritise or hide until there is a reference:** SaaS-Plattformen, Voice-Agenten/RexFangs, RexDesk, RPA & Prozessautomatisierung "ab 2.999 €", KI-Videomarketing, Content & Social, Dashboards, and the 15 fictional "Design-Konzept" cards (keep them off the /work index; they dilute the two real projects). Reconcile the chatbot's "AI workspaces for ambitious teams" positioning with the site's local-SMB message so AI engines get one consistent entity description.
5. **Use LevelKraft as proof, not as a second business.** Keep it as the SEO case study that sells the "found on Google and in AI search" promise; do not spend agency sales time on it during this window.
6. **Measure weekly:** indexed pages, brand-query answers on Perplexity/ChatGPT/Google AI Mode (re-run the four questions monthly from an unblocked network), GBP views, inbound calls/bookings via the site's own "Termin buchen" form.

Uncertainty: I have no visibility into current pipeline, capacity or cash; if the founder is solo, 4–5 projects/month may exceed capacity, in which case the recurring-plan step matters more than the project volume.

---

## Key question: Which engines know the company at all, and which confuse it with other entities?

### Takeaway
No third-party AI answer engine could be queried (all 19 hosts are blocked by the organisation's egress policy), so the only evidence is the WebSearch backend: it does not know Rexity Labs UG as a web-design/AI agency at all, knows only the LevelKraft app, and confidently describes rexity.ai as an "Enterprise SAP AI Platform" — a wrong/stale entity description that LLM engines would repeat.

### Cited Findings
- WebSearch: "Rexity Labs is the developer of an app that helps users pass TELC & Goethe exams ... over 5,000 downloads" — [Google Play ai.rexity.telc](https://play.google.com/store/apps/details?id=ai.rexity.telc)
- WebSearch indexes www.rexity.ai under the title "REXITY.AI - Enterprise SAP AI Platform | Agentic AI Workflows & Intelligent Dashboards" and summarises it as "an enterprise SAP AI platform ... predictive maintenance, and smart automation for SAP systems" — [rexity.ai (as indexed)](https://www.rexity.ai/); contradicted by the site source, whose title is "Rexity Labs — Software, Apps & Automatisierung aus Deutschland" and which contains no "SAP" string in 52 commits — [repo index.html](https://github.com/sunnyth7/Rexity.ai-website)
- WebSearch found "no specific match for 'Rexity Labs' on LinkedIn" and offered "Desarrollos Rexity - A consulting firm in real estate development, founded in 2015" — [LinkedIn Desarrollos Rexity](https://www.linkedin.com/company/desarrollos-rexity)
- WebSearch: "do not contain specific information about 'Rexity Labs UG' in the German Handelsregister" — [handelsregister.de](https://www.handelsregister.de/rp_web/normalesuche/welcome.xhtml)
- Further collisions surfaced by search: Rexie AI ([LinkedIn](https://www.linkedin.com/company/rexie-ai)), Rexi-AI Photo & Video Maker ([Google Play](https://play.google.com/store/apps/details?id=rexi.ai.photo&hl=en_US)), REXai ([LinkedIn](https://www.linkedin.com/company/rexai/)), rex.ai ([rex.ai](https://rex.ai/)), Rexium ([rexium.ai](https://www.rexium.ai/)), Rex Inc ([YC](https://www.ycombinator.com/companies/rex-inc)), Rexi Labs ([MakerWorld](https://makerworld.com/en/@rexilabs)), "Rexity" ([YouTube](https://www.youtube.com/c/Rexity)), "Rexity" ([Mayer Hasbani portfolio](https://mayerhasbani.com/en/portfolio/rexity-2/)), GitHub user Rexity with "Game like roblox" repos ([GitHub](https://github.com/Rexity)).
- Perplexity, You.com, Phind, iAsk, Andi, Brave, Bing, Google AI Mode, DuckDuckGo, Kagi, Exa, Felo, Komo, Lepton, Morphic, ChatGPT, Grok, Mistral: `EGRESS_BLOCKED` at CONNECT, 2026-09-28 19:50–19:53 UTC; Claude.ai: HTTP 403 — proxy status endpoint recorded "gateway answered 403 to CONNECT (policy denial or upstream failure)".

### Inferences
- Any LLM engine that grounds on the same web index will (a) answer "Rexity Labs = TELC app developer" or (b) "rexity.ai = enterprise SAP AI platform", and will not mention Niedersachsen, web design, prices or references.
- The brand query "Rexity" is crowded (Rexie/Rexi/REXai/rex.ai/Rexium); without a LinkedIn page, GBP, and register aggregator pages there is no entity anchor for engines to disambiguate.

### Gaps
- Actual verbatim answers from Perplexity, ChatGPT, Google AI Mode, Bing Copilot, etc. could not be obtained; they must be re-run from a network without the egress policy.
- Whether the live rexity.ai still emits the "Enterprise SAP AI Platform" title, or whether it is a stale index, could not be verified (host blocked).

## Key question: What sources do the engines cite?

### Takeaway
The only sources that surfaced for the company are app-store listings for LevelKraft, the public GitHub repo, and a stale index entry for rexity.ai; no engine cited the rexity.ai service/pricing/Niedersachsen pages, any register, LinkedIn, or directory.

### Cited Findings
- Cited for Rexity Labs: [Google Play ai.rexity.telc](https://play.google.com/store/apps/details?id=ai.rexity.telc), [App Store id6761135303](https://apps.apple.com/no/app/telc-goethe-b1-b2-german/id6761135303), [apkpure mirror](https://apkpure.com/telc-prep-a1-b2-%E2%80%93-levelkraft/ai.rexity.telc), [LevelKraft YouTube](https://www.youtube.com/watch?v=_-yVk2QyKd8), [GitHub sunnyth7/Rexity.ai-website](https://github.com/sunnyth7/Rexity.ai-website) (fetched: no description, 0 stars, 0 forks), [rexity.ai (stale title)](https://www.rexity.ai/).
- Not cited anywhere: /services, /preise, /work, /niedersachsen, /impressum, NorthData/Creditreform/Unternehmensregister entries, LinkedIn, Sortlist/ProvenExpert/golocal — WebSearch "Rexity Webdesign Niedersachsen Bewertungen Google" returned only generic directories ([Sortlist Niedersachsen](https://www.sortlist.de/webentwicklung/niedersachsen-nds-de), [ProvenExpert Webdesign Niedersachsen](https://www.provenexpert.com/de-de/suche/Webdesign/Niedersachsen/)).
- The repo's own local-SEO docs show GBP and directory listings were still unexecuted plans as of 2026-09-23/24 — `docs/GBP_SETUP.md`, `docs/NAP_DIRECTORIES.md` (local files).

### Inferences
- Engines have nothing to cite for the agency business because the only crawlable, third-party-hosted assets are app-store pages.

### Gaps
- Bing/Google index coverage of the 29 sitemap URLs could not be checked (hosts blocked).

## Key question: What concrete advice do engines give for 100K ARR, and which services/pages do they say to focus on or drop?

### Takeaway
No engine gave company-specific advice; the only retrievable synthesis was generic ("€100k ARR ≈ €8,333/month; flat-fee retainers"). The service-focus recommendation therefore comes solely from this agent's grounded analysis: sell booking websites plus a monthly care/automation plan to fitness studios and workshops, and park SaaS, voice, RPA, video and social offerings.

### Cited Findings
- WebSearch: "Rexity Labs UG does not appear in these results. It's possible that this company may not be widely indexed on major agency listing sites" — [DesignRush AI companies Germany](https://www.designrush.com/agency/ai-companies/de)
- WebSearch: "To reach €100k ARR (approximately €8,333/month), a small agency would need to target clients in the lower-to-mid range ... A flat-fee retainer model is preferred" — [magiclibrary.co](https://www.magiclibrary.co/blog/best-b2b-saas-marketing-agencies-in-germany), [saashero.net](https://www.saashero.net/strategy/top-b2b-saas-agencies-2026/)
- Published Rexity price list has 16 one-off fixed prices and one optional recurring item (Wartung ab 999 €/Jahr) — `data/rexity-knowledge.json` pricingPolicy (as of 2026-09-25), local file mirroring [rexity.ai/preise](https://www.rexity.ai/preise)
- LevelKraft MRR ca. $290 in September 2026 — `work/levelkraft/index.html`, local file mirroring [rexity.ai/work/levelkraft](https://www.rexity.ai/work/levelkraft)

### Inferences
- See "Claude (this research agent) answer — Q4": fix entity signals (title/meta, GBP, LinkedIn, Impressum draft note, VAT contradiction), convert maintenance/chatbot/WhatsApp into monthly plans, focus on the booking-website offer for the two proven verticals, hide fictional design concepts and un-referenced services.

### Gaps
- No engine-provided, company-specific list of services to drop exists; the recommendation is inferred from the site's own reference-to-service ratio and pricing structure.
