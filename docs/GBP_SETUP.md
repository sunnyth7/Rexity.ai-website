# Google Business Profile — Setup-Pack (Copy-and-paste)

Stand: 2026-09-23. Alles unten ist so vorbereitet, dass es Feld für Feld in den
GBP-Erstellungsflow (https://business.google.com/create) eingefügt werden kann.
Wo etwas nicht per Web-Recherche verifiziert werden konnte, steht **unverified**.

Verwandte Dateien: `docs/NAP_DIRECTORIES.md` (kanonischer NAP-Block + Verzeichnisse),
`docs/SEO_NIEDERSACHSEN_PLAN.md` (Branch `task/niedersachsen-hub`, Abschnitt "Google Business Profile").

---

## 0. Zwei Dinge vorab klären (blockieren die Konsistenz)

1. **Ortsname in der Adresse.** Impressum (https://www.rexity.ai/impressum), NorthData
   und Handelsregister führen `Willighäuser Weg 11, 29320 Südheide`. Der Briefing-Text
   sagt "29320 Hermannsburg". Hermannsburg ist ein Ortsteil der Gemeinde Südheide. Für
   NAP-Konsistenz überall **`29320 Südheide`** verwenden (wie im Impressum und Register);
   "Hermannsburg" nur im Fließtext der Beschreibung. Die Adresse wird im GBP ohnehin
   ausgeblendet (Abschnitt 4), Google braucht sie nur intern für die Bestätigung.
2. **Telefonnummer auf der Website.** Die Startseite https://www.rexity.ai/ enthält keinen
   `tel:`-Link und keine sichtbare Rufnummer; die Nummer steht nur im Impressum. Google
   gleicht Profilangaben mit der Website ab. Empfehlung (separater Task, nicht Teil dieses
   Packs): `+49 174 2471435` als `tel:+491742471435` in den Footer/Kontaktbereich aufnehmen.

---

## 1. Unternehmensname

**Eintragen:** `Rexity Labs`

**Warum diese Form (und nicht `Rexity Labs UG (haftungsbeschränkt)` oder `Rexity`):**

Google-Richtlinie (https://support.google.com/business/answer/3038177?hl=de, geöffnet 2026-09-23):

> "Verwenden Sie für Ihr Unternehmen einheitlich den Namen, den Sie auch außerhalb von Google für Ihr Ladengeschäft, Ihre Website, Ihr Briefpapier und gegenüber Kunden gebrauchen."
> "Es ist nicht erlaubt, dem Namen eines Unternehmens unnötige Informationen hinzuzufügen."

- Der Titel der Live-Website lautet `Rexity Labs — Software, Apps & Automatisierung aus Deutschland`
  und der Body-Text spricht von "Rexity Labs baut Websites, Apps ...". "Rexity Labs" ist also der
  real verwendete Name.
- Der Rechtsformzusatz "UG (haftungsbeschränkt)" ist keine Pflicht im GBP-Namen; er wird auf der
  Website nur im Impressum/Footer verwendet, nicht als Marke. Weglassen hält den Namen sauber und
  vermeidet, dass Google den Zusatz als "unnötige Information" wertet.
- Nur "Rexity" wäre zu kurz gegriffen: Website-Titel, Impressum und Handelsregister sagen "Rexity Labs".
  Ein Name, der vom Register abweicht, erschwert die Video-Bestätigung (Abschnitt 13).

Keine Schlagwörter, keine Orte im Namen ("Rexity Labs Celle" wäre ein Richtlinienverstoß).

---

## 2. Kategorien

Google erlaubt eine Hauptkategorie plus bis zu neun Zusatzkategorien. Die Namen unten sind die
**deutschen UI-Namen**, geprüft gegen drei unabhängige Listen:
(a) till.de-Liste mit gcid-Codes (PDF, 2019, 2.252 Einträge, https://www.till.de/wp-content/uploads/sites/19/2019/06/Google-My-Business-Kategorien-Liste.pdf),
(b) k-twelve.de Liste 2026 (https://www.k-twelve.de/blog/google-my-business-kategorien-liste-2026/),
(c) dynamic-duo.ch Liste (https://www.dynamic-duo.ch/seo-suchmaschinenoptimierung/seo-wissen/google-my-business-liste-aller-kategorien).
Google selbst veröffentlicht keine durchsuchbare Liste; im Erstellungsflow tippt man den Namen ein und
wählt aus dem Vorschlagsmenü. Wenn ein Name unten nicht erscheint, den gcid-Hinweis / das englische
Pendant als Suchhilfe nehmen.

| # | Rolle | Deutscher Kategoriename (eintippen) | gcid / englisch | Status |
|---|---|---|---|---|
| 1 | **Hauptkategorie** | `Softwareentwickler/-hersteller` | gcid:software_company / Software company | verifiziert (a, b, c) |
| 2 | Zusatz | `Webdesigner` | gcid:website_designer / Website designer | verifiziert (a, b, c) |
| 3 | Zusatz | `Unternehmensberater` | gcid:business_management_consultant / Business management consultant | verifiziert (a, b, c) |
| 4 | Zusatz | `Online-Marketing-Unternehmen` | gcid:internet_marketing_service / Internet marketing service | verifiziert (a, b, c) |
| 5 | Zusatz | `Computersupport und -dienste` | gcid:computer_support_and_services / Computer support and services | verifiziert (a, b, c) |
| 6 | Zusatz | `Designagentur` | gcid:design_agency / Design agency | verifiziert (a, b, c) |
| 7 | Zusatz | `Softwareberater` | gcid:software_consultant / Software consultant | verifiziert (a) |
| 8 | Zusatz | `Marketingbüro` | gcid:marketing_agency / Marketing agency | verifiziert nur in (a, 2019); in (b)/(c) nicht gelistet — im UI prüfen, ggf. inzwischen umbenannt |

Bewusst **nicht** aufgenommen (nicht als GBP-Kategorie verifizierbar, in keiner der drei Listen):
`Softwareunternehmen`, `Internetagentur`, `IT-Dienstleister`, `Marketingagentur`, `Website-Designer`.
Falls das UI beim Tippen eine dieser Bezeichnungen doch vorschlägt, ist sie echt und kann statt der
Tabellenzeile genommen werden (z. B. "Marketingagentur" statt "Marketingbüro").

Ebenfalls **nicht** aufnehmen: `Werbeagentur`, `Grafikdesigner`, `Web-Hosting-Unternehmen`,
`Computerservice`, `EDV-Berater` — verifiziert, aber sie beschreiben nicht das Kerngeschäft; zu viele
oder unpassende Kategorien werden von Google als Spam gewertet (Community-FAQ
https://support.google.com/business/community-guide/396853994?hl=de).

Empfehlung: mit 1 + 2 + 3 + 4 starten (vier Kategorien, alle sauber verifiziert), Rest optional.

---

## 3. Unternehmenstyp

Im Flow fragt Google "Empfangen Sie Kunden an Ihrer Geschäftsadresse?" bzw. bietet
"Kunden vor Ort besuchen / beliefern". Antwort:

- **Ladengeschäft / Kunden empfangen:** Nein
- **Kunden vor Ort besuchen oder beliefern (Dienstleistungsunternehmen):** Ja

Google-Definition (https://support.google.com/business/answer/9157481?hl=de):
> "Wenn Sie an Ihrer Geschäftsadresse keine Kunden empfangen, entfernen Sie die Adresse bitte aus Ihrem Unternehmensprofil."

---

## 4. Adresse (nur für Google, wird ausgeblendet)

```
Willighäuser Weg 11
29320 Südheide
Deutschland
```

Adresse **ausblenden** ("Adresse nicht anzeigen" / Adresse nach Anlage aus dem Profil entfernen).
Richtlinie (answer/3038177): "Falls Sie ein Unternehmen ohne festen Standort in einem Einzugsgebiet
haben, sollten Sie den Kunden Ihre Geschäftsadresse nicht anzeigen."

---

## 5. Einzugsgebiet (max. 20 Gebiete — answer/9157481: "Maximal 20 Einzugsgebiete sind zulässig")

Reihenfolge = Priorität (Google zeigt sie in Eingabereihenfolge; Kern zuerst, dann Fernradius).
Jeweils als Stadt/Gemeinde eingeben, nicht als PLZ:

```
1. Celle
2. Südheide
3. Hermannsburg
4. Bergen (Landkreis Celle)
5. Faßberg
6. Landkreis Celle
7. Hannover
8. Braunschweig
9. Wolfsburg
10. Lüneburg
11. Göttingen
12. Osnabrück
13. Oldenburg
```

Hinweis: Google bietet beim Tippen Auswahlvorschläge an; "Hermannsburg" wird ggf. als Ortsteil von
Südheide angeboten, "Bergen" muss disambiguiert werden (Bergen bei Celle, nicht Bergen auf Rügen).
"Niedersachsen" als ganzes Bundesland nicht eintragen — zu groß, verwässert die lokale Relevanz.

---

## 6. Öffnungszeiten (Vorschlag — **vom Gründer bestätigen**)

```
Montag      09:00–18:00
Dienstag    09:00–18:00
Mittwoch    09:00–18:00
Donnerstag  09:00–18:00
Freitag     09:00–18:00
Samstag     Geschlossen
Sonntag     Geschlossen
```

Hinweis: Wenn Anrufe außerhalb dieser Zeiten regelmäßig angenommen werden, lieber die realen Zeiten
angeben. Google nutzt Öffnungszeiten auch für die Auswahl der Bestätigungsmethode (Abschnitt 13).

---

## 7. Kontakt

| Feld | Wert |
|---|---|
| Telefon | `+49 174 2471435` |
| Website | `https://www.rexity.ai/` |
| Terminlink (Termine vereinbaren) | `https://www.rexity.ai/#contact` |
| E-Mail (nur für Google-Konto, nicht öffentlich) | `info@rexity.ai` |

Der Anker `#contact` existiert auf der Live-Startseite (verifiziert per `id="contact"` und
`href="#contact"` am 2026-09-23). Kein Calendly/Buchungstool vorhanden; falls später eins
eingeführt wird, hier den Link austauschen. Als Fallback für "Termin"-Felder, die eine reine URL
verlangen und Anker ablehnen: `mailto:info@rexity.ai`.

---

## 8. Unternehmensbeschreibung

Google-Limit: "Im Beschreibungsfeld dürfen maximal 750 Zeichen verwendet werden" und "Fügen Sie
keine URLs oder HTML-Codes ein" (https://support.google.com/business/answer/3039617?hl=de).

### 8a. Lang (750 Zeichen max.) — 747 Zeichen

```
Rexity Labs ist eine Software- und Digitalagentur aus Hermannsburg (Gemeinde Südheide) im Landkreis Celle. Wir entwickeln Websites mit Online-Buchung, mobile Apps und Dashboards für Dienstleister, Handwerk, Praxen, Studios und Werkstätten in Celle, Hannover, Braunschweig, Wolfsburg, Lüneburg und Niedersachsen. Dazu kommen Prozess- und WhatsApp-Automatisierung sowie Website-Chatbots, die Anfragen und Termine rund um die Uhr abfangen. Wir arbeiten als Design-and-Build-Partner: Konzept, Gestaltung, Entwicklung, Hosting und Wartung aus einer Hand, mit festen Preisen und klaren Zeitplänen. Referenzen: Body & Care Hermannsburg (Fitnessstudio mit Kursbuchung) und Fahrzeugpflege Celle (Online-Terminbuchung). Zum Erstgespräch kommen wir zu Ihnen.
```

### 8b. Kurz (250 Zeichen max.) — 231 Zeichen

```
Rexity Labs, Software- und Digitalagentur aus dem Landkreis Celle: Websites mit Online-Buchung, mobile Apps, WhatsApp- und Prozess-Automatisierung sowie Chatbots für Dienstleister in Celle, Hannover, Braunschweig und Niedersachsen.
```

---

## 9. Leistungen (Dienstleistungen im Profil)

Google lässt pro Kategorie eigene Dienstleistungen mit Beschreibung anlegen
(https://support.google.com/business/answer/9455399?hl=de). Namen kurz, Beschreibung 1–2 Sätze.
Preisangabe: "Preis auf Anfrage" lassen; keine Preise eintragen, die nicht öffentlich auf der Website stehen.

| Dienstleistung | Beschreibung |
|---|---|
| Website mit Online-Terminbuchung | Moderne, schnelle Website mit integrierter Terminbuchung oder Kursbuchung. Kunden buchen direkt online, Sie erhalten die Anfrage sofort per E-Mail oder WhatsApp. |
| Webdesign und Webentwicklung | Gestaltung und Umsetzung von Unternehmenswebsites, Landingpages und Kundenportalen, inklusive Hosting, DSGVO-konformer Einbindung und Wartung. |
| Mobile Apps (iOS und Android) | Native und plattformübergreifende Apps für Kunden oder Mitarbeitende, vom Konzept bis zur Veröffentlichung im App Store und bei Google Play. |
| WhatsApp-Automatisierung | Automatische Antworten, Terminbestätigungen und Erinnerungen über die WhatsApp Business API, angebunden an Ihre bestehenden Systeme. |
| Prozessautomatisierung | Wiederkehrende Abläufe wie Angebotsversand, Rechnungsläufe oder Datenübernahmen werden automatisiert, damit weniger manuelle Arbeit anfällt. |
| Website-Chatbot | Ein Chatbot auf Ihrer Website beantwortet Standardfragen, nimmt Anfragen auf und leitet qualifizierte Kontakte an Sie weiter, rund um die Uhr. |
| Dashboards und Reporting | Kennzahlen aus Buchungen, Kasse, Werkstatt oder CRM in einer übersichtlichen Auswertung, tagesaktuell und ohne Excel-Handarbeit. |
| SaaS- und Portalentwicklung | Eigene Webanwendungen und Kundenportale mit Login, Rollen und Abrechnung, auf Basis moderner, wartbarer Technik. |
| Digitalisierungsberatung | Erstgespräch vor Ort oder per Video: Wir prüfen, welche Abläufe sich digitalisieren lassen, und liefern einen umsetzbaren Plan mit Aufwand und Reihenfolge. |
| Testing und Support | Laufende Betreuung bestehender Websites und Apps: Updates, Sicherheits-Checks, Fehlerbehebung und kleine Erweiterungen mit festen Reaktionszeiten. |

---

## 10. Attribute (nur ankreuzen, was zutrifft)

Verfügbare Attribute hängen von Kategorie und Land ab
(https://support.google.com/business/answer/9049526?hl=de: "Einige Attribute sind nur an bestimmten
Standorten, in bestimmten Ländern oder in bestimmten Unternehmenskategorien verfügbar").

| Attribut | Setzen? | Anmerkung |
|---|---|---|
| Online-Termine | **Ja** | Genauer UI-Name laut Drittquelle "Online-Termine" (digital-lokal.de Attributliste); im UI unter "Serviceoptionen" suchen. Terminlink aus Abschnitt 7 hinterlegen. |
| Terminvereinbarung erforderlich | **Ja** | Es gibt kein Walk-in. |
| Onlinetermine / Online-Dienste ("Bietet Online-Dienste an") | **Ja**, falls angeboten | Beratung per Video ist möglich. |
| Kleinunternehmen | Ja, falls angeboten | Google definiert es als Unternehmen unter 10 Mio. USD Jahresumsatz (answer/9049526). Trifft zu. |
| Von Frauen geführt / Von Veteranen geführt / LGBTQ+-freundlich etc. | **Nicht setzen** | Identitätsattribute nur, wenn der Gründer sie ausdrücklich selbst wählt. Hier nicht geraten. |
| Rollstuhlgerechter Eingang etc. | **Nicht setzen** | Kein öffentlicher Standort; Barrierefreiheitsattribute beziehen sich auf Ladengeschäfte. |
| Zahlungsarten | Optional: Überweisung, Rechnung | Nur wenn das UI es für die Kategorie anbietet. |

---

## 11. Fotos

Google-Vorgaben (https://support.google.com/business/answer/6103862?hl=de):
Format "JPG oder PNG", Größe "10 KB bis 5 MB", empfohlene Auflösung "720 Pixel hoch, 720 Pixel breit",
Minimum "250 Pixel hoch, 250 Pixel breit". **WEBP wird nicht angenommen** — die Projektbilder im
Repo liegen als `.webp` vor und müssen konvertiert werden.

Sechs Bilder (Pfade relativ zum Repo-Root; Maße per `sips` geprüft):

| # | Zweck im GBP | Quelle | Maße | Aktion |
|---|---|---|---|---|
| 1 | Logo | `rexity-omi/assets/brand/final/rexity-mark-1024.png` | 1024×1024 PNG | direkt hochladen |
| 2 | Titelbild (Cover) | `rexity-omi/assets/brand/final/rexity-logo-master.png` | 1850×850 PNG, kein Alpha | zu JPG 1200 px breit konvertieren |
| 3 | Arbeiten: Body & Care Startseite | `rexity-omi/assets/work/body-and-care/01-start.webp` | 1600×1000 | zu JPG konvertieren |
| 4 | Arbeiten: Body & Care Kursbuchung | `rexity-omi/assets/work/body-and-care/03-buchen.webp` | 1600×1000 | zu JPG konvertieren |
| 5 | Arbeiten: Fahrzeugpflege Celle Startseite | `rexity-omi/assets/work/chara/01-start.webp` | 1600×1000 | zu JPG konvertieren |
| 6 | Arbeiten: Fahrzeugpflege Celle Terminbuchung | `rexity-omi/assets/work/chara/03-termin.webp` | 1600×1000 | zu JPG konvertieren |

Optional als 7. Bild: `rexity-omi/assets/work/levelkraft/01-website.webp` (1600×1000, eigenes Produkt LevelKraft).

Konvertierung (ImageMagick 7 ist unter `/opt/homebrew/bin/magick` installiert; vom Repo-Root ausführen):

```bash
mkdir -p /tmp/gbp-photos
magick rexity-omi/assets/brand/final/rexity-logo-master.png      -resize 1200x -background white -flatten -quality 90 /tmp/gbp-photos/02-cover-rexity-labs.jpg
magick rexity-omi/assets/work/body-and-care/01-start.webp         -resize 1200x -quality 90 /tmp/gbp-photos/03-body-and-care-website.jpg
magick rexity-omi/assets/work/body-and-care/03-buchen.webp        -resize 1200x -quality 90 /tmp/gbp-photos/04-body-and-care-kursbuchung.jpg
magick rexity-omi/assets/work/chara/01-start.webp                 -resize 1200x -quality 90 /tmp/gbp-photos/05-fahrzeugpflege-celle-website.jpg
magick rexity-omi/assets/work/chara/03-termin.webp                -resize 1200x -quality 90 /tmp/gbp-photos/06-fahrzeugpflege-celle-terminbuchung.jpg
cp rexity-omi/assets/brand/final/rexity-mark-1024.png            /tmp/gbp-photos/01-logo-rexity-labs.png
```

Dateinamen bewusst sprechend (Google liest sie nicht als Rankingsignal, sie helfen aber beim Zuordnen
im Upload-Dialog). Vor dem Upload der Projekt-Screenshots: Freigabe der Kunden für die Nutzung als
Referenzbild sicherstellen (Body & Care: Melanie; Fahrzeugpflege Celle: Aref). Den Namen "Chara" nirgends verwenden.

---

## 12. Erste drei Beiträge (Typ "Aktuelles", jeweils ≤ 1.500 Zeichen)

Das 1.500-Zeichen-Limit steht nicht auf der Google-Hilfeseite zu Beiträgen
(https://support.google.com/business/answer/7342169?hl=de), wird aber im Google-eigenen Community-Forum
als UI-Fehlermeldung "max. 1500 Zeichen möglich" bestätigt (https://support.google.com/business/thread/120650341?hl=de).
Beiträge ohne Zeitraum werden nach sechs Monaten archiviert (answer/7342169). Telefonnummern im
Beitragstext vermeiden (können zur Ablehnung führen, ebd.). Jedem Beitrag ein Foto aus Abschnitt 11 beilegen
und den Button "Mehr erfahren" auf `https://www.rexity.ai/` bzw. die passende Unterseite setzen.

### 12a. Launch-Beitrag (Foto: 02-cover) — 621 Zeichen

```
Rexity Labs ist jetzt auch bei Google zu finden. Wir sind eine Software- und Digitalagentur aus Hermannsburg im Landkreis Celle und entwickeln Websites mit Online-Buchung, mobile Apps, WhatsApp- und Prozess-Automatisierung sowie Chatbots für Dienstleister, Handwerk, Studios und Werkstätten. Unser Einzugsgebiet reicht von Celle und der Südheide über Hannover, Braunschweig und Wolfsburg bis Lüneburg, Göttingen, Osnabrück und Oldenburg. Zum Erstgespräch kommen wir zu Ihnen oder treffen uns per Video. Auf unserer Website finden Sie aktuelle Projekte, Leistungen und das Kontaktformular. Wir freuen uns auf Ihre Anfrage.
```

Button: Mehr erfahren → `https://www.rexity.ai/`

### 12b. Referenz Body & Care Hermannsburg (Foto: 04-kursbuchung) — 679 Zeichen

```
Neues Projekt live: die Website von Body & Care Hermannsburg. Das Fitnessstudio in der Südheide hat seit dem 14. September 2026 eine neue Website mit integrierter Kursbuchung. Mitglieder sehen den aktuellen Kursplan, reservieren ihren Platz direkt online und erhalten eine Bestätigung, ohne Anruf und ohne Zettel an der Theke. Für das Studio bedeutet das weniger Rückfragen am Empfang und eine verlässliche Übersicht, wer wann kommt. Umgesetzt haben wir Design, Entwicklung, Buchungslogik und Hosting aus einer Hand, abgestimmt auf die Abläufe vor Ort. Wenn Sie ein Studio, eine Praxis oder ein Kursangebot betreiben und Ihre Buchung online abbilden möchten, sprechen Sie uns an.
```

Button: Mehr erfahren → `https://www.rexity.ai/#work`

### 12c. Online-Terminbuchung für Werkstätten (Foto: 06-terminbuchung) — 812 Zeichen

```
Online-Terminbuchung für Werkstätten und Fahrzeugpflege. Wer eine Werkstatt, eine Aufbereitung oder einen Reifenservice betreibt, kennt das: Das Telefon klingelt, während man unter dem Fahrzeug liegt, und abends stapeln sich die Rückrufe. Für Fahrzeugpflege Celle haben wir eine Website mit Online-Terminbuchung gebaut. Kunden wählen Leistung, Fahrzeugklasse und Wunschtermin, das System prüft die freien Zeiten und bestätigt automatisch. Der Betrieb sieht alle Termine in einer Übersicht und kann sie bei Bedarf verschieben. Ergebnis: weniger Unterbrechungen im Tagesgeschäft und Termine, die auch außerhalb der Öffnungszeiten eingehen. Die Lösung lässt sich auf Kfz-Werkstätten, Lackierer, Reifendienste und Detailer im Raum Celle, Hannover und Braunschweig übertragen. Fragen Sie nach einer kurzen Vorführung.
```

Button: Mehr erfahren → `https://www.rexity.ai/#work`

---

## 13. Bestätigung (Verifizierung)

Google-Hilfe "Unternehmen bei Google bestätigen" (https://support.google.com/business/answer/7107242?hl=de,
geöffnet 2026-09-23) nennt fünf Methoden: **Telefon oder SMS**, **E-Mail**, **Live-Videoanruf**,
**Videoaufzeichnung**, **Postkarte**. Wichtig, wörtlich:

> "Welche Bestätigungsoptionen für dich verfügbar sind, hängt von deinem Unternehmenstyp, öffentlichen Informationen, der Region oder den Öffnungszeiten ab."
> "Die möglichen Bestätigungsmethoden werden automatisch von Google ermittelt und können nicht geändert werden."
> "Die Bestätigung per Postkarte ist nicht für alle Unternehmen verfügbar."

Für ein neues Profil mit ausgeblendeter Adresse ist nach übereinstimmender Aussage mehrerer deutscher
Agentur-Ratgeber (z. B. https://www.knallblaumedia.de/google-unternehmensprofil-verifizieren-der-vollstaendige-leitfaden-2026/,
Drittquelle, nicht Google) in der Praxis **Videoaufzeichnung** der Standard; Postkarte wird kaum noch
angeboten. Darauf einstellen.

Video-Bestätigung (https://support.google.com/business/answer/14271705?hl=de, geöffnet 2026-09-23):
- Video muss ununterbrochen, unbearbeitet, **mindestens 30 Sekunden** lang und live auf dem Mobilgerät aufgenommen sein.
- Es muss drei Dinge belegen: Standort, Existenz des Unternehmens, Berechtigung zur Verwaltung.
- Für Dienstleistungsunternehmen ohne Ladengeschäft akzeptiert Google u. a.: Straßenschild/Hausnummer
  in der Umgebung, Fahrzeug mit Firmenbranding, Arbeitsplatz/Home-Office, Werkzeuge, sowie Dokumente
  wie "Gewerbeerlaubnis, Rechnung oder Rechnung eines Versorgungsunternehmens" auf den Firmennamen.
- Keine Gesichter anderer Personen, keine vertraulichen Daten filmen.
- Prüfung dauert bis zu 5 Werktage; das Video kann danach in den Profileinstellungen gelöscht werden
  ("Sie können Ihr Bestätigungsvideo jederzeit löschen").

**Vorbereitung für das Rexity-Video (Reihenfolge, ca. 45–60 s):**
1. Straßenschild "Willighäuser Weg" und Hausnummer 11 filmen.
2. Briefkasten/Klingelschild mit "Rexity Labs" (falls nicht vorhanden: vorher anbringen, das ist die häufigste Ablehnungsursache).
3. Arbeitsplatz (Schreibtisch, Rechner mit geöffnetem rexity.ai).
4. Handelsregisterauszug HRB 213911 oder eine Rechnung/Versorgerrechnung auf "Rexity Labs UG (haftungsbeschränkt), Willighäuser Weg 11, 29320 Südheide" in die Kamera halten.
5. Nicht schneiden, nicht pausieren.

Unabhängig davon E-Mail `info@rexity.ai` und die Rufnummer bereithalten, falls Google stattdessen
E-Mail- oder Telefon-Bestätigung anbietet.

---

## 14. Zulässigkeit (Eligibility) — geprüft

Quelle: https://support.google.com/business/answer/3038177?hl=de (geöffnet 2026-09-23).

Die maßgebliche Regel in einer Zeile:

> "Unternehmen dieser Art, die Dienstleistungen am Kundenstandort erbringen, sollten ein Profil für die Unternehmenszentrale bzw. den Unternehmensstandort erstellen und das Einzugsgebiet festlegen."

Und zur Adresse:

> "Falls Sie ein Unternehmen ohne festen Standort in einem Einzugsgebiet haben, sollten Sie den Kunden Ihre Geschäftsadresse nicht anzeigen."

Ergebnis: Ein von zu Hause betriebenes Software-/Web-Unternehmen, das Kunden vor Ort besucht (Erstgespräch,
Abnahme, Schulung) und ein Einzugsgebiet bedient, ist zulässig, sofern die Adresse ausgeblendet wird.
Die Eingangsbedingung derselben Richtlinie lautet: "Wenn Ihr Unternehmen einen physischen Standort
hat, den Kunden besuchen können, oder Sie Dienstleistungen am jeweiligen Kundenstandort anbieten, können
Sie ein Unternehmensprofil bei Google erstellen." Ein reines Online-Angebot ohne Kundenkontakt vor Ort
erfüllt diese Bedingung nicht. Der Punkt "Wir kommen zum Erstgespräch zu Ihnen" in der Beschreibung ist
deshalb inhaltlich wichtig und muss der Praxis entsprechen.

Voraussetzung aus dem Plan (Handelsregistereintrag) ist erfüllt: NorthData zeigt "Rexity Labs UG",
Amtsgericht Lüneburg HRB 213911, Geschäftsführer Sunny Singh Thakur, Eintragung 22.07.2026
(https://www.northdata.de/, geöffnet 2026-09-23).

---

## 15. Fragen und Antworten — Funktion eingestellt

Die öffentliche Q&A-Funktion im Unternehmensprofil wurde von Google abgeschaltet. Google-eigene
Community-Seite: "FAQ: Funktion »Fragen und Antworten« eingestellt"
(https://support.google.com/business/community-guide/396852533?hl=de; Titel verifiziert, Seiteninhalt
lädt nur mit JavaScript). Drittquellen nennen den 03.12.2025 als Beginn der Abschaltung und Anfang 2026
als Abschluss (https://www.unicorn-factory.net/google-unternehmensprofil-fragen-und-antworten-eingestellt/).

Die fünf vorbereiteten Fragen unten daher **nicht** im GBP posten (geht nicht mehr), sondern:
(a) als FAQ-Abschnitt auf https://www.rexity.ai/ (mit FAQPage-Schema) einbauen — Google zieht
Antworten für KI-Übersichten aus der Website; (b) als Vorlage für Antworten auf Rezensionen und Beiträge nutzen.

**F1: Kommen Sie für ein Erstgespräch nach Celle oder Hannover?**
Ja. Im Landkreis Celle sowie in Hannover, Braunschweig und Wolfsburg kommen wir zum Erstgespräch zu Ihnen. Für weiter entfernte Orte in Niedersachsen bieten wir ein Videogespräch an.

**F2: Können Kunden über die Website Termine oder Kurse buchen?**
Ja. Wir bauen Websites mit integrierter Online-Terminbuchung oder Kursbuchung, zum Beispiel für Fitnessstudios, Werkstätten und Fahrzeugpflege. Buchungen werden automatisch bestätigt und per E-Mail oder WhatsApp an Sie weitergeleitet.

**F3: Entwickeln Sie auch Apps für iOS und Android?**
Ja. Wir entwickeln mobile Apps für beide Plattformen und übernehmen die Veröffentlichung im App Store und bei Google Play. Unsere eigene App LevelKraft zur Prüfungsvorbereitung ist dort verfügbar.

**F4: Was kostet eine Website mit Online-Buchung?**
Der Preis hängt vom Umfang ab (Seitenzahl, Buchungslogik, Anbindungen). Nach einem kostenlosen Erstgespräch erhalten Sie ein Festpreisangebot mit Zeitplan. Es gibt keine versteckten laufenden Kosten außer Hosting und optionaler Wartung.

**F5: Wer kümmert sich nach dem Start um Updates und Fehler?**
Wir bieten Wartungspakete mit festen Reaktionszeiten an. Darin enthalten sind Sicherheitsupdates, Fehlerbehebung und kleine Anpassungen. Sie können die Website aber auch selbst pflegen; wir übergeben alle Zugänge.

---

## 16. Rezensionen anfragen

Google-Regel (answer/3038177 und https://support.google.com/business/answer/7035772?hl=de): nur echte
Kunden, keine Anreize, keine Massen-Aufforderungen. Nach Fertigstellung persönlich fragen.

### 16a. Rezensionslink beschaffen

Offizieller Weg (https://support.google.com/business/answer/16816815?hl=de, geöffnet 2026-09-23):
Nach der Bestätigung in business.google.com anmelden → "Rezensionen lesen" → "Mehr Rezensionen erhalten"
→ Link kopieren oder QR-Code speichern ("QR-Codes für Rezensionen [können] nur in einem Computerbrowser
und nicht auf Mobilgeräten generiert werden").

Alternatives Linkformat mit Place ID (Drittquellen, z. B. https://support.reputation.com/s/article/How-do-I-make-a-direct-Google-Review-URL;
nicht auf einer Google-Hilfeseite dokumentiert, funktioniert aber seit Jahren):

```
https://search.google.com/local/writereview?placeid=<PLACE_ID>
```

Place ID ermitteln: https://developers.google.com/maps/documentation/places/web-service/place-id → Abschnitt
"Place ID Finder" → "Rexity Labs" + Ort eingeben → ID kopieren (beginnt meist mit `ChIJ`). Funktioniert erst,
wenn das Profil bestätigt und öffentlich ist. Bei Änderung von Name oder Adresse kann sich die Place ID ändern.

### 16b. WhatsApp-Vorlage (3 Sätze, "Sie")

An Melanie (Body & Care Hermannsburg):

```
Hallo Melanie, vielen Dank noch einmal für die Zusammenarbeit an der neuen Website von Body & Care. Wir sind jetzt mit einem Unternehmensprofil bei Google gelistet, und eine kurze, ehrliche Rezension von Ihnen würde uns als junges Unternehmen aus der Südheide sehr helfen. Der Link führt direkt zum Bewertungsfenster: https://search.google.com/local/writereview?placeid=<PLACE_ID>
```

An Aref (Fahrzeugpflege Celle):

```
Hallo Aref, vielen Dank noch einmal für das Vertrauen beim Projekt Website mit Online-Terminbuchung. Wir sind jetzt mit einem Unternehmensprofil bei Google gelistet, und eine kurze, ehrliche Rezension von Ihnen würde uns als junges Unternehmen aus dem Landkreis Celle sehr helfen. Der Link führt direkt zum Bewertungsfenster: https://search.google.com/local/writereview?placeid=<PLACE_ID>
```

`<PLACE_ID>` vor dem Versand ersetzen. Keine Vorgabe machen, was geschrieben werden soll, und keine
Gegenleistung anbieten.

---

## 17. Reihenfolge am Tag der Erstellung (Checkliste)

1. Mit dem Google-Konto anmelden, das dauerhaft der Firma gehört (nicht ein privates Gmail, das später
   abgegeben wird). Falls noch keins: `info@rexity.ai` als Google-Konto ohne Gmail registrieren.
2. https://business.google.com/create → Name (Abschnitt 1) → Kategorie (Abschnitt 2, erst nur die Hauptkategorie).
3. "Kunden vor Ort besuchen" = Ja, Adresse eingeben (Abschnitt 4), Einzugsgebiet (Abschnitt 5).
4. Telefon + Website (Abschnitt 7).
5. Bestätigung starten (Abschnitt 13). Video vorher proben.
6. Nach Bestätigung: Zusatzkategorien, Öffnungszeiten, Beschreibung, Leistungen, Attribute, Fotos, Terminlink.
7. Erst dann die drei Beiträge (Abschnitt 12) posten, 2–3 Tage Abstand.
8. Rezensionslink holen (16a), WhatsApp an Melanie und Aref (16b).
9. Profil-URL und Place ID in `docs/NAP_DIRECTORIES.md` nachtragen; danach Bing Places per Google-Import anlegen.
