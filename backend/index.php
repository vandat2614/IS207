<?php

/**
 * E-commerce API Entry Point
 */

// Force CORS headers at the very beginning
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
header('Access-Control-Max-Age: 86400');

// Handle preflight OPTIONS requests immediately
if ($_SERVER['REQUEST_METHOD'] == 'OPTIONS') {
    exit(0);
}

// Load environment variables
if (file_exists(__DIR__ . '/.env')) {
    $env = parse_ini_file(__DIR__ . '/.env');
    foreach ($env as $key => $value) {
        putenv("$key=$value");
        $_ENV[$key] = $value;
    }
}

// Include dependencies
require_once __DIR__ . '/config/database.php';
require_once __DIR__ . '/utils/jwt.php';
require_once __DIR__ . '/controllers/AuthController.php';
require_once __DIR__ . '/controllers/UserController.php';
require_once __DIR__ . '/controllers/ProductController.php';
require_once __DIR__ . '/controllers/OrderController.php';

// Set Content-Type header
header('Content-Type: application/json');

// Get request method and URI
$method = $_SERVER['REQUEST_METHOD'];
$uri = str_replace('/backend', '', $_SERVER['REQUEST_URI']);
$uri = explode('?', $uri)[0]; // Remove query parameters
$uri_parts = array_filter(explode('/', trim($uri, '/')));

// Route handling
try {
    switch ($method) {
        case 'GET':
            handleGet($uri_parts);
            break;
        case 'POST':
            handlePost($uri_parts);
            break;
        case 'PUT':
            handlePut($uri_parts);
            break;
        case 'PATCH':
            handlePut($uri_parts); // PATCH is handled the same as PUT
            break;
        case 'DELETE':
            handleDelete($uri_parts);
            break;
        case 'OPTIONS':
            exit(0); // Handle preflight requests
        default:
            JWTHandler::sendError('Method not allowed', 405);
    }
} catch (Exception $e) {
    JWTHandler::sendError('Server error: ' . $e->getMessage(), 500);
}

function handleGet($parts)
{
    switch ($parts[0] ?? '') {
        case 'products':
            if (isset($parts[1])) {
                ProductController::getProduct($parts[1]);
            } else {
                ProductController::getProducts();
            }
            break;

        case 'categories':
            ProductController::getCategories();
            break;

        case 'orders':
            if (isset($parts[1])) {
                if (isset($parts[2]) && $parts[2] === 'status') {
                    OrderController::updateOrderStatus($parts[1]);
                } else {
                    OrderController::getOrder($parts[1]);
                }
            } else {
                OrderController::getUserOrders();
            }
            break;

        case 'cart':
            if (isset($parts[1])) {
                if ($parts[1] === 'add') {
                    OrderController::addToCart();
                } elseif (is_numeric($parts[1])) {
                    $method = $_SERVER['REQUEST_METHOD'];
                    if ($method === 'GET') {
                        // Handle GET /cart/{id} if needed
                        JWTHandler::sendError('Endpoint not found', 404);
                    } elseif ($method === 'PUT') {
                        OrderController::updateCartItem($parts[1]);
                    } elseif ($method === 'DELETE') {
                        OrderController::removeFromCart($parts[1]);
                    } else {
                        JWTHandler::sendError('Method not allowed', 405);
                    }
                } elseif ($parts[1] === 'clear') {
                    OrderController::clearCart();
                } else {
                    JWTHandler::sendError('Endpoint not found', 404);
                }
            } else {
                OrderController::getCart();
            }
            break;

        case 'admin':
            if (isset($parts[1])) {
                // Require admin role for all admin endpoints
                JWTHandler::requireAdmin();
                switch ($parts[1]) {
                    case 'orders':
                        OrderController::getAllOrders();
                        break;
                    case 'products':
                        ProductController::getProducts();
                        break;
                    case 'users':
                        UserController::getAllUsers();
                        break;
                    default:
                        JWTHandler::sendError('Endpoint not found', 404);
                }
            } else {
                JWTHandler::sendError('Endpoint not found', 404);
            }
            break;

        case 'profile':
            if (isset($parts[1])) {
                // Handle profile sub-routes that aren't GET requests
                if ($parts[1] === 'avatar' && isset($parts[2])) {
                    if ($parts[2] === 'upload') {
                        // This should be handled in POST
                        JWTHandler::sendError('Endpoint not found', 404);
                    } elseif ($parts[2] === 'delete') {
                        // This should be handled in POST
                        JWTHandler::sendError('Endpoint not found', 404);
                    } else {
                        JWTHandler::sendError('Endpoint not found', 404);
                    }
                } else {
                    JWTHandler::sendError('Endpoint not found', 404);
                }
            } else {
                UserController::getProfile();
            }
            break;

        default:
            JWTHandler::sendError('Endpoint not found', 404);
    }
}

function handlePost($parts)
{
    switch ($parts[0] ?? '') {
        case 'auth':
            if (isset($parts[1])) {
                switch ($parts[1]) {
                    case 'login':
                        AuthController::login();
                        break;
                    case 'register':
                        AuthController::register();
                        break;
                    default:
                        JWTHandler::sendError('Endpoint not found', 404);
                }
            } else {
                JWTHandler::sendError('Endpoint not found', 404);
            }
            break;

        case 'orders':
            OrderController::createOrder();
            break;

        case 'products':
            ProductController::createProduct();
            break;

        case 'cart':
            if (isset($parts[1])) {
                if ($parts[1] === 'add') {
                    OrderController::addToCart();
                } else {
                    JWTHandler::sendError('Endpoint not found', 404);
                }
            } else {
                JWTHandler::sendError('Endpoint not found', 404);
            }
            break;

        case 'profile':
            if (isset($parts[1])) {
                if ($parts[1] === 'addresses') {
                    UserController::addAddress();
                } elseif ($parts[1] === 'avatar' && isset($parts[2])) {
                    if ($parts[2] === 'upload') {
                        UserController::uploadAvatar();
                    } elseif ($parts[2] === 'delete') {
                        UserController::deleteAvatar();
                    } else {
                        JWTHandler::sendError('Endpoint not found', 404);
                    }
                } else {
                    JWTHandler::sendError('Endpoint not found', 404);
                }
            } else {
                JWTHandler::sendError('Endpoint not found', 404);
            }
            break;

        default:
            JWTHandler::sendError('Endpoint not found', 404);
    }
}

function handlePut($parts)
{
    switch ($parts[0] ?? '') {
        case 'profile':
            if (!isset($parts[1])) {
                // PUT /profile - update user profile
                UserController::updateProfile();
            } elseif ($parts[1] === 'addresses' && isset($parts[2])) {
                UserController::updateAddress($parts[2]);
            } else {
                JWTHandler::sendError('Endpoint not found', 404);
            }
            break;

        case 'products':
            if (isset($parts[1])) {
                ProductController::updateProduct($parts[1]);
            } else {
                JWTHandler::sendError('Endpoint not found', 404);
            }
            break;

        case 'cart':
            if (isset($parts[1]) && is_numeric($parts[1])) {
                OrderController::updateCartItem($parts[1]);
            } else {
                JWTHandler::sendError('Endpoint not found', 404);
            }
            break;

        case 'orders':
            if (isset($parts[1]) && isset($parts[2]) && $parts[2] === 'status') {
                OrderController::updateOrderStatus($parts[1]);
            } else {
                JWTHandler::sendError('Endpoint not found', 404);
            }
            break;

        case 'admin':
            if (isset($parts[1]) && isset($parts[2])) {
                JWTHandler::requireAdmin();
                switch ($parts[1]) {
                    case 'users':
                        if ($parts[2] === 'role' && isset($parts[3])) {
                            UserController::updateUserRole($parts[3]);
                        } else {
                            JWTHandler::sendError('Endpoint not found', 404);
                        }
                        break;
                    default:
                        JWTHandler::sendError('Endpoint not found', 404);
                }
            } else {
                JWTHandler::sendError('Endpoint not found', 404);
            }
            break;

        default:
            JWTHandler::sendError('Endpoint not found', 404);
    }
}

function handleDelete($parts)
{
    switch ($parts[0] ?? '') {
        case 'profile':
            if (isset($parts[1]) && $parts[1] === 'addresses' && isset($parts[2])) {
                UserController::deleteAddress($parts[2]);
            } else {
                JWTHandler::sendError('Endpoint not found', 404);
            }
            break;

        case 'products':
            if (isset($parts[1])) {
                ProductController::deleteProduct($parts[1]);
            } else {
                JWTHandler::sendError('Endpoint not found', 404);
            }
            break;

        case 'cart':
            if (isset($parts[1]) && is_numeric($parts[1])) {
                OrderController::removeFromCart($parts[1]);
            } else {
                JWTHandler::sendError('Endpoint not found', 404);
            }
            break;

        case 'orders':
            if (isset($parts[1])) {
                OrderController::cancelOrder($parts[1]);
            } else {
                JWTHandler::sendError('Endpoint not found', 404);
            }
            break;

        case 'admin':
            if (isset($parts[1]) && isset($parts[2])) {
                JWTHandler::requireAdmin();
                switch ($parts[1]) {
                    case 'users':
                        UserController::deleteUser($parts[2]);
                        break;
                    default:
                        JWTHandler::sendError('Endpoint not found', 404);
                }
            } else {
                JWTHandler::sendError('Endpoint not found', 404);
            }
            break;

        default:
            JWTHandler::sendError('Endpoint not found', 404);
    }
}
