<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/jwt.php';

class AuthController
{
    public static function login()
    {
        $data = json_decode(file_get_contents('php://input'), true);

        if (!isset($data['email']) || !isset($data['password'])) {
            JWTHandler::sendError('Email and password are required', 400);
        }

        $email = trim($data['email']);
        $password = $data['password'];

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            JWTHandler::sendError('Invalid email format', 400);
        }

        try {
            $db = Database::getInstance();

            $user = $db->fetchOne(
                "SELECT id, email, password_hash, first_name, last_name, role, avatar FROM users WHERE email = ?",
                [$email]
            );

            if (!$user || !password_verify($password, $user['password_hash'])) {
                JWTHandler::sendError('Invalid email or password', 401);
            }

            $token = JWTHandler::generateToken(
                $user['id'],
                $user['email'],
                $user['role']  // Pass role to token
            );

            JWTHandler::sendSuccess([
                'token' => $token,
                'user' => [
                    'first_name' => $user['first_name'],
                    'last_name' => $user['last_name'],
                    'email' => $user['email'],
                    'role' => $user['role'],
                    'avatar' => $user['avatar']
                ]
            ]);
        } catch (Exception $e) {
            JWTHandler::sendError('Login failed: ' . $e->getMessage(), 500);
        }
    }

    public static function register()
    {
        $data = json_decode(file_get_contents('php://input'), true);

        $required = ['email', 'password', 'firstName', 'lastName'];
        foreach ($required as $field) {
            if (!isset($data[$field]) || empty(trim($data[$field]))) {
                JWTHandler::sendError("{$field} is required", 400);
            }
        }

        $email = trim($data['email']);
        $password = $data['password'];
        $firstName = trim($data['firstName']);
        $lastName = trim($data['lastName']);

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            JWTHandler::sendError('Invalid email format', 400);
        }

        if (strlen($password) < 8) {
            JWTHandler::sendError('Password must be at least 8 characters', 400);
        }

        try {
            $db = Database::getInstance();

            // Check if email already exists
            $existing = $db->fetchOne("SELECT id FROM users WHERE email = ?", [$email]);
            if ($existing) {
                JWTHandler::sendError('Email already registered', 400);
            }

            $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

            $userId = $db->insert('users', [
                'first_name' => $firstName,
                'last_name' => $lastName,
                'email' => $email,
                'password_hash' => $hashedPassword,
                'role' => 'user'  // Default role for new users
            ]);

            $token = JWTHandler::generateToken($userId, $email, 'user');

            JWTHandler::sendSuccess([
                'token' => $token,
                'user' => [
                    'id' => $userId,
                    'first_name' => $firstName,
                    'last_name' => $lastName,
                    'email' => $email,
                    'role' => 'user'
                ]
            ], 'Registration successful');
        } catch (Exception $e) {
            JWTHandler::sendError('Registration failed: ' . $e->getMessage(), 500);
        }
    }
}
