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

Bei **jedem** Update die Versionsnummer in `version.js` erhöhen (einzige Stelle). Daran erkennt der Service Worker die neue Version, lädt alle Dateien frisch und die App startet beim nächsten Öffnen neu. In der App: Einstellungen → „Nach Updates suchen“ prüft sofort.

| Version | Inhalt |
| --- | --- |
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
