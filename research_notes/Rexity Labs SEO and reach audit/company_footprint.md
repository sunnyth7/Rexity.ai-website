# Rexity Labs UG (haftungsbeschränkt) — public footprint, reach and reputation (audit date 2026-09-28)

Method note: this session's network egress proxy blocked almost every third-party host (rexity.ai itself, all German registry mirrors, all traffic/backlink estimators, Wayback Machine, RDAP/DNS resolvers, Google Maps/Play, App Store, LinkedIn, Instagram, YouTube, X, TikTok, every review/directory site). Reachable were: web search (US index), github.com and the GitHub API. Where the live site could not be fetched, the local checkout of the site repository (`/home/user/Rexity.ai-website`, HEAD `15ec2b76` "Release candidate: new site", 2026-09-27) was used as the source and is cited as such — it is the deploy source, not proof of what is live. Every "blocked" result below is recorded explicitly; no numbers are guessed.

## Key question 1 — Legal registration (Handelsregister, register data)

### Takeaway
The company's own legal notice states Rexity Labs UG (haftungsbeschränkt), Willighäuser Weg 11, 29320 Südheide, Amtsgericht Lüneburg HRB 213911, managing director Sunny Singh Thakur — but the notice still carries a "draft pending incorporation" disclaimer, and no independent register mirror (northdata, companyhouse, unternehmensregister, handelsregister.de, firmenwissen, creditreform, implisense, D&B) could be reached or is indexed for the company.

### Cited Findings
- Legal notice (repo source of /impressum, "Stand: 23.07.2026"): "Rexity Labs UG (haftungsbeschränkt), Willighäuser Weg 11, 29320 Südheide, Deutschland; Vertreten durch: Sunny Singh Thakur (Geschäftsführer); Registergericht: Amtsgericht Lüneburg; Registernummer: HRB 213911; Steuernummer: 17/201/12328; USt-IdNr. DE464252076; Kein Ausweis der Umsatzsteuer gemäß § 19 UStG (Kleinunternehmerregelung); E-Mail info@rexity.ai; Telefon +49 174 2471435" — [Repo file impressum.html, deployed to https://www.rexity.ai/impressum](https://github.com/sunnyth7/Rexity.ai-website)
- The same legal notice ends with: "Dieses Impressum ist ein Entwurf zur juristischen Prüfung und wird nach Abschluss der Gesellschaftsgründung sowie nach anwaltlicher Freigabe finalisiert." (i.e. it self-describes as a draft to be finalised after incorporation and legal review) — [Repo file impressum.html](https://github.com/sunnyth7/Rexity.ai-website)
- Site footer on every page: "© 2026 Rexity Labs UG (haftungsbeschränkt) · HRB 213911 · Amtsgericht Lüneburg." — [Repo file impressum.html / work pages](https://github.com/sunnyth7/Rexity.ai-website)
- Homepage schema.org Organization data: name "Rexity Labs UG", founder "Sunny Singh Thakur", foundingDate "2026", telephone "+49 174 2471435", email "info@rexity.ai", areaServed Niedersachsen/Hannover/Braunschweig/Wolfsburg/Celle/Lüneburg — [Repo file index.html](https://github.com/sunnyth7/Rexity.ai-website)
- Chatbot knowledge base (data/rexity-knowledge.json, v3.2.0, lastReviewed 2026-09-27, approvedBy "Sunny Thakur"): "Rexity Labs UG (haftungsbeschränkt) was founded by Sunny Singh Thakur, who runs the company as managing director. Rexity is a small team in Hermannsburg (Südheide, district of Celle)" — [Repo file data/rexity-knowledge.json](https://github.com/sunnyth7/Rexity.ai-website)
- Web search for "HRB 213911" Lüneburg returned no company match (only other Lüneburg-register firms and the Amtsgericht Lüneburg service page) — [Search result set, incl. Amtsgericht Lüneburg Registersachen](https://amtsgericht-lueneburg.niedersachsen.de/startseite/service/registersachen/registersachen-64067.html)
- Web search "Rexity Labs" restricted to northdata.de / companyhouse.de / creditreform.de / webvalid.de / online-handelsregister.de returned no Rexity entry; nearest hits were unrelated ("Rexmix UG, Berlin", "ARKI Labs UG", "Rex Technologies GmbH") — [companyhouse.de Rexmix UG](https://www.companyhouse.de/Rexmix-UG-Berlin); [northdata ARKI Labs UG](https://www.northdata.de/ARKI%20Labs%20UG,%20Dresden/HRB%2041352)
- Web search "Rexity Labs" Handelsregister HRB returned only "Recurity Labs GmbH, Berlin, HRB 105213 B" (a different company) — [creditreform Recurity Labs](https://firmeneintrag.creditreform.de/10997/2011825374/RECURITY_LABS_GMBH)
- Direct fetches BLOCKED by egress proxy (HTTP 403 CONNECT, "policy denial"): https://www.northdata.de/?query=Rexity+Labs ; https://www.companyhouse.de/suche?q=Rexity+Labs ; https://www.unternehmensregister.de/… ; https://www.firmenwissen.de/suche?q=Rexity+Labs ; https://implisense.com/de/search?q=Rexity ; https://www.dnb.com/business-directory/company-search.html?term=Rexity+Labs ; https://www.handelsregister.de/rp_web/welcome.xhtml ; https://www.handelsregisterbekanntmachungen.de/… ; https://www.webvalid.de/suche?q=Rexity ; https://www.online-handelsregister.de/… ; https://lemreveal.com/data/germany ; https://www.unternehmen24.info/… — (proxy status log, this session)

### Inferences
- The HRB number and Amtsgericht are self-reported only; combined with the "Entwurf … nach Abschluss der Gesellschaftsgründung" disclaimer still present in the deployed source, a reader cannot tell from public sources whether the UG is already registered or whether the number is a placeholder. This is a credibility risk that a register check (northdata/handelsregister.de) from an unrestricted network would settle in one lookup.
- The § 19 UStG Kleinunternehmer statement implies expected annual turnover under the small-business threshold; together with foundingDate "2026" it signals a very young, very small entity.

### Gaps
- Founding date, share capital, Gesellschafter, register-entry date and any Bekanntmachung text: unobtainable (all register mirrors blocked; none indexed by web search).
- Whether the live /impressum still contains the "Entwurf" sentence: live site blocked; the repo HEAD dated 2026-09-27 still contains it.

## Key question 2 — Web presence beyond rexity.ai (social, GitHub, app stores, directories, reviews)

### Takeaway
Outside its own domain the company is essentially invisible: the only third-party footprints found are two mobile-app store listings (LevelKraft TELC app, CLEVR app) and a GitHub account with 0-star repos; the Instagram and LinkedIn handles linked from the site are not discoverable via search, and no directory, review-site, Google Business, Kununu, Xing, Clutch, Sortlist or startup-database entry surfaced.

### Cited Findings
- The site links to exactly two social profiles, https://www.instagram.com/rexitylabs/ and https://www.linkedin.com/company/rexity/ (footer of every page) — [Repo files work/index.html, aeb.html](https://github.com/sunnyth7/Rexity.ai-website); both URLs BLOCKED by proxy when fetched.
- Web search for the exact handle "rexitylabs" returned nothing related (only "Rexlabs", a real-estate software firm) — [Rexlabs on Crunchbase](https://www.crunchbase.com/organization/rexlabs); web search "rexitylabs instagram OR tiktok OR youtube" returned no matching account.
- Web search "linkedin.com/company/rexity" did not surface the company page; the only "Rexity" LinkedIn company page indexed is "Desarrollos Rexity" (Mexico, real estate, 440 followers) — [Desarrollos Rexity | LinkedIn](https://www.linkedin.com/company/desarrollos-rexity)
- GitHub profile sunnyth7 (user id 45876823): no bio, no company, no website shown; 3 public repositories: LevelKraftWebsite (TypeScript), LevelKraft (TypeScript), Rexity.ai-website (HTML) — [github.com/sunnyth7](https://github.com/sunnyth7); [GitHub user search](https://api.github.com/search/users?q=sunnyth7)
- Repo sunnyth7/Rexity.ai-website: public, no description, 0 stars, 0 forks, 0 watchers, 156 commits on main — [github.com/sunnyth7/Rexity.ai-website](https://github.com/sunnyth7/Rexity.ai-website)
- Public repo sunnyth7/LevelKraft: 0 stars, 0 forks, created and last pushed 2026-02-17 — [GitHub repo search user:sunnyth7](https://github.com/sunnyth7/LevelKraft)
- GitHub code search for "rexity.ai" excluding the company's own repo: 0 results (no other public repository references the domain) — [GitHub code search API](https://github.com/search?q=%22rexity.ai%22&type=code)
- Google Play: "TELC & Goethe B1 B2 Prep -LK" (package ai.rexity.telc), developer shown as Rexity Labs, "5K+ downloads" per the search snippet — [Google Play listing](https://play.google.com/store/apps/details?id=ai.rexity.telc) (direct fetch BLOCKED; figure comes from search-engine snippet only)
- iOS: "TELC & Goethe B1 B2 German" App Store id 6761135303 — [App Store (NO storefront)](https://apps.apple.com/no/app/telc-goethe-b1-b2-german/id6761135303) (fetch BLOCKED; no rating data obtained)
- Second app: "Soirée & Invitations: CLEVR" (Android com.clevr.app, iOS id 6761129912) developed by Sunny Singh Thakur per search snippet — [App Store](https://apps.apple.com/us/app/soir%C3%A9e-invitations-clevr/id6761129912?l=fr-FR); [Google Play](https://play.google.com/store/apps/details?id=com.clevr.app&hl=fr)
- A search snippet for the Play developer listing states developer contact "sunnyth7@gmail.com" and address "Willighäuser Weg 11, 29320 Südheide, Germany", linking the app publisher to the company address — [Google Play ai.rexity.telc](https://play.google.com/store/apps/details?id=ai.rexity.telc)
- LevelKraft has its own YouTube channel and video: "TELC Exam Prep A1–C1 … LevelKraft App" and channel @levelkraft-telc-prep — [YouTube video](https://www.youtube.com/watch?v=_-yVk2QyKd8); [YouTube channel shorts](https://m.youtube.com/@levelkraft-telc-prep/shorts) (subscriber counts not obtainable, host blocked)
- LevelKraft web properties: https://www.levelkraft.de/privacy and https://app.levelkraft.de/ are indexed — [levelkraft.de privacy](https://www.levelkraft.de/privacy); [app.levelkraft.de](https://app.levelkraft.de/) (fetch BLOCKED)
- Directories / reviews — all direct fetches BLOCKED: Google Maps search (www.google.com), Trustpilot /review/rexity.ai, ProvenExpert search, Clutch search, Sortlist search, gelbeseiten.de, 11880.com, cylex.de, yelp.de, kununu.com, xing.com. Web searches "Rexity" + (kununu|xing|trustpilot|provenexpert|clutch|sortlist) and "Rexity" + (gelbeseiten|11880|cylex|wer liefert was|yelp) returned no Rexity entry — [Sortlist Niedersachsen webdesign list (no Rexity)](https://www.sortlist.de/webdesign/niedersachsen-nds-de); [feedbax Niedersachsen design agencies (no Rexity)](https://feedbax.de/design-agenturen/niedersachsen)
- Startup databases: web search "Rexity" crunchbase OR dealroom OR startbase OR startupdetector returned no Rexity profile — [search result set, e.g. Startbase on Crunchbase](https://www.crunchbase.com/organization/startbase-2b3a)
- Founder profile: web searches for "Sunny Singh Thakur" and "Sunny Thakur" + Rexity/LevelKraft return only unrelated namesakes (an Accenture VP, a Coforge analyst, many Indian software engineers); no LinkedIn profile connected to Rexity was found — [LinkedIn directory "Sunny Singh Thakur"](https://www.linkedin.com/pub/dir/Sunny+Singh/Thakur); [Coforge namesake](https://in.linkedin.com/in/sunny-singh-thakur-49a523108)
- Google Search Console is set up: verification file googled143c8bf41723924.html and robots.txt pointing to https://www.rexity.ai/sitemap.xml (29 URLs) exist in the deploy root — [Repo files](https://github.com/sunnyth7/Rexity.ai-website)

### Inferences
- Social reach is effectively unmeasurable and probably negligible: the two linked handles are not indexed by search, and the company never appears in any agency directory, review site, or startup database.
- The strongest third-party signal is the LevelKraft app ("5K+" installs on Play per snippet), which is branded LevelKraft, not Rexity — so it builds little brand equity for the agency name.

### Gaps
- Follower/post counts for Instagram @rexitylabs and LinkedIn /company/rexity: hosts blocked, not indexed.
- Google Business Profile existence, rating, review count: Google Maps blocked.
- App Store/Play ratings, review counts, last-update dates: hosts blocked.
- Kununu/Xing/Trustpilot/ProvenExpert/Clutch/Sortlist/DesignRush/GoodFirms/Agenturmatching/WLW/Gelbe Seiten/11880/Cylex/Yelp: hosts blocked; web search shows no entry, but absence in a US-biased search index is not proof of absence.

## Key question 3 — Backlinks, mentions, site history, traffic estimates

### Takeaway
No backlinks or third-party mentions of rexity.ai were found in web search or GitHub code search; every traffic/backlink estimator and the Wayback Machine were blocked, so reach cannot be quantified from outside — the only hard "activity" metrics are the repo's own commit cadence and the site's self-published LevelKraft analytics.

### Cited Findings
- Web search for "rexity.ai" (quoted, excluding rexity.ai and github.com) returned only the site itself, the GitHub repo, the Play listing, and unrelated look-alikes (Rexie AI, Rexi-AI, rex.ai); no press, blog, directory or forum mention — [GitHub repo](https://github.com/sunnyth7/Rexity.ai-website); [Rexie AI LinkedIn (unrelated)](https://www.linkedin.com/company/rexie-ai); [rex.ai (unrelated)](https://rex.ai/)
- Search-engine index of the homepage currently shows the title "REXITY.AI - Enterprise SAP AI Platform | Agentic AI Workflows & Intelligent Dashboards" and a description about "agentic AI workflows, intelligent dashboards, and autonomous agents … for SAP systems" — [www.rexity.ai as indexed](https://www.rexity.ai/)
- The earliest commit available in the local clone (2026-07-23) already had the title "Rexity Labs — Software, Apps & Automatisierung aus Deutschland"; no commit in the available history contains the string "Enterprise SAP AI Platform" — [Repo git history](https://github.com/sunnyth7/Rexity.ai-website)
- Repo commit cadence (local shallow clone, 52 of the 156 commits): first 2026-07-23, last 2026-09-27; 10 commits in Jul 2026, 7 in Aug, 35 in Sep; authors sunnyth7 / "Sunny Thakur" only — [Repo git log](https://github.com/sunnyth7/Rexity.ai-website)
- Hosting: vercel.json sets region "fra1" (Frankfurt) with cleanUrls, HSTS preload headers, and permanent redirects incl. /rexity-omi → / and /web/web-development → /web/web-design; pages load Vercel Web Analytics only on *.rexity.ai / *.vercel.app hosts — [Repo file vercel.json](https://github.com/sunnyth7/Rexity.ai-website)
- Self-published traffic for the sister product levelkraft.de (not rexity.ai): monthly pageviews Mar 515, Apr 155, May 372, Jun 351, Jul 624, Aug 2,736, Sep (to 22.09.) 2,892; 569 unique visitors in the last full 7-day window (≈81/day); 2,590 visitors 1–27 Sep; source stated as "Vercel Web Analytics; interne Anmelde- und Umsatzdaten. Stand: September 2026" — [Repo file work/levelkraft/index.html (deployed at /work/levelkraft)](https://github.com/sunnyth7/Rexity.ai-website)
- Same page states LevelKraft app MRR of ca. $50 (May) → $80 (Jun) → $110 (Jul) → $160 (Aug) → $290 (Sep 2026), "Werte gerundet", with a forecast disclaimer "keine Garantie" — [Repo file work/levelkraft/index.html](https://github.com/sunnyth7/Rexity.ai-website)
- BLOCKED (egress 403): https://www.similarweb.com/website/rexity.ai/ ; https://hypestat.com/info/rexity.ai ; https://www.semrush.com/website/rexity.ai/overview/ ; https://ahrefs.com/traffic-checker/?input=rexity.ai ; https://www.statshow.com/www/rexity.ai ; https://siteprice.org/website-value/rexity.ai ; moz.com/domain-analysis (fetch failed) — (proxy status log)
- BLOCKED: http://archive.org/wayback/available?url=rexity.ai and https://web.archive.org/cdx/search/cdx?url=rexity.ai ("Host not in allowlist") — (Bash output this session)
- No traffic figures for rexity.ai itself are published anywhere the search index reached.

### Inferences
- The indexed SAP-platform title is inconsistent with the July-2026 repo baseline, which suggests either a pre-July site version that positioned Rexity as an "Enterprise SAP AI Platform" and has not been re-crawled, or an older cached snippet; either way the current search snippet misrepresents the agency and is an SEO/credibility problem worth fixing (request re-indexing after verifying the live <title>).
- With zero discoverable backlinks, zero GitHub references and no directory listings, rexity.ai's organic authority is almost certainly minimal; the agency's only demonstrated organic traction is on levelkraft.de, and those numbers are self-reported.

### Gaps
- Domain Rating/Authority, referring domains, estimated visits for rexity.ai: all estimators blocked.
- Wayback capture count, first capture date, change frequency: archive.org blocked.
- Whether Google has re-crawled the September-2026 relaunch: cannot verify (live site blocked).

## Key question 4 — Domain facts (WHOIS/RDAP, DNS, age)

### Takeaway
No domain-registration or DNS data could be retrieved: every resolver and RDAP/WHOIS endpoint was blocked and the container has no `whois`/`dig` binaries; the only hosting evidence is the repo's Vercel configuration.

### Cited Findings
- BLOCKED: https://rdap.org/domain/rexity.ai (403), https://who.is/whois/rexity.ai (403), https://dns.google/resolve?name=rexity.ai (403), https://cloudflare-dns.com/dns-query (403); https://rdap.nic.ai/domain/rexity.ai → DNS lookup failed (ENOTFOUND); `whois` and `dig` commands not installed — (Bash and WebFetch output this session)
- Direct HTTPS to https://www.rexity.ai/ from the container: "CONNECT tunnel failed, response 403" — (curl output this session)
- Site is configured for Vercel (vercel.json, region fra1, `/_vercel/insights/script.js` analytics loader); the chatbot knowledge base states "Website-Hosting bei Vercel in Frankfurt" — [Repo files vercel.json, data/site-knowledge.json](https://github.com/sunnyth7/Rexity.ai-website)
- A privacy-policy path for the LevelKraft app was historically hosted under rexity.ai ("/LevelKraft-TELC Prep AI/Privacypolicy" now redirected to /levelkraft-telc-prep-ai/privacypolicy), and the Play package name is ai.rexity.telc, indicating the domain predates the LevelKraft app release (app repo created 2026-02-17) — [Repo file vercel.json](https://github.com/sunnyth7/Rexity.ai-website); [Google Play ai.rexity.telc](https://play.google.com/store/apps/details?id=ai.rexity.telc)

### Inferences
- The domain was in use at least by early 2026 (app package namespace + privacy-policy path), but exact registration date, registrar and nameservers remain unknown.

### Gaps
- Registration date, expiry, registrar, registrant, nameservers, A/MX/TXT records: all unobtainable from this network.

## Key question 5 — Portfolio, client sites and social proof

### Takeaway
The public portfolio consists of three case studies — two named local clients (Body & Care Hermannsburg, live since 14.09.2026; Fahrzeugpflege Celle, not yet on its own domain) and the company's own product LevelKraft — plus 14 explicitly labelled "Design-Konzept" mock-ups; no client testimonials with real names exist on the site, and the client sites could not be fetched to confirm a "built by Rexity" credit.

### Cited Findings
- /work lists "Ausgewählte Arbeiten": Body & Care Hermannsburg (Website & Online-Kursbuchung, "Live seit 14.09.2026", bodycare-fitness.de), Fahrzeugpflege Celle (Website & Online-Terminbuchung, "Fertiggestellt · Go-live auf eigener Domain in Vorbereitung", no external URL), LevelKraft ("unser eigenes Produkt", levelkraft.de, "Seit November 2025", "Live im App Store, bei Google Play und im Web") — [Repo files work/index.html, work/body-and-care/index.html, work/chara/index.html, work/levelkraft/index.html](https://github.com/sunnyth7/Rexity.ai-website)
- /work "Designs aus dem Studio": "14 weitere Websites und Apps aus unserem Studio: eigene Produkte und Design-Konzepte" — BodyLabs, Rejoice Salon, Möbelmanufaktur Sonnenhof, Sunshine Salon, The Sunshine Irish Pub, CLEVR (Eigenes Produkt), Rexity Studio, Sunshine Fitness, Sunny Resorts, Sunshine Hotel & Restaurants, Hermannsburg Industries, Sunshine Pizzaria, Immo Markler, Schuemacher — each tagged "Design-Konzept" except CLEVR — [Repo file work/index.html](https://github.com/sunnyth7/Rexity.ai-website)
- Own products listed: LevelKraft (Live), RexDesk ("Wir testen es gerade intensiv – bald verfügbar"), RexFangs, CLEVR — [Repo file work/index.html](https://github.com/sunnyth7/Rexity.ai-website)
- Web search for "RexDesk" OR "RexFangs" OR "Rexity Studio" found no external mention of any of them — [search result set (only unrelated Rexet Studio / Rexity GitHub)](https://github.com/Rexity)
- No testimonial block, named quote or star rating was found in the deployed HTML (grep for testimonial/„Kunden sagen"/Bewertung across index.html and work/index.html returned nothing) — [Repo files](https://github.com/sunnyth7/Rexity.ai-website)
- Chatbot guardrail in the knowledge base: "Never invent case studies, references, testimonials, packages or integrations. The only references you may name are the published ones on https://www.rexity.ai/work: Body & Care Hermannsburg, Fahrzeugpflege Celle and LevelKraft." and changelog v3.1.2: "Body & Care customer figures removed (hidden on the work pages)" — [Repo file data/rexity-knowledge.json](https://github.com/sunnyth7/Rexity.ai-website)
- Third-party listings of the client Body & Care Hermannsburg (Bahnhofstr. 3, 29320 Hermannsburg) still give the website as www.bac-fitness.de, not bodycare-fitness.de — [Hansefit partner page](https://hansefit.de/de/studio-finden/hermannsburg/fitnessstudio/body-and-care/); [wirdfit.de](https://wirdfit.de/studio/body-care-hermannsburg/); [Facebook page](https://www.facebook.com/p/Body-and-Care-100063593532481/)
- Web search "bodycare-fitness.de" OR "Body & Care Hermannsburg" Rexity found no page connecting the studio to Rexity — (same result set)
- https://www.bodycare-fitness.de/ , https://www.levelkraft.de/ and https://app.levelkraft.de/ : fetch BLOCKED, so whether they credit Rexity could not be verified.
- The earlier portfolio paths named in the assignment (clevr, rexity-omi, save-and-fresh, levelkraft-telc-prep-ai, aeb) exist as directories in the repo but contain no index.html (rexity-omi is 301-redirected to /; levelkraft-telc-prep-ai holds the app privacy policy; aeb is now /aeb "AEB — Rexity Labs UG", a legal page) — [Repo tree and vercel.json](https://github.com/sunnyth7/Rexity.ai-website)
- Pricing stated on site/knowledge base: websites from 999 €, with backend/booking from 1,999 €, relaunch from 1,299 €, maintenance optional annual package from 999 €; "4–8 Wochen Umsetzung" — [Repo file data/rexity-knowledge.json](https://github.com/sunnyth7/Rexity.ai-website)

### Inferences
- Verified paying-client evidence visible to outsiders is limited to one live local website (Body & Care) and one unfinished one; most of the visual portfolio is concept work, which the site itself labels honestly.
- The old bac-fitness.de address still being the one listed on aggregators suggests the domain migration is recent and the client's own citations have not been updated — a small local-SEO task that would also create a first real backlink to rexity.ai if the new site credits the agency.

### Gaps
- Whether bodycare-fitness.de / levelkraft.de link back to rexity.ai: unverifiable (hosts blocked).
- Identity/domain of "Fahrzeugpflege Celle": not disclosed on the site.

## Key question 6 — Name collisions ("Rexity")

### Takeaway
"Rexity" is heavily diluted: a Mexican real-estate developer (rexity.mx, the only "Rexity" with a LinkedIn company page and Glassdoor/ZoomInfo profiles), a US gaming YouTuber @Rexity, several X/TikTok/Pinterest handles, a GitHub user "Rexity", and near-homonyms (Rexie AI, Rexi-AI, rex.ai, Rexlabs, Recurity Labs) dominate generic search results.

### Cited Findings
- Desarrollos Rexity — real-estate development firm, Nuevo León, Mexico, established 2015, website www.rexity.mx, LinkedIn 440 followers, HQ "1102 Av Juarez Piso 21, San Jorge, Nuevo Leon 64000" — [LinkedIn](https://www.linkedin.com/company/desarrollos-rexity); [ZoomInfo](https://www.zoominfo.com/c/desarrollos-rexity/546701482); [Glassdoor](https://www.glassdoor.com/Overview/Working-at-Rexity-Desarrollos-EI_IE2725021.11,29.htm); [rexity.mx](http://rexity.mx/wordpress/)
- "Rexity" mixed-use project in Monterrey (hotel, offices, retail, housing) in an architect's portfolio — [Mayer Hasbani portfolio](https://mayerhasbani.com/en/portfolio/rexity-2/)
- YouTube @Rexity — gaming-challenge channel, "2k YouTuber based in New Jersey" per snippet — [youtube.com/@Rexity](https://www.youtube.com/@Rexity); also channel "Team Rexity" — [YouTube](https://www.youtube.com/channel/UChaj_XUKwq9TChLVyEA30pw); playlist "REXY Media | Rexity" — [YouTube](https://www.youtube.com/playlist?list=PL7410-fIXANZOWEoUlM4kBo2LW-tUg-hj)
- X/Twitter handles: @_rexity (Toronto, joined Aug 2014), @RReXity, @RexityIsBetter — [x.com/_rexity](https://x.com/_rexity); [x.com/rrexity](https://x.com/rrexity); [x.com/RexityIsBetter](https://x.com/RexityIsBetter)
- TikTok @.rexity and Pinterest /rexity — [tiktok.com/@.rexity](https://www.tiktok.com/@.rexity); [pinterest.com/rexity](https://www.pinterest.com/rexity/)
- GitHub user "Rexity" (id 44346845): 5 Roblox-style game repos, 1 follower, unrelated to the German company — [github.com/Rexity](https://github.com/Rexity)
- Near-homonyms competing for "rexity.ai"-style queries: Rexie AI chatbot app and LinkedIn page; Rexi-AI photo/video app; rex.ai news-intelligence platform; Rexlabs (real-estate software, 39 GitHub repos); Recurity Labs GmbH Berlin — [Rexie AI Play](https://play.google.com/store/apps/details?id=com.rexie.ai.chatbot&hl=en&gl=US); [Rexi-AI Play](https://play.google.com/store/apps/details?id=rexi.ai.photo&hl=en_US); [rex.ai](https://rex.ai/); [Rexlabs GitHub](https://github.com/rexlabsio); [Recurity Labs](https://www.webvalid.de/company/Recurity+Labs+GmbH,+Berlin/HRB+105213+B)
- "Rexity Nutrition" / "Rexity Ltd": no such entities found; the search surfaced only Rexius Nutrition Inc. (Omaha) and Nutrition Rex Ltd (UK, dissolved 2024) — [Rexius Nutrition D&B](https://www.dnb.com/business-directory/company-profiles.rexius_nutrition_inc.201fb2f09a6560adb193ce6489a193d5.html); [Nutrition Rex Ltd, Companies House](https://find-and-update.company-information.service.gov.uk/company/13731541)
- rexity.com: no live site surfaced in search results (not confirmed either way; host not fetched).

### Inferences
- For brand-name queries, the German agency currently loses to the Mexican developer (LinkedIn, ZoomInfo, Glassdoor) and the gaming YouTuber; only the compound "Rexity Labs" and the domain "rexity.ai" are unambiguous, and even "rexity.ai" is crowded by Rexie/Rexi AI apps.

### Gaps
- Ownership/status of rexity.com and rexity.de: not checked (hosts unreachable; no search hit).

## Key question 7 — Press, podcasts, talks, awards, jobs, startup listings

### Takeaway
No press coverage, podcast appearance, event talk, award, job posting, Meetup or startup-database entry for Rexity Labs was found.

### Cited Findings
- Web search "Rexity" podcast OR interview OR award OR meetup OR job (Germany, AI agency) returned only generic podcasts and unrelated pages — e.g. [GTAI "Into Germany" podcast (unrelated)](https://www.gtai.de/en/invest/service/podcast-into-germany/episode-34-from-assistance-to-action-the-rise-of-agentic-ai-1996646)
- Web search "Rexity" crunchbase OR dealroom OR startbase OR startupdetector: no Rexity profile — [search set, e.g. Startupdetector on Crunchbase](https://www.crunchbase.com/organization/startupdetector)
- Web search "Rexity Labs" Niedersachsen/Germany/Deutschland: only the Play listing and unrelated "Rex Technologies GmbH" results — [Rex Technologies GmbH D&B (unrelated)](https://www.dnb.com/business-directory/company-profiles.rex_technologies_gmbh.6c3cc6a01af48bacc98678d9168397a6.html)
- Web search "Rexity" Südheide OR Celle OR Lüneburg: zero Rexity hits (only Naturpark Südheide tourism pages) — [Naturpark Südheide (unrelated)](https://www.lueneburger-heide.de/naturpark-suedheide)

### Inferences
- The company has done no visible PR, has not been picked up by regional media (Celle/Lüneburg), and is not in any startup registry; its only third-party visibility comes from app-store listings under the LevelKraft/CLEVR brands.

### Gaps
- German-language regional press (Cellesche Zeitung, Landeszeitung Lüneburg) and IHK Lüneburg-Wolfsburg member listings were not searchable from this US-index search tool and were not reachable directly.

## Summary table — source-by-source result (2026-09-28)

| Source | URL tried | Result |
|---|---|---|
| Live site /impressum, /work | https://www.rexity.ai/… | BLOCKED (egress 403); repo source used instead |
| northdata.de | https://www.northdata.de/?query=Rexity+Labs | BLOCKED; not indexed by search |
| companyhouse.de | https://www.companyhouse.de/suche?q=Rexity+Labs | BLOCKED; not indexed |
| unternehmensregister.de | search URL | BLOCKED |
| handelsregister.de | https://www.handelsregister.de/rp_web/welcome.xhtml | BLOCKED |
| firmenwissen / creditreform / implisense / D&B | search URLs | BLOCKED; not indexed |
| LinkedIn company /company/rexity | https://www.linkedin.com/company/rexity/ | BLOCKED; not indexed |
| Instagram @rexitylabs | https://www.instagram.com/rexitylabs/ | BLOCKED; not indexed |
| GitHub sunnyth7 | https://github.com/sunnyth7 | OK — 3 public repos, 0 stars |
| GitHub code search "rexity.ai" | API | OK — 0 external references |
| Google Play ai.rexity.telc | play.google.com | BLOCKED; snippet says "5K+ downloads", developer Rexity Labs |
| App Store id6761135303 / id6761129912 | apps.apple.com | BLOCKED |
| Google Maps "Rexity Labs" | https://www.google.com/maps/search/Rexity+Labs | BLOCKED |
| Trustpilot, ProvenExpert, Clutch, Sortlist, Kununu, Xing, Gelbe Seiten, 11880, Cylex, Yelp | search/profile URLs | BLOCKED; no entry found via web search |
| Similarweb, Hypestat, Semrush, Ahrefs, Moz, StatShow, SitePrice | rexity.ai lookups | BLOCKED |
| Wayback (availability API, CDX) | archive.org / web.archive.org | BLOCKED |
| RDAP/WHOIS/DNS (rdap.org, rdap.nic.ai, who.is, dns.google, cloudflare-dns) | rexity.ai | BLOCKED / unresolvable; no whois/dig binaries |
| Client sites bodycare-fitness.de, levelkraft.de, app.levelkraft.de | homepages | BLOCKED |
| Crunchbase/Dealroom/Startbase/Startupdetector | web search | no entry |
| Press/podcasts/awards/jobs | web search | none found |
