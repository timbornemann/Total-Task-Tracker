# Task Tree Dashboard

Kleine Aufgabenverwaltung auf Basis von React und Node.js. Aufgaben lassen sich in Kategorien organisieren und in einem Kalender oder auf einer Statistikseite auswerten. Die Daten werden dabei auf dem Server in einer kleinen SQLite-Datenbank gespeichert.

## Voraussetzungen

* Für die lokale Entwicklung: **Node.js** (empfohlen Version 18) und **npm**
* Für den produktiven Betrieb: **Docker** und **docker-compose**

## Installation (lokale Entwicklung)

```bash
# Repository klonen
git clone <REPO_URL>
cd total-task-tracker

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
  - Notizen lassen sich anpinnen; die ersten drei angepinnten erscheinen auf der Startseite
  - Tasks lassen sich ebenfalls anpinnen; die ersten drei werden auf der Startseite gezeigt
  - Text kann im Markdown-Format geschrieben werden
- Lernkarten mit Spaced-Repetition-Training und Verwaltung eigener Karten
  - Decks lassen sich beim Lernen ein- oder ausblenden
  - Optionaler Zufallsmodus ohne Bewertung
  - Trainingsmodus direkt auf der Kartenseite mit frei einstellbarer Rundengröße
  - Eingabemodus zum Tippen der Antworten; nach dem Prüfen bewertest du selbst, ob die Karte leicht, mittel oder schwer war
  - Timed-Modus mit anpassbarem Countdown pro Karte; der Timer wird einmalig gestartet und kann pausiert werden. Bei Ablauf wird automatisch "schwer" gewertet
- Statistikseite für Lernkarten
  - Deck-Statistiken mit Übersicht fälliger Karten
- Speicherung der Daten auf dem lokalen Server
- Pomodoro-Timer läuft beim Neuladen der Seite weiter
- Kann als schwebendes Fenster (Picture-in-Picture) angezeigt werden
 - Statistikseite auf der Pomodoro-Seite mit Tages-, Wochen-, Monats- und Jahresübersicht
   - Auswertung nach Tageszeiten (Morgen, Mittag, Abend, Nacht)
   - Zusätzliche Anzeige für den aktuellen Tag
 - Minuten für Arbeit und Pause werden separat gezählt und als gestapelter Balken
    dargestellt. Beim Pausieren oder Zurücksetzen des Timers werden die Werte
  sofort aktualisiert.
- Lern- und Pausendauer frei konfigurierbar (auch direkt im Timer anpassbar)
- Daten können im Einstellungsbereich exportiert und importiert werden
- Standard-Priorität für neue Tasks einstellbar
- Mehrere Theme-Voreinstellungen (light, dark, ocean, dark-red, hacker,
  motivation) und ein eigenes "Custom"-Theme wählbar
- Im Custom-Theme lassen sich Farben der Oberfläche und Karten individuell anpassen

## Verwendung

1. Nach dem Start siehst du die vorhandenen **Kategorien**. Mit dem Button `Kategorie` kannst du neue Kategorien erstellen.
2. Wähle eine Kategorie aus, um ihre **Tasks** zu sehen. Über `Task` legst du neue Aufgaben an. Dort kannst du Titel, Beschreibung, Priorität, Farbe, Fälligkeitsdatum und optionale Wiederholung definieren.
3. Tasks lassen sich per Drag & Drop umsortieren oder in Unteraufgaben aufteilen.
4. Über das Suchfeld und die Filter sortierst und findest du Aufgaben nach Priorität oder Farbe.
5. Mit dem Sternsymbol kannst du eine Task anpinnen. Die ersten drei gepinnten erscheinen auf der Startseite.
6. Mit `Strg+K` (oder über das Suchsymbol) öffnest du die **globale Suche**. Sie durchsucht Tasks, Notizen und Lernkarten und führt dich bei Auswahl direkt zum entsprechenden Eintrag.
7. In der **Kalender**-Ansicht klickst du auf ein Datum, um alle bis dahin fälligen Aufgaben zu sehen. Dort kannst du die Tasks direkt öffnen, bearbeiten, Unteraufgaben anlegen oder löschen. Die **Statistiken** geben einen Überblick über erledigte Tasks.
8. Unter **Notizen** kannst du unabhängige Notizen verwalten und per Drag & Drop sortieren. Gepinnte Notizen erscheinen auf der Startseite. Deine Inhalte kannst du dabei in Markdown verfassen. Beim Anklicken einer Notiz siehst du zunächst eine Vorschau, die du dort auch bearbeiten kannst.
9. Unter **Decks** legst du Kartendecks an und kannst sie bearbeiten. In der Detailansicht eines Decks fügst du einzelne Karten hinzu.
10. Der Bereich **Karten** zeigt dir fällige Karten zum Lernen an. Dort kannst du
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
