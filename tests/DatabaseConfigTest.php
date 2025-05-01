<?php

use PHPUnit\Framework\TestCase;
require_once dirname(__DIR__, 1) . '/src/database/Database.php';
class DatabaseConfigTest extends TestCase
{
    private $db;
    private $pdo;

    protected function setUp(): void
    {
        // Use the Database singleton class
        $this->db = Database::getInstance();
        $this->pdo = $this->db->getConnection();
    }

    public function testDatabaseConnection()
    {
        echo "\nTesting database connection...\n";
        $this->assertInstanceOf(PDO::class, $this->pdo);
        echo "✓ Database connection successful\n";
    }

    public function testDatabaseTables()
    {
        echo "\nTesting database tables...\n";
        
        $expectedTables = ['tasks', 'labels', 'task_labels', 'users', 'user_tasks', 'user_password_resets'];
        $actualTables = $this->pdo->query("SHOW TABLES")->fetchAll(PDO::FETCH_COLUMN);
        
        foreach ($expectedTables as $table) {
            $this->assertContains($table, $actualTables);
            echo "✓ Table '{$table}' exists\n";
        }
    }

    public function testTasksTableStructure()
    {
        echo "\nTesting tasks table structure...\n";
        
        $columns = $this->pdo->query("DESCRIBE tasks")->fetchAll(PDO::FETCH_COLUMN);
        $expectedColumns = ['id', 'parent_id', 'title', 'description', 'due_date', 'color', 'is_completed', 'created_at', 'updated_at'];
        
        foreach ($expectedColumns as $column) {
            $this->assertContains($column, $columns);
            echo "✓ Column '{$column}' exists in tasks table\n";
        }
    }

    public function testLabelsTableStructure()
    {
        echo "\nTesting labels table structure...\n";
        
        $columns = $this->pdo->query("DESCRIBE labels")->fetchAll(PDO::FETCH_COLUMN);
        $expectedColumns = ['id', 'name', 'color', 'created_at'];
        
        foreach ($expectedColumns as $column) {
            $this->assertContains($column, $columns);
            echo "✓ Column '{$column}' exists in labels table\n";
        }
    }

    public function testUsersTableStructure()
    {
        echo "\nTesting users table structure...\n";
        
        $columns = $this->pdo->query("DESCRIBE users")->fetchAll(PDO::FETCH_COLUMN);
        $expectedColumns = ['id', 'username', 'email', 'password', 'created_at'];
        
        foreach ($expectedColumns as $column) {
            $this->assertContains($column, $columns);
            echo "✓ Column '{$column}' exists in users table\n";
        }
    }

    public function testForeignKeys()
    {
        echo "\nTesting foreign key constraints...\n";
        
        // Test tasks.parent_id foreign key
        $result = $this->pdo->query("
            SELECT COUNT(*)
            FROM information_schema.KEY_COLUMN_USAGE
            WHERE TABLE_NAME = 'tasks'
            AND COLUMN_NAME = 'parent_id'
            AND REFERENCED_TABLE_NAME = 'tasks'
        ")->fetchColumn();
        
        $this->assertEquals(1, $result);
        echo "✓ Foreign key constraint for tasks.parent_id exists\n";

        // Test task_labels foreign keys
        $result = $this->pdo->query("
            SELECT COUNT(*)
            FROM information_schema.KEY_COLUMN_USAGE
            WHERE TABLE_NAME = 'task_labels'
            AND REFERENCED_TABLE_NAME IN ('tasks', 'labels')
        ")->fetchColumn();
        
        $this->assertEquals(2, $result);
        echo "✓ Foreign key constraints for task_labels exist\n";

        // Test user_tasks foreign keys
        $result = $this->pdo->query("
            SELECT COUNT(*)
            FROM information_schema.KEY_COLUMN_USAGE
            WHERE TABLE_NAME = 'user_tasks'
            AND REFERENCED_TABLE_NAME IN ('users', 'tasks')
        ")->fetchColumn();
        
        $this->assertEquals(2, $result);
        echo "✓ Foreign key constraints for user_tasks exist\n";
    }

    public function testIndexes()
    {
        echo "\nTesting indexes...\n";
        
        // Get database name from connection
        $dbName = $this->pdo->query("SELECT DATABASE()")->fetchColumn();
        
        // Test unique indexes
        $uniqueIndexes = $this->pdo->query("
            SELECT TABLE_NAME, COLUMN_NAME
            FROM information_schema.STATISTICS
            WHERE TABLE_SCHEMA = '{$dbName}'
            AND NON_UNIQUE = 0
            AND INDEX_NAME != 'PRIMARY'
        ")->fetchAll();
        
        $expectedUniqueIndexes = [
            ['TABLE_NAME' => 'users', 'COLUMN_NAME' => 'username'],
            ['TABLE_NAME' => 'users', 'COLUMN_NAME' => 'email'],
            ['TABLE_NAME' => 'labels', 'COLUMN_NAME' => 'name']
        ];
        
        foreach ($expectedUniqueIndexes as $index) {
            $found = false;
            foreach ($uniqueIndexes as $actualIndex) {
                if ($actualIndex['TABLE_NAME'] === $index['TABLE_NAME'] && 
                    $actualIndex['COLUMN_NAME'] === $index['COLUMN_NAME']) {
                    $found = true;
                    break;
                }
            }
            $this->assertTrue($found);
            echo "✓ Unique index on {$index['TABLE_NAME']}.{$index['COLUMN_NAME']} exists\n";
        }
    }

    protected function tearDown(): void
    {
        $this->pdo = null;
        $this->db = null;
    }
}
