# Total-Task-Tracker

English version available in [README.en.md](README.en.md).

Der Total-Task-Tracker ist eine leistungsstarke, lokal betriebene Aufgaben- und Lernverwaltung auf Basis von React, Node.js und SQLite. Die Anwendung kombiniert klassische To-do-Funktionen mit Kalenderintegration, Markdown-Notizen, einem Pomodoro-Timer und einem integrierten Lernkarten-System mit Spaced-Repetition-Algorithmus.
Ideal für Selbstorganisation, Projektplanung oder die strukturierte Prüfungsvorbereitung.

Die Daten werden dabei vollständig lokal auf dem Server gespeichert, entweder per Docker oder im klassischen Node.js-Betrieb. So behältst du volle Kontrolle über deine Inhalte.

## Inhaltsverzeichnis

- [Voraussetzungen](#voraussetzungen)
- [Schnellstart mit dem fertigen Docker-Image](#schnellstart-mit-dem-fertigen-docker-image)
- [Automatische Updates mit Watchtower](#automatische-updates-mit-watchtower)
- [Docker-Compose: Image selbst bauen](#docker-compose-image-selbst-bauen)
- [Installation für die lokale Entwicklung](#installation-für-die-lokale-entwicklung)
- [Entwicklung starten](#entwicklung-starten)
- [Manuelle Produktion ohne Docker](#manuelle-produktion-ohne-docker)
- [Android APK erstellen](#android-apk-erstellen)
- [Funktionen](#funktionen)
- [Verwendung](#verwendung)
- [Tastenkürzel](#tastenkürzel)
- [Lernkarten-Algorithmus](#lernkarten-algorithmus)

## Voraussetzungen

- Für die lokale Entwicklung: **Node.js** (empfohlen Version 18) und **npm**
- Für den produktiven Betrieb: **Docker** und **docker-compose**

## Schnellstart mit dem fertigen Docker-Image (empfohlen)

Wenn du nicht lokal bauen möchtest, kannst du das bereits bereitgestellte Docker-Image aus der GitHub Container Registry nutzen:

```bash
docker pull ghcr.io/timbornemann/total-task-tracker:latest
docker run -d --name total-task-tracker -p 3002:3002 -v total-task-tracker-data:/app/server/data ghcr.io/timbornemann/total-task-tracker:latest
```

Die Anwendung legt ihre SQLite-Daten standardmäßig im Volume `total-task-tracker-data` ab. Dieses Volume wird beim ersten Start automatisch angelegt und bleibt auch nach einem Container-Update erhalten. Möchtest du stattdessen ein bestimmtes Verzeichnis binden, kannst du ein Volume angeben:

```bash
docker run -d --name total-task-tracker -p 3002:3002 -v ./server/data:/app/server/data ghcr.io/timbornemann/total-task-tracker:latest
```

Soll in den Einstellungen eine bestimmte IP angezeigt werden (etwa bei der Docker-Nutzung), kannst du die Umgebungsvariable `SERVER_PUBLIC_IP` setzen. Dieser Wert wird unter "Server Info" zusätzlich ausgegeben.

## Automatische Updates mit Watchtower

Um den Container stets aktuell zu halten, kannst du [Watchtower](https://containrrr.dev/watchtower/) einsetzen. Damit wird regelmäßig geprüft, ob neue Images verfügbar sind.

### Alle Container überwachen

```bash
docker run -d --name watchtower --restart unless-stopped -v /var/run/docker.sock:/var/run/docker.sock containrrr/watchtower --interval 3600
```

Der Parameter `--interval` gibt das Prüfintervall in Sekunden an. Im Beispiel sucht Watchtower also jede Stunde nach Updates und startet betroffene Container neu.

### Nur diesen Container aktualisieren

```bash
docker run -d --name watchtower --restart unless-stopped -v /var/run/docker.sock:/var/run/docker.sock containrrr/watchtower total-task-tracker-app --interval 3600
```

Soll Watchtower lediglich einmalig prüfen und danach beendet werden, füge `--run-once` hinzu:

```bash
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock containrrr/watchtower total-task-tracker-app --run-once
```

## Docker-Compose: Image selbst bauen

Die Anwendung kann auch komplett über `docker-compose` ausgeführt werden. Dabei wird automatisch ein Produktionsbuild erstellt.

1. Repository klonen und in das Projektverzeichnis wechseln
2. Container bauen und starten (setzt optional die Versionsnummer)

```bash
VERSION=$(git describe --tags --abbrev=0) docker-compose up --build
```

Der Dienst lauscht anschließend auf Port **3002**. Im Browser unter `http://localhost:3002` erreichst du das Dashboard. Die Daten werden in einem benannten Docker-Volume (`total-task-tracker-data`) gespeichert. Mit `docker-compose down` kann der Container gestoppt werden, ohne dass die Daten verloren gehen.

## Installation für die lokale Entwicklung

```bash
# Repository klonen
git clone <REPO_URL>
cd Total-Task-Tracker

# Abhängigkeiten installieren
npm install

Das Projekt nutzt für die Anzeige von Notizen **react-markdown**.
```

## Entwicklung starten

Im Entwicklungsmodus läuft die React-Anwendung mit Vite auf Port **8081**. Für die Datenspeicherung kann gleichzeitig der Node-Server gestartet werden.

```bash
# Frontend mit automatischem Reload
npm run dev

# In zweitem Terminal: Backend starten
npm start
```

Rufe anschließend im Browser `http://localhost:8081` auf.

## Tests ausführen

Die Anwendung verwendet [Vitest](https://vitest.dev/) und die React Testing Library.
Nach der Installation der Abhängigkeiten kannst du die Tests mit folgendem Befehl starten:

```bash
npm test
```

## Manuelle Produktion ohne Docker

Möchtest du ohne Docker deployen, kannst du die Anwendung lokal bauen und den Node-Server direkt nutzen.

```bash
npm run build
npm start    # startet die gebaute App auf Port 3002
```

## Android APK erstellen

Mit [Capacitor](https://capacitorjs.com/) kannst du den Tracker auch als Android-App bauen.

1. Projekt einmalig initialisieren:
   ```bash
   npm install
   npx cap init total-task-tracker com.example.total_task_tracker --web-dir=dist
   npx cap add android
   ```
2. Produktionsbuild erstellen und Dateien kopieren:
   ```bash
   npm run build:android
   ```
3. Android-Projekt in Android Studio öffnen und ein signiertes APK erzeugen:
   ```bash
   npm run open:android
   ```

## Funktionen

- Aufgaben anlegen, bearbeiten und in Kategorien sortieren
- Unteraufgaben und Prioritäten
- Separate Seite für wiederkehrende Aufgaben mit eigenen Intervallen und dynamischen Titeln
- Zeitplan-Seite mit Tages-, Wochen- und Monatsansicht
  - Aufgaben lassen sich mit Start- und Endzeit planen
  - Tasks ohne Uhrzeit werden pro Tag als Liste angezeigt
- Eigene Notizen mit Farbe und Drag & Drop sortierbar
  - Drag & Drop basiert jetzt auf dnd-kit und funktioniert in Grid-Layouts für Notizen, Tasks, Kategorien und die Startseiten-Buttons
  - Notizen lassen sich anpinnen; die ersten drei angepinnten erscheinen auf der Startseite
  - Tasks lassen sich ebenfalls anpinnen; die ersten drei werden auf der Startseite gezeigt
  - Text kann im Markdown-Format geschrieben werden
  - Eingebauter Editor bietet Icons und Tooltips für häufige Formatierungen (z. B. Listen, Links, Codeblöcke)
- Lernkarten mit Spaced-Repetition-Training und Verwaltung eigener Karten
  - Decks lassen sich beim Lernen ein- oder ausblenden
  - Optionaler Zufallsmodus ohne Bewertung
  - Trainingsmodus direkt auf der Kartenseite mit frei einstellbarer Rundengröße
  - Eingabemodus zum Tippen der Antworten; nach dem Prüfen bewertest du selbst, ob die Karte leicht, mittel oder schwer war
  - Timed-Modus mit anpassbarem Countdown pro Karte; der Timer wird einmalig gestartet und kann pausiert werden. Bei Ablauf wird automatisch "schwer" gewertet
- Statistikseite für Lernkarten
- Deck-Statistiken mit Übersicht fälliger Karten
- Speicherung der Daten auf dem lokalen Server
- Kann als Progressive Web App installiert werden (Desktop & Smartphone)
- Pomodoro-Timer läuft beim Neuladen der Seite weiter
- Separate Uhr-Seite zeigt stets die aktuelle Zeit
- Kann als schwebendes Fenster (Picture-in-Picture) angezeigt werden
- Statistikseite auf der Pomodoro-Seite mit Tages-, Wochen-, Monats- und Jahresübersicht
  - Auswertung nach Tageszeiten (Morgen, Mittag, Abend, Nacht)
  - Zusätzliche Anzeige für den aktuellen Tag
- Minuten für Arbeit und Pause werden separat gezählt und als gestapelter Balken
  dargestellt. Beim Pausieren oder Zurücksetzen des Timers werden die Werte
  sofort aktualisiert.
- Lern- und Pausendauer frei konfigurierbar (auch direkt im Timer anpassbar)
- Daten können im Einstellungsbereich exportiert und importiert werden
  (inklusive Einstellungen)
- Import zeigt eine Vorschau der einzufügenden Elemente und bestätigt den Erfolg
- Zusätzlich kann die reine Datenstruktur als JSON exportiert werden
- Zentrale Synchronisation über HTTP. Ein Container kann als Sync-Server
  betrieben werden, alle anderen senden ihre Daten regelmäßig dorthin.
  Der Server listet seine IP-Adressen auf und führt ein Log über eingehende
  Anfragen. Fällt der Server aus, speichern Clients lokal weiter und gleichen
  die Daten ab, sobald der Server wieder erreichbar ist.
- Live-Updates per Server-Sent Events halten geöffnete Clients automatisch auf dem neuesten Stand.
- Gelöschte Einträge werden über ein Deletion-Log abgeglichen und tauchen nicht wieder auf.
- Standard-Priorität für neue Tasks einstellbar
- Mehrsprachige Oberfläche (Deutsch, Englisch) auswählbar
- Mehrere Theme-Voreinstellungen (light, dark, ocean, dark-red, hacker,
  motivation) stehen zur Auswahl. Eigene Themes können benannt,
  gespeichert und verwaltet werden, wobei alle Farben individuell
  anpassbar sind.
- Jede Theme-Voreinstellung bringt nun eine passende Farbpalette für Kategorien,
  Tasks und Notizen mit
- Neuer "Info"-Reiter in den Einstellungen zeigt Versionsnummer, Release Notes und README
- Im Reiter "Sprache" lässt sich Deutsch oder Englisch auswählen
- Untermenü "Server Info" in den Einstellungen listet IP-Adressen, Port und fertige URLs auf

## Verwendung

1. Nach dem Start siehst du die vorhandenen **Kategorien**. Mit dem Button `Kategorie` kannst du neue Kategorien erstellen.
2. Wähle eine Kategorie aus, um ihre **Tasks** zu sehen. Über `Task` legst du neue Aufgaben an. Dort kannst du Titel, Beschreibung, Priorität, Farbe und ein Fälligkeitsdatum festlegen.
3. Wiederkehrende Aufgaben erstellst du über die Seite **Wiederkehrend**. Dort legst du Vorlagen mit festen oder benutzerdefinierten Intervallen an und kannst Platzhalter wie `{date}` oder `{counter}` im Titel nutzen.
4. Tasks lassen sich per Drag & Drop umsortieren oder in Unteraufgaben aufteilen.
5. Über das Suchfeld und die Filter sortierst und findest du Aufgaben nach Priorität oder Farbe.
6. Mit dem Sternsymbol kannst du eine Task anpinnen. Die ersten drei gepinnten erscheinen auf der Startseite.
7. Mit `Strg+K` (oder über das Suchsymbol) öffnest du die **globale Suche**. Sie durchsucht Tasks, Notizen und Lernkarten und führt dich bei Auswahl direkt zum entsprechenden Eintrag.
8. In der **Zeitplan**-Ansicht wählst du einen Tag, eine Woche oder einen Monat aus. Aufgaben mit Uhrzeit erscheinen als Blöcke, solche ohne Zeit als Liste unterhalb des Plans.
   Die **Statistiken** geben einen Überblick über erledigte Tasks.
9. Unter **Notizen** kannst du unabhängige Notizen verwalten und per Drag & Drop sortieren. Gepinnte Notizen erscheinen auf der Startseite. Deine Inhalte kannst du dabei in Markdown verfassen. Beim Anklicken einer Notiz siehst du zunächst eine Vorschau und kannst sie direkt bearbeiten. Auf dem Desktop erscheint nun während des Bearbeitens eine Live-Vorschau rechts neben dem Editor. Der Editor stellt zahlreiche Schaltflächen für gängige Formatierungen bereit.
10. Unter **Decks** legst du Kartendecks an und kannst sie bearbeiten. In der Detailansicht eines Decks fügst du einzelne Karten hinzu.
11. Der Bereich **Karten** zeigt dir fällige Karten zum Lernen an. Dort kannst du
    gezielt Decks ein- oder ausblenden, einen Zufallsmodus aktivieren und im
    Eingabemodus Antworten eintippen. Nach dem Vergleich der Lösung entscheidest
    du selbst, wie schwer dir die Karte fiel.
    Im Timed-Modus bestimmt ein einstellbarer Countdown die Zeit pro Karte. Der Timer startet einmalig zu Beginn der Session und kann jederzeit pausiert werden. Bei 0 wird automatisch "schwer" gewertet.

Viel Spaß beim Ausprobieren!

### Tastenkürzel

In den Einstellungen kannst du die wichtigsten Shortcuts per Tastendruck
anpassen. Standardmäßig gelten folgende Kombinationen:

- `ctrl+k` – Command Palette öffnen
- `ctrl+alt+t` – Schnell eine neue Task anlegen
- `ctrl+alt+n` – Schnell eine neue Notiz anlegen
- `ctrl+alt+f` – Neue Lernkarte erstellen

## Lernkarten-Algorithmus

Beim Bewerten einer Karte merkt sich das System, wie oft sie als **leicht**, **mittel** oder **schwer** eingestuft wurde. Aus diesen Zählen berechnet sich eine Erfolgsquote:

```
successRate = (easyCount + 0.5 * mediumCount) / (easyCount + mediumCount + hardCount)
```

Die nächste Wiederholungszeit wird dann wie folgt bestimmt:

1. Basisfaktor je nach aktueller Bewertung (`leicht` = 1.5, `mittel` = 1.2, `schwer` = 0.8)
2. Der Faktor wird mit `1 + successRate` multipliziert
3. Das Intervall erhöht sich um `interval * Faktor`

Dadurch fließt sowohl die bisherige Leistung als auch die aktuelle Bewertung in das nächste Fälligkeitsdatum ein.
