# NAP-Block und Verzeichnis-Liste

Stand: 2026-09-24 (Anzeigename an Google-Profil angeglichen). NAP = Name, Address, Phone. Diese Strings müssen in **jedem** Verzeichnis
zeichengleich verwendet werden (gleiche Schreibweise, gleiche Leerzeichen, gleiche Ortsbezeichnung).
Abweichungen zwischen Google, Bing, Branchenbüchern und Impressum sind das häufigste Local-SEO-Problem
und lassen sich später nur mühsam korrigieren.

Jede URL in der Tabelle wurde am 2026-09-23 per HTTP-Abruf geprüft; wo das aus dieser Umgebung nicht
möglich war (Bot-Sperre, Geo-Sperre, DNS), steht **unverified** mit dem Grund.

---

## 1. Kanonischer NAP-Block (exakt so kopieren)

| Feld | Wert |
|---|---|
| Name (Anzeigename, = Google-Profil) | `Rexity Labs UG` |
| Name (juristisch, nur wo Rechtsform verlangt wird) | `Rexity Labs UG (haftungsbeschränkt)` |
| Straße | `Willighäuser Weg 11` |
| PLZ | `29320` |
| Ort | `Südheide` |
| Ortsteil (nur wenn ein eigenes Feld existiert) | `Hermannsburg` |
| Bundesland | `Niedersachsen` |
| Land | `Deutschland` |
| Adresse einzeilig | `Willighäuser Weg 11, 29320 Südheide, Deutschland` |
| Telefon (Anzeige) | `+49 174 2471435` |
| Telefon (E.164, für `tel:`-Links und API-Felder) | `+491742471435` |
| Website | `https://www.rexity.ai/` |
| E-Mail | `info@rexity.ai` |
| Kategorie (Freitext) | `Softwareentwicklung und Webdesign` |
| Kategorie (Google-Hauptkategorie) | `Softwareentwickler/-hersteller` |
| Geschäftsführer | `Sunny Singh Thakur` |
| Handelsregister | `Amtsgericht Lüneburg, HRB 213911` |
| Steuernummer (nur wo verlangt) | `17/201/12328` |
| USt-IdNr. (laut Impressum) | `DE464252076` |
| Gründungsjahr | `2026` |

Warum `Südheide` und nicht `Hermannsburg`: Impressum (https://www.rexity.ai/impressum), NorthData und
das Handelsregister führen `29320 Südheide`. Hermannsburg ist ein Ortsteil der Gemeinde Südheide.
Der Ort im NAP muss dem Register und dem Impressum entsprechen; "Hermannsburg" gehört in Beschreibungstexte.

### Beschreibung kurz (231 Zeichen)

```
Rexity Labs, Software- und Digitalagentur aus dem Landkreis Celle: Websites mit Online-Buchung, mobile Apps, WhatsApp- und Prozess-Automatisierung sowie Chatbots für Dienstleister in Celle, Hannover, Braunschweig und Niedersachsen.
```

### Beschreibung lang (747 Zeichen)

```
Rexity Labs ist eine Software- und Digitalagentur aus Hermannsburg (Gemeinde Südheide) im Landkreis Celle. Wir entwickeln Websites mit Online-Buchung, mobile Apps und Dashboards für Dienstleister, Handwerk, Praxen, Studios und Werkstätten in Celle, Hannover, Braunschweig, Wolfsburg, Lüneburg und Niedersachsen. Dazu kommen Prozess- und WhatsApp-Automatisierung sowie Website-Chatbots, die Anfragen und Termine rund um die Uhr abfangen. Wir arbeiten als Design-and-Build-Partner: Konzept, Gestaltung, Entwicklung, Hosting und Wartung aus einer Hand, mit festen Preisen und klaren Zeitplänen. Referenzen: Body & Care Hermannsburg (Fitnessstudio mit Kursbuchung) und Fahrzeugpflege Celle (Online-Terminbuchung). Zum Erstgespräch kommen wir zu Ihnen.
```

### Öffnungszeiten (Vorschlag, vom Gründer zu bestätigen)

`Mo–Fr 09:00–18:00, Sa/So geschlossen`

### Nach GBP-Bestätigung hier nachtragen

| Feld | Wert |
|---|---|
| Google-Profil (Bewertungslink) | `https://g.page/r/CdC2R6jI0hKLEAE/review` |
| Google Place ID | `ChIJaQCOtB35NwQR0LZHqMjSEos` |
| Duplikat | Zweites, älteres Profil "Rexity Tech-Labs" (Business-ID 12142606431947245644) existiert noch — entfernen oder als geschlossen markieren, bevor weitere Verzeichnisse angelegt werden |
| Bing Places ID | _(offen)_ |

---

## 2. Verzeichnisse in Prioritätsreihenfolge

Legende Spalte "Kosten": **frei** = dauerhaft kostenloser Basiseintrag; **Trial** = kostenlose
Testphase, danach kostenpflichtig (nicht nutzen); **Mitglied** = im Mitgliedsbeitrag enthalten.
Spalte "SAB" = Service-Area-Business / Adresse ausblendbar.

| Prio | Verzeichnis | Anmelde-/Claim-URL (geprüft) | Kosten | SAB / Adresse ausblendbar | Fragt zusätzlich zu NAP | Notiz |
|---|---|---|---|---|---|---|
| 1 | **Google Business Profile** | https://business.google.com/create | frei | Ja, explizit (answer/3038177, answer/9157481) | Kategorie, Einzugsgebiet, Öffnungszeiten, Beschreibung, Leistungen, Fotos, Bestätigung per Video/Telefon/E-Mail/Postkarte | Vollständiges Pack in `docs/GBP_SETUP.md`. Zuerst erledigen, alles andere hängt daran. |
| 2 | **Bing Places for Business** | https://www.bingplaces.com/ → leitet auf https://www.bing.com/forbusiness/ (HTTP 200, JavaScript-App; Inhalt ohne Login nicht lesbar) | frei (Drittquellen; Bing-eigene FAQ-Seiten `bingplaces.com/Home/MoreFAQ` und `/serviceareas` leiten alle auf dieselbe App um) | Ja laut Drittquellen: Adresse muss eingegeben, kann aber ausgeblendet werden (**unverified** gegen Bing-eigene Hilfe) | Microsoft-Konto; Option "Import from Google" übernimmt Daten aus dem bestätigten GBP | Erst nach GBP-Bestätigung anlegen und den Google-Import nutzen; danach Daten kontrollieren. |
| 3 | **Apple Business Connect** (seit 2025/26 als "Apple Business" geführt) | https://businessconnect.apple.com/ → leitet auf https://business.apple.com/ (HTTP 200) | frei (Apple Newsroom 10/2024: "they can begin to customize their brand for free") | Ja: "every business — including those that provide a service or operate fully online or without a physical location — can register for Business Connect" (https://www.apple.com/newsroom/2024/10/apple-expands-tools-to-help-businesses-connect-with-customers/) | Apple-Konto (bestehendes oder neues), Logo, Titelbild, Kategorie, Bestätigung | Wirkt auf Apple Maps, Siri, Wallet/Mail-Branding. Im Register-Flow den Typ "Dienstleistung / kein Ladengeschäft" wählen. |
| 4 | **Gelbe Seiten** (Grundeintrag) | https://www.gelbeseiten.de/starteintrag (HTTP 200) → dort den Button "Eintragen" unter **Grundeintrag** wählen, **nicht** "Starteintrag" | frei (FAQ: "Der Grundeintrag ist für Sie kostenlos", https://www.gelbeseiten.de/gsservice/haeufige-fragen) | Adresse ist Pflichtfeld; ausblenden nicht vorgesehen (**unverified**, Formular ohne Anlage nicht einsehbar) | Branche, Öffnungszeiten; redaktionelle Prüfung durch den regionalen Verlag vor Veröffentlichung | Achtung: Der "Starteintrag" auf derselben Seite ist ein Trial: "3 Monate kostenlos testen. Kostenpflichtiges Jahres-Abo ab dem 4. Monat (358,80 € zzgl. Ust.)" mit automatischer Verlängerung. Nur den Grundeintrag nehmen. |
| 5 | **11880.com** (+ werkenntdenbesten.de) | https://firma-eintragen-kostenlos.11880.com/ (HTTP 200) | frei ("Kostenfreier Firmeneintrag auf zwei starken Plattformen: 11880.com und werkenntdenbesten.de") | Adresse Pflicht (Straße, Hausnummer, PLZ, Ort); ausblenden nicht angeboten (**unverified**) | Branche, Telefon Pflicht; laut Drittquellen telefonische Verifizierung vor Freischaltung | Nach Anlage keine Upsell-Anrufe annehmen; Basiseintrag reicht. |
| 6 | **Das Örtliche** | Startseite https://www.dasoertliche.de/ verlinkt "Kostenfreier Eintragsservice" → https://services.dasoertliche.de/services/schnupperpaket/sp/ (HTTP 200) | **Trial, nicht frei**: "3 Monate kostenlos!" danach "358,80 € zzgl. USt. – jährliche Zahlweise" | — | — | **Nicht über diesen Weg eintragen.** Ein dauerhaft kostenloser Basiseintrag war auf dasoertliche.de nicht auffindbar (alte URL `/unternehmen/kostenfreier-eintragsservice/` liefert HTTP 410). Das Örtliche, Das Telefonbuch und Gelbe Seiten werden von denselben Verlagen gespeist; der kostenlose Gelbe-Seiten-Grundeintrag (Prio 4) wird laut GoYellow-Selbstbeschreibung ("Partner von Das Örtliche, Das Telefonbuch und Gelbe Seiten", Drittquelle) mit synchronisiert — **unverified**, nach 4–8 Wochen prüfen, ob der Eintrag dort auftaucht. |
| 7 | **GoYellow** | https://www.goyellow.de/ und https://business.goyellow.de/faq/ | frei laut Drittquellen (GoBasic-Tarif) | **unverified** | **unverified** | **URL unverified**: goyellow.de und business.goyellow.de waren aus dieser Umgebung nicht erreichbar (Verbindung abgewiesen, vermutlich Geo-/Bot-Sperre). Vom Gründer aus Deutschland manuell prüfen; nur GoBasic (kostenlos) nehmen, zwei weitere Stufen sind monatlich kostenpflichtig. |
| 8 | **Cylex** | https://www.cylex.de/ (HTTP 403 aus dieser Umgebung) | frei laut Drittquellen ("kostenlose Basiseinträge") | **unverified** | Benutzerkonto, dann "Firma registrieren" | **URL unverified** (Bot-Sperre). Niedrige Priorität; Basiseintrag ohne Zusatzpakete. |
| 9 | **Yelp** | https://biz.yelp.de/ → leitet auf https://business.yelp.com/ (HTTP 200) | frei ("It's free to be on Yelp") | Kein Hinweis auf SAB/Adresse ausblenden auf der Seite (**unverified**) | Kategorie, Fotos, E-Mail-Bestätigung | In Deutschland für B2B-Software kaum Reichweite, aber sauberer NAP-Zitat. Keine Yelp-Ads-Angebote annehmen. |
| 10 | **NorthData** (Handelsregister-Aggregator) | https://www.northdata.de/ (HTTP 200) | frei, automatisch | n/a (Registeradresse wird angezeigt) | nichts; Daten kommen aus dem Register | Eintrag existiert bereits: "Rexity Labs UG, Willighäuser Weg 11, D-29320 Südheide, Amtsgericht Lüneburg HRB 213911, Geschäftsführer Sunny Singh Thakur, Eintragung 22.07.2026". **Nur prüfen, nicht anlegen.** Kein Claim-Mechanismus auf der Seite gefunden. |
| 11 | **CompanyHouse** (Handelsregister-Aggregator) | https://www.companyhouse.de/ (HTTP 403 aus dieser Umgebung) | frei, automatisch | n/a | nichts | **URL unverified** (Bot-Sperre). Wie NorthData: befüllt sich aus dem Register. Vom Gründer nur kontrollieren, ob Name/Adresse korrekt sind. |
| 12 | **wlw (Wer liefert was)** | https://www.wlw.de/de/supplier-registration (HTTP 303 → Registrierungsformular unter `wlw.de/.ory/kratos/self-service/registration/browser`) | frei laut wlw-Eigenwerbung ("kostenloses Firmenprofil", Suchergebnis-Snippet); Hilfe-Center nennt keinen Preis (**unverified**) | Firmenadresse Pflicht; B2B-Plattform, kein Endkundenverzeichnis | Logo, Ansprechpartner, Leistungsbeschreibung, Lieferinformationen (https://hilfe.wlw.de/en/anbieter/company-profile-basic-information) | Mittlere Priorität: B2B-Einkäufer suchen dort auch IT-Dienstleister. Nur das kostenlose Profil, keine "Premium"-Angebote. |
| 13 | **hannoverimpuls Unternehmensdatenbank** | https://www.wirtschaftsfoerderung-hannover.de/de/Microsites/Unternehmensdatenbank/UDatenbank_Start.php (HTTP 200) | frei ("Präsentieren Sie hier kostenlos Ihr Angebot") | Adresse wird angezeigt | Angebot, Branche, ggf. Stellenangebote | **Regionaler Fokus Region Hannover.** Rexity sitzt im Landkreis Celle; ob ein Unternehmen von außerhalb der Region aufgenommen wird, steht nicht auf der Seite (**unverified**). Vor dem Eintrag nachfragen; nicht mit einer fiktiven Hannover-Adresse eintragen. |
| 14 | **Startup-Map Niedersachsen** (startup.nds.de) | https://startup.nds.de/startupmap-niedersachsen-jetzt-mitmachen/ (HTTP 200) | frei (kein Preis genannt; Landesplattform) | n/a (Kartenpunkt am Firmensitz) | Kurzes Formular; Eintrag wird geprüft: "Jeder Beitrag, sowohl von Startups als auch von Startup-Hotspots, vervollständigt das Bild vom Gründerland Niedersachsen" | Gute, legitime Landes-Quelle. Kriterien (Alter, Innovationsgrad) auf der Seite nicht genannt (**unverified**). Sitz Südheide, Gründung 2026 passt ins Raster "Startup". |
| 15 | **innomatch niedersachsen** | https://innomatch.nds.de/register/?language=de (HTTP 200) | frei (kein Preis; Registrierung mit Name, E-Mail, Passwort) | n/a | Profil nach Registrierung; Zielgruppe: "Niedersächsisches Unternehmen, welches jünger als zehn Jahre alt und hochinnovativ im Geschäftsmodell oder der Technologie ist" | Community-Plattform des Landes, weniger Verzeichnis als Matching. Nur wenn Zeit bleibt; kein NAP-Signal im engeren Sinn. |
| 16 | **IHK Lüneburg-Wolfsburg** | https://www.ihk.de/ihklw/service/unternehmen (HTTP 200, "Unternehmen und Anbieter finden") | Mitglied (Pflichtmitgliedschaft der UG) | n/a | — | Die Seite ist nur eine Kontaktseite; **eine Firmendatenbank mit Selbsteintrag war nicht auffindbar** (die im Web genannte Norddeutschland-Datenbank `fitnord.ihk.de` ist per DNS nicht mehr erreichbar). Ob Mitglieder automatisch gelistet werden: **unverified**. Empfehlung: per E-Mail an service@ihklw.de fragen, ob es ein Mitgliederverzeichnis/„Firmen und Anbieter"-Eintrag gibt und ob die Registeradresse dort korrekt hinterlegt ist. |

### Bewusst ausgeschlossen

| Verzeichnis | Grund |
|---|---|
| **Kununu** | Arbeitgeber-Bewertungsportal, nicht Kundenverzeichnis. Profile werden "automatisch erstellt, sobald eine erste Bewertung zu Ihrem Unternehmen abgegeben wird" (https://arbeitgeberportal.kununu.com/produkte/kostenloses-arbeitgeberprofil/, HTTP 200). Rexity hat keine Mitarbeitenden und keine Bewertungen; ein leeres Arbeitgeberprofil bringt kein NAP-Signal und lädt zu Fremd-Bewertungen ein. Erst anlegen, wenn eingestellt wird. |
| **Das Örtliche "Kostenfreier Eintragsservice"** | Trial mit automatischem Jahresabo (siehe Prio 6). |
| **Gelbe Seiten "Starteintrag"** | Trial mit automatischem Jahresabo, 358,80 € zzgl. USt. p. a. (siehe Prio 4). |
| **Gründungsnetzwerk Celle / Wirtschaftsregion Celle** | https://www.wirtschaftsregion-celle.de/ (HTTP 200) bietet **kein Firmenverzeichnis**; Angebote sind Beratung, "Start-Up-Center FachWork Celle" (https://www.wirtschaftsregion-celle.de/Angebote/Start-Up-Center-FachWork-Celle/, Kontakt Monique Hilse, monique.hilse@celle.de) und Gründerinnen-Café. Kein Listing möglich, aber sinnvoller Kontakt für regionale Presse/Netzwerk; das gehört in den Link-Acquisition-Plan, nicht in die NAP-Liste. |
| **Startup-Zentrum Niedersachsen** | Kein eigenes Verzeichnis; die Landes-Startup-Zentren (Braunschweig, Göttingen, Hannover, Lüneburg, Oldenburg, Osnabrück) sind Inkubatoren mit Aufnahmeverfahren, kein Eintragsservice. Die Landesplattform ist startup.nds.de (Prio 14). |
| Listing-Aggregatoren (Yext, Listingstar, Omnea/Ströer, Advantago, Synup, "30 kostenlose Branchenbücher"-Listen) | Kostenpflichtige Syndikation oder Massen-Eintragsdienste; Linkschema-nah, keine Kontrolle über Datenqualität. Nicht verwenden. |
| Kleine Branchenbücher (KennstDuEinen, geolokal, induux, wermachtwas, handwerktreff etc.) | Kaum Reichweite, teils Bewertungs-Spam; Aufwand rechtfertigt keinen Eintrag. Nur falls ein konkreter Kunde aus dem Portal kommt. |

---

## 3. Reihenfolge und Zeitplan

1. **Woche 1:** Google Business Profile anlegen und Bestätigung starten (`docs/GBP_SETUP.md`).
2. **Nach GBP-Bestätigung:** Bing Places per Google-Import, Apple Business Connect, Gelbe-Seiten-Grundeintrag, 11880.
3. **Woche 3–4:** wlw, Startup-Map Niedersachsen, IHK-Anfrage per E-Mail, NorthData/CompanyHouse kontrollieren.
4. **Danach, optional:** GoYellow, Cylex, Yelp, innomatch, hannoverimpuls (nach Rückfrage).
5. **Alle 3 Monate:** jeden Eintrag gegen den NAP-Block in Abschnitt 1 prüfen. Bei jeder Änderung
   (Telefon, Adresse, Öffnungszeiten) zuerst Impressum, dann GBP, dann alle anderen in dieser Reihenfolge anpassen.

Für jeden angelegten Eintrag in dieser Datei ergänzen: Login-Konto (immer `info@rexity.ai`), Datum,
Profil-URL. Passwörter gehören in den Passwort-Manager, nicht in dieses Repo.
