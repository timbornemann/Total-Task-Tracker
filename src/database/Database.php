<?php

class Database
{
    private static $instance = null;
    private $conn;

    private function __construct()
    {
        // Pfad zur Konfigurationsdatei
        $configPath = dirname(__DIR__, 3) . '/config/db_config.ini';
        $config = parse_ini_file($configPath);

        if ($config === false) {
            throw new Exception("Fehler beim Laden der Konfigurationsdatei.");
        }

        $dsn = "mysql:host={$config['host']};dbname={$config['db']};charset=utf8mb4";
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, // Fehler als Ausnahme werfen
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,       // Standard-Fetch-Modus
            PDO::ATTR_EMULATE_PREPARES => false,                  // Native Prepared Statements
        ];

        try {
            $this->conn = new PDO($dsn, $config['user'], $config['pass'], $options);
        } catch (PDOException $e) {
            die("Ein technischer Fehler ist aufgetreten. Bitte versuchen Sie es später erneut oder kontaktieren Sie den Administrator.");
        }
    }

    public static function getInstance()
    {
        if (self::$instance === null) {
            self::$instance = new Database();
        }
        return self::$instance;
    }

    public function getConnection()
    {
        return $this->conn;
    }
}
?>