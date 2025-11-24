<?php

/**
 * Debug script to check request routing
 * Access: http://localhost:8000/debug-route.php
 */

echo "<h1>Request Debug Information</h1>";
echo "<pre>";
echo "Request Method: " . $_SERVER['REQUEST_METHOD'] . "\n";
echo "Request URI: " . $_SERVER['REQUEST_URI'] . "\n";
echo "Script Name: " . $_SERVER['SCRIPT_NAME'] . "\n";
echo "Query String: " . ($_SERVER['QUERY_STRING'] ?? 'none') . "\n";

// Parse URI like the main router does
$uri = str_replace('/backend', '', $_SERVER['REQUEST_URI']);
$uri = explode('?', $uri)[0];
$uri_parts = array_filter(explode('/', trim($uri, '/')));

echo "Parsed URI (after /backend removal): " . $uri . "\n";
echo "URI Parts: ";
print_r($uri_parts);

// Check database connection
echo "\n\nDatabase Connection Test:\n";
require_once 'config/database.php';
try {
    $db = Database::getInstance();
    $pdo = $db->getConnection();

    // Check if sample user exists
    $user = $pdo->query("SELECT * FROM users WHERE email = 'eleanor@example.com'")->fetch();
    if ($user) {
        echo "✅ Sample user 'eleanor@example.com' exists with ID: {$user['id']}\n";

        // Check addresses
        $addresses = $pdo->query("SELECT COUNT(*) as count FROM user_addresses WHERE user_id = {$user['id']}")->fetch();
        echo "✅ User has {$addresses['count']} addresses\n";

        // Check products
        $products = $pdo->query("SELECT COUNT(*) as count FROM products")->fetch();
        echo "✅ Database has {$products['count']} products\n";

        // Check orders
        $orders = $pdo->query("SELECT COUNT(*) as count FROM orders WHERE user_id = {$user['id']}")->fetch();
        echo "✅ User has {$orders['count']} orders\n";
    } else {
        echo "❌ Sample user not found. Run: mysql -u root -p ecommerce_db < database/sample_data.sql\n";
    }
} catch (Exception $e) {
    echo "❌ Database error: " . $e->getMessage() . "\n";
    echo "Check .env file and database credentials\n";
}

echo "</pre>";

echo "<hr>";
echo "<h2>Try these endpoints to debug:</h2>";
echo "<ul>";
echo "<li><a href='/products'>GET /products</a> (should work without auth)</li>";
echo "<li><a href='/categories'>GET /categories</a> (should work without auth)</li>";
echo "<li><a href='/auth/login'>POST /auth/login</a> (use Postman)</li>";
echo "</ul>";
