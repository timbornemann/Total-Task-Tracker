<?php

require_once dirname(__DIR__, 2) . '/src/database/Database.php'; 

class Task
{
    private $db; // PDO Connection Objekt

    /**
     * Konstruktor, holt die Datenbankverbindung.
     */
    public function __construct()
    {
        // Hole die Singleton-Instanz der Datenbank und dann die Verbindung
        $databaseInstance = Database::getInstance();
        $this->db = $databaseInstance->getConnection();
    }

    /**
     * Erstellt eine neue Aufgabe in der Datenbank.
     *
     * @param array $data Assoziatives Array mit den Task-Daten (z.B. ['title' => '...', 'description' => '...', ...])
     * @return int|false Die ID des neu erstellten Tasks oder false bei einem Fehler.
     */
    public function create(array $data): int|false
    {
        // Standardwerte setzen, falls nicht übergeben
        $data['parent_id'] = $data['parent_id'] ?? null;
        $data['description'] = $data['description'] ?? null;
        $data['due_date'] = $data['due_date'] ?? null;
        $data['color'] = $data['color'] ?? null;
        $data['is_completed'] = $data['is_completed'] ?? false;
        $data['is_pinned'] = $data['is_pinned'] ?? false;
        $data['is_favorite'] = $data['is_favorite'] ?? false;
        $data['is_archived'] = $data['is_archived'] ?? false;
        $data['planned_time'] = $data['planned_time'] ?? null;
        $data['actual_time'] = $data['actual_time'] ?? null;
        $data['milestone_id'] = $data['milestone_id'] ?? null;

        // Validiere, dass der Titel gesetzt ist (REQUIRED Field)
        if (empty($data['title'])) {
            // Optional: Hier könntest du eine spezifischere Exception werfen
            error_log("Task creation failed: Title is required.");
            return false;
        }

        $sql = "INSERT INTO tasks (
                    parent_id, title, description, due_date, color,
                    is_completed, is_pinned, is_favorite, is_archived,
                    planned_time, actual_time, milestone_id
                ) VALUES (
                    :parent_id, :title, :description, :due_date, :color,
                    :is_completed, :is_pinned, :is_favorite, :is_archived,
                    :planned_time, :actual_time, :milestone_id
                )";

        try {
            $stmt = $this->db->prepare($sql);

            // Binde die Parameter
            $stmt->bindParam(':parent_id', $data['parent_id'], PDO::PARAM_INT); // Oder PDO::PARAM_NULL wenn null
            $stmt->bindParam(':title', $data['title']);
            $stmt->bindParam(':description', $data['description']);
            $stmt->bindParam(':due_date', $data['due_date']); // PDO::PARAM_NULL wenn null
            $stmt->bindParam(':color', $data['color']); // PDO::PARAM_NULL wenn null
            $stmt->bindParam(':is_completed', $data['is_completed'], PDO::PARAM_BOOL);
            $stmt->bindParam(':is_pinned', $data['is_pinned'], PDO::PARAM_BOOL);
            $stmt->bindParam(':is_favorite', $data['is_favorite'], PDO::PARAM_BOOL);
            $stmt->bindParam(':is_archived', $data['is_archived'], PDO::PARAM_BOOL);
            $stmt->bindParam(':planned_time', $data['planned_time']); // PDO::PARAM_NULL wenn null
            $stmt->bindParam(':actual_time', $data['actual_time']); // PDO::PARAM_NULL wenn null
            $stmt->bindParam(':milestone_id', $data['milestone_id'], PDO::PARAM_INT); // Oder PDO::PARAM_NULL wenn null

            // Führe die Anweisung aus
            if ($stmt->execute()) {
                return (int)$this->db->lastInsertId(); // Gibt die ID des neuen Tasks zurück
            } else {
                error_log("Task creation failed during execution.");
                return false;
            }
        } catch (PDOException $e) {
            // Fehler loggen statt die() verwenden
            error_log("Datenbankfehler beim Erstellen des Tasks: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Liest einen Task anhand seiner ID.
     *
     * @param int $id Die ID des zu lesenden Tasks.
     * @return array|false Ein assoziatives Array mit den Task-Daten oder false, wenn nicht gefunden oder Fehler.
     */
    public function getById(int $id): array|false
    {
        $sql = "SELECT * FROM tasks WHERE id = :id";
        try {
            $stmt = $this->db->prepare($sql);
            $stmt->bindParam(':id', $id, PDO::PARAM_INT);
            $stmt->execute();
            $task = $stmt->fetch(PDO::FETCH_ASSOC); // Fetch_ASSOC ist Standard dank deiner Database Klasse, aber explizit ist ok

            // Konvertiere Boolean-Werte von 0/1 zu true/false
            if ($task) {
                 $task = $this->convertBooleans($task);
            }

            return $task; // Gibt das Array oder false zurück (wenn fetch fehlschlägt)
        } catch (PDOException $e) {
            error_log("Datenbankfehler beim Lesen des Tasks (ID: {$id}): " . $e->getMessage());
            return false;
        }
    }

    /**
     * Liest alle Tasks, optional gefiltert und sortiert.
     *
     * @param array $options Optionen zum Filtern und Sortieren, z.B.:
     * ['parent_id' => null|int, 'is_archived' => false, 'orderBy' => 'due_date ASC']
     * @return array Ein Array von Task-Arrays.
     */
    public function getAll(array $options = []): array
    {
        $sql = "SELECT * FROM tasks";
        $whereClauses = [];
        $params = [];

        // --- Filterung ---
        // Nach Parent-ID (z.B. nur Root-Tasks holen)
        if (isset($options['parent_id'])) {
            if ($options['parent_id'] === null) {
                $whereClauses[] = "parent_id IS NULL";
            } else {
                $whereClauses[] = "parent_id = :parent_id";
                $params[':parent_id'] = (int)$options['parent_id'];
            }
        }

        // Nach Archivierungsstatus
        if (isset($options['is_archived'])) {
             $whereClauses[] = "is_archived = :is_archived";
             $params[':is_archived'] = (bool)$options['is_archived'];
        }
        // Nach Abschlussstatus
        if (isset($options['is_completed'])) {
             $whereClauses[] = "is_completed = :is_completed";
             $params[':is_completed'] = (bool)$options['is_completed'];
        }
        // Nach Pinned-Status
        if (isset($options['is_pinned'])) {
             $whereClauses[] = "is_pinned = :is_pinned";
             $params[':is_pinned'] = (bool)$options['is_pinned'];
        }
         // Nach Favoriten-Status
        if (isset($options['is_favorite'])) {
             $whereClauses[] = "is_favorite = :is_favorite";
             $params[':is_favorite'] = (bool)$options['is_favorite'];
        }

        // Füge WHERE-Klausel hinzu, wenn Filter vorhanden sind
        if (!empty($whereClauses)) {
            $sql .= " WHERE " . implode(" AND ", $whereClauses);
        }

        // --- Sortierung ---
        if (isset($options['orderBy'])) {
            // WICHTIG: Direkte Einfügung von Spaltennamen ist riskant. Validieren!
            $allowedSortColumns = ['id', 'title', 'due_date', 'created_at', 'updated_at', 'is_pinned', 'is_favorite', 'is_completed'];
            $sortParts = explode(' ', $options['orderBy']);
            $sortColumn = $sortParts[0];
            $sortDirection = isset($sortParts[1]) && strtoupper($sortParts[1]) === 'DESC' ? 'DESC' : 'ASC';

            if (in_array($sortColumn, $allowedSortColumns)) {
                $sql .= " ORDER BY " . $sortColumn . " " . $sortDirection;
                // Beispiel: ORDER BY is_pinned DESC, due_date ASC (mehrere Kriterien)
                // Dafür müsste die Logik erweitert werden, um Komma-separierte orderBy-Werte zu parsen.
            } else {
                // Standard-Sortierung oder Fehler werfen/loggen
                 $sql .= " ORDER BY created_at DESC"; // Fallback
                 error_log("Ungültige Sortierspalte angefordert: " . $options['orderBy']);
            }
        } else {
            // Standard-Sortierung
            $sql .= " ORDER BY created_at DESC";
        }

        try {
            $stmt = $this->db->prepare($sql);
            // Binde Parameter für WHERE-Klausel
            foreach ($params as $key => $value) {
                 $stmt->bindValue($key, $value, is_bool($value) ? PDO::PARAM_BOOL : PDO::PARAM_STR); // Typ anpassen bei Bedarf
            }

            $stmt->execute();
            $tasks = $stmt->fetchAll(PDO::FETCH_ASSOC);

            // Konvertiere Boolean-Werte für jeden Task
            return array_map([$this, 'convertBooleans'], $tasks);

        } catch (PDOException $e) {
            error_log("Datenbankfehler beim Lesen aller Tasks: " . $e->getMessage());
            return []; // Leeres Array bei Fehler
        }
    }


    /**
     * Aktualisiert einen bestehenden Task.
     *
     * @param int $id Die ID des zu aktualisierenden Tasks.
     * @param array $data Assoziatives Array mit den zu ändernden Daten.
     * @return bool True bei Erfolg, false bei Fehler.
     */
    public function update(int $id, array $data): bool
    {
        // Überprüfen, ob der Task existiert (optional, aber gut)
        if (!$this->getById($id)) {
            return false; // Task nicht gefunden
        }

        // Erlaubte Felder für das Update definieren, um unerwünschte Änderungen zu verhindern
        $allowedFields = [
            'parent_id', 'title', 'description', 'due_date', 'color', 'is_completed',
            'is_pinned', 'is_favorite', 'is_archived', 'planned_time', 'actual_time', 'milestone_id'
        ];

        $setClauses = [];
        $params = [':id' => $id]; // ID für die WHERE-Klausel

        foreach ($data as $key => $value) {
            if (in_array($key, $allowedFields)) {
                $setClauses[] = "`" . $key . "` = :" . $key; // Spaltennamen in Backticks
                $params[':' . $key] = $value;
            }
        }

        // Nichts zu aktualisieren
        if (empty($setClauses)) {
            return true; // Keine Änderung, aber technisch erfolgreich
        }

        // Füge updated_at automatisch hinzu (obwohl die DB es kann, ist es explizit oft klarer)
        // $setClauses[] = "updated_at = CURRENT_TIMESTAMP"; // Nicht nötig, da ON UPDATE CURRENT_TIMESTAMP im Schema

        $sql = "UPDATE tasks SET " . implode(", ", $setClauses) . " WHERE id = :id";

        try {
            $stmt = $this->db->prepare($sql);

            // Binde die Parameter dynamisch
            foreach ($params as $key => &$value) { // Referenz (&) ist wichtig für bindParam
                 $pdoType = PDO::PARAM_STR; // Standardtyp
                 if (is_int($value) && ($key === ':id' || $key === ':parent_id' || $key === ':milestone_id')) {
                     $pdoType = PDO::PARAM_INT;
                 } elseif (is_bool($value)) {
                     $pdoType = PDO::PARAM_BOOL;
                 } elseif (is_null($value)) {
                      $pdoType = PDO::PARAM_NULL;
                 }
                 $stmt->bindParam($key, $value, $pdoType);
            }
            unset($value); // Referenz auflösen

            return $stmt->execute(); // Gibt true bei Erfolg zurück

        } catch (PDOException $e) {
            error_log("Datenbankfehler beim Aktualisieren des Tasks (ID: {$id}): " . $e->getMessage());
            return false;
        }
    }

    /**
     * Löscht einen Task anhand seiner ID.
     * Beachte: Dank "ON DELETE CASCADE" in deinem Schema werden auch alle direkten
     * und indirekten Unteraufgaben automatisch gelöscht!
     *
     * @param int $id Die ID des zu löschenden Tasks.
     * @return bool True bei Erfolg, false bei Fehler.
     */
    public function delete(int $id): bool
    {
        $sql = "DELETE FROM tasks WHERE id = :id";
        try {
            $stmt = $this->db->prepare($sql);
            $stmt->bindParam(':id', $id, PDO::PARAM_INT);
            return $stmt->execute(); // Gibt true bei Erfolg zurück
        } catch (PDOException $e) {
            error_log("Datenbankfehler beim Löschen des Tasks (ID: {$id}): " . $e->getMessage());
            return false;
        }
    }

     /**
      * Holt alle direkten Unteraufgaben für einen gegebenen Parent-Task.
      *
      * @param int $parentId Die ID des Parent-Tasks.
      * @param array $options Zusätzliche Optionen (wie bei getAll, z.B. Sortierung, Filterung nach Status).
      * @return array Ein Array von Task-Arrays.
      */
     public function getSubtasks(int $parentId, array $options = []): array
     {
         // Nutze die bestehende getAll Methode und setze die parent_id Option
         $options['parent_id'] = $parentId;
         return $this->getAll($options);
     }


    /**
     * Hilfsfunktion zur Konvertierung von DB Boolean (0/1) zu PHP Boolean (false/true).
     *
     * @param array $task Das Task-Array von der Datenbank.
     * @return array Das Task-Array mit konvertierten Booleans.
     */
    private function convertBooleans(array $task): array
    {
        $booleanFields = ['is_completed', 'is_pinned', 'is_favorite', 'is_archived'];
        foreach ($booleanFields as $field) {
            if (isset($task[$field])) {
                $task[$field] = (bool)$task[$field];
            }
        }
        return $task;
    }

    // --- Zusätzliche Methoden (Beispiele) ---

    /**
     * Holt einen kompletten Aufgabenbaum rekursiv ab einem Startpunkt (oder alle Bäume).
     * VORSICHT: Kann bei sehr vielen Tasks performance-intensiv sein!
     * Oft ist es besser, die Ebenen bei Bedarf nachzuladen (z.B. per AJAX).
     *
     * @param int|null $parentId Die ID des Start-Tasks (null für alle Root-Tasks).
     * @param array $options Filter/Sortieroptionen für jede Ebene (siehe getAll).
     * @return array Ein verschachteltes Array, das die Baumstruktur repräsentiert.
     */
    public function getTaskTree(?int $parentId = null, array $options = []): array
    {
        $tasks = $this->getAll(array_merge($options, ['parent_id' => $parentId]));
        $tree = [];

        foreach ($tasks as $task) {
            // Rekursiver Aufruf, um Kinder zu holen
            $children = $this->getTaskTree($task['id'], $options);
            if (!empty($children)) {
                $task['children'] = $children; // Füge Kinder dem Task-Array hinzu
            }
            $tree[] = $task;
        }

        return $tree;
    }


     /**
      * Berechnet den Fortschritt eines Tasks basierend auf seinen direkten Unteraufgaben.
      * HINWEIS: Dies ist eine einfache Berechnung. Eine gewichtete oder tiefere
      * rekursive Berechnung wäre komplexer.
      *
      * @param int $taskId Die ID des Tasks, dessen Fortschritt berechnet werden soll.
      * @return float Fortschritt als Zahl zwischen 0.0 und 1.0 (oder 0 bei keinen Unteraufgaben/Fehler).
      */
     public function calculateProgress(int $taskId): float
     {
         $subtasks = $this->getSubtasks($taskId, ['is_archived' => false]); // Ignoriere archivierte Unteraufgaben?

         if (empty($subtasks)) {
             // Wenn ein Task keine Unteraufgaben hat, könnte sein eigener Status zählen?
             // $task = $this->getById($taskId);
             // return $task && $task['is_completed'] ? 1.0 : 0.0;
             return 0.0; // Oder 1.0, je nach Definition
         }

         $completedCount = 0;
         foreach ($subtasks as $subtask) {
             if ($subtask['is_completed']) {
                 $completedCount++;
             }
         }

         return count($subtasks) > 0 ? (float)$completedCount / count($subtasks) : 0.0;
     }
}


// --- Beispielhafte Verwendung ---

/*
// Annahme: $db = Database::getInstance()->getConnection(); ist bereits erfolgt
$taskRepo = new TaskRepository();

// 1. Neuen Task erstellen
$newTaskId = $taskRepo->create([
    'title' => 'Hauptaufgabe Projekt X',
    'description' => 'Planung und Umsetzung von Projekt X.',
    'due_date' => '2025-12-31',
    'color' => '#ff0000', // Rot
    'is_favorite' => true
]);

if ($newTaskId) {
    echo "Neuer Task erstellt mit ID: " . $newTaskId . "\n";

    // 1.1 Unteraufgabe erstellen
    $subTaskId = $taskRepo->create([
        'parent_id' => $newTaskId,
        'title' => 'Teilaufgabe 1: Anforderungsanalyse',
        'planned_time' => 8.5 // 8 Stunden 30 Minuten
    ]);
     echo "Unteraufgabe erstellt mit ID: " . $subTaskId . "\n";

    // 2. Einen Task lesen
    $task = $taskRepo->getById($newTaskId);
    if ($task) {
        echo "Gelesener Task: ";
        print_r($task);
    }

    // 3. Task aktualisieren (als erledigt markieren)
    if ($taskRepo->update($subTaskId, ['is_completed' => true, 'actual_time' => 7.0])) {
        echo "Unteraufgabe (ID: {$subTaskId}) als erledigt markiert.\n";
    }

    // 4. Alle Root-Tasks lesen (nicht archiviert)
    $rootTasks = $taskRepo->getAll(['parent_id' => null, 'is_archived' => false, 'orderBy' => 'is_pinned DESC, due_date ASC']);
    echo "Root Tasks:\n";
    print_r($rootTasks);

    // 5. Direkte Unteraufgaben von Task $newTaskId holen
    $subtasks = $taskRepo->getSubtasks($newTaskId);
    echo "Unteraufgaben von Task {$newTaskId}:\n";
    print_r($subtasks);

    // 6. Fortschritt berechnen
    $progress = $taskRepo->calculateProgress($newTaskId);
    echo "Fortschritt von Task {$newTaskId}: " . ($progress * 100) . "%\n";

    // 7. Den kompletten Baum ab $newTaskId holen (Achtung bei großen Bäumen!)
    // $taskTree = $taskRepo->getTaskTree($newTaskId);
    // echo "Aufgabenbaum für Task {$newTaskId}:\n";
    // print_r($taskTree);


    // 8. Task löschen (löscht auch die Unteraufgabe wegen CASCADE)
    // if ($taskRepo->delete($newTaskId)) {
    //    echo "Task (ID: {$newTaskId}) und seine Unteraufgaben gelöscht.\n";
    // }

} else {
    echo "Fehler beim Erstellen des Tasks.\n";
}

*/

?>