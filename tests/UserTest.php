<?php

use PHPUnit\Framework\TestCase;
require_once dirname(__DIR__, 1) . '/src/models/User.php';

class UserTest extends TestCase
{
    private $user;
    private $db;
    private $testUserIds = [];
    private $testTaskIds = [];

    protected function setUp(): void
    {
        // Get database connection
        $this->db = Database::getInstance()->getConnection();
        $this->user = new User();
        
        // Set up test database - make sure we're working in a clean state
        $this->cleanupTestData();
    }

    /**
     * Clean up any test data that might be left from previous test runs
     */
    private function cleanupTestData(): void
    {
        // Delete any test users from previous test runs
        $this->db->exec("DELETE FROM users WHERE username LIKE 'testuser%' OR email LIKE 'test%@example.com'");
        $this->db->exec("DELETE FROM user_password_resets WHERE email LIKE 'test%@example.com'");
    }

    /**
     * Create a test task for assignment tests
     */
    private function createTestTask(): int
    {
        $stmt = $this->db->prepare("
            INSERT INTO tasks (title, description) 
            VALUES ('Test Task', 'Task for user testing')
        ");
        $stmt->execute();
        $taskId = (int)$this->db->lastInsertId();
        $this->testTaskIds[] = $taskId;
        
        return $taskId;
    }

    public function testCreateUser()
    {
        echo "\nTesting user creation...\n";
        
        $username = 'testuser' . uniqid();
        $email = 'test' . uniqid() . '@example.com';
        $password = 'testpassword123';
        
        $userId = $this->user->create($username, $email, $password);
        $this->assertIsInt($userId);
        $this->assertGreaterThan(0, $userId);
        $this->testUserIds[] = $userId;
        
        echo "✓ User created with ID: {$userId}\n";
        
        // Verify the user was created
        $createdUser = $this->user->findById($userId);
        $this->assertIsArray($createdUser);
        $this->assertEquals($username, $createdUser['username']);
        $this->assertEquals($email, $createdUser['email']);
        
        echo "✓ Created user data verified\n";
        
        return [$userId, $username, $email, $password];
    }

    /**
     * @depends testCreateUser
     */
    public function testCreateDuplicateUsername(array $userData)
    {
        echo "\nTesting duplicate username validation...\n";
        
        [$userId, $username, $email, $password] = $userData;
        
        // Try to create a user with the same username but different email
        $newEmail = 'test' . uniqid() . '@example.com';
        $result = $this->user->create($username, $newEmail, 'differentpassword');
        $this->assertFalse($result);
        
        echo "✓ Creating user with duplicate username failed as expected\n";
        
        return $userData;
    }

    /**
     * @depends testCreateUser
     */
    public function testCreateDuplicateEmail(array $userData)
    {
        echo "\nTesting duplicate email validation...\n";
        
        [$userId, $username, $email, $password] = $userData;
        
        // Try to create a user with the same email but different username
        $newUsername = 'testuser' . uniqid();
        $result = $this->user->create($newUsername, $email, 'differentpassword');
        $this->assertFalse($result);
        
        echo "✓ Creating user with duplicate email failed as expected\n";
        
        return $userData;
    }

    /**
     * @depends testCreateUser
     */
    public function testFindById(array $userData)
    {
        echo "\nTesting finding user by ID...\n";
        
        [$userId, $username, $email, $password] = $userData;
        
        $user = $this->user->findById($userId);
        $this->assertIsArray($user);
        $this->assertEquals($userId, $user['id']);
        $this->assertEquals($username, $user['username']);
        $this->assertEquals($email, $user['email']);
        $this->assertArrayNotHasKey('password', $user); // Password should not be returned
        
        echo "✓ User found by ID: {$userId}\n";
        
        // Test finding non-existent user
        $nonExistentUserId = 9999999;
        $nonExistentUser = $this->user->findById($nonExistentUserId);
        $this->assertFalse($nonExistentUser);
        
        echo "✓ Non-existent user returns false\n";
        
        return $userData;
    }

    /**
     * @depends testCreateUser
     */
    public function testFindByUsername(array $userData)
    {
        echo "\nTesting finding user by username...\n";
        
        [$userId, $username, $email, $password] = $userData;
        
        $user = $this->user->findByUsername($username);
        $this->assertIsArray($user);
        $this->assertEquals($userId, $user['id']);
        $this->assertEquals($username, $user['username']);
        $this->assertEquals($email, $user['email']);
        $this->assertArrayHasKey('password', $user); // Password hash is returned for verification
        
        echo "✓ User found by username: {$username}\n";
        
        // Test finding non-existent user
        $nonExistentUser = $this->user->findByUsername('nonexistent');
        $this->assertFalse($nonExistentUser);
        
        echo "✓ Non-existent username returns false\n";
        
        return $userData;
    }

    /**
     * @depends testCreateUser
     */
    public function testFindByEmail(array $userData)
    {
        echo "\nTesting finding user by email...\n";
        
        [$userId, $username, $email, $password] = $userData;
        
        $user = $this->user->findByEmail($email);
        $this->assertIsArray($user);
        $this->assertEquals($userId, $user['id']);
        $this->assertEquals($username, $user['username']);
        $this->assertEquals($email, $user['email']);
        $this->assertArrayHasKey('password', $user); // Password hash is returned for verification
        
        echo "✓ User found by email: {$email}\n";
        
        // Test finding non-existent user
        $nonExistentUser = $this->user->findByEmail('nonexistent@example.com');
        $this->assertFalse($nonExistentUser);
        
        echo "✓ Non-existent email returns false\n";
        
        return $userData;
    }

    /**
     * @depends testCreateUser
     */
    public function testVerifyPassword(array $userData)
    {
        echo "\nTesting password verification...\n";
        
        [$userId, $username, $email, $password] = $userData;
        
        // Test verifying with username
        $verifiedUserByUsername = $this->user->verifyPassword($username, $password);
        $this->assertIsArray($verifiedUserByUsername);
        $this->assertEquals($userId, $verifiedUserByUsername['id']);
        $this->assertArrayNotHasKey('password', $verifiedUserByUsername); // Password should not be returned
        
        echo "✓ Password verified successfully using username\n";
        
        // Test verifying with email
        $verifiedUserByEmail = $this->user->verifyPassword($email, $password);
        $this->assertIsArray($verifiedUserByEmail);
        $this->assertEquals($userId, $verifiedUserByEmail['id']);
        
        echo "✓ Password verified successfully using email\n";
        
        // Test with wrong password
        $invalidVerification = $this->user->verifyPassword($username, 'wrongpassword');
        $this->assertFalse($invalidVerification);
        
        echo "✓ Verification with wrong password failed as expected\n";
        
        return $userData;
    }

    /**
     * @depends testCreateUser
     */
    public function testUpdateUser(array $userData)
    {
        echo "\nTesting user update...\n";
        
        [$userId, $username, $email, $password] = $userData;
        
        $newEmail = 'updated' . uniqid() . '@example.com';
        $updateData = [
            'email' => $newEmail
        ];
        
        $updateResult = $this->user->update($userId, $updateData);
        $this->assertTrue($updateResult);
        
        echo "✓ User updated successfully\n";
        
        // Verify the update was successful
        $updatedUser = $this->user->findById($userId);
        $this->assertEquals($newEmail, $updatedUser['email']);
        
        echo "✓ Updated user data verified\n";
        
        // Update username
        $newUsername = 'updated' . uniqid();
        $updateData = [
            'username' => $newUsername
        ];
        
        $updateResult = $this->user->update($userId, $updateData);
        $this->assertTrue($updateResult);
        
        // Verify the update was successful
        $updatedUser = $this->user->findById($userId);
        $this->assertEquals($newUsername, $updatedUser['username']);
        
        echo "✓ Username updated successfully\n";
        
        return [$userId, $newUsername, $newEmail, $password];
    }

    /**
     * @depends testUpdateUser
     */
    public function testUpdatePassword(array $userData)
    {
        echo "\nTesting password update...\n";
        
        [$userId, $username, $email, $password] = $userData;
        
        $newPassword = 'newPassword123';
        $updateResult = $this->user->updatePassword($userId, $newPassword);
        $this->assertTrue($updateResult);
        
        echo "✓ Password updated successfully\n";
        
        // Verify the password update was successful by trying to login
        $verifiedUser = $this->user->verifyPassword($username, $newPassword);
        $this->assertIsArray($verifiedUser);
        $this->assertEquals($userId, $verifiedUser['id']);
        
        echo "✓ Updated password verified\n";
        
        // Old password should not work
        $invalidVerification = $this->user->verifyPassword($username, $password);
        $this->assertFalse($invalidVerification);
        
        echo "✓ Old password no longer works\n";
        
        return [$userId, $username, $email, $newPassword];
    }

    /**
     * @depends testCreateUser
     */
    public function testTaskAssignment(array $userData)
    {
        echo "\nTesting task assignment...\n";
        
        [$userId, $username, $email, $password] = $userData;
        
        // Create a test task
        $taskId = $this->createTestTask();
        $this->assertIsInt($taskId);
        
        echo "✓ Test task created with ID: {$taskId}\n";
        
        // Assign task to user
        $assignResult = $this->user->assignTask($userId, $taskId);
        $this->assertTrue($assignResult);
        
        echo "✓ Task assigned to user successfully\n";
        
        // Get tasks assigned to user
        $assignedTaskIds = $this->user->getAssignedTaskIds($userId);
        $this->assertIsArray($assignedTaskIds);
        $this->assertNotEmpty($assignedTaskIds);
        $this->assertContains($taskId, $assignedTaskIds);
        
        echo "✓ Retrieved assigned tasks successfully\n";
        
        // Unassign task from user
        $unassignResult = $this->user->unassignTask($userId, $taskId);
        $this->assertTrue($unassignResult);
        
        echo "✓ Task unassigned from user successfully\n";
        
        // Verify task was unassigned
        $assignedTaskIdsAfter = $this->user->getAssignedTaskIds($userId);
        $this->assertNotContains($taskId, $assignedTaskIdsAfter);
        
        echo "✓ Unassignment verified\n";
        
        return $userData;
    }

    /**
     * @depends testCreateUser
     */
    public function testPasswordResetFunctionality(array $userData)
    {
        echo "\nTesting password reset functionality...\n";
        
        [$userId, $username, $email, $password] = $userData;
        
        // Create password reset token
        $tokenData = $this->user->createPasswordResetToken($email);
        $this->assertIsArray($tokenData);
        $this->assertArrayHasKey('token', $tokenData);
        $this->assertEquals($userId, $tokenData['user_id']);
        $this->assertEquals($email, $tokenData['email']);
        
        $token = $tokenData['token'];
        echo "✓ Password reset token created: " . substr($token, 0, 10) . "...\n";
        
        // Verify token
        $verifiedToken = $this->user->verifyPasswordResetToken($token);
        $this->assertIsArray($verifiedToken);
        $this->assertEquals($userId, $verifiedToken['user_id']);
        $this->assertEquals($email, $verifiedToken['email']);
        
        echo "✓ Password reset token verified\n";
        
        // Reset password using token
        $newPassword = 'resetPassword123';
        $resetResult = $this->user->resetPasswordWithToken($token, $newPassword);
        $this->assertTrue($resetResult);
        
        echo "✓ Password reset using token successful\n";
        
        // Verify new password works
        $verifiedUser = $this->user->verifyPassword($username, $newPassword);
        $this->assertIsArray($verifiedUser);
        $this->assertEquals($userId, $verifiedUser['id']);
        
        echo "✓ New password works after reset\n";
        
        // Token should be deleted after use
        $invalidToken = $this->user->verifyPasswordResetToken($token);
        $this->assertFalse($invalidToken);
        
        echo "✓ Token deleted after use\n";
        
        return $userData;
    }

    /**
     * @depends testPasswordResetFunctionality
     */
    public function testCleanupExpiredTokens(array $userData)
    {
        echo "\nTesting cleanup of expired tokens...\n";
        
        // This is more of a functional test than a unit test
        // We'll just verify the method runs without errors
        $result = $this->user->cleanupExpiredResetTokens();
        $this->assertTrue($result);
        
        echo "✓ Expired tokens cleanup executed successfully\n";
        
        return $userData;
    }

    /**
     * @depends testCreateUser
     */
    public function testDeleteUser(array $userData)
    {
        echo "\nTesting user deletion...\n";
        
        [$userId, $username, $email, $password] = $userData;
        
        // Create a task and assign it to the user first to test CASCADE
        $taskId = $this->createTestTask();
        $this->user->assignTask($userId, $taskId);
        
        // Delete the user
        $deleteResult = $this->user->delete($userId);
        $this->assertTrue($deleteResult);
        
        echo "✓ User deleted successfully\n";
        
        // Verify the user was deleted
        $deletedUser = $this->user->findById($userId);
        $this->assertFalse($deletedUser);
        
        echo "✓ User deletion verified\n";
        
        // Remove deleted user from tracking array
        $index = array_search($userId, $this->testUserIds);
        if ($index !== false) {
            unset($this->testUserIds[$index]);
        }
    }

    protected function tearDown(): void
    {
        // Clean up any users created during testing
        foreach ($this->testUserIds as $id) {
            try {
                $this->user->delete($id);
            } catch (Exception $e) {
                // Ignore exceptions during cleanup
            }
        }
        
        // Clean up any tasks created during testing
        foreach ($this->testTaskIds as $id) {
            try {
                $this->db->exec("DELETE FROM tasks WHERE id = {$id}");
            } catch (Exception $e) {
                // Ignore exceptions during cleanup
            }
        }
        
        $this->testUserIds = [];
        $this->testTaskIds = [];
        $this->user = null;
        $this->db = null;
    }
} 