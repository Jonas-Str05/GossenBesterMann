# GossensBesterMann

Offline-Karteikarten-App für die Abschlussprüfung, im Apple-Design, für dein Smartphone (installierbare Web-App/PWA).

## Funktionen

- **Karten anlegen:** Vorderseite, Rückseite, optionaler Hinweis, Pflicht-Kategorie
- **Spracheingabe:** Mikrofon an jedem Feld (Deutsch). Gesprochene Satzzeichen („Punkt“, „Komma“, „Fragezeichen“, „neue Zeile“) werden umgewandelt.
- **Lernen:** Frage → optional Hinweis → umdrehen → selbst bewerten (Buttons oder nach rechts/links wischen), Rückgängig-Taste
- **Fächer-System:** Start bei 0, gewusst = +1, nicht gewusst = −1, Bereich −5 … +5
- **Lernmodi:** eine Kategorie · eine Ebene · alle zufällig (gleich oft) · Schwächen zuerst (schwache Karten bis zu 32× häufiger)
- **Kategorien:** anlegen, Farbe, Stichwörter, löschen, manuell und automatisch verteilen
- **Backup:** JSON exportieren/importieren, Text-Import (`Vorderseite ; Rückseite ; Hinweis ; Kategorie`)

## Prüfungskarten (deck/ap2.txt)

Der mitgelieferte Kartensatz wird beim App-Start automatisch übernommen: neue Karten kommen dazu, Lernstand und eigene Änderungen bleiben erhalten, gelöschte Karten kommen nicht wieder (außer über Einstellungen → „Fehlende wiederherstellen“).

Format:

```
# k1 | Klausur 1: IT-Systemlösung | blue      ← Bereich (ID, Name, Farbe)
## k1-net | Netzwerke & Kommunikation        ← Kategorie (ID, Name)
### Netzwerkdienste                           ← Unterthema, wird als Hinweis gezeigt
DNS | Domain Name System | Übersetzt Domainnamen in IP-Adressen.
Router | Verbindet Netze …                    ← ohne Abkürzung: nur Erklärung
```

Die Karten-ID ergibt sich aus Kategorie-ID + Vorderseite. Wer die Vorderseite ändert, erzeugt also eine neue Karte.

## Aufs Handy bringen

Die App muss einmal über **HTTPS** geöffnet werden; danach ist sie installiert und läuft komplett offline.

1. Den Ordner hosten (z. B. GitHub Pages oder Netlify).
2. Auf dem Pixel die Adresse in **Chrome** öffnen.
3. Menü ⋮ → **„App installieren“** (oder den Banner in der App nutzen).
4. Danach die App einmal ohne Internet öffnen, um den Offline-Modus zu prüfen.

## Updates

Bei **jedem** Update die Versionsnummer in `version.js` **und** in der Kommentarzeile oben in `sw.js` erhöhen. Daran erkennt der Service Worker die neue Version, lädt alle Dateien frisch und die App startet beim nächsten Öffnen neu. In der App: Einstellungen → „Nach Updates suchen“ prüft sofort.

| Version | Inhalt |
| --- | --- |
| 1.17.1 | Installationshinweis für iPhone/iPad |
| 1.17.0 | Neues App-Icon (Auge) |
| 1.16.2 | Beim Lernen: Löschen und Bearbeiten getauscht |
| 1.16.1 | Play-Pfeil mittig im Kreis |
| 1.16.0 | Mittige Überschriften mit Übergang auch in Kartenlisten und Einstellungen, Zurück nur als Pfeil |
| 1.15.1 | Play-Knopf im Lernen-Tab pulsiert |
| 1.15.0 | Nach oben wischen = Merken, Wiederholung nach Zeit, Tagesziel automatisch aus Prüfungsterminen, Wischen in der Kartenliste, Haptik bei der Überschrift, Backup-Erinnerung |
| 1.14.1 | Rundenende: „Falsche“ rechts, hervorgehoben und pulsierend |
| 1.14.0 | GitHub-Backup: Lernstand automatisch im Branch „backup“ sichern und wiederherstellen |
| 1.13.1 | Sortierung beim App-Start immer alphabetisch |
| 1.13.0 | Tab-Überschriften mittig oben, fließender Übergang beim Scrollen, Anordnen als Symbol |
| 1.12.2 | Android-Zurück wechselt erst in den Lernen-Tab |
| 1.12.1 | Plus-Menü ohne Abbrechen, Plus im Lernen-Tab wie im Karten-Tab |
| 1.12.0 | Langes Drücken auf eine Fach-Säule zeigt ihre Karten, Sortieren ohne Abbrechen |
| 1.11.9 | Drei Erklärtexte im Karten-Tab entfernt |
| 1.11.8 | Suchfeld wächst oben aus der Lupe heraus |
| 1.11.7 | Karten-Tab ohne „% gewusst“, „Neue Karte“ über „Neue Kategorie“ |
| 1.11.6 | Kartenliste: großer „Karte hinzufügen“-Button, Suche als Lupe oben rechts, Stichwort-Text entfernt |
| 1.11.5 | Doppeltipp auf Bereich entfernt |
| 1.11.4 | Automatisch verteilen nur für unsortierte Karten, Lernen nur noch im Lernen-Tab |
| 1.11.3 | Standardsortierung alphabetisch, „Bearbeiten“ in Kategorien entfernt |
| 1.11.2 | Kein „0 % gewusst“ bei leeren Bereichen, Doppeltipp auf Bereich = neue Kategorie |
| 1.11.1 | Sortierung „Zuletzt gelernt“, Ø Ebene unter „Alle Karten“, zwei Erklärtexte entfernt |
| 1.11.0 | Karten-Tab: Bereiche aufklappbar, langes Drücken öffnet Einstellungen |
| 1.10.1 | Erklärtexte im Bereich-Editor und im Lernen-Tab entfernt |
| 1.10.0 | Tabs Karten und Kategorien zusammengelegt: Kategorie öffnet ihre Karten, „Alle Karten“, Suche |
| 1.9.7 | Keine Pfeile in der Prüfungs-Auswahl (Tipp startet direkt) |
| 1.9.6 | Lernmodus-Regler im „Jetzt lernen“-Button (Schwächen zuerst / Alle gleich) |
| 1.9.5 | Prüfung antippen öffnet ihre Kategorien; „Eine Kategorie“ und „Eine Ebene“ entfernt |
| 1.9.4 | Statistik-Bausteine in der normalen Ansicht per langem Drücken verschieben |
| 1.9.3 | Fix: Updates werden sofort erkannt (sw.js trägt die Version, kein HTTP-Cache für version.js) |
| 1.9.2 | Fix: App blieb beim Start schwarz (Ansichten wurden nicht gezeichnet) |
| 1.9.1 | Statistik-Bausteine per langem Drücken direkt verschieben |
| 1.9.0 | Statistik-Bausteine anordnen, Update-Prüfung, aufgeräumte Einstellungen |
| 1.8 | Zahnrad in allen Tabs, Auswahl per langem Drücken |
| 1.7 | Papierkorb |
| 1.6 | „Jetzt lernen“, Wisch-Hinweise |
| 1.5 | Design hell/dunkel/System |
| 1.4 | Statistik-Tab, neues Icon |
| 1.3 | Kategorie-Symbole, Merken/Bearbeiten/Löschen beim Lernen |
| 1.2 | 747 Prüfungskarten, Bereiche |
| 1.0 | Erste Version |

## Daten

Alle Karten liegen nur lokal auf dem Gerät (Browser-Speicher). **Regelmäßig ein Backup exportieren!**
