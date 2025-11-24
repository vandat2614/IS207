<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/jwt.php';

class UserController
{
    public static function getProfile()
    {
        $user = JWTHandler::requireAuth();

        try {
            $db = Database::getInstance();

            // Get user info
            $userInfo = $db->fetchOne(
                "SELECT id, first_name, last_name, email, phone, avatar, role, created_at FROM users WHERE id = ?",
                [$user['user_id']]
            );

            if (!$userInfo) {
                JWTHandler::sendError('User not found', 404);
            }

            // Get user addresses
            $addresses = $db->fetchAll(
                "SELECT * FROM user_addresses WHERE user_id = ? ORDER BY is_default DESC, created_at DESC",
                [$user['user_id']]
            );

            JWTHandler::sendSuccess([
                'user' => $userInfo,
                'addresses' => $addresses
            ]);
        } catch (Exception $e) {
            JWTHandler::sendError('Failed to get profile: ' . $e->getMessage(), 500);
        }
    }

    public static function updateProfile()
    {
        $user = JWTHandler::requireAuth();
        $data = json_decode(file_get_contents('php://input'), true);

        if (!isset($data['first_name']) || !isset($data['last_name']) || !isset($data['email'])) {
            JWTHandler::sendError('First name, last name, and email are required', 400);
        }

        $firstName = trim($data['first_name']);
        $lastName = trim($data['last_name']);
        $email = trim($data['email']);
        $phone = isset($data['phone']) ? trim($data['phone']) : null;

        // Validation
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            JWTHandler::sendError('Invalid email format', 400);
        }

        try {
            $db = Database::getInstance();
            $pdo = $db->getConnection();

            // Check if email is taken by another user
            $existing = $db->fetchOne(
                "SELECT id FROM users WHERE email = ? AND id != ?",
                [$email, $user['user_id']]
            );

            if ($existing) {
                JWTHandler::sendError('Email already in use', 400);
            }

            // Update user
            $updated = $db->update(
                'users',
                [
                    'first_name' => $firstName,
                    'last_name' => $lastName,
                    'email' => $email,
                    'phone' => $phone
                ],
                ['id' => $user['user_id']]
            );

            if ($updated === 0) {
                JWTHandler::sendError('No changes made', 400);
            }

            JWTHandler::sendSuccess([
                'user' => [
                    'id' => $user['user_id'],
                    'first_name' => $firstName,
                    'last_name' => $lastName,
                    'email' => $email,
                    'phone' => $phone
                ]
            ], 'Profile updated successfully');
        } catch (Exception $e) {
            JWTHandler::sendError('Profile update failed: ' . $e->getMessage(), 500);
        }
    }

    public static function addAddress()
    {
        $user = JWTHandler::requireAuth();
        $data = json_decode(file_get_contents('php://input'), true);

        $required = ['address_type', 'street_address', 'city', 'postal_code', 'country'];
        foreach ($required as $field) {
            if (!isset($data[$field]) || empty(trim($data[$field]))) {
                JWTHandler::sendError("{$field} is required", 400);
            }
        }

        $addressData = [
            'user_id' => $user['user_id'],
            'address_type' => trim($data['address_type']),
            'first_name' => isset($data['first_name']) ? trim($data['first_name']) : null,
            'last_name' => isset($data['last_name']) ? trim($data['last_name']) : null,
            'street_address' => trim($data['street_address']),
            'apartment' => isset($data['apartment']) ? trim($data['apartment']) : null,
            'city' => trim($data['city']),
            'state_province' => isset($data['state_province']) ? trim($data['state_province']) : null,
            'postal_code' => trim($data['postal_code']),
            'country' => trim($data['country']),
            'is_default' => isset($data['is_default']) ? (bool)$data['is_default'] : false
        ];

        try {
            $db = Database::getInstance();

            // If setting as default, remove default from other addresses
            if ($addressData['is_default']) {
                $db->update(
                    'user_addresses',
                    ['is_default' => false],
                    ['user_id' => $user['user_id']]
                );
            }

            $addressId = $db->insert('user_addresses', $addressData);

            JWTHandler::sendSuccess([
                'address' => array_merge(['id' => $addressId], $addressData)
            ], 'Address added successfully');
        } catch (Exception $e) {
            JWTHandler::sendError('Failed to add address: ' . $e->getMessage(), 500);
        }
    }

    public static function updateAddress($addressId)
    {
        $user = JWTHandler::requireAuth();
        $data = json_decode(file_get_contents('php://input'), true);

        try {
            $db = Database::getInstance();

            // Check if address belongs to user
            $existing = $db->fetchOne(
                "SELECT id FROM user_addresses WHERE id = ? AND user_id = ?",
                [$addressId, $user['user_id']]
            );

            if (!$existing) {
                JWTHandler::sendError('Address not found', 404);
            }

            $updateData = [];
            $allowedFields = ['address_type', 'first_name', 'last_name', 'street_address', 'apartment', 'city', 'state_province', 'postal_code', 'country', 'is_default'];

            foreach ($allowedFields as $field) {
                if (isset($data[$field])) {
                    $updateData[$field] = trim($data[$field]);
                }
            }

            if (empty($updateData)) {
                JWTHandler::sendError('No valid fields to update', 400);
            }

            // If setting as default, remove default from other addresses
            if (isset($updateData['is_default']) && $updateData['is_default']) {
                $db->update(
                    'user_addresses',
                    ['is_default' => false],
                    ['user_id' => $user['user_id']]
                );
            }

            $updated = $db->update('user_addresses', $updateData, ['id' => $addressId]);

            JWTHandler::sendSuccess(null, 'Address updated successfully');
        } catch (Exception $e) {
            JWTHandler::sendError('Failed to update address: ' . $e->getMessage(), 500);
        }
    }

    public static function deleteAddress($addressId)
    {
        $user = JWTHandler::requireAuth();

        try {
            $db = Database::getInstance();

            // Check if address belongs to user
            $existing = $db->fetchOne(
                "SELECT id FROM user_addresses WHERE id = ? AND user_id = ?",
                [$addressId, $user['user_id']]
            );

            if (!$existing) {
                JWTHandler::sendError('Address not found', 404);
            }

            $deleted = $db->delete('user_addresses', ['id' => $addressId]);

            JWTHandler::sendSuccess(null, 'Address deleted successfully');
        } catch (Exception $e) {
            JWTHandler::sendError('Failed to delete address: ' . $e->getMessage(), 500);
        }
    }

    public static function uploadAvatar()
    {
        $user = JWTHandler::requireAuth();

        // Ensure uploads directory exists
        $uploadsDir = __DIR__ . '/../../public/uploads/avatars/';
        if (!file_exists($uploadsDir)) {
            mkdir($uploadsDir, 0755, true);
        }

        // Check if file was uploaded
        if (!isset($_FILES['avatar']) || $_FILES['avatar']['error'] !== UPLOAD_ERR_OK) {
            JWTHandler::sendError('No avatar file uploaded', 400);
        }

        $file = $_FILES['avatar'];
        $allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
        $maxSize = 2 * 1024 * 1024; // 2MB

        // Validate file type
        if (!in_array($file['type'], $allowedTypes)) {
            JWTHandler::sendError('Invalid file type. Only JPEG, PNG, and GIF are allowed', 400);
        }

        // Validate file size
        if ($file['size'] > $maxSize) {
            JWTHandler::sendError('File size too large. Maximum 2MB allowed', 400);
        }

        // Generate unique filename
        $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
        $filename = 'avatar_' . $user['user_id'] . '_' . time() . '.' . $extension;
        $filepath = $uploadsDir . $filename;

        // Move uploaded file
        if (!move_uploaded_file($file['tmp_name'], $filepath)) {
            JWTHandler::sendError('Failed to save avatar file', 500);
        }

        try {
            $db = Database::getInstance();

            // Get current avatar to delete old file
            $currentUser = $db->fetchOne(
                "SELECT avatar FROM users WHERE id = ?",
                [$user['user_id']]
            );

            if ($currentUser && $currentUser['avatar']) {
                $oldFilePath = __DIR__ . '/../../public/' . $currentUser['avatar'];
                if (file_exists($oldFilePath)) {
                    unlink($oldFilePath);
                }
            }

            // Update user's avatar path in database
            $avatarUrl = 'uploads/avatars/' . $filename;
            $db->update('users', ['avatar' => $avatarUrl], ['id' => $user['user_id']]);

            JWTHandler::sendSuccess([
                'avatar' => $avatarUrl
            ], 'Avatar uploaded successfully');
        } catch (Exception $e) {
            // Clean up uploaded file if database update fails
            if (file_exists($filepath)) {
                unlink($filepath);
            }
            JWTHandler::sendError('Failed to update avatar: ' . $e->getMessage(), 500);
        }
    }

    public static function deleteAvatar()
    {
        $user = JWTHandler::requireAuth();

        try {
            $db = Database::getInstance();

            // Get current avatar
            $currentUser = $db->fetchOne(
                "SELECT avatar FROM users WHERE id = ?",
                [$user['user_id']]
            );

            if (!$currentUser || !$currentUser['avatar']) {
                JWTHandler::sendError('No avatar to delete', 400);
            }

            // Delete file from disk
            $filePath = __DIR__ . '/../../public/' . $currentUser['avatar'];
            if (file_exists($filePath)) {
                unlink($filePath);
            }

            // Remove avatar from database
            $db->update('users', ['avatar' => null], ['id' => $user['user_id']]);

            JWTHandler::sendSuccess(null, 'Avatar deleted successfully');
        } catch (Exception $e) {
            JWTHandler::sendError('Failed to delete avatar: ' . $e->getMessage(), 500);
        }
    }

    // Admin functions for user management
    public static function getAllUsers()
    {
        JWTHandler::requireAdmin(); // Only admins can access this

        try {
            $db = Database::getInstance();

            $users = $db->fetchAll(
                "SELECT id, first_name, last_name, email, phone, avatar, role, created_at FROM users ORDER BY created_at DESC"
            );

            JWTHandler::sendSuccess(['users' => $users]);
        } catch (Exception $e) {
            JWTHandler::sendError('Failed to get users: ' . $e->getMessage(), 500);
        }
    }

    public static function updateUserRole($userId)
    {
        JWTHandler::requireAdmin(); // Only admins can access this

        $data = json_decode(file_get_contents('php://input'), true);

        if (!isset($data['role']) || !in_array($data['role'], ['admin', 'user'])) {
            JWTHandler::sendError('Valid role (admin or user) is required', 400);
        }

        $role = $data['role'];

        try {
            $db = Database::getInstance();

            // Check if user exists
            $userExists = $db->fetchOne(
                "SELECT id FROM users WHERE id = ?",
                [$userId]
            );

            if (!$userExists) {
                JWTHandler::sendError('User not found', 404);
            }

            // Update user role
            $updated = $db->update(
                'users',
                ['role' => $role],
                ['id' => $userId]
            );

            if ($updated === 0) {
                JWTHandler::sendError('No changes made', 400);
            }

            JWTHandler::sendSuccess(['role' => $role], 'User role updated successfully');
        } catch (Exception $e) {
            JWTHandler::sendError('Failed to update user role: ' . $e->getMessage(), 500);
        }
    }

    public static function deleteUser($userId)
    {
        JWTHandler::requireAdmin(); // Only admins can access this

        try {
            $db = Database::getInstance();

            // Check if user exists
            $userExists = $db->fetchOne(
                "SELECT id FROM users WHERE id = ?",
                [$userId]
            );

            if (!$userExists) {
                JWTHandler::sendError('User not found', 404);
            }

            // Delete user
            $deleted = $db->delete('users', ['id' => $userId]);

            if ($deleted === 0) {
                JWTHandler::sendError('User could not be deleted', 500);
            }

            JWTHandler::sendSuccess(null, 'User deleted successfully');
        } catch (Exception $e) {
            JWTHandler::sendError('Failed to delete user: ' . $e->getMessage(), 500);
        }
    }
}
