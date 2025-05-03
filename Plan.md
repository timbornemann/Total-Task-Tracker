# Total Task Tracker - Projektplan

## Projektinitialisierung
[✅] Projektstruktur anlegen
[✅] GitHub Repository erstellen
[✅] Entwicklungsumgebung einrichten
[✅] Docker-Container konfigurieren (Port 3032+)

## Datenbankdesign
[✅] Datenbankschema entwerfen
  [✅] Tabelle für Aufgaben mit rekursiver parent_id-Struktur
  [✅] Tabelle für Meilensteine
  [✅] Tabelle für Dateien/Anhänge
  [✅] Tabelle für Benutzer
[✅] SQL-Skripte für Tabellenerstellung


## Backend-Entwicklung
[] PHP-Projektstruktur aufsetzen
[✅] Datenbank-Verbindungsklasse erstellen
[] API-Endpunkte entwickeln:
  [✅] Aufgaben CRUD-Operationen
  [] Unteraufgaben verwalten
  [] Meilensteine CRUD-Operationen
  [] Dateianhänge hochladen/löschen
  [] Filter- und Sortierfunktionen
  [] Import/Export-Funktionalität
  [] Benutzerverwaltung CRUD-Operationen
[] Unit-Tests für Backend-Funktionen

## Frontend-Grundstruktur
[] HTML-Grundgerüst erstellen
[] TailwindCSS einrichten
[] Responsive Layout entwickeln
[] Navigationskomponente erstellen

## Frontend-Komponenten
[] Treeview-Navigation implementieren
[] Aufgabenansicht entwickeln
  [] Einzelaufgabenansicht mit Details
  [] Fortschrittsbalken basierend auf Unteraufgaben
  [] Farbcodierung implementieren
  [] Deadline-Anzeige mit Überfälligkeitsmarkierung
[] Modale Dialoge für CRUD-Operationen
  [] Aufgaben anlegen/bearbeiten Dialog
  [] Meilenstein anlegen/bearbeiten Dialog
  [] Bestätigungsdialoge für Löschvorgänge
[] Kalenderansicht implementieren
[] Zeitmanagementsystem
  [] Stoppuhr-Funktion für Aufwandserfassung
  [] Geplante vs. tatsächliche Zeit visualisieren

## Hauptfunktionen
[] Aufgaben-Management
  [] Aufgaben anlegen, bearbeiten und löschen
  [] Rekursive Unteraufgaben (beliebige Tiefe) implementieren
  [] Fortschrittsberechnung für Aufgaben mit Unteraufgaben
  [] Farbcodierung je nach Priorität/Status
  [] Deadline-Verwaltung
[] Notizfeld pro Aufgabe implementieren
[] Dateien/Anhänge-Funktionalität
  [] Upload-Mechanismus
  [] Vorschau für Bilder
  [] Downloadmöglichkeit

## Benutzerverwaltung
[] Benutzerregistrierung implementieren
[] Login-System einrichten
[] Passwort-Reset-Funktion
[] Benutzerprofilseite entwickeln
[] Rechteverwaltung für Aufgabenzugriff
[] Aufgabenzuweisung an Benutzer
[] Benutzereinstellungen (Präferenzen)

## Erweiterte Funktionen
[] Sortier- und Filterfunktionen
  [] Nach Deadline sortieren
  [] Nach Priorität sortieren
  [] Nach Fortschritt sortieren
  [] Nach Farbe/Status/Fälligkeit/Kategorie filtern
  [] Freitext-Suche implementieren
[] Favoriten/Pinned Aufgaben
[] Import/Export-Funktionalität
  [] JSON-Export aller Aufgaben
  [] Import von Aufgabenbäumen
  [] Direkte JSON-Eingabe

## Archiv & Verlauf
[] Archivierungsfunktion implementieren
[] Ansicht für archivierte Aufgaben
[] Wiederherstellungsmechanismus

## Meilensteine & Ziele
[] Meilenstein-Verwaltung implementieren
[] Zuordnung von Aufgaben zu Meilensteinen
[] Fortschrittsanzeige pro Meilenstein

## Statistik & Überblick
[] Dashboard entwickeln
  [] Gesamtfortschritt visualisieren
  [] Erledigungsquote berechnen und anzeigen
  [] Zeitabweichungsanalyse (geplant vs. tatsächlich)
  [] Aufgabenverteilung nach Kategorien
  [] Deadline-Übersicht nach Wochen
  [] Benutzerstatistiken und Aktivitäten

## Testing
[] Unit-Tests
[] Integrationstests
[] Benutzerakzeptanztests
[] Responsivitätstests auf verschiedenen Geräten

## Deployment
[] Docker-Container finalisieren
[] Deployment-Skripte erstellen
[] Dokumentation für Installation und Betrieb

## Optimierung & Finalisierung
[] Performance-Optimierung
[] Code-Refactoring
[] Bugfixing
[] UI/UX-Verbesserungen
[] Dokumentation vervollständigen
