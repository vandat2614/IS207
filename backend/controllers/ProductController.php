<?php

require_once __DIR__ . '/../config/database.php';
require_once __DIR__ . '/../utils/jwt.php';

class ProductController
{
    public static function getProducts()
    {
        $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 20;
        $category = isset($_GET['category']) ? trim($_GET['category']) : null;
        $search = isset($_GET['search']) ? trim($_GET['search']) : null;

        $offset = ($page - 1) * $limit;

        try {
            $db = Database::getInstance();
            $pdo = $db->getConnection();

            // Build query
            $where = ["p.is_active = 1"];
            $params = [];

            if ($category) {
                $where[] = "c.slug = ?";
                $params[] = $category;
            }

            if ($search) {
                $where[] = "(p.name LIKE ? OR p.description LIKE ? OR c.name LIKE ?)";
                $params[] = "%$search%";
                $params[] = "%$search%";
                $params[] = "%$search%";
            }

            $whereClause = implode(' AND ', $where);

            // Get products
            $products = $db->fetchAll(
                "SELECT p.*, c.name as category_name, c.slug as category_slug
                 FROM products p
                 LEFT JOIN categories c ON p.category_id = c.id
                 WHERE $whereClause
                 ORDER BY p.created_at DESC
                 LIMIT ? OFFSET ?",
                array_merge($params, [$limit, $offset])
            );

            // Get total count
            $count = $db->fetchOne(
                "SELECT COUNT(*) as total FROM products p
                 LEFT JOIN categories c ON p.category_id = c.id
                 WHERE $whereClause",
                $params
            );

            $totalPages = ceil($count['total'] / $limit);

            JWTHandler::sendSuccess([
                'products' => $products,
                'pagination' => [
                    'page' => $page,
                    'limit' => $limit,
                    'total' => $count['total'],
                    'total_pages' => $totalPages
                ]
            ]);
        } catch (Exception $e) {
            JWTHandler::sendError('Failed to get products: ' . $e->getMessage(), 500);
        }
    }

    public static function getProduct($id)
    {
        try {
            $db = Database::getInstance();

            $product = $db->fetchOne(
                "SELECT p.*, c.name as category_name, c.slug as category_slug
                 FROM products p
                 LEFT JOIN categories c ON p.category_id = c.id
                 WHERE p.id = ? AND p.is_active = 1",
                [$id]
            );

            if (!$product) {
                JWTHandler::sendError('Product not found', 404);
            }

            // Parse JSON images
            if ($product['images']) {
                $product['images'] = json_decode($product['images'], true);
            } else {
                $product['images'] = [];
            }

            JWTHandler::sendSuccess(['product' => $product]);
        } catch (Exception $e) {
            JWTHandler::sendError('Failed to get product: ' . $e->getMessage(), 500);
        }
    }

    public static function getCategories()
    {
        try {
            $db = Database::getInstance();

            $categories = $db->fetchAll(
                "SELECT * FROM categories ORDER BY name ASC"
            );

            JWTHandler::sendSuccess(['categories' => $categories]);
        } catch (Exception $e) {
            JWTHandler::sendError('Failed to get categories: ' . $e->getMessage(), 500);
        }
    }

    // Admin functions - require authentication
    public static function createProduct()
    {
        JWTHandler::requireAuth();
        $data = json_decode(file_get_contents('php://input'), true);

        $required = ['name', 'price', 'quantity', 'sku'];
        foreach ($required as $field) {
            if (!isset($data[$field])) {
                JWTHandler::sendError("{$field} is required", 400);
            }
        }

        $productData = [
            'name' => trim($data['name']),
            'slug' => isset($data['slug']) ? trim($data['slug']) : self::generateSlug($data['name']),
            'description' => isset($data['description']) ? trim($data['description']) : null,
            'price' => (float)$data['price'],
            'quantity' => (int)$data['quantity'],
            'sku' => trim($data['sku']),
            'category_id' => isset($data['category_id']) ? (int)$data['category_id'] : null,
            'images' => isset($data['images']) ? json_encode($data['images']) : null,
            'status' => isset($data['status']) ? trim($data['status']) : 'in_stock',
            'is_active' => isset($data['is_active']) ? (bool)$data['is_active'] : true
        ];

        try {
            $db = Database::getInstance();

            // Check if SKU exists
            $existing = $db->fetchOne(
                "SELECT id FROM products WHERE sku = ?",
                [$productData['sku']]
            );

            if ($existing) {
                JWTHandler::sendError('SKU already exists', 400);
            }

            $productId = $db->insert('products', $productData);

            $product = $db->fetchOne(
                "SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = ?",
                [$productId]
            );

            JWTHandler::sendSuccess(['product' => $product], 'Product created successfully');
        } catch (Exception $e) {
            JWTHandler::sendError('Failed to create product: ' . $e->getMessage(), 500);
        }
    }

    public static function updateProduct($id)
    {
        JWTHandler::requireAuth();
        $data = json_decode(file_get_contents('php://input'), true);

        try {
            $db = Database::getInstance();

            // Check if product exists
            $existing = $db->fetchOne(
                "SELECT id FROM products WHERE id = ?",
                [$id]
            );

            if (!$existing) {
                JWTHandler::sendError('Product not found', 404);
            }

            $updateData = [];
            $allowed = ['name', 'description', 'price', 'quantity', 'category_id', 'status', 'is_active'];

            foreach ($allowed as $field) {
                if (isset($data[$field])) {
                    $updateData[$field] = $data[$field];
                }
            }

            if (isset($data['slug'])) {
                $updateData['slug'] = trim($data['slug']);
            }

            if (isset($data['images'])) {
                $updateData['images'] = json_encode($data['images']);
            }

            if (isset($data['sku'])) {
                // Check SKU uniqueness
                $skuExists = $db->fetchOne(
                    "SELECT id FROM products WHERE sku = ? AND id != ?",
                    [$data['sku'], $id]
                );

                if ($skuExists) {
                    JWTHandler::sendError('SKU already exists', 400);
                }

                $updateData['sku'] = trim($data['sku']);
            }

            if (empty($updateData)) {
                JWTHandler::sendError('No valid fields to update', 400);
            }

            $updated = $db->update('products', $updateData, ['id' => $id]);

            JWTHandler::sendSuccess(null, 'Product updated successfully');
        } catch (Exception $e) {
            JWTHandler::sendError('Failed to update product: ' . $e->getMessage(), 500);
        }
    }

    public static function deleteProduct($id)
    {
        JWTHandler::requireAuth();

        try {
            $db = Database::getInstance();

            $deleted = $db->delete('products', ['id' => $id]);

            if ($deleted === 0) {
                JWTHandler::sendError('Product not found', 404);
            }

            JWTHandler::sendSuccess(null, 'Product deleted successfully');
        } catch (Exception $e) {
            JWTHandler::sendError('Failed to delete product: ' . $e->getMessage(), 500);
        }
    }

    private static function generateSlug($name)
    {
        $slug = strtolower(trim($name));
        $slug = preg_replace('/[^a-z0-9-]+/', '-', $slug);
        $slug = preg_replace('/-+/', '-', $slug);
        $slug = trim($slug, '-');

        // Ensure uniqueness
        $db = Database::getInstance();
        $originalSlug = $slug;
        $counter = 1;

        while ($db->fetchOne("SELECT id FROM products WHERE slug = ?", [$slug])) {
            $slug = $originalSlug . '-' . $counter;
            $counter++;
        }

        return $slug;
    }
}
