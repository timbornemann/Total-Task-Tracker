## 🗂️ Projektbeschreibung – **Total-Task-Tracker** (erweitert)

**Total-Task-Tracker** ist eine moderne, webbasierte Anwendung zur Aufgabenverwaltung mit hierarchischer Struktur, die auf einfache Bedienbarkeit, klare Visualisierung und vollständige Kontrolle über komplexe Aufgabenbäume setzt. Die App ist vollständig offline nutzbar, läuft containerisiert über Docker, speichert alle Daten in einer SQL-Datenbank.  

---

### 🎯 **Hauptfunktionen**

- **Aufgaben-Management**
  - Aufgaben anlegen, bearbeiten und löschen
  - Rekursive Unteraufgaben (beliebige Tiefe)
  - Fortschrittsbalken basierend auf erledigten Unteraufgaben
  - Farbcode je Aufgabe (z. B. rot = kritisch)
  - Deadline-Anzeige mit Hervorhebung bei Überfälligkeit

- **Navigation & Darstellung**
  - Treeview-Navigation zur schnellen Orientierung
  - Responsive Design mit TailwindCSS für PC & Mobilgeräte
  - Modale Dialoge für alle Bearbeitungen
  - Kalenderansicht (z. B. Monatsansicht) für Aufgaben mit Deadline
  - Pinned/Favorisierte Aufgaben oben anzeigen
  - Notizfeld pro Aufgabe für spontane Gedanken oder Zusatzinfos

- **Dateien & Anhänge**
  - Kleine Dateien oder Bilder an Aufgaben anhängen (z. B. Screenshots, PDFs)

- **Benutzerverwaltung**
  - Benutzerregistrierung und Login-System
  - Persönliche Aufgabenzuweisung und Verantwortlichkeiten
  - Benutzerprofile mit individuellen Einstellungen
  - Rechteverwaltung für Aufgaben und Projekte
  - Passwort-Reset-Funktionalität für vergessene Passwörter

- **Sortieren & Filtern**
  - Sortierung nach Deadline, Priorität oder Fortschritt
  - Filter nach Farbe, Status, Fälligkeit, Kategorie oder Freitext
  - Filter nach zugewiesenen Benutzern

- **Zeitmanagement**
  - Feld für geplanten Aufwand (z. B. 2 Stunden)
  - Tatsächlicher Aufwand via Stoppuhr oder manuelle Eingabe
  - Gegenüberstellung von geplant vs. tatsächlich in der Statistik

- **Import & Export**
  - JSON-Export aller Aufgaben
  - Import kompletter Aufgabenbäume per JSON-Datei
  - Aufgaben direkt aus JSON-Textfeld hinzufügen

- **Archiv & Verlauf**
  - Abgeschlossene Aufgaben können ausgeblendet, aber archiviert werden
  - Archivierte Aufgaben sind wiederherstellbar und einsehbar

- **Meilensteine & Ziele**
  - Meilensteine definierbar (z. B. „Projektstart", „Beta-Release")
  - Aufgaben lassen sich Meilensteinen zuordnen
  - Fortschrittsanzeige pro Meilenstein

- **Statistik & Überblick**
  - Gesamtfortschritt
  - Erledigungsquote
  - Zeitabweichung (geplant vs. benötigt)
  - Aufgabenanzahl pro Kategorie, Status oder Deadline-Woche
  - Benutzeraktivitäten und Arbeitsanalyse

---

### 🔧 Technik

- **Frontend:** HTML5, TailwindCSS, JavaScript
- **Backend:** PHP 8+, SQL (MySQL/MariaDB)
- **Deployment:** Docker-Container (Port 3032+), keine Authentifizierung
- **Datenhaltung:** SQL-Tabelle mit rekursiver parent_id-Struktur