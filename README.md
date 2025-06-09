# Task Tree Dashboard

Kleine Aufgabenverwaltung auf Basis von React und Node.js. Aufgaben lassen sich in Kategorien organisieren und in einem Kalender oder auf einer Statistikseite auswerten. Die Daten werden dabei auf dem Server in einer kleinen SQLite-Datenbank gespeichert.

## Voraussetzungen

* Für die lokale Entwicklung: **Node.js** (empfohlen Version 18) und **npm**
* Für den produktiven Betrieb: **Docker** und **docker-compose**

## Installation (lokale Entwicklung)

```bash
# Repository klonen
git clone <REPO_URL>
cd task-tree-dashboard-docked

# Abhängigkeiten installieren
npm install
```

## Entwicklung starten

Im Entwicklungsmodus läuft die React-Anwendung mit Vite auf Port **8080**. Für die Datenspeicherung kann gleichzeitig der Node-Server gestartet werden.

```bash
# Frontend mit automatischem Reload
npm run dev

# In zweitem Terminal: Backend starten
npm start
```

Rufe anschließend im Browser `http://localhost:8080` auf.

---

## Bereitstellung mit Docker

Die Anwendung kann komplett über einen Docker-Container ausgeführt werden. Dabei wird automatisch ein Produktionsbuild erstellt.

1. Repository klonen und in das Projektverzeichnis wechseln
2. Container bauen und starten

```bash
docker-compose up --build
```

Der Dienst lauscht anschließend auf Port **3002**. Im Browser unter `http://localhost:3002` erreichst du das Dashboard. Die Daten werden dauerhaft im Verzeichnis `./server/data` als SQLite-Datenbank abgelegt. Mit `docker-compose down` kann der Container gestoppt werden.

## Manuelle Produktion (optional)

Möchtest du ohne Docker deployen, kannst du die Anwendung lokal bauen und den Node-Server direkt nutzen.

```bash
npm run build
npm start    # startet die gebaute App auf Port 3002
```

## Funktionen

- Aufgaben anlegen, bearbeiten und in Kategorien sortieren
- Unteraufgaben, Prioritäten und Wiederholungen
- Kalenderansicht mit direkter Task-Erstellung; Tagesaufgaben sind klickbar und bieten alle Task-Optionen
- Eigene Notizen mit Farbe und Drag & Drop sortierbar
- Lernkarten mit Spaced-Repetition-Training und Verwaltung eigener Karten
  - Decks lassen sich beim Lernen ein- oder ausblenden
  - Optionaler Zufallsmodus ohne Bewertung
  - Trainingsmodus direkt auf der Kartenseite mit 5 Karten pro Runde und Fazit
  - Eingabemodus zum Tippen der Antworten; nach dem Prüfen bewertest du selbst, ob die Karte leicht, mittel oder schwer war
  - Timed-Modus mit 10 Sekunden Countdown pro Karte; der Timer wird einmalig gestartet und kann pausiert werden. Bei Ablauf wird automatisch "schwer" gewertet
- Statistikseite für Lernkarten
- Speicherung der Daten auf dem lokalen Server
 - Pomodoro-Timer läuft beim Neuladen der Seite weiter
 - Statistikseite auf der Pomodoro-Seite mit Tages-, Wochen-, Monats- und Jahresübersicht
   - Auswertung nach Tageszeiten (Morgen, Mittag, Abend, Nacht)
   - Zusätzliche Anzeige für den aktuellen Tag
 - Minuten für Arbeit und Pause werden separat gezählt und als gestapelter Balken
    dargestellt. Beim Pausieren oder Zurücksetzen des Timers werden die Werte
  sofort aktualisiert.
- Lern- und Pausendauer frei konfigurierbar (auch direkt im Timer anpassbar)

## Verwendung

1. Nach dem Start siehst du die vorhandenen **Kategorien**. Mit dem Button `Kategorie` kannst du neue Kategorien erstellen.
2. Wähle eine Kategorie aus, um ihre **Tasks** zu sehen. Über `Task` legst du neue Aufgaben an. Dort kannst du Titel, Beschreibung, Priorität, Farbe, Fälligkeitsdatum und optionale Wiederholung definieren.
3. Tasks lassen sich per Drag & Drop umsortieren oder in Unteraufgaben aufteilen.
4. Über das Suchfeld und die Filter sortierst und findest du Aufgaben nach Priorität oder Farbe.
5. In der **Kalender**-Ansicht klickst du auf ein Datum, um alle bis dahin fälligen Aufgaben zu sehen. Dort kannst du die Tasks direkt öffnen, bearbeiten, Unteraufgaben anlegen oder löschen. Die **Statistiken** geben einen Überblick über erledigte Tasks.
6. Unter **Notizen** kannst du unabhängige Notizen verwalten und per Drag & Drop sortieren.
7. Unter **Decks** legst du Kartendecks an und kannst sie bearbeiten. In der Detailansicht eines Decks fügst du einzelne Karten hinzu.
8. Der Bereich **Karten** zeigt dir fällige Karten zum Lernen an. Dort kannst du
   gezielt Decks ein- oder ausblenden, einen Zufallsmodus aktivieren und im
   Eingabemodus Antworten eintippen. Nach dem Vergleich der Lösung entscheidest
   du selbst, wie schwer dir die Karte fiel.
   Im Timed-Modus bleiben dir pro Karte 10 Sekunden. Der Timer startet einmalig zu Beginn der Session und kann jederzeit pausiert werden. Bei 0 wird automatisch "schwer" gewertet.

Viel Spaß beim Ausprobieren!

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
