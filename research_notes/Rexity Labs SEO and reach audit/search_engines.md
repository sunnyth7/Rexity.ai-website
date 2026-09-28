# Classic web search engines: what they return for "Rexity Labs UG" / rexity.ai

Research date: 2026-09-28 (all queries run on this date). Researcher environment: Claude Code cloud container behind an organization egress proxy.

## Method and access limitations (read first)

### Takeaway
Only Google-style results (via the WebSearch tool) could be observed. All nine other engines (Bing, DuckDuckGo HTML + Lite, Brave, Startpage, Ecosia, Yandex, Mojeek, Qwant, Yahoo) were hard-blocked by the network egress proxy on every attempt, so the engine x query matrix is complete for Google only; for the others the observed value is "BLOCKED", not "no results".

### Cited Findings
- WebSearch (Google-style, US-locale per the tool description "US-only") returned result lists for all 10 assigned queries plus ~12 supplementary queries. Result lists below are transcribed verbatim (titles and URLs as returned). Snippets are not exposed verbatim by the tool; only titles/URLs are, plus a model-generated summary that I did not treat as evidence.
- curl to every non-Google engine failed with `curl: (56) CONNECT tunnel failed, response 403` for: https://www.bing.com/search?q=%22Rexity+Labs+UG%22, https://html.duckduckgo.com/html/?q=..., https://lite.duckduckgo.com/lite/?q=..., https://search.brave.com/search?q=..., https://www.startpage.com/do/search?q=..., https://www.ecosia.org/search?q=..., https://yandex.com/search/?text=..., https://www.mojeek.com/search?q=..., https://www.qwant.com/?q=..., https://search.yahoo.com/search?p=... (observed 2026-09-28).
- WebFetch on the same 10 URLs returned `EGRESS_BLOCKED ... blocked by the network egress proxy` for bing.com, html.duckduckgo.com, lite.duckduckgo.com, search.brave.com, ecosia.org, yandex.com, mojeek.com, qwant.com, search.yahoo.com; and "Claude Code is unable to fetch from www.startpage.com" for Startpage (both /do/search and /sp/search paths).
- Alternate hostnames were also blocked: duckduckgo.com/html, yandex.ru, de.search.yahoo.com (EGRESS_BLOCKED, 2026-09-28).
- The proxy status endpoint (`$HTTPS_PROXY/__agentproxy/status`) logged each attempt as `connect_rejected: gateway answered 403 to CONNECT (policy denial or upstream failure)`; the proxy README (/root/.ccr/README.md) says 403/407 are organization egress-policy denials that must be reported, not retried or routed around. I therefore did not use third-party fetch proxies.
- Also blocked (relevant to verification): https://www.rexity.ai/ itself, play.google.com, apps.apple.com, apkpure.com. Reachable: github.com.
- Because the live site could not be fetched, on-page facts were taken from the local repo checkout at /home/user/Rexity.ai-website (HEAD 15ec2b76, 2026-09-27 23:01 +0200, "Release candidate: new site ... sprint/13"), which is the source of the deployed Vercel site (vercel.json present; region fra1).

### Inferences
- The Bing-family engines (Bing, DuckDuckGo, Ecosia, Yahoo, Qwant partially) usually share Bing's index, and Startpage proxies Google; so if the parent wants a proxy for those witnesses, the Google findings below are the closest available, but this was NOT observed and should be labelled as such in the report.

### Gaps
- No observations at all for Bing, DuckDuckGo, Brave, Startpage, Ecosia, Yandex, Mojeek, Qwant, Yahoo. These must be re-run from a network that allows those hosts (or manually in a browser). Recommended manual checks: the 10 queries below on Bing and DuckDuckGo at minimum, plus `site:rexity.ai` on each.

## Engine x query matrix (2026-09-28)

Legend: position = rank of the first rexity.ai result in the returned list; "-" = rexity.ai absent from the returned list (Google/WebSearch returns ~9-10 results per query, i.e. roughly page 1; positions 11-20 were not observable with this tool). BLOCKED = engine unreachable (egress proxy 403), nothing observed.

| # | Query | Google (WebSearch) - rexity.ai position | Google - top results (domains, in order) | Bing | DDG html | DDG lite | Brave | Startpage | Ecosia | Yandex | Mojeek | Qwant | Yahoo |
|---|---|---|---|---|---|---|---|---|---|---|---|---|---|
| 1 | "Rexity Labs UG" | - (not in list) | play.google.com (ai.rexity.telc app, dev "Rexity Labs"), makerworld.com/@rexilabs, mayerhasbani.com (Rexity portfolio), youtube.com/c/Rexity, linkedin.com/company/desarrollos-rexity, en.wikipedia.org x4 (REX American Resources, Rex International, Rexonics, Rex Black) | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED |
| 2 | Rexity Labs | 5 (https://www.rexity.ai/, title "REXITY.AI - Enterprise SAP AI Platform \| Agentic AI Workflows & Intelligent Dashboards") | play.google.com (ai.rexity.telc), makerworld.com/@rexilabs, youtube.com/c/Rexity/playlists, linkedin.com/company/desarrollos-rexity, www.rexity.ai, youtube.com/c/rexity, wikipedia (T.Rex Arms, Rexonics, Rex Black) | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED |
| 3 | rexity.ai | 5 (www.rexity.ai, same stale SAP title); GitHub repo github.com/sunnyth7/Rexity.ai-website at 1 | github.com/sunnyth7/Rexity.ai-website, play.google.com (rexi.ai.photo), play.google.com (com.rexie.ai.chatbot), play.google.com (ai.rexity.telc), www.rexity.ai, linkedin.com/company/rexie-ai, rex.ai, linkedin.com/company/desarrollos-rexity, rexie-ai-limitless-genius-ios.soft112.com | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED |
| 4 | Rexity Labs UG Bewertung Erfahrungen | - | trustedshops.de (ug-alu-de), trustedshops.de (RedRice Solutions UG), ghostwritererfahrungenforum.de, trustedshops.de (rexproduct.com), erfahrungenscout.de (Medicross Labs), ghostwriter-erfahrung.com, ug-gwc.de, at.trustpilot.com (technorex.co), ch.trustpilot.com (chexy.co) | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED |
| 5 | "Rexity" Webdesign Niedersachsen | - | provenexpert.com, niedersachsen-webdesign.de, sortlist.de, webigraf.de, karolkowalczyk.de (ANKERWEB), die-webseiten-macher.de, webdesign-kall.de, web-shop-gestaltung.de, webdesign-niedersachsen.com (P1 Commerce), virtualx.de | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED |
| 6 | Webdesign Agentur Niedersachsen | - | feedbax.ai, sortlist.de (webentwicklung), sortlist.de (webdesign), web.la-agencia.de, hgd-media.de, webdesign-kall.de, brand-tactics.de, smartfinity-media.de, homepage-designer.net | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED |
| 7 | Website Fitnessstudio erstellen lassen | - (rexity.ai/fitnessstudio-website absent) | leosa.de, kreativschock.de, nc-newmedia.de, niederrhein-web.de, zajamedia.de, rankpilot.de, yola.com, fitleadsmarketing.de, support.squarespace.com | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED |
| 8 | WhatsApp Automatisierung Agentur | - (rexity.ai/automation/whatsapp absent) | whatsapp-automation.de, bitpalm.ai, jotform.com, connect.lime-technologies.com, respond.io, derprozessmeister.de, chatarmin.com, wassenger.com, infobip.com | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED |
| 9 | KI Voice Agent Agentur Deutschland | - (rexity.ai/automation/voice absent) | ki-voice-agenten.de, trendview.de, ki-voice-agenten-agentur.de, kiberatung.de, gipfelstuermer-agentur.de, voicery.ai, stkom.de, voico.ai, img3.ibisworld.com | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED |
| 10 | Website mit Kursbuchung Kosten | - (rexity.ai/website-mit-kursbuchung-kosten absent) | supersaas.de x2, yolawo.de x2, cituro.com, bookeo.com, kursifant.com, splonkit.com, coursera.org | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED | BLOCKED |

Supplementary Google (WebSearch) probes, 2026-09-28:

| Query | rexity.ai position | Notes |
|---|---|---|
| site:rexity.ai | 1 (www.rexity.ai only, stale SAP title) | Only ONE rexity.ai URL returned; the rest were off-domain noise (pypi rexia-ai, businesswire, marketbeat LON:REX, cbinsights rexai, etc.). No subpage of rexity.ai surfaced. |
| "Webdesign Agentur Niedersachsen" restricted to rexity.ai | none | "No links found." |
| "Fitnessstudio Website Kursbuchung WhatsApp Voice Agent" restricted to rexity.ai | none | "No links found." |
| "WhatsApp Automatisierung" restricted to rexity.ai | 1 (homepage only) | Homepage returned under the SAP title; /automation/whatsapp not returned. |
| "Rexity Labs Impressum Niedersachsen" restricted to rexity.ai | 1 (homepage only) | /impressum not returned. |
| "Rexity Labs" Unternehmergesellschaft Handelsregister | - | Only unrelated register hits (Lex Labs UG, Recurity Labs GmbH, handelsregister.de generic). No Rexity Labs UG register/Northdata/Creditreform entry surfaced. |
| Rexity Labs vercel.app | - | No rexity vercel.app preview URL surfaced (only unrelated rex-*.vercel.app projects). |
| Rexity Labs LinkedIn Niedersachsen | - | No Rexity Labs LinkedIn company page surfaced; linkedin.com/company/desarrollos-rexity (Mexico real estate) and linkedin.com/company/rexai appear instead. |
| LevelKraft Rexity Labs TELC app | - | play.google.com/store/apps/details?id=ai.rexity.telc (1), github.com/sunnyth7/Rexity.ai-website (2), youtube.com/watch?v=_-yVk2QyKd8 (LevelKraft), m.youtube.com/@levelkraft-telc-prep, apkpure.com/.../ai.rexity.telc, apps.apple.com/tt/app/telc-goethe-b1-b2-german/id6761135303 |
| LevelKraft privacy policy rexity | - | www.levelkraft.de/privacy (1), play.google.com ai.rexity.telc, github.com/sunnyth7/Rexity.ai-website, x.com/_rexity (4), apkpure.com |
| Rexity Impressum | - | rexio.de, rex-technologie.com, linkedin desarrollos-rexity, youtube.com/c/Rexity, revoltworld.net/user/rexity, youtube "Team Rexity", http://rexity.mx/ ("My CMS") |
| "Rexity" Agentur KI Automatisierung | - | deinekiagentur.de, onacy.de, automated-ki-agentur.de, xmethod.de, agenturfinder.com, the-digitale.com, ki-agentur.com, orcaya.com |
| "rexity.ai" SAP | 2 (www.rexity.ai) | github.com/sunnyth7/Rexity.ai-website (1), www.rexity.ai (2), then SAP/Reltio news. |
| Rexity Nutrition | - | Google auto-corrects to "Rexius Nutrition" (Omaha, NE supplement retailer): rexiusnutrition.com, linkedin, yelp, facebook, instagram. |
| Rexity Labs Webdesign Niedersachsen Agentur | - | sortlist.de x2, feedbax.ai x2, mediaeffekt.de, webdesign-kall.de, bloqlabs.ch, infinity-labs.de, virtualx.de |

## Key question 1: Does the engine know the company at all? Which rexity.ai pages surface? Which third-party pages?

### Takeaway
Google knows the domain but barely the company: exactly one rexity.ai URL (the homepage) is in the observed index, and it is shown under a stale, wrong title/description ("Enterprise SAP AI Platform") that does not match the deployed site. The homepage ranks only for navigational queries containing "Rexity" ("Rexity Labs" pos. 5, "rexity.ai" pos. 5) and not for the exact phrase "Rexity Labs UG". No other engine could be observed.

### Cited Findings
- For "Rexity Labs" Google returns https://www.rexity.ai/ at position 5 with title "REXITY.AI - Enterprise SAP AI Platform | Agentic AI Workflows & Intelligent Dashboards" — [Google via WebSearch, 2026-09-28](https://www.rexity.ai/)
- For "rexity.ai" the same homepage appears at position 5, behind https://github.com/sunnyth7/Rexity.ai-website at position 1 and three unrelated "Rexi/Rexie AI" Play Store apps — [Google via WebSearch, 2026-09-28](https://github.com/sunnyth7/Rexity.ai-website)
- For the exact-phrase query "Rexity Labs UG", rexity.ai does NOT appear in the returned list at all; the top result is the Play Store listing of the LevelKraft app (package id ai.rexity.telc, developer shown as "Rexity Labs") — [Google Play](https://play.google.com/store/apps/details?id=ai.rexity.telc)
- `site:rexity.ai` returns only https://www.rexity.ai/ from that domain; every other result is off-domain (pypi.org/project/rexia-ai, businesswire.com, marketbeat.com LON:REX, cbinsights.com/company/rexai, substack, mexc.com) — [Google via WebSearch, 2026-09-28](https://www.rexity.ai/)
- Domain-restricted searches for "WhatsApp Automatisierung" and "Rexity Labs Impressum Niedersachsen" return only the homepage; domain-restricted "Webdesign Agentur Niedersachsen" and "Fitnessstudio Website Kursbuchung WhatsApp Voice Agent" return "No links found" — Google via WebSearch, 2026-09-28.
- The deployed site's sitemap lists 29 URLs (/, /web, /web/web-design, /web/saas, /web/mobile-apps, /web/dashboards, /automation, /automation/rpa, /automation/whatsapp, /automation/voice, /automation/chatbots, /marketing, /marketing/seo, /marketing/content, /marketing/video, /testing-support, /services, /niedersachsen, /preise, /fitnessstudio-website, /kfz-aufbereitung-website, /website-mit-kursbuchung-kosten, /impressum, /datenschutz, /work, /work/body-and-care, /work/chara, /work/levelkraft, /artikel); robots.txt is `User-agent: * / Allow: /` with the sitemap declared; a Google Search Console verification file (googled143c8bf41723924.html) is present — local repo /home/user/Rexity.ai-website (sitemap.xml, robots.txt), HEAD 15ec2b76 of 2026-09-27.
- The repo's index.html `<title>` is "Rexity Labs — Software, Apps & Automatisierung aus Deutschland" and its meta description is "Rexity Labs baut Websites, Apps, SaaS und Dashboards und automatisiert Prozesse — RPA, WhatsApp- und Voice-Agenten. DSGVO-konform, in Deutschland gebaut. Kontakt: info@rexity.ai"; the string "SAP" occurs zero times in index.html, in any HTML file of the repo, or anywhere in git history (`git log -S 'Enterprise SAP AI Platform' --all` returns nothing) — local repo /home/user/Rexity.ai-website/index.html.
- impressum.html in the repo names the legal entity "Rexity Labs UG (haftungsbeschränkt)" — local repo /home/user/Rexity.ai-website/impressum.html.
- Third-party pages Google associates with the company: Play Store app ai.rexity.telc ("TELC & Goethe B1 B2 Prep -LK", developer "Rexity Labs") — [Google Play](https://play.google.com/store/apps/details?id=ai.rexity.telc); Apple App Store "TELC & Goethe B1 B2 German" — [App Store](https://apps.apple.com/tt/app/telc-goethe-b1-b2-german/id6761135303); APKPure mirror — [APKPure](https://apkpure.com/telc-prep-a1-b2-%E2%80%93-levelkraft/ai.rexity.telc); LevelKraft YouTube video and channel — [YouTube](https://www.youtube.com/watch?v=_-yVk2QyKd8), [YouTube channel](https://m.youtube.com/@levelkraft-telc-prep/shorts); LevelKraft privacy page whose text (per WebSearch summary) names "REXITY AI Solutions" — [levelkraft.de/privacy](https://www.levelkraft.de/privacy); an X/Twitter account — [x.com/_rexity](https://x.com/_rexity); the public GitHub source repo — [github.com/sunnyth7/Rexity.ai-website](https://github.com/sunnyth7/Rexity.ai-website) (GitHub page fetched 2026-09-28: no description, no homepage URL set, 0 stars, 0 forks; folder names visible include fitnessstudio-website, kfz-aufbereitung-website, levelkraft-telc-prep-ai, save-and-fresh, website-mit-kursbuchung-kosten, and vercel.json).
- No LinkedIn company page for Rexity Labs, no Handelsregister/Northdata/Creditreform/unternehmensregister entry, and no directory listing (Sortlist, ProvenExpert, Feedbax, agenturfinder) surfaced for Rexity Labs in any query — Google via WebSearch, 2026-09-28 (queries "Rexity Labs LinkedIn Niedersachsen", "\"Rexity Labs\" Unternehmergesellschaft Handelsregister", "Rexity Labs Webdesign Niedersachsen Agentur").

### Inferences
- Google's cached title/description for www.rexity.ai ("Enterprise SAP AI Platform... predictive maintenance... for SAP systems") predates the current site and is not from this repo's history at all; either an earlier deployment on the domain (before this repo) or a different owner/site once carried that copy. Until Google recrawls, searchers see the company described as an SAP enterprise-AI vendor, not a Niedersachsen web/automation agency. Requesting reindexing via Search Console (verification file exists) is the obvious fix.
- Index coverage is effectively 1 of 29 sitemap URLs (based on what WebSearch exposes), so none of the service or landing pages can rank for anything yet.
- The strongest "entity" signal Google has for the company is the LevelKraft app (package namespace ai.rexity), not the agency business.

### Gaps
- Could not fetch www.rexity.ai (egress blocked) to confirm the live `<title>`; relied on the repo release candidate committed 2026-09-27. If the deploy is not live yet, the SAP title could be from whatever is currently served.
- Could not verify Play Store / App Store developer fields directly (hosts blocked); "Rexity Labs" as developer name comes from the Google result title/summary only.
- Google's full result pages (positions 11-20, exact snippets, knowledge panel presence) are not exposed by the WebSearch tool.
- No observation for any non-Google engine.

## Key question 2: Knowledge panel / entity card / People-also-ask / sitelinks?

### Takeaway
No evidence of any knowledge panel, entity card, PAA or sitelinks for Rexity Labs on Google; the tool exposes only organic links, but the organic pattern (single URL, stale title, no brand-name dominance) makes an entity card very unlikely. Nothing observable on other engines.

### Cited Findings
- WebSearch returned only flat organic link lists for "Rexity Labs UG", "Rexity Labs" and "rexity.ai"; no sitelinks (secondary rexity.ai URLs) were included for any brand query — Google via WebSearch, 2026-09-28.
- The brand query "Rexity Labs" places www.rexity.ai at position 5 behind Play Store, MakerWorld (@rexilabs), YouTube "Rexity" and LinkedIn "Desarrollos Rexity" — [Google via WebSearch, 2026-09-28](https://www.rexity.ai/).

### Inferences
- Sitelinks require multiple indexed, internally linked pages on the domain; with one indexed URL none can exist.
- No Wikipedia/Wikidata, no LinkedIn company page, no register listing surfaced, so there is no source for a knowledge-graph entity.

### Gaps
- The WebSearch tool does not render SERP features (knowledge panel, PAA, sitelinks); this is inferred, not observed. Manual Google check in a browser (google.de, German locale) recommended.
- Non-Google engines: not observed.

## Key question 3: Generic service queries (6-10): who ranks, and does Rexity appear in the top 20?

### Takeaway
Rexity does not appear in any observed result list for the five generic service queries (nor for #5 "Rexity" Webdesign Niedersachsen); page 1 is held by directories (Sortlist, Feedbax, ProvenExpert), niche agencies with dedicated landing pages, and SaaS booking tools.

### Cited Findings
- "Webdesign Agentur Niedersachsen" top domains: feedbax.ai, sortlist.de (x2), web.la-agencia.de, hgd-media.de, webdesign-kall.de, brand-tactics.de, smartfinity-media.de, homepage-designer.net; rexity.ai absent — [Google via WebSearch, 2026-09-28](https://www.sortlist.de/webdesign/niedersachsen-nds-de)
- "Website Fitnessstudio erstellen lassen" top domains: leosa.de, kreativschock.de, nc-newmedia.de, niederrhein-web.de, zajamedia.de, rankpilot.de, yola.com, fitleadsmarketing.de, support.squarespace.com; rexity.ai/fitnessstudio-website absent — [Google via WebSearch, 2026-09-28](https://www.kreativschock.de/fitnessstudio-website-erstellen-lassen/)
- "WhatsApp Automatisierung Agentur" top domains: whatsapp-automation.de, bitpalm.ai, jotform.com, connect.lime-technologies.com, respond.io, derprozessmeister.de, chatarmin.com, wassenger.com, infobip.com; rexity.ai/automation/whatsapp absent — [Google via WebSearch, 2026-09-28](https://derprozessmeister.de/ki-agent-whatsapp)
- "KI Voice Agent Agentur Deutschland" top domains: ki-voice-agenten.de, trendview.de, ki-voice-agenten-agentur.de, kiberatung.de, gipfelstuermer-agentur.de, voicery.ai, stkom.de, voico.ai, img3.ibisworld.com; rexity.ai/automation/voice absent — [Google via WebSearch, 2026-09-28](https://ki-voice-agenten-agentur.de/)
- "Website mit Kursbuchung Kosten" top domains: supersaas.de (x2), yolawo.de (x2), cituro.com, bookeo.com, kursifant.com, splonkit.com, coursera.org; rexity.ai/website-mit-kursbuchung-kosten absent — [Google via WebSearch, 2026-09-28](https://yolawo.de/online-buchungssystem-kurse/)
- Even with the brand name added ("Rexity" Webdesign Niedersachsen, and Rexity Labs Webdesign Niedersachsen Agentur), Google returns only generic Niedersachsen agencies (provenexpert.com, niedersachsen-webdesign.de, sortlist.de, webigraf.de, karolkowalczyk.de, die-webseiten-macher.de, webdesign-kall.de, web-shop-gestaltung.de, webdesign-niedersachsen.com, virtualx.de, mediaeffekt.de, infinity-labs.de, bloqlabs.ch) — Google via WebSearch, 2026-09-28.
- For "Website mit Kursbuchung Kosten" the intent Google serves is booking-software pricing (SaaS tools from ~20-25 EUR/month), not agency build cost — [SuperSaaS](https://www.supersaas.de/info/kurse-reservieren), [kursifant](https://kursifant.com/).

### Inferences
- Since the relevant rexity.ai landing pages are not indexed at all (see KQ1), non-appearance here is an indexing problem before it is a ranking problem.
- Query 10's SERP is dominated by SaaS booking tools; an agency "cost" page competes with a different intent than the SERP currently rewards.

### Gaps
- Positions 11-20 could not be observed (tool returns ~9-10 results). "Not in top 20" is therefore not proven; "not in top ~10" is.
- WebSearch is US-locale; a German-locale google.de SERP may differ in ordering (and for German-language queries, likely in favour of .de agencies).

## Key question 4: Negative, confusing or name-collision results

### Takeaway
"Rexity" is a crowded token: Google mixes in a Mexican real-estate consultancy (Desarrollos Rexity), gaming YouTube channels named Rexity, a Mexican site rexity.mx, a MakerWorld maker "Rexi Labs", several "Rexi/Rexie AI" apps, rex.ai, and multiple "REX" Wikipedia entries; "Rexity Nutrition" resolves to the unrelated US chain "Rexius Nutrition". Nothing negative (reviews, complaints) about Rexity Labs itself was found — because nothing about it exists.

### Cited Findings
- Name collisions returned for brand queries: "Desarrollos Rexity" (real-estate development consulting, Mexico, founded 2015 per search summary) — [LinkedIn](https://www.linkedin.com/company/desarrollos-rexity); "Rexity" YouTube channels — [youtube.com/c/Rexity](https://www.youtube.com/c/Rexity/playlists), [youtube.com/c/rexity](https://www.youtube.com/c/rexity), [Team Rexity](https://www.youtube.com/channel/UChaj_XUKwq9TChLVyEA30pw); a gamer profile "RexiTy" — [revoltworld.net](https://www.revoltworld.net/user/rexity/); a "My CMS" placeholder site at http://rexity.mx/ — [rexity.mx](http://rexity.mx/); "Rexity" portfolio entry at a Mexican design studio — [mayerhasbani.com](https://mayerhasbani.com/en/portfolio/rexity-2/); "Rexi Labs" on MakerWorld — [makerworld.com/@rexilabs](https://makerworld.com/en/@rexilabs).
- For "rexity.ai" Google returns look-alike AI apps/companies ahead of or beside the homepage: "Rexi-AI Photo & Video Maker" (rexi.ai.photo), "Rexie AI Limitless Genius" (com.rexie.ai.chatbot), "Rexie AI | LinkedIn", "rex.ai — News intelligence platform" — [Google via WebSearch, 2026-09-28](https://rex.ai/).
- "Rexity Nutrition" yields only "Rexius Nutrition" (Omaha, Nebraska supplement retailer, 17 stores per its own site) — [rexiusnutrition.com](https://www.rexiusnutrition.com/).
- Review-intent query "Rexity Labs UG Bewertung Erfahrungen" returned zero Rexity results; only unrelated Trusted Shops/Trustpilot pages for other UGs and "Medicross Labs", "TECHNOREX" — Google via WebSearch, 2026-09-28 ([example](https://www.trustedshops.de/company/redrice_solutions_ug__haftungsbeschrankt_/)).
- The most confusing result is Google's own listing of www.rexity.ai as "REXITY.AI - Enterprise SAP AI Platform | Agentic AI Workflows & Intelligent Dashboards", which is inconsistent with the deployed site copy (no "SAP" in the repo) — [Google via WebSearch](https://www.rexity.ai/) vs. local repo index.html.
- The LevelKraft privacy policy (per search summary) refers to the operator as "REXITY AI Solutions", a third naming variant next to "Rexity Labs" (Play Store) and "Rexity Labs UG (haftungsbeschränkt)" (Impressum) — [levelkraft.de/privacy](https://www.levelkraft.de/privacy).

### Inferences
- Inconsistent naming (Rexity Labs / REXITY.AI / REXITY AI Solutions / Rexity Labs UG) plus the stale SAP title fragments whatever entity signal exists; the SAP title in particular is actively misleading for a prospective SMB client.
- No reputation risk found, but also no trust signals (no reviews, no directory, no register page) for a review-intent searcher to land on.

### Gaps
- Could not open levelkraft.de or the app stores to confirm the "REXITY AI Solutions" wording first-hand (only from the WebSearch page summary).

## Key question 5: Stale / leaking preview URLs (vercel.app, netlify, github.io)?

### Takeaway
No vercel.app, netlify.app or github.io preview URL for Rexity surfaced in any Google query; the only "leak" is the public GitHub source repository, which outranks the homepage for the query "rexity.ai".

### Cited Findings
- "Rexity Labs vercel.app" returned only unrelated rex-*.vercel.app projects and Vercel Labs pages; no rexity preview — [Google via WebSearch, 2026-09-28](https://github.com/orgs/vercel-labs/repositories).
- `site:rexity.ai` and all brand queries returned no *.vercel.app / *.netlify.app / *.github.io hosts — Google via WebSearch, 2026-09-28.
- The public repo https://github.com/sunnyth7/Rexity.ai-website is indexed and ranks #1 for "rexity.ai", #1 for "\"rexity.ai\" SAP", #2 for "LevelKraft Rexity Labs TELC app", and #3 for "LevelKraft privacy policy rexity"; its GitHub page shows no description, no homepage link, 0 stars/0 forks, and exposes folder names (research_notes, reports, docs, data, api, scripts, save-and-fresh, kfz-aufbereitung-website, etc.) — [GitHub, fetched 2026-09-28](https://github.com/sunnyth7/Rexity.ai-website).
- vercel.json in the repo contains permanent redirects for /rexity-omi -> / and for a legacy "/LevelKraft-TELC Prep AI/Privacypolicy" path, indicating earlier URL structures existed on the domain — local repo /home/user/Rexity.ai-website/vercel.json.

### Inferences
- The public GitHub repo (which includes research_notes/ and reports/ directories) is the main unintended exposure; whether that is a problem depends on the repo's contents, which is outside this scope, but it clearly is the most visible Rexity asset on Google after the app.
- Absence of preview-URL leaks on Google does not rule out Bing/DDG (unobserved).

### Gaps
- Bing/DuckDuckGo/Yandex commonly index *.vercel.app hosts that Google drops; this could not be checked.
- Repo contents/visibility settings were not audited here.
