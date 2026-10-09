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

## Aufs Handy bringen

Die App muss einmal über **HTTPS** geöffnet werden; danach ist sie installiert und läuft komplett offline.

1. Den Ordner hosten (z. B. GitHub Pages oder Netlify).
2. Auf dem Pixel die Adresse in **Chrome** öffnen.
3. Menü ⋮ → **„App installieren“** (oder den Banner in der App nutzen).
4. Danach die App einmal ohne Internet öffnen, um den Offline-Modus zu prüfen.

## Updates

Nach Änderungen in `sw.js` die Versionsnummer in `CACHE` erhöhen. Die App lädt die neue Version im Hintergrund und zeigt sie beim nächsten Start.

## Daten

Alle Karten liegen nur lokal auf dem Gerät (Browser-Speicher). **Regelmäßig ein Backup exportieren!**
