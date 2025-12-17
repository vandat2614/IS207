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

            // Parse JSON images for each product and convert to base64
            foreach ($products as &$product) {
                if ($product['images']) {
                    $images = json_decode($product['images'], true);
                    $base64Images = [];

                    if (is_array($images)) {
                        foreach ($images as $imagePath) {
                            // Try both locations: new backend/public and old public
                            $filePath1 = __DIR__ . '/../public/' . $imagePath;
                            $filePath2 = __DIR__ . '/../../public/' . $imagePath;

                            $actualPath = null;
                            if (file_exists($filePath1)) {
                                $actualPath = $filePath1;
                            } elseif (file_exists($filePath2)) {
                                $actualPath = $filePath2;
                            }

                            if ($actualPath && file_exists($actualPath)) {
                                $imageData = file_get_contents($actualPath);
                                if ($imageData !== false) {
                                    $mimeType = mime_content_type($actualPath) ?: 'image/jpeg';
                                    $base64Images[] = 'data:' . $mimeType . ';base64,' . base64_encode($imageData);
                                }
                            }
                        }
                    }

                    $product['images'] = $base64Images;
                } else {
                    $product['images'] = [];
                }
            }

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

            // Parse JSON images and convert to base64
            if ($product['images']) {
                $images = json_decode($product['images'], true);
                $base64Images = [];

                if (is_array($images)) {
                    foreach ($images as $imagePath) {
                        // Try both locations: new backend/public and old public
                        $filePath1 = __DIR__ . '/../public/' . $imagePath;
                        $filePath2 = __DIR__ . '/../../public/' . $imagePath;

                        $actualPath = null;
                        if (file_exists($filePath1)) {
                            $actualPath = $filePath1;
                        } elseif (file_exists($filePath2)) {
                            $actualPath = $filePath2;
                        }

                        if ($actualPath && file_exists($actualPath)) {
                            $imageData = file_get_contents($actualPath);
                            if ($imageData !== false) {
                                $mimeType = mime_content_type($actualPath) ?: 'image/jpeg';
                                $base64Images[] = 'data:' . $mimeType . ';base64,' . base64_encode($imageData);
                            }
                        }
                    }
                }

                $product['images'] = $base64Images;
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

        $required = ['name', 'price', 'quantity'];
        foreach ($required as $field) {
            if (!isset($data[$field]) || empty(trim($data[$field]))) {
                JWTHandler::sendError("{$field} is required", 400);
            }
        }

        // Auto-generate SKU if not provided
        $sku = isset($data['sku']) && !empty(trim($data['sku'])) ? trim($data['sku']) : self::generateSKU($data['name']);

        $productData = [
            'name' => trim($data['name']),
            'slug' => isset($data['slug']) ? trim($data['slug']) : self::generateSlug($data['name']),
            'description' => isset($data['description']) ? trim($data['description']) : null,
            'price' => (float)$data['price'],
            'quantity' => (int)$data['quantity'],
            'sku' => $sku,
            'category_id' => isset($data['category_id']) ? (int)$data['category_id'] : null,
            'images' => isset($data['images']) ? json_encode($data['images']) : null,
            'status' => isset($data['status']) ? trim($data['status']) : 'in_stock',
            'is_active' => isset($data['is_active']) ? (bool)$data['is_active'] : true,
            'sale_percentage' => isset($data['sale_percentage']) ? (float)$data['sale_percentage'] : 0.00,
            'sale_start_date' => isset($data['sale_start_date']) && !empty($data['sale_start_date']) ? $data['sale_start_date'] : null,
            'sale_end_date' => isset($data['sale_end_date']) && !empty($data['sale_end_date']) ? $data['sale_end_date'] : null
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
            $allowed = ['name', 'description', 'price', 'quantity', 'category_id', 'status', 'is_active', 'sale_percentage', 'sale_start_date', 'sale_end_date'];

            foreach ($allowed as $field) {
                if (isset($data[$field])) {
                    if ($field === 'sale_percentage') {
                        $updateData[$field] = (float)$data[$field];
                    } elseif (in_array($field, ['sale_start_date', 'sale_end_date'])) {
                        $updateData[$field] = !empty($data[$field]) ? $data[$field] : null;
                    } else {
                        $updateData[$field] = $data[$field];
                    }
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

    public static function uploadProductImage($productId)
    {
        JWTHandler::requireAuth();

        // Debug logging
        error_log("Product Image Upload Debug:");
        error_log("Product ID: " . $productId);
        error_log("_FILES array: " . print_r($_FILES, true));
        error_log("_POST array: " . print_r($_POST, true));

        // Check if product exists
        $db = Database::getInstance();
        $product = $db->fetchOne("SELECT id FROM products WHERE id = ?", [$productId]);

        if (!$product) {
            error_log("Product not found: " . $productId);
            JWTHandler::sendError('Product not found', 404);
        }

        // Check if image was uploaded
        if (!isset($_FILES['image'])) {
            error_log("No _FILES['image'] set");
            JWTHandler::sendError('No image field in request', 400);
        }

        if ($_FILES['image']['error'] !== UPLOAD_ERR_OK) {
            error_log("Upload error code: " . $_FILES['image']['error']);
            switch ($_FILES['image']['error']) {
                case UPLOAD_ERR_INI_SIZE:
                    JWTHandler::sendError('File exceeds PHP upload_max_filesize limit', 400);
                case UPLOAD_ERR_FORM_SIZE:
                    JWTHandler::sendError('File exceeds form MAX_FILE_SIZE limit', 400);
                case UPLOAD_ERR_PARTIAL:
                    JWTHandler::sendError('File was only partially uploaded', 400);
                case UPLOAD_ERR_NO_FILE:
                    JWTHandler::sendError('No file was uploaded', 400);
                case UPLOAD_ERR_NO_TMP_DIR:
                    JWTHandler::sendError('Missing temporary folder', 400);
                case UPLOAD_ERR_CANT_WRITE:
                    JWTHandler::sendError('Failed to write file to disk', 400);
                case UPLOAD_ERR_EXTENSION:
                    JWTHandler::sendError('File upload stopped by extension', 400);
                default:
                    JWTHandler::sendError('Unknown upload error: ' . $_FILES['image']['error'], 400);
            }
        }

        $file = $_FILES['image'];

        // Validate file type
        $allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (!in_array($file['type'], $allowedTypes)) {
            JWTHandler::sendError('Invalid file type. Only JPEG, PNG, GIF, and WebP are allowed.', 400);
        }

        // Validate file size (max 5MB)
        if ($file['size'] > 5 * 1024 * 1024) {
            JWTHandler::sendError('File too large. Maximum size is 5MB.', 400);
        }

        // Create uploads/products directory if it doesn't exist
        $uploadDir = __DIR__ . '/../public/uploads/products/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        // Generate unique filename
        $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
        $filename = 'product_' . $productId . '_' . time() . '_' . uniqid() . '.' . $extension;
        $filepath = $uploadDir . $filename;

        // Debug: Check file paths and permissions
        error_log("Upload directory: " . $uploadDir);
        error_log("Full file path: " . $filepath);
        error_log("Upload dir exists: " . (is_dir($uploadDir) ? 'yes' : 'no'));
        error_log("Upload dir writable: " . (is_writable($uploadDir) ? 'yes' : 'no'));
        error_log("Temp file exists: " . (file_exists($file['tmp_name']) ? 'yes' : 'no'));

        // Move uploaded file
        if (!move_uploaded_file($file['tmp_name'], $filepath)) {
            error_log("move_uploaded_file failed. Last error: " . error_get_last()['message']);
            JWTHandler::sendError('Failed to save image: ' . error_get_last()['message'], 500);
        }

        // Verify file was saved
        if (!file_exists($filepath)) {
            error_log("File was not saved to: " . $filepath);
            JWTHandler::sendError('File was not saved successfully', 500);
        }

        error_log("File saved successfully to: " . $filepath);

        // Get current product images
        $product = $db->fetchOne("SELECT images FROM products WHERE id = ?", [$productId]);
        $currentImages = $product['images'] ? json_decode($product['images'], true) : [];

        // Add new image to array
        $imagePath = 'uploads/products/' . $filename;
        $currentImages[] = $imagePath;

        // Update product with new image array
        $db->update('products', ['images' => json_encode($currentImages)], ['id' => $productId]);

        JWTHandler::sendSuccess([
            'image_path' => $imagePath,
            'all_images' => $currentImages
        ], 'Image uploaded successfully');
    }

    public static function deleteProductImage($productId, $imageIndex)
    {
        JWTHandler::requireAuth();

        $db = Database::getInstance();

        // Get current product images
        $product = $db->fetchOne("SELECT images FROM products WHERE id = ?", [$productId]);
        if (!$product) {
            JWTHandler::sendError('Product not found', 404);
        }

        $currentImages = $product['images'] ? json_decode($product['images'], true) : [];

        if (!isset($currentImages[$imageIndex])) {
            JWTHandler::sendError('Image not found', 404);
        }

        // Delete physical file
        $imagePath = __DIR__ . '/../public/' . $currentImages[$imageIndex];
        if (file_exists($imagePath)) {
            unlink($imagePath);
        }

        // Remove image from array
        array_splice($currentImages, $imageIndex, 1);

        // Update product
        $db->update('products', ['images' => json_encode($currentImages)], ['id' => $productId]);

        JWTHandler::sendSuccess([
            'remaining_images' => $currentImages
        ], 'Image deleted successfully');
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

    private static function generateSKU($name)
    {
        $db = Database::getInstance();

        // Extract first 2 letters of name for AB part
        $namePart = strtoupper(substr(preg_replace('/[^a-zA-Z]/', '', $name), 0, 2));

        // If name is too short, pad with 'X'
        if (strlen($namePart) < 2) {
            $namePart = str_pad($namePart, 2, 'X');
        }

        // Use 'PR' as default category prefix (can be customized per category later)
        $categoryPrefix = 'PR';

        // Find the next sequential number for this pattern
        $basePattern = $categoryPrefix . '-' . $namePart . '-';
        $existingSKUs = $db->fetchAll(
            "SELECT sku FROM products WHERE sku LIKE ? ORDER BY sku DESC",
            [$basePattern . '%']
        );

        $nextNumber = 1;
        if (!empty($existingSKUs)) {
            // Extract numbers from existing SKUs and find the highest
            $numbers = [];
            foreach ($existingSKUs as $sku) {
                $parts = explode('-', $sku['sku']);
                if (count($parts) === 3) {
                    $number = (int)$parts[2];
                    if ($number > 0) {
                        $numbers[] = $number;
                    }
                }
            }
            if (!empty($numbers)) {
                $nextNumber = max($numbers) + 1;
            }
        }

        // Format as 3-digit number (001, 002, etc.)
        $formattedNumber = str_pad($nextNumber, 3, '0', STR_PAD_LEFT);

        $sku = $categoryPrefix . '-' . $namePart . '-' . $formattedNumber;

        // Double-check uniqueness (in case of race conditions)
        $counter = 1;
        $originalSKU = $sku;
        while ($db->fetchOne("SELECT id FROM products WHERE sku = ?", [$sku])) {
            $sku = $categoryPrefix . '-' . $namePart . '-' . str_pad($nextNumber + $counter, 3, '0', STR_PAD_LEFT);
            $counter++;
        }

        return $sku;
    }
}
