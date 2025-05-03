<?php

require_once dirname(__DIR__, 2) . '/src/database/Database.php'; 

class User
{
    private $db; // PDO Connection Objekt

    /**
     * Konstruktor, holt die Datenbankverbindung.
     */
    public function __construct()
    {
        $databaseInstance = Database::getInstance();
        $this->db = $databaseInstance->getConnection();
    }

    /**
     * Erstellt einen neuen Benutzer.
     * Hashes the password automatically.
     *
     * @param string $username Der gewünschte Benutzername.
     * @param string $email Die E-Mail-Adresse des Benutzers.
     * @param string $plainPassword Das Passwort im Klartext.
     * @return int|false Die ID des neuen Benutzers oder false bei Fehler (z.B. Duplikat).
     */
    public function create(string $username, string $email, string $plainPassword): int|false
    {
        // 1. Überprüfen, ob Benutzername oder E-Mail bereits existieren
        if ($this->findByUsername($username)) {
            error_log("Registrierungsfehler: Benutzername '{$username}' bereits vergeben.");
            return false;
        }
        if ($this->findByEmail($email)) {
            error_log("Registrierungsfehler: E-Mail '{$email}' bereits registriert.");
            return false;
        }

        // 2. Passwort sicher hashen
        $hashedPassword = password_hash($plainPassword, PASSWORD_DEFAULT);
        if ($hashedPassword === false) {
             error_log("Fehler beim Hashen des Passworts.");
             return false; // Fehler beim Hashen
        }


        // 3. Benutzer in die Datenbank einfügen
        $sql = "INSERT INTO users (username, email, password) VALUES (:username, :email, :password)";

        try {
            $stmt = $this->db->prepare($sql);
            $stmt->bindParam(':username', $username);
            $stmt->bindParam(':email', $email);
            $stmt->bindParam(':password', $hashedPassword);

            if ($stmt->execute()) {
                return (int)$this->db->lastInsertId();
            } else {
                error_log("Benutzererstellung fehlgeschlagen während der Ausführung.");
                return false;
            }
        } catch (PDOException $e) {
            // Spezifische Prüfung auf Duplicate Key Error (Code 23000)
            if ($e->getCode() == 23000) {
                 error_log("Datenbankfehler beim Erstellen des Benutzers: Benutzername oder E-Mail bereits vorhanden. " . $e->getMessage());
            } else {
                 error_log("Datenbankfehler beim Erstellen des Benutzers: " . $e->getMessage());
            }
            return false;
        }
    }

    /**
     * Findet einen Benutzer anhand seiner ID.
     *
     * @param int $id Die Benutzer-ID.
     * @return array|false Benutzerdaten als Array oder false bei Fehler/Nicht gefunden.
     */
    public function findById(int $id): array|false
    {
        $sql = "SELECT id, username, email, created_at FROM users WHERE id = :id"; // Passwort nicht standardmäßig zurückgeben
        try {
            $stmt = $this->db->prepare($sql);
            $stmt->bindParam(':id', $id, PDO::PARAM_INT);
            $stmt->execute();
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Datenbankfehler beim Suchen nach Benutzer-ID {$id}: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Findet einen Benutzer anhand seines Benutzernamens.
     *
     * @param string $username Der Benutzername.
     * @return array|false Benutzerdaten als Array (inkl. Passwort-Hash!) oder false bei Fehler/Nicht gefunden.
     */
    public function findByUsername(string $username): array|false
    {
        // Hier geben wir das Passwort mit zurück, da es oft für die Verifizierung benötigt wird
        $sql = "SELECT * FROM users WHERE username = :username";
        try {
            $stmt = $this->db->prepare($sql);
            $stmt->bindParam(':username', $username);
            $stmt->execute();
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Datenbankfehler beim Suchen nach Benutzername '{$username}': " . $e->getMessage());
            return false;
        }
    }

    /**
     * Findet einen Benutzer anhand seiner E-Mail-Adresse.
     *
     * @param string $email Die E-Mail-Adresse.
     * @return array|false Benutzerdaten als Array (inkl. Passwort-Hash!) oder false bei Fehler/Nicht gefunden.
     */
    public function findByEmail(string $email): array|false
    {
         // Hier geben wir das Passwort mit zurück, da es oft für die Verifizierung benötigt wird
        $sql = "SELECT * FROM users WHERE email = :email";
        try {
            $stmt = $this->db->prepare($sql);
            $stmt->bindParam(':email', $email);
            $stmt->execute();
            return $stmt->fetch(PDO::FETCH_ASSOC);
        } catch (PDOException $e) {
            error_log("Datenbankfehler beim Suchen nach E-Mail '{$email}': " . $e->getMessage());
            return false;
        }
    }

    /**
     * Überprüft das Passwort eines Benutzers.
     *
     * @param string $usernameOrEmail Benutzername oder E-Mail des Benutzers.
     * @param string $plainPassword Das eingegebene Passwort im Klartext.
     * @return array|false Die Benutzerdaten (ohne Passwort) bei Erfolg, sonst false.
     */
    public function verifyPassword(string $usernameOrEmail, string $plainPassword): array|false
    {
        $user = null;
        // Prüfen, ob es eine E-Mail oder ein Benutzername ist
        if (filter_var($usernameOrEmail, FILTER_VALIDATE_EMAIL)) {
            $user = $this->findByEmail($usernameOrEmail);
        } else {
            $user = $this->findByUsername($usernameOrEmail);
        }

        if ($user && isset($user['password'])) {
            // Passwort verifizieren
            if (password_verify($plainPassword, $user['password'])) {
                // Passwort stimmt überein
                unset($user['password']); // Passwort-Hash nicht zurückgeben
                return $user;
            }
        }

        // Benutzer nicht gefunden oder Passwort falsch
        return false;
    }


    /**
     * Aktualisiert Benutzerdaten (Username und/oder E-Mail).
     *
     * @param int $id Die ID des zu aktualisierenden Benutzers.
     * @param array $data Daten zum Aktualisieren (z.B. ['username' => 'new', 'email' => 'new@example.com']).
     * @return bool True bei Erfolg, false bei Fehler (z.B. Duplikat).
     */
    public function update(int $id, array $data): bool
    {
        // Erlaubte Felder für das Update
        $allowedFields = ['username', 'email'];
        $setClauses = [];
        $params = [':id' => $id];

        // Vorab prüfen, ob der Benutzer existiert
        $currentUser = $this->findById($id);
        if (!$currentUser) {
             error_log("Update fehlgeschlagen: Benutzer mit ID {$id} nicht gefunden.");
             return false;
        }

        foreach ($data as $key => $value) {
            if (in_array($key, $allowedFields)) {
                 // Prüfung auf Duplikate, wenn sich der Wert ändert
                 if ($key === 'username' && $value !== $currentUser['username']) {
                      if ($this->findByUsername($value)) {
                          error_log("Update fehlgeschlagen: Neuer Benutzername '{$value}' bereits vergeben.");
                          return false;
                      }
                 }
                 if ($key === 'email' && $value !== $currentUser['email']) {
                     if ($this->findByEmail($value)) {
                          error_log("Update fehlgeschlagen: Neue E-Mail '{$value}' bereits registriert.");
                          return false;
                     }
                 }

                $setClauses[] = "`" . $key . "` = :" . $key;
                $params[':' . $key] = $value;
            }
        }

        if (empty($setClauses)) {
            return true; // Keine Änderungen
        }

        $sql = "UPDATE users SET " . implode(", ", $setClauses) . " WHERE id = :id";

        try {
            $stmt = $this->db->prepare($sql);
            // Parameter binden
            foreach ($params as $key => &$val) {
                 $stmt->bindParam($key, $val, ($key === ':id' ? PDO::PARAM_INT : PDO::PARAM_STR));
            }
            unset($val); // Referenz auflösen

            return $stmt->execute();
        } catch (PDOException $e) {
             if ($e->getCode() == 23000) {
                 error_log("Datenbankfehler beim Aktualisieren des Benutzers (ID: {$id}): Benutzername oder E-Mail bereits vorhanden. " . $e->getMessage());
             } else {
                 error_log("Datenbankfehler beim Aktualisieren des Benutzers (ID: {$id}): " . $e->getMessage());
             }
            return false;
        }
    }

     /**
      * Aktualisiert das Passwort eines Benutzers.
      *
      * @param int $id Die ID des Benutzers.
      * @param string $newPlainPassword Das neue Passwort im Klartext.
      * @return bool True bei Erfolg, false bei Fehler.
      */
     public function updatePassword(int $id, string $newPlainPassword): bool
     {
         $newHashedPassword = password_hash($newPlainPassword, PASSWORD_DEFAULT);
         if ($newHashedPassword === false) {
              error_log("Fehler beim Hashen des neuen Passworts für Benutzer ID {$id}.");
              return false;
         }

         $sql = "UPDATE users SET password = :password WHERE id = :id";
         try {
             $stmt = $this->db->prepare($sql);
             $stmt->bindParam(':password', $newHashedPassword);
             $stmt->bindParam(':id', $id, PDO::PARAM_INT);
             return $stmt->execute();
         } catch (PDOException $e) {
             error_log("Datenbankfehler beim Aktualisieren des Passworts für Benutzer ID {$id}: " . $e->getMessage());
             return false;
         }
     }


    /**
     * Löscht einen Benutzer anhand seiner ID.
     * Beachte: `ON DELETE CASCADE` in der `user_tasks` Tabelle löscht auch die Verknüpfungen.
     *
     * @param int $id Die ID des zu löschenden Benutzers.
     * @return bool True bei Erfolg, false bei Fehler.
     */
    public function delete(int $id): bool
    {
        $sql = "DELETE FROM users WHERE id = :id";
        try {
            $stmt = $this->db->prepare($sql);
            $stmt->bindParam(':id', $id, PDO::PARAM_INT);
            return $stmt->execute();
        } catch (PDOException $e) {
            error_log("Datenbankfehler beim Löschen des Benutzers (ID: {$id}): " . $e->getMessage());
            return false;
        }
    }

    // --- Zuweisung von Tasks zu Benutzern (Beispiel) ---

    /**
     * Weist einem Benutzer einen Task zu.
     *
     * @param int $userId
     * @param int $taskId
     * @return bool True bei Erfolg, false bei Fehler (z.B. Zuweisung existiert bereits).
     */
    public function assignTask(int $userId, int $taskId): bool
    {
        $sql = "INSERT INTO user_tasks (user_id, task_id) VALUES (:user_id, :task_id)";
        try {
            $stmt = $this->db->prepare($sql);
            $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
            $stmt->bindParam(':task_id', $taskId, PDO::PARAM_INT);
            return $stmt->execute();
        } catch (PDOException $e) {
            // Fehlercode 23000 deutet auf Duplicate Entry hin (PK Constraint)
            if ($e->getCode() == 23000) {
                error_log("Task {$taskId} ist bereits Benutzer {$userId} zugewiesen.");
            } else {
                error_log("DB Fehler beim Zuweisen von Task {$taskId} zu Benutzer {$userId}: " . $e->getMessage());
            }
            return false;
        }
    }

    /**
     * Entfernt die Zuweisung eines Tasks von einem Benutzer.
     *
     * @param int $userId
     * @param int $taskId
     * @return bool True bei Erfolg, false bei Fehler.
     */
    public function unassignTask(int $userId, int $taskId): bool
    {
        $sql = "DELETE FROM user_tasks WHERE user_id = :user_id AND task_id = :task_id";
        try {
            $stmt = $this->db->prepare($sql);
            $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
            $stmt->bindParam(':task_id', $taskId, PDO::PARAM_INT);
            return $stmt->execute();
        } catch (PDOException $e) {
            error_log("DB Fehler beim Entfernen der Zuweisung von Task {$taskId} von Benutzer {$userId}: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Holt alle Task-IDs, die einem Benutzer zugewiesen sind.
     *
     * @param int $userId
     * @return array Array von Task-IDs.
     */
    public function getAssignedTaskIds(int $userId): array
    {
        $sql = "SELECT task_id FROM user_tasks WHERE user_id = :user_id";
        try {
            $stmt = $this->db->prepare($sql);
            $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
            $stmt->execute();
            // Gibt ein Array zurück, das nur die task_id Spalte enthält
            return $stmt->fetchAll(PDO::FETCH_COLUMN);
        } catch (PDOException $e) {
            error_log("DB Fehler beim Holen der zugewiesenen Task-IDs für Benutzer {$userId}: " . $e->getMessage());
            return [];
        }
    }

    // --- Passwort-Reset Funktionalität ---

    /**
     * Generiert ein Passwort-Reset-Token für einen Benutzer und speichert es in der Datenbank.
     * Das Token ist für einen bestimmten Zeitraum gültig (24 Stunden).
     *
     * @param string $email Die E-Mail-Adresse des Benutzers.
     * @return array|false Array mit user_id, email und token bei Erfolg, false bei Fehler.
     */
    public function createPasswordResetToken(string $email): array|false
    {
        // Überprüfen, ob der Benutzer existiert
        $user = $this->findByEmail($email);
        if (!$user) {
            error_log("Passwort-Reset fehlgeschlagen: Benutzer mit E-Mail '{$email}' nicht gefunden.");
            return false;
        }

        // Vorhandene Tokens löschen
        $this->deletePasswordResetTokens($user['id']);

        // Generiere ein sicheres, zufälliges Token
        $token = bin2hex(random_bytes(32)); // 64 Zeichen lang
        $userId = (int)$user['id'];
        
        // Token-Ablaufzeit setzen (24 Stunden ab jetzt)
        $expiresAt = date('Y-m-d H:i:s', strtotime('+24 hours'));

        $sql = "INSERT INTO user_password_resets (user_id, email, token, expires_at) 
                VALUES (:user_id, :email, :token, :expires_at)";
        
        try {
            $stmt = $this->db->prepare($sql);
            $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
            $stmt->bindParam(':email', $email);
            $stmt->bindParam(':token', $token);
            $stmt->bindParam(':expires_at', $expiresAt);
            
            if ($stmt->execute()) {
                return [
                    'user_id' => $userId,
                    'email' => $email,
                    'token' => $token
                ];
            } else {
                error_log("Fehler beim Erstellen des Passwort-Reset-Tokens für Benutzer ID {$userId}.");
                return false;
            }
        } catch (PDOException $e) {
            error_log("Datenbankfehler beim Erstellen des Passwort-Reset-Tokens: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Verifiziert ein Passwort-Reset-Token.
     *
     * @param string $token Das zu überprüfende Token.
     * @return array|false Benutzer-ID und E-Mail bei Erfolg, false wenn Token ungültig oder abgelaufen ist.
     */
    public function verifyPasswordResetToken(string $token): array|false
    {
        $sql = "SELECT user_id, email FROM user_password_resets 
                WHERE token = :token AND expires_at > NOW()";
        
        try {
            $stmt = $this->db->prepare($sql);
            $stmt->bindParam(':token', $token);
            $stmt->execute();
            $result = $stmt->fetch(PDO::FETCH_ASSOC);
            
            if ($result) {
                return [
                    'user_id' => (int)$result['user_id'],
                    'email' => $result['email']
                ];
            } else {
                return false; // Token nicht gefunden oder abgelaufen
            }
        } catch (PDOException $e) {
            error_log("Datenbankfehler beim Verifizieren des Passwort-Reset-Tokens: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Setzt das Passwort eines Benutzers zurück nach erfolgreicher Token-Verifizierung.
     *
     * @param string $token Das verifizierte Token.
     * @param string $newPassword Das neue Passwort im Klartext.
     * @return bool True bei Erfolg, false bei Fehler.
     */
    public function resetPasswordWithToken(string $token, string $newPassword): bool
    {
        // Token verifizieren
        $tokenData = $this->verifyPasswordResetToken($token);
        if (!$tokenData) {
            error_log("Passwort-Reset fehlgeschlagen: Ungültiges oder abgelaufenes Token.");
            return false;
        }

        // Passwort ändern
        if ($this->updatePassword($tokenData['user_id'], $newPassword)) {
            // Token löschen nach erfolgreichem Reset
            $this->deletePasswordResetTokens($tokenData['user_id']);
            return true;
        }

        return false;
    }

    /**
     * Löscht alle Passwort-Reset-Tokens für einen bestimmten Benutzer.
     *
     * @param int $userId Die ID des Benutzers.
     * @return bool True bei Erfolg, false bei Fehler.
     */
    private function deletePasswordResetTokens(int $userId): bool
    {
        $sql = "DELETE FROM user_password_resets WHERE user_id = :user_id";
        
        try {
            $stmt = $this->db->prepare($sql);
            $stmt->bindParam(':user_id', $userId, PDO::PARAM_INT);
            return $stmt->execute();
        } catch (PDOException $e) {
            error_log("Datenbankfehler beim Löschen der Passwort-Reset-Tokens für Benutzer ID {$userId}: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Bereinigt abgelaufene Passwort-Reset-Tokens aus der Datenbank.
     * Diese Methode sollte regelmäßig aufgerufen werden, z.B. durch einen Cron-Job.
     *
     * @return bool True bei Erfolg, false bei Fehler.
     */
    public function cleanupExpiredResetTokens(): bool
    {
        $sql = "DELETE FROM user_password_resets WHERE expires_at <= NOW()";
        
        try {
            $stmt = $this->db->prepare($sql);
            return $stmt->execute();
        } catch (PDOException $e) {
            error_log("Datenbankfehler beim Bereinigen abgelaufener Passwort-Reset-Tokens: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Fügt dem Benutzer benutzerdefinierte Einstellungen hinzu oder aktualisiert diese.
     * Diese Methode könnte später erweitert werden, um eine separate Tabelle für Benutzereinstellungen zu nutzen.
     *
     * @param int $userId Die ID des Benutzers.
     * @param array $settings Assoziatives Array mit Einstellungen, z.B. ['theme' => 'dark', 'notifications' => true].
     * @return bool True bei Erfolg, false bei Fehler.
     */
    public function updateUserSettings(int $userId, array $settings): bool
    {
        // Implementation würde eine separate Tabelle für Benutzereinstellungen erfordern
        // Hier nur Platzhalter für zukünftige Implementierung
        return true;
    }
}


// --- Beispielhafte Verwendung ---
/*

$userRepo = new UserRepository();

// 1. Neuen Benutzer registrieren
$newUserId = $userRepo->create('testuser', 'test@example.com', 'secret123');
if ($newUserId) {
    echo "Benutzer 'testuser' erstellt mit ID: {$newUserId}\n";

    // 1.1 Versuchen, denselben Benutzer nochmal zu erstellen (sollte fehlschlagen)
    $failUserId = $userRepo->create('testuser', 'another@example.com', 'password');
    if (!$failUserId) {
        echo "Zweite Registrierung für 'testuser' wie erwartet fehlgeschlagen.\n";
    }

    // 2. Benutzer nach ID suchen
    $userById = $userRepo->findById($newUserId);
    if ($userById) {
        echo "Benutzer gefunden nach ID {$newUserId}:\n";
        print_r($userById);
    }

    // 3. Passwort verifizieren (Login-Versuch)
    $verifiedUser = $userRepo->verifyPassword('test@example.com', 'secret123');
    if ($verifiedUser) {
        echo "Passwort für 'test@example.com' erfolgreich verifiziert:\n";
        print_r($verifiedUser); // Enthält keine Passwort-Info mehr
    } else {
        echo "Passwort-Verifizierung für 'test@example.com' fehlgeschlagen.\n";
    }

    // 3.1 Falsches Passwort testen
    $verifiedUserFail = $userRepo->verifyPassword('testuser', 'wrongpassword');
    if (!$verifiedUserFail) {
        echo "Passwort-Verifizierung für 'testuser' mit falschem Passwort wie erwartet fehlgeschlagen.\n";
    }

    // 4. Benutzerdaten aktualisieren
    if ($userRepo->update($newUserId, ['email' => 'new.test@example.com'])) {
        echo "E-Mail für Benutzer ID {$newUserId} aktualisiert.\n";
        $updatedUser = $userRepo->findById($newUserId);
        print_r($updatedUser);
    } else {
        echo "E-Mail-Update fehlgeschlagen.\n";
    }

    // 4.1 Versuchen, auf eine bereits verwendete E-Mail zu aktualisieren (angenommen, 'admin@example.com' existiert)
    // $otherUserId = $userRepo->create('admin', 'admin@example.com', 'adminpass'); // Voraussetzung
    // if (!$userRepo->update($newUserId, ['email' => 'admin@example.com'])) {
    //     echo "Update auf existierende E-Mail 'admin@example.com' wie erwartet fehlgeschlagen.\n";
    // }


    // 5. Passwort ändern
    if ($userRepo->updatePassword($newUserId, 'newSecret456')) {
        echo "Passwort für Benutzer ID {$newUserId} geändert.\n";
        // Erneut verifizieren mit neuem Passwort
        $verifiedUserNewPass = $userRepo->verifyPassword('testuser', 'newSecret456');
        if ($verifiedUserNewPass) {
            echo "Verifizierung mit neuem Passwort erfolgreich.\n";
        } else {
             echo "FEHLER: Verifizierung mit neuem Passwort fehlgeschlagen.\n";
        }
    } else {
         echo "Passwortänderung fehlgeschlagen.\n";
    }

    // 6. Task zuweisen (Annahme: Task mit ID 1 existiert)
    // $taskRepo = new TaskRepository(); // Benötigt TaskRepository Instanz
    // $taskId = 1; // Annahme
    // if ($userRepo->assignTask($newUserId, $taskId)) {
    //     echo "Task {$taskId} Benutzer {$newUserId} zugewiesen.\n";
    // }
    // $assigned = $userRepo->getAssignedTaskIds($newUserId);
    // echo "Zugewiesene Task IDs für Benutzer {$newUserId}: "; print_r($assigned);

    // 7. Task Zuweisung entfernen
    // if ($userRepo->unassignTask($newUserId, $taskId)) {
    //     echo "Zuweisung von Task {$taskId} für Benutzer {$newUserId} entfernt.\n";
    // }


    // 8. Benutzer löschen
    // if ($userRepo->delete($newUserId)) {
    //    echo "Benutzer ID {$newUserId} gelöscht.\n";
    // }

} else {
    echo "Fehler beim Erstellen des initialen Benutzers.\n";
}

*/
?>