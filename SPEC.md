# Umbau: Zwei Berichte werden ein Mandanten-Dossier

## Kontext

Dieses Repository ist ein Fork meines Analyse-Tools (Datenerhebung u. a. über Firecrawl und die SISTRIX-API). Das Tool erzeugt bisher pro Zielunternehmen zwei Word-Berichte: eine "Strategieanalyse" (3 Kapitel, ca. 9 Seiten) und ein "Akquise-Briefing" (5 Abschnitte, ca. 5 Seiten). Beide enthalten dieselben Befunde in unterschiedlicher Verpackung, geschätzt ein Drittel des Textes ist Wiederholung.

Im Fork werden beide Berichte ersetzt durch genau ein Dokument: das **Mandanten-Dossier**. Im Repo-Root liegt `260612_Mandanten-Dossier_Scholl_Real_Estate_Solutions.docx` als Goldstandard. Dein Output muss diesem Beispiel in Struktur, Optik und Tonalität entsprechen.

## Arbeitsweise

1. **Erst erkunden, dann bauen.** Verschaffe Dir einen Überblick: Wo entstehen die beiden Berichte (Generierungs-Prompts, Templates, Rendering-Code)? Wie fließen die Firecrawl- und SISTRIX-Daten hinein? Fasse Deinen Befund und Deinen Umbauplan kurz zusammen und warte auf mein Go, bevor Du Code änderst.
2. **Datenerhebung nicht anfassen.** Firecrawl-Crawling, SISTRIX-Abfragen und alle vorgelagerten Analyse-Schritte bleiben unverändert. Du baust nur die Synthese- und Rendering-Schicht um.
3. **Die beiden alten Berichtsgeneratoren entfernen**, sobald der Dossier-Generator steht und der Beispiellauf abgenommen ist. Bis dahin parallel lassen.

## Zielformat: das Mandanten-Dossier

Eine einzige .docx-Datei. Dateiname: `JJMMTT_Mandanten-Dossier_<Firmenname>.docx` (Datum sechsstellig, Unterstriche als Trenner, Firmenname mit Unterstrichen statt Leerzeichen).

### Teil A — Intern (Seiten 1 bis ca. 5)

Titelblock: "Mandanten-Dossier: <Firma>", Untertitel "Intern · Lage, Befunde, Daten und Gesprächsdrehbuch", Autor- und Datumszeile. Darunter eine Akzent-Box mit dem Kernsatz des Falls in zwei, drei Sätzen plus dem Hinweis, dass alles mit (H) markierte Hypothese ist und im Erstgespräch geprüft wird.

**1 · Cockpit.** Sechs Info-Boxen (grünes Label links, hellgraue Inhaltszelle rechts), je zwei bis vier Sätze:
- Unternehmen (Firma, Ort, Geschäftsmodell, Größe, Marktalter)
- Ansprechpartner (Name, Rolle, Entscheidungsweg)
- Lage in einem Satz (Substanz vs. Kernproblem)
- Score (eine Zeile: Gesamteindruck plus Einzeldimensionen, mit · getrennt, aufsteigend nach Schwäche sortiert)
- Attraktivität (Mandatsattraktivität, Abschlusswahrscheinlichkeit, was die Entscheidung kippen kann)
- Nächster Schritt (konkret, mit Frist)

**2 · Befunde.** Vier bis sechs Befunde, priorisiert nach Hebelwirkung. Eröffnungssatz unter der Abschnittsüberschrift: "Jeder Befund steht genau einmal. Grau bleibt bei mir, Grün darf ins Gespräch." Jeder Befund hat exakt diese Struktur:
- H2-Titel: kurz und sprechend ("B1 · Digital unsichtbar", nicht "Defizit 1: Digitale Nicht-Existenz als Wachstumsdeckel")
- Beleg-Fließtext: zwei bis vier Sätze mit den harten Zahlen. Keine Bewertung, nur Befund.
- INTERN-Box (Labelzelle dunkelgrau #454544, weiße Schrift): wahrscheinliche Ursache, Bedeutung für Qualifizierung und Angebotslogik, Förderbezug (BAFA/INQA) wo passend, taktische Hinweise inklusive dessen, was ich NICHT ansprechen soll.
- GESPRÄCH-Box (Labelzelle grün #8CC63E, weiße Schrift): die wörtliche Frage oder Formulierung für das Erstgespräch in deutschen Anführungszeichen, plus erwartete Reaktion in einem Satz. Wenn ein Befund im Erstgespräch tabu ist, steht hier nur: "Im Erstgespräch nicht ansprechen."

**3 · Datenblatt.** Nur Tabellen (grüne Kopfzeile, weiße Schrift; hellgraue Datenzeilen; Zahlenspalten zentriert), dazwischen höchstens je ein kursiver Ergänzungssatz:
- Digitaler Wettbewerb (SISTRIX): Domain, Sichtbarkeit, Klicks/Monat, Keywords. Alle Wettbewerber aus den Rohdaten, Zieldomain als letzte Zeile fett.
- Markt und Trends in Kürze: maximal fünf Zeilen (Regionales Potenzial, Marktphase, Treiber, Dämpfer, Strukturrisiko), Überschrift trägt den Zusatz "(alles H)".
- Förderhebel: Programm, Hebel (Prozent/Betrag), Einsatz im Mandat mit Eignungsurteil.

**4 · Gesprächsdrehbuch.** Vier H2-Abschnitte in Fließtext:
- Hauptthema: der eine Satz fürs Gespräch und warum er den Unternehmer-Nerv trifft.
- Dramaturgie: Reihenfolge der Fragen, referenziert per Befund-Nummer ("Einstieg über B1, dann B2..."). Die Fragen werden hier NICHT wiederholt, sie stehen wörtlich nur bei den Befunden.
- Einwände: die zwei wahrscheinlichsten Einwände als Zitat fett, dahinter die Antwortstrategie im Fließtext.
- Tabu im Erstgespräch und Nach dem Gespräch (48-Stunden-Routine).

Abschluss von Teil A: H1 "Teil B · Kundenteil (abtrennbar)" mit drei Sätzen, was die folgenden Seiten sind und was sie bewusst nicht enthalten. Danach harter Seitenumbruch.

### Teil B — Kundenteil (abtrennbar, maximal 2 Seiten)

Eigener Titelblock: "Digitaler Sichtbarkeits-Check", Untertitel "<Firma> · Kurzdossier", Metazeile "Für <Ansprechpartner> · Clemens Gutmann, be nice Managementberatung · <Monat Jahr>". Akzent-Box: "Dieses Kurzdossier zeigt, was ein potenzieller Mandant sieht, wenn er Sie heute sucht. Und was er nicht sieht." (sinngemäß an die Branche anpassen).

Dramaturgie in vier H1-Abschnitten:
1. **Szene-Einstieg:** Ein konkreter, fiktiver Wunschkunde des Mandanten sucht dessen Leistung, googelt die relevanten Begriffe und findet die Wettbewerber, nicht den Mandanten. Direkt danach die Anerkennung: die zwei, drei echten Stärken des Mandanten, mit Namen und Substanz. Erst Beziehung, dann Diagnose.
2. **Die Zahlen:** Eine kompakte Tabelle (drei bis fünf Zeilen: Marktführer, ein bis zwei Vergleichswerte, regionaler Peer, Zieldomain fett). Darunter die Übersetzung des Schmerzes in Alltagssprache ("Wer Sie kennt, findet Sie. Wer Sie nicht kennt, findet <Marktführer>.").
3. **Was das für Sie bedeutet:** Konsequenz (Abhängigkeit vom Netzwerk, verändertes Suchverhalten der nächsten Entscheider-Generation) UND die gute Nachricht (offenes Zeitfenster, weil auch die Peers unsichtbar sind). Schmerz und Chance gehören zusammen.
4. **Drei Hebel, die schnell wirken:** Drei nummerierte Kurzabsätze, konkret genug für Glaubwürdigkeit, zu knapp für Selbstumsetzung. Danach ein Absatz zur Förderfähigkeit (BAFA bis 3.500 €, INQA-Coaching bis 80 %). Abschluss: grüne "Nächster Schritt"-Überschrift, Gesprächseinladung, Kontaktzeile mit Mail-Link.

**Harte Verbote für Teil B:** keine internen Einschätzungen, keine Gesprächstaktik, keine Abschlusswahrscheinlichkeiten, kein Beratungsfahrplan in Phasen, und keines der Themen, die in Teil A als Tabu markiert sind (typisch: Inhaber-Flaschenhals, Markeninkonsistenz). Was Teil A unter "Tabu im Erstgespräch" führt, darf in Teil B unter keinen Umständen auftauchen.

## Redaktionsregeln

- **Redundanzverbot:** Jeder Befund und jede Kennzahl steht in Teil A genau einmal. Das Drehbuch referenziert Befunde per Nummer statt sie zu wiederholen. Teil B darf Kennzahlen aus Teil A erneut nennen (anderer Leser), aber intern gegenüber dem Mandanten nichts doppeln.
- **Hypothesen-Kennzeichnung:** Alles, was nicht aus den Rohdaten belegt ist, trägt das Kürzel (H). Keine ausgeschriebene "(Hypothese)"-Klammer mehr.
- **Umfangsbudget:** Teil A maximal 5 Seiten (ca. 1.800 Wörter), Teil B maximal 2 Seiten (ca. 700 Wörter). Gesamt maximal 7 Seiten. Wenn der Inhalt nicht passt, wird priorisiert und gekürzt, nicht die Schrift verkleinert.

## Schreibstimme

Es schreibt Clemens Gutmann, be nice Managementberatung. Die verbindlichen Regeln (falls der be-nice-ci-Skill im Repo liegt, gilt dessen SKILL.md vollständig):
- Erst Beziehung, dann Erklärung. Erst Bild, dann Begriff. Erst Mensch, dann Mechanismus. Texte beginnen mit etwas Wiedererkennbarem (Szene, Beobachtung, Frage), nie mit Definition oder Analyse.
- Kurze Impulssätze wechseln mit längeren, fließenden Sätzen. Menschen kommen vor, nicht nur Prozesse.
- Keine langen Gedankenstriche (Em-Dashes); stattdessen Komma, Punkt oder Klammer.
- Keine Argumentationsduette nach dem Muster "das ist kein X, das ist ein Y".
- Keine Phrasen wie "in der heutigen Zeit", "ganzheitlicher Ansatz", "Mehrwert schaffen", "maßgeschneiderte Lösungen", "entscheidend". Kein Agentursprech, kein LinkedIn-Guru-Ton.
- Teil A ist intern und darf nüchterner sein, bleibt aber in Ich-Perspektive ("Im Erstgespräch nicht ansprechen", "entscheidet meine Angebotslogik"). Teil B ist Beziehungstext in Sie-Ansprache.

## CI und Technik

- Optik exakt wie im Goldstandard-Dokument: Calibri durchgehend, Header mit be-nice-Logo links und www.nice-network.de rechts auf hellgrauem Grund mit grüner Linie, H1 dunkelgrau #454544 mit grünem Unterstrich #8CC63E, H2 türkis #33AB97, Footer mit Seitenzahl X / Y. Wenn das Tool bereits ein CI-Template für die alten Berichte hat, baue darauf auf.
- **Logo-Maße nie hartkodieren.** Breite und Höhe immer aus der Bilddatei berechnen (bei PNG aus dem IHDR-Header) und das Seitenverhältnis erhalten. Das war im alten Template ein Bug (Logo wurde auf 125 × 68 gestaucht, echte Datei ist 2493 × 887).
- Boxen: Info-Box und GESPRÄCH-Box mit grüner Labelzelle, INTERN-Box mit dunkelgrauer Labelzelle, Inhaltszelle jeweils hellgrau #E9E9E9. Tabellen mit grüner Kopfzeile und hellgrauen Datenzeilen, Rahmen dezent (#CCCCCC).
- Seitenformat A4, Ränder ca. 2 cm. Seitenumbruch vor Teil B als echter PageBreak, nicht über Leerabsätze.

## Abnahme

Führe nach dem Umbau einen Beispiellauf mit den vorhandenen Scholl-Daten durch und prüfe gegen diese Kriterien, bevor Du mir das Ergebnis zeigst:
1. Genau eine Ausgabedatei, Namensschema korrekt.
2. Maximal 7 Seiten, Seitenumbruch sitzt vor dem Kundenteil.
3. Jede SISTRIX-Kennzahl kommt in Teil A genau einmal vor; das Drehbuch wiederholt keine Frage wörtlich.
4. Teil B enthält kein Tabu-Thema aus Teil A und keine interne Einschätzung.
5. Logo im Header unverzerrt (Seitenverhältnis der Quelldatei).
6. Stichprobe Schreibstimme: keine Em-Dashes, keine verbotenen Phrasen, kein "das ist kein X, das ist Y".
