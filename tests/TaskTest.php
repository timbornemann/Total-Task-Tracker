<?php

use PHPUnit\Framework\TestCase;
require_once dirname(__DIR__, 1) . '/src/database/Database.php';
require_once dirname(__DIR__, 1) . '/src/models/Task.php';

class TaskTest extends TestCase
{
    private $task;
    private $db;
    private $testTaskIds = [];

    protected function setUp(): void
    {
        // Get database connection
        $this->db = Database::getInstance()->getConnection();
        $this->task = new Task();
        
        // Set up test database - make sure we're working in a clean state
        $this->cleanupTestData();
    }

    /**
     * Clean up any test data that might be left from previous test runs
     */
    private function cleanupTestData(): void
    {
        // Delete any test tasks from previous test runs
        $this->db->exec("DELETE FROM tasks WHERE title LIKE 'Test Task %'");
        $this->db->exec("DELETE FROM user_tasks WHERE task_id NOT IN (SELECT id FROM tasks)");
    }

    /**
     * Create a test user for task assignment tests
     */
    private function createTestUser(): int
    {
        // Check if our test user already exists
        $stmt = $this->db->prepare("SELECT id FROM users WHERE username = 'testuser'");
        $stmt->execute();
        $userId = $stmt->fetchColumn();
        
        if ($userId) {
            return (int)$userId;
        }
        
        // Create a new test user
        $stmt = $this->db->prepare("
            INSERT INTO users (username, email, password) 
            VALUES ('testuser', 'test@example.com', :password)
        ");
        $hashedPassword = password_hash('testpassword', PASSWORD_DEFAULT);
        $stmt->bindParam(':password', $hashedPassword);
        $stmt->execute();
        
        return (int)$this->db->lastInsertId();
    }

    public function testCreateTask()
    {
        echo "\nTesting task creation...\n";
        
        $taskData = [
            'title' => 'Test Task 1',
            'description' => 'This is a test task',
            'due_date' => date('Y-m-d', strtotime('+1 week')),
            'color' => '#ff0000',
            'is_completed' => false,
            'is_pinned' => true,
            'is_favorite' => true,
            'planned_time' => 5.5
        ];
        
        $taskId = $this->task->create($taskData);
        $this->assertIsInt($taskId);
        $this->assertGreaterThan(0, $taskId);
        $this->testTaskIds[] = $taskId;
        
        echo "✓ Task created with ID: {$taskId}\n";
        
        // Verify the task was created with correct data
        $createdTask = $this->task->getById($taskId);
        $this->assertIsArray($createdTask);
        $this->assertEquals($taskData['title'], $createdTask['title']);
        $this->assertEquals($taskData['description'], $createdTask['description']);
        $this->assertEquals($taskData['due_date'], $createdTask['due_date']);
        $this->assertEquals($taskData['color'], $createdTask['color']);
        $this->assertEquals($taskData['is_completed'], $createdTask['is_completed']);
        $this->assertEquals($taskData['is_pinned'], $createdTask['is_pinned']);
        $this->assertEquals($taskData['is_favorite'], $createdTask['is_favorite']);
        $this->assertEquals($taskData['planned_time'], $createdTask['planned_time']);
        
        echo "✓ Created task data verified\n";
        
        return $taskId;
    }

    /**
     * @depends testCreateTask
     */
    public function testGetTaskById(int $taskId)
    {
        echo "\nTesting task retrieval by ID...\n";
        
        $task = $this->task->getById($taskId);
        $this->assertIsArray($task);
        $this->assertEquals($taskId, $task['id']);
        $this->assertEquals('Test Task 1', $task['title']);
        
        echo "✓ Task retrieved by ID: {$taskId}\n";
        
        // Test retrieving non-existent task
        $nonExistentTaskId = 9999999;
        $nonExistentTask = $this->task->getById($nonExistentTaskId);
        $this->assertFalse($nonExistentTask);
        
        echo "✓ Non-existent task returns false\n";
        
        return $taskId;
    }

    /**
     * @depends testGetTaskById
     */
    public function testUpdateTask(int $taskId)
    {
        echo "\nTesting task update...\n";
        
        $updateData = [
            'title' => 'Test Task 1 Updated',
            'description' => 'This is an updated test task',
            'is_completed' => true,
            'actual_time' => 4.5
        ];
        
        $result = $this->task->update($taskId, $updateData);
        $this->assertTrue($result);
        
        echo "✓ Task updated successfully\n";
        
        // Verify the task was updated with correct data
        $updatedTask = $this->task->getById($taskId);
        $this->assertIsArray($updatedTask);
        $this->assertEquals($updateData['title'], $updatedTask['title']);
        $this->assertEquals($updateData['description'], $updatedTask['description']);
        $this->assertEquals($updateData['is_completed'], $updatedTask['is_completed']);
        $this->assertEquals($updateData['actual_time'], $updatedTask['actual_time']);
        
        echo "✓ Updated task data verified\n";
        
        return $taskId;
    }

    public function testCreateSubtask()
    {
        echo "\nTesting subtask creation...\n";
        
        // Create a parent task first
        $parentTaskData = [
            'title' => 'Test Task Parent',
            'description' => 'This is a parent test task'
        ];
        
        $parentTaskId = $this->task->create($parentTaskData);
        $this->assertIsInt($parentTaskId);
        $this->assertGreaterThan(0, $parentTaskId);
        $this->testTaskIds[] = $parentTaskId;
        
        echo "✓ Parent task created with ID: {$parentTaskId}\n";
        
        // Create a subtask
        $subtaskData = [
            'parent_id' => $parentTaskId,
            'title' => 'Test Task Subtask',
            'description' => 'This is a subtask'
        ];
        
        $subtaskId = $this->task->create($subtaskData);
        $this->assertIsInt($subtaskId);
        $this->assertGreaterThan(0, $subtaskId);
        $this->testTaskIds[] = $subtaskId;
        
        echo "✓ Subtask created with ID: {$subtaskId}\n";
        
        // Verify the subtask was created with correct parent_id
        $createdSubtask = $this->task->getById($subtaskId);
        $this->assertIsArray($createdSubtask);
        $this->assertEquals($parentTaskId, $createdSubtask['parent_id']);
        
        echo "✓ Subtask parent_id verified\n";
        
        return [$parentTaskId, $subtaskId];
    }

    /**
     * @depends testCreateSubtask
     */
    public function testGetSubtasks(array $taskIds)
    {
        echo "\nTesting subtask retrieval...\n";
        
        [$parentTaskId, $subtaskId] = $taskIds;
        
        $subtasks = $this->task->getSubtasks($parentTaskId);
        $this->assertIsArray($subtasks);
        $this->assertNotEmpty($subtasks);
        $this->assertEquals(1, count($subtasks));
        $this->assertEquals($subtaskId, $subtasks[0]['id']);
        
        echo "✓ Subtasks retrieved successfully\n";
        
        return $taskIds;
    }

    /**
     * @depends testCreateSubtask
     */
    public function testCalculateProgress(array $taskIds)
    {
        echo "\nTesting progress calculation...\n";
        
        [$parentTaskId, $subtaskId] = $taskIds;
        
        // Initial progress should be 0 (subtask not completed)
        $initialProgress = $this->task->calculateProgress($parentTaskId);
        $this->assertEquals(0.0, $initialProgress);
        
        echo "✓ Initial progress is 0 (no completed subtasks)\n";
        
        // Mark subtask as completed
        $this->task->update($subtaskId, ['is_completed' => true]);
        
        // Progress should now be 1.0 (100%)
        $updatedProgress = $this->task->calculateProgress($parentTaskId);
        $this->assertEquals(1.0, $updatedProgress);
        
        echo "✓ Updated progress is 1.0 (all subtasks completed)\n";
        
        // Add another subtask (not completed)
        $subtaskData2 = [
            'parent_id' => $parentTaskId,
            'title' => 'Test Task Subtask 2',
            'description' => 'This is another subtask'
        ];
        
        $subtaskId2 = $this->task->create($subtaskData2);
        $this->testTaskIds[] = $subtaskId2;
        
        // Progress should now be 0.5 (50%)
        $finalProgress = $this->task->calculateProgress($parentTaskId);
        $this->assertEquals(0.5, $finalProgress);
        
        echo "✓ Final progress is 0.5 (1 of 2 subtasks completed)\n";
        
        return $taskIds;
    }

    /**
     * @depends testCreateSubtask
     */
    public function testGetTaskTree(array $taskIds)
    {
        echo "\nTesting task tree retrieval...\n";
        
        [$parentTaskId, $subtaskId] = $taskIds;
        
        $taskTree = $this->task->getTaskTree($parentTaskId);
        $this->assertIsArray($taskTree);
        $this->assertNotEmpty($taskTree);
        $this->assertEquals(1, count($taskTree));
        $this->assertEquals($parentTaskId, $taskTree[0]['id']);
        $this->assertArrayHasKey('children', $taskTree[0]);
        $this->assertNotEmpty($taskTree[0]['children']);
        
        echo "✓ Task tree retrieved successfully\n";
        
        // Get all root tasks
        $rootTasks = $this->task->getTaskTree(null);
        $this->assertIsArray($rootTasks);
        
        echo "✓ All root tasks retrieved successfully\n";
        
        return $taskIds;
    }

    public function testTaskUserAssignment()
    {
        echo "\nTesting task-user assignment...\n";
        
        // Create a test task
        $taskData = [
            'title' => 'Test Task User Assignment',
            'description' => 'Task for testing user assignment'
        ];
        
        $taskId = $this->task->create($taskData);
        $this->assertIsInt($taskId);
        $this->testTaskIds[] = $taskId;
        
        echo "✓ Test task created with ID: {$taskId}\n";
        
        // Create or get test user
        $userId = $this->createTestUser();
        $this->assertIsInt($userId);
        
        echo "✓ Test user has ID: {$userId}\n";
        
        // Test assigning user to task
        $assignResult = $this->task->assignUser($taskId, $userId);
        $this->assertTrue($assignResult);
        
        echo "✓ User assigned to task successfully\n";
        
        // Test getting assigned users for task
        $assignedUsers = $this->task->getAssignedUsers($taskId);
        $this->assertIsArray($assignedUsers);
        $this->assertNotEmpty($assignedUsers);
        $this->assertEquals(1, count($assignedUsers));
        $this->assertEquals($userId, $assignedUsers[0]['id']);
        
        echo "✓ Retrieved assigned users successfully\n";
        
        // Test getting tasks for user
        $userTasks = $this->task->getTasksByUserId($userId);
        $this->assertIsArray($userTasks);
        $this->assertNotEmpty($userTasks);
        $foundTask = false;
        foreach ($userTasks as $task) {
            if ($task['id'] === $taskId) {
                $foundTask = true;
                break;
            }
        }
        $this->assertTrue($foundTask);
        
        echo "✓ Retrieved tasks for user successfully\n";
        
        // Test unassigning user from task
        $unassignResult = $this->task->unassignUser($taskId, $userId);
        $this->assertTrue($unassignResult);
        
        // Verify user was unassigned
        $assignedUsersAfter = $this->task->getAssignedUsers($taskId);
        $this->assertEmpty($assignedUsersAfter);
        
        echo "✓ User unassigned from task successfully\n";
        
        return $taskId;
    }

    /**
     * @depends testCreateTask
     */
    public function testGetAllTasks(int $taskId)
    {
        echo "\nTesting retrieval of all tasks with filtering and sorting...\n";
        
        // Test getting all tasks
        $allTasks = $this->task->getAll();
        $this->assertIsArray($allTasks);
        $this->assertNotEmpty($allTasks);
        
        echo "✓ Retrieved all tasks successfully\n";
        
        // Test filtering by is_completed
        $completedTasks = $this->task->getAll(['is_completed' => true]);
        $this->assertIsArray($completedTasks);
        
        echo "✓ Filtered tasks by completion status successfully\n";
        
        // Test filtering by is_favorite
        $favoriteTasks = $this->task->getAll(['is_favorite' => true]);
        $this->assertIsArray($favoriteTasks);
        $this->assertNotEmpty($favoriteTasks);
        
        echo "✓ Filtered tasks by favorite status successfully\n";
        
        // Test sorting by title
        $sortedTasks = $this->task->getAll(['orderBy' => 'title ASC']);
        $this->assertIsArray($sortedTasks);
        $this->assertNotEmpty($sortedTasks);
        
        echo "✓ Sorted tasks successfully\n";
        
        return $taskId;
    }

    /**
     * @depends testCreateTask
     */
    public function testDeleteTask(int $taskId)
    {
        echo "\nTesting task deletion...\n";
        
        // Delete the task
        $deleteResult = $this->task->delete($taskId);
        $this->assertTrue($deleteResult);
        
        echo "✓ Task deleted successfully\n";
        
        // Verify the task was deleted
        $deletedTask = $this->task->getById($taskId);
        $this->assertFalse($deletedTask);
        
        echo "✓ Task deletion verified\n";
    }

    protected function tearDown(): void
    {
        // Clean up any tasks created during testing
        foreach ($this->testTaskIds as $id) {
            try {
                $this->task->delete($id);
            } catch (Exception $e) {
                // Ignore exceptions during cleanup
            }
        }
        
        $this->testTaskIds = [];
        $this->task = null;
        $this->db = null;
    }
} 