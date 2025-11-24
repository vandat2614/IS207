<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/jwt.php';

class OrderController
{
    private static function generateOrderNumber()
    {
        $today = date('ymd'); // YYMMDD format
        $prefix = "ORD-{$today}-";

        try {
            $db = Database::getInstance();

            // Find the highest order number for today
            $stmt = $db->query(
                "SELECT MAX(CAST(SUBSTRING_INDEX(order_number, '-', -1) AS UNSIGNED)) as max_num
                 FROM orders
                 WHERE order_number LIKE ?",
                [$prefix . '%']
            );

            $result = $stmt->fetch();
            $nextNum = ($result['max_num'] ?? 0) + 1;

            return $prefix . str_pad($nextNum, 4, '0', STR_PAD_LEFT);
        } catch (Exception $e) {
            // Fallback to timestamp-based number if query fails
            return $prefix . str_pad(mt_rand(1, 9999), 4, '0', STR_PAD_LEFT);
        }
    }

    public static function getUserOrders()
    {
        $user = JWTHandler::requireAuth();

        try {
            $db = Database::getInstance();

            $orders = $db->fetchAll(
                "SELECT
                    o.*,
                    sa.street_address as shipping_street,
                    sa.city as shipping_city,
                    sa.postal_code as shipping_postal_code,
                    sa.country as shipping_country
                 FROM orders o
                 LEFT JOIN user_addresses sa ON o.shipping_address_id = sa.id
                 WHERE o.user_id = ?
                 ORDER BY o.ordered_at DESC",
                [$user['user_id']]
            );

            // Get order items for each order
            foreach ($orders as &$order) {
                $order['items'] = $db->fetchAll(
                    "SELECT * FROM order_items WHERE order_id = ? ORDER BY product_name ASC",
                    [$order['id']]
                );
            }

            JWTHandler::sendSuccess(['orders' => $orders]);
        } catch (Exception $e) {
            JWTHandler::sendError('Failed to get orders: ' . $e->getMessage(), 500);
        }
    }

    public static function getOrder($id)
    {
        $user = JWTHandler::requireAuth();

        try {
            $db = Database::getInstance();

            $order = $db->fetchOne(
                "SELECT
                    o.*,
                    sa.street_address as shipping_street,
                    sa.city as shipping_city,
                    sa.postal_code as shipping_postal_code,
                    sa.country as shipping_country,
                    sa.first_name as shipping_first_name,
                    sa.last_name as shipping_last_name
                 FROM orders o
                 LEFT JOIN user_addresses sa ON o.shipping_address_id = sa.id
                 WHERE o.id = ? AND o.user_id = ?",
                [$id, $user['user_id']]
            );

            if (!$order) {
                JWTHandler::sendError('Order not found', 404);
            }

            $order['items'] = $db->fetchAll(
                "SELECT * FROM order_items WHERE order_id = ? ORDER BY product_name ASC",
                [$id]
            );

            JWTHandler::sendSuccess(['order' => $order]);
        } catch (Exception $e) {
            JWTHandler::sendError('Failed to get order: ' . $e->getMessage(), 500);
        }
    }

    public static function createOrder()
    {
        $user = JWTHandler::requireAuth();
        $data = json_decode(file_get_contents('php://input'), true);

        if (!isset($data['cart_items']) || !is_array($data['cart_items']) || empty($data['cart_items'])) {
            JWTHandler::sendError('Cart items are required', 400);
        }

        if (!isset($data['shipping_address_id'])) {
            JWTHandler::sendError('Shipping address is required', 400);
        }

        try {
            $db = Database::getInstance();
            $pdo = $db->getConnection();

            $pdo->beginTransaction();

            // Verify shipping address belongs to user
            $address = $db->fetchOne(
                "SELECT * FROM user_addresses WHERE id = ? AND user_id = ?",
                [$data['shipping_address_id'], $user['user_id']]
            );

            if (!$address) {
                JWTHandler::sendError('Invalid shipping address', 400);
            }

            // Calculate totals and verify stock
            $subtotal = 0;
            $validItems = [];

            foreach ($data['cart_items'] as $item) {
                if (!isset($item['id']) || !isset($item['quantity'])) {
                    JWTHandler::sendError('Invalid cart item format', 400);
                }

                $product = $db->fetchOne(
                    "SELECT * FROM products WHERE id = ? AND is_active = 1",
                    [$item['id']]
                );

                if (!$product) {
                    JWTHandler::sendError("Product {$item['id']} not found", 400);
                }

                if ($product['quantity'] < $item['quantity']) {
                    JWTHandler::sendError("Insufficient stock for {$product['name']}", 400);
                }

                $itemTotal = $product['price'] * $item['quantity'];
                $subtotal += $itemTotal;

                $validItems[] = [
                    'product' => $product,
                    'quantity' => $item['quantity'],
                    'total' => $itemTotal
                ];
            }

            $shipping = $subtotal > 100 ? 0 : 9.99;
            $tax = $subtotal * 0.08;
            $total = $subtotal + $shipping + $tax;

            // Generate unique order number
            $orderNumber = self::generateOrderNumber();

            // Create order
            $orderData = [
                'order_number' => $orderNumber,
                'user_id' => $user['user_id'],
                'status' => 'pending',
                'total_amount' => $total,
                'subtotal' => $subtotal,
                'shipping_amount' => $shipping,
                'tax_amount' => $tax,
                'payment_method' => isset($data['payment_method']) ? $data['payment_method'] : 'Credit Card',
                'payment_status' => 'pending',
                'shipping_address_id' => $data['shipping_address_id'],
                'billing_address_id' => isset($data['billing_address_id']) ? $data['billing_address_id'] : $data['shipping_address_id'],
                'notes' => isset($data['notes']) ? $data['notes'] : null
            ];

            $orderId = $db->insert('orders', $orderData);

            // Create order items
            foreach ($validItems as $item) {
                $db->insert('order_items', [
                    'order_id' => $orderId,
                    'product_id' => $item['product']['id'],
                    'product_name' => $item['product']['name'],
                    'product_price' => $item['product']['price'],
                    'quantity' => $item['quantity'],
                    'line_total' => $item['total']
                ]);

                // Update inventory
                $newQuantity = $item['product']['quantity'] - $item['quantity'];
                $db->update('products', ['quantity' => $newQuantity], ['id' => $item['product']['id']]);
            }

            // Clear user's cart
            $db->delete('shopping_cart', ['user_id' => $user['user_id']]);

            $pdo->commit();

            // Get complete order details
            $order = $db->fetchOne(
                "SELECT * FROM orders WHERE id = ?",
                [$orderId]
            );

            $order['items'] = $db->fetchAll(
                "SELECT * FROM order_items WHERE order_id = ?",
                [$orderId]
            );

            JWTHandler::sendSuccess([
                'order' => $order,
                'message' => 'Order placed successfully'
            ]);
        } catch (Exception $e) {
            if (isset($pdo) && $pdo->inTransaction()) {
                $pdo->rollback();
            }
            JWTHandler::sendError('Failed to create order: ' . $e->getMessage(), 500);
        }
    }

    public static function cancelOrder($id)
    {
        $user = JWTHandler::requireAuth();

        try {
            $db = Database::getInstance();

            // Check if order belongs to user and can be cancelled
            $order = $db->fetchOne(
                "SELECT * FROM orders WHERE id = ? AND user_id = ?",
                [$id, $user['user_id']]
            );

            if (!$order) {
                JWTHandler::sendError('Order not found', 404);
            }

            if (!in_array($order['status'], ['pending', 'processing'])) {
                JWTHandler::sendError('Order cannot be cancelled', 400);
            }

            // Update order status
            $db->update('orders', ['status' => 'cancelled'], ['id' => $id]);

            // Restore inventory
            $items = $db->fetchAll(
                "SELECT * FROM order_items WHERE order_id = ?",
                [$id]
            );

            foreach ($items as $item) {
                $db->query(
                    "UPDATE products SET quantity = quantity + ? WHERE id = ?",
                    [$item['quantity'], $item['product_id']]
                );
            }

            JWTHandler::sendSuccess(['message' => 'Order cancelled successfully']);
        } catch (Exception $e) {
            JWTHandler::sendError('Failed to cancel order: ' . $e->getMessage(), 500);
        }
    }

    // Admin functions
    public static function getAllOrders()
    {
        JWTHandler::requireAuth();

        $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 20;
        $status = isset($_GET['status']) ? trim($_GET['status']) : null;

        $offset = ($page - 1) * $limit;

        try {
            $db = Database::getInstance();

            $where = [];
            $params = [];

            if ($status) {
                $where[] = "o.status = ?";
                $params[] = $status;
            }

            $whereClause = $where ? 'WHERE ' . implode(' AND ', $where) : '';

            $orders = $db->fetchAll(
                "SELECT
                    o.*,
                    u.first_name, u.last_name, u.email,
                    sa.city as shipping_city, sa.country as shipping_country
                 FROM orders o
                 JOIN users u ON o.user_id = u.id
                 LEFT JOIN user_addresses sa ON o.shipping_address_id = sa.id
                 $whereClause
                 ORDER BY o.ordered_at DESC
                 LIMIT ? OFFSET ?",
                array_merge($params, [$limit, $offset])
            );

            $count = $db->fetchOne(
                "SELECT COUNT(*) as total FROM orders o $whereClause",
                $params
            );

            $totalPages = ceil($count['total'] / $limit);

            JWTHandler::sendSuccess([
                'orders' => $orders,
                'pagination' => [
                    'page' => $page,
                    'limit' => $limit,
                    'total' => $count['total'],
                    'total_pages' => $totalPages
                ]
            ]);
        } catch (Exception $e) {
            JWTHandler::sendError('Failed to get orders: ' . $e->getMessage(), 500);
        }
    }

    public static function updateOrderStatus($id)
    {
        JWTHandler::requireAuth();
        $data = json_decode(file_get_contents('php://input'), true);

        if (!isset($data['status'])) {
            JWTHandler::sendError('Status is required', 400);
        }

        $validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
        if (!in_array($data['status'], $validStatuses)) {
            JWTHandler::sendError('Invalid status', 400);
        }

        try {
            $db = Database::getInstance();

            $updated = $db->update('orders', ['status' => $data['status']], ['id' => $id]);

            if ($updated === 0) {
                JWTHandler::sendError('Order not found', 404);
            }

            JWTHandler::sendSuccess(['message' => 'Order status updated successfully']);
        } catch (Exception $e) {
            JWTHandler::sendError('Failed to update order status: ' . $e->getMessage(), 500);
        }
    }

    // Cart management methods
    public static function getCart()
    {
        $user = JWTHandler::requireAuth();

        try {
            $db = Database::getInstance();

            // Get cart items with product details and variants
            $cartItems = $db->fetchAll(
                "SELECT sc.id, sc.product_id, sc.quantity, sc.size, sc.color, sc.created_at,
                        p.name as product_name, p.price, p.sku, p.images, p.quantity as stock_quantity
                 FROM shopping_cart sc
                 JOIN products p ON sc.product_id = p.id
                 WHERE sc.user_id = ?
                 ORDER BY sc.created_at DESC",
                [$user['user_id']]
            );

            // Calculate totals
            $totalItems = 0;
            $totalAmount = 0;

            foreach ($cartItems as &$item) {
                $item['images'] = json_decode($item['images'], true) ?: [];
                $item['subtotal'] = (float)$item['price'] * (int)$item['quantity'];
                $totalItems += $item['quantity'];
                $totalAmount += $item['subtotal'];
            }

            JWTHandler::sendSuccess([
                'items' => $cartItems,
                'total_items' => $totalItems,
                'total_amount' => $totalAmount
            ]);
        } catch (Exception $e) {
            JWTHandler::sendError('Failed to get cart: ' . $e->getMessage(), 500);
        }
    }

    public static function addToCart()
    {
        $user = JWTHandler::requireAuth();
        $data = json_decode(file_get_contents('php://input'), true);

        if (!isset($data['product_id']) || !isset($data['quantity'])) {
            JWTHandler::sendError('Product ID and quantity are required', 400);
        }

        $productId = (int)$data['product_id'];
        $quantity = (int)$data['quantity'];
        $size = isset($data['size']) ? trim($data['size']) : null;
        $color = isset($data['color']) ? trim($data['color']) : null;

        if ($quantity < 1) {
            JWTHandler::sendError('Quantity must be at least 1', 400);
        }

        try {
            $db = Database::getInstance();

            // Check if product exists and is in stock
            $product = $db->fetchOne(
                "SELECT * FROM products WHERE id = ? AND is_active = 1",
                [$productId]
            );

            if (!$product) {
                JWTHandler::sendError('Product not found', 404);
            }

            if ($product['quantity'] < $quantity) {
                JWTHandler::sendError('Insufficient stock available', 400);
            }

            // Check if item with same variant already exists in cart
            $existingItem = $db->fetchOne(
                "SELECT * FROM shopping_cart
                 WHERE user_id = ? AND product_id = ?
                 AND (size <=> ? OR size IS NULL) AND (color <=> ? OR color IS NULL)",
                [$user['user_id'], $productId, $size, $color]
            );

            if ($existingItem) {
                // Update quantity for existing variant
                $newQuantity = $existingItem['quantity'] + $quantity;

                if ($product['quantity'] < $newQuantity) {
                    JWTHandler::sendError('Insufficient stock available', 400);
                }

                $db->update('shopping_cart', ['quantity' => $newQuantity], ['id' => $existingItem['id']]);
            } else {
                // Add new item with variant
                $db->insert('shopping_cart', [
                    'user_id' => $user['user_id'],
                    'product_id' => $productId,
                    'quantity' => $quantity,
                    'size' => $size,
                    'color' => $color
                ]);
            }

            return self::getCart();
        } catch (Exception $e) {
            JWTHandler::sendError('Failed to add to cart: ' . $e->getMessage(), 500);
        }
    }

    public static function updateCartItem($cartId)
    {
        $user = JWTHandler::requireAuth();
        $data = json_decode(file_get_contents('php://input'), true);

        if (!isset($data['quantity'])) {
            JWTHandler::sendError('Quantity is required', 400);
        }

        $quantity = (int)$data['quantity'];

        if ($quantity < 0) {
            JWTHandler::sendError('Quantity cannot be negative', 400);
        }

        try {
            $db = Database::getInstance();

            // Check if cart item belongs to user
            $cartItem = $db->fetchOne(
                "SELECT sc.*, p.quantity as stock_quantity
                 FROM shopping_cart sc
                 JOIN products p ON sc.product_id = p.id
                 WHERE sc.id = ? AND sc.user_id = ?",
                [$cartId, $user['user_id']]
            );

            if (!$cartItem) {
                JWTHandler::sendError('Cart item not found', 404);
            }

            if ($cartItem['stock_quantity'] < $quantity) {
                JWTHandler::sendError('Insufficient stock available', 400);
            }

            if ($quantity === 0) {
                // Remove item from cart
                $db->delete('shopping_cart', ['id' => $cartId]);
            } else {
                // Update quantity
                $db->update('shopping_cart', ['quantity' => $quantity], ['id' => $cartId]);
            }

            return self::getCart();
        } catch (Exception $e) {
            JWTHandler::sendError('Failed to update cart: ' . $e->getMessage(), 500);
        }
    }

    public static function removeFromCart($cartId)
    {
        $user = JWTHandler::requireAuth();

        try {
            $db = Database::getInstance();

            // Check if cart item belongs to user
            $cartItem = $db->fetchOne(
                "SELECT id FROM shopping_cart WHERE id = ? AND user_id = ?",
                [$cartId, $user['user_id']]
            );

            if (!$cartItem) {
                JWTHandler::sendError('Cart item not found', 404);
            }

            $db->delete('shopping_cart', ['id' => $cartId]);

            return self::getCart();
        } catch (Exception $e) {
            JWTHandler::sendError('Failed to remove from cart: ' . $e->getMessage(), 500);
        }
    }

    public static function clearCart()
    {
        $user = JWTHandler::requireAuth();

        try {
            $db = Database::getInstance();

            $db->delete('shopping_cart', ['user_id' => $user['user_id']]);

            JWTHandler::sendSuccess(['message' => 'Cart cleared successfully']);
        } catch (Exception $e) {
            JWTHandler::sendError('Failed to clear cart: ' . $e->getMessage(), 500);
        }
    }
}
