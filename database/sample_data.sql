-- Comprehensive Sample Data for E-commerce Database
-- Includes users, addresses, products, orders, and order items
USE `ecommerce_db`;

-- ============================================================================
-- USERS (2 users: 1 admin, 1 regular user)
-- ============================================================================
-- Note: Passwords are NOT hashed for testing convenience
-- Admin user: email=admin@example.com, password=admin123
-- Regular user: email=user@example.com, password=user123

INSERT INTO `users` (`id`, `first_name`, `last_name`, `email`, `password_hash`, `phone`, `role`, `avatar`) VALUES
(1, 'Admin', 'User', 'admin@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '+1-555-0100', 'admin', NULL),
(2, 'Regular', 'User', 'user@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '+1-555-0200', 'user', NULL);

-- ============================================================================
-- USER ADDRESSES (2 addresses per user)
-- ============================================================================

-- Admin user addresses
INSERT INTO `user_addresses` (`user_id`, `address_type`, `first_name`, `last_name`, `street_address`, `apartment`, `city`, `state_province`, `postal_code`, `country`, `is_default`) VALUES
(1, 'Home Address', 'Admin', 'User', '123 Admin Street', 'Apt 1A', 'Admin City', 'AC', '10001', 'United States', TRUE),
(1, 'Work Address', 'Admin', 'User', '456 Office Plaza', 'Suite 100', 'Business District', 'BD', '10002', 'United States', FALSE);

-- Regular user addresses
INSERT INTO `user_addresses` (`user_id`, `address_type`, `first_name`, `last_name`, `street_address`, `apartment`, `city`, `state_province`, `postal_code`, `country`, `is_default`) VALUES
(2, 'Home Address', 'Regular', 'User', '789 Home Avenue', 'Unit 5B', 'Residential Area', 'RA', '20001', 'United States', TRUE),
(2, 'Work Address', 'Regular', 'User', '321 Corporate Blvd', 'Floor 15', 'Downtown', 'DT', '20002', 'United States', FALSE);

-- ============================================================================
-- CATEGORIES
-- ============================================================================

INSERT INTO `categories` (`id`, `name`, `slug`, `description`, `image`) VALUES
(1, 'Shoes', 'shoes', 'Footwear for all occasions', NULL),
(2, 'Shirts', 'shirts', 'Casual and formal shirts', NULL),
(3, 'Pants', 'pants', 'Comfortable and stylish pants', NULL),
(4, 'Caps', 'caps', 'Headwear accessories', NULL),
(5, 'Hats', 'hats', 'Various hat styles', NULL),
(6, 'Accessories', 'accessories', 'Fashion accessories and jewelry', NULL);

-- ============================================================================
-- PRODUCTS (10+ products, no images, no sales as requested)
-- ============================================================================

INSERT INTO `products` (`id`, `category_id`, `name`, `slug`, `description`, `price`, `quantity`, `sku`, `images`, `status`, `brand`, `rating`) VALUES
(1, 1, 'Black High-Tops', 'black-high-tops', 'Comfortable canvas sneakers perfect for everyday wear', 69.99, 120, 'SK-BHT-001', '[]', 'in_stock', 'Urban Comfort', 4.5),
(2, 2, 'Classic White Tee', 'classic-white-tee', 'Essential white cotton t-shirt for your wardrobe', 25.00, 350, 'SH-CWT-002', '[]', 'in_stock', 'Premium Style', 4.2),
(3, 3, 'Slim Fit Pants', 'slim-fit-pants', 'Modern slim fit pants with excellent comfort', 89.50, 75, 'PT-SFP-003', '[]', 'in_stock', 'Modern Wear', 4.0),
(4, 4, 'Beige Baseball Cap', 'beige-baseball-cap', 'Classic baseball cap in neutral beige color', 19.99, 0, 'CP-BBC-004', '[]', 'out_of_stock', 'Casual Essentials', 4.7),
(5, 5, 'Summer Fedora', 'summer-fedora', 'Elegant fedora hat perfect for summer outings', 45.00, 25, 'HT-SF-005', '[]', 'low_stock', 'Premium Style', 4.1),
(6, 1, 'Running Shoes', 'running-shoes', 'Engineered for performance and comfort during runs', 129.99, 45, 'SK-RS-006', '[]', 'in_stock', 'Urban Comfort', 4.8),
(7, 2, 'Graphic Hoodie', 'graphic-hoodie', 'Comfortable hoodie with unique graphic design', 79.99, 60, 'SH-GH-007', '[]', 'in_stock', 'Modern Wear', 4.3),
(8, 3, 'Cargo Pants', 'cargo-pants', 'Functional cargo pants with multiple pockets', 95.00, 30, 'PT-CP-008', '[]', 'in_stock', 'Urban Comfort', 4.4),
(9, 6, 'Leather Belt', 'leather-belt', 'Premium leather belt with classic buckle design', 35.99, 80, 'AC-LB-009', '[]', 'in_stock', 'Premium Style', 4.6),
(10, 4, 'Snapback Cap', 'snapback-cap', 'Retro snapback cap with adjustable fit', 24.99, 55, 'CP-SC-010', '[]', 'in_stock', 'Casual Essentials', 4.2),
(11, 5, 'Wool Beanie', 'wool-beanie', 'Warm wool beanie for cold weather', 18.99, 40, 'HT-WB-011', '[]', 'in_stock', 'Modern Wear', 4.0),
(12, 6, 'Sunglasses', 'sunglasses', 'UV protection sunglasses with modern design', 89.99, 25, 'AC-SG-012', '[]', 'in_stock', 'Premium Style', 4.5);

-- ============================================================================
-- SHOPPING CART (sample items)
-- ============================================================================

INSERT INTO `shopping_cart` (`user_id`, `product_id`, `quantity`, `size`, `color`) VALUES
(2, 1, 1, '10', 'Black'),
(2, 2, 2, 'M', 'White');

-- ============================================================================
-- ORDERS (3 orders with 2 order items each as requested)
-- ============================================================================

-- Order 1: Delivered order by regular user
INSERT INTO `orders` (`id`, `order_number`, `user_id`, `status`, `total_amount`, `subtotal`, `shipping_amount`, `tax_amount`, `payment_method`, `payment_status`, `shipping_address_id`, `billing_address_id`, `ordered_at`, `shipped_at`, `delivered_at`) VALUES
(1, 'ORD-20241201-0001', 2, 'delivered', 94.99, 94.99, 0.00, 0.00, 'Credit Card', 'paid', 3, 3, '2024-12-01 10:00:00', '2024-12-02 09:00:00', '2024-12-05 14:00:00');

INSERT INTO `order_items` (`order_id`, `product_id`, `product_name`, `product_price`, `quantity`, `line_total`) VALUES
(1, 2, 'Classic White Tee', 25.00, 1, 25.00),
(1, 4, 'Beige Baseball Cap', 19.99, 2, 39.98);

-- Order 2: Processing order by regular user
INSERT INTO `orders` (`id`, `order_number`, `user_id`, `status`, `total_amount`, `subtotal`, `shipping_amount`, `tax_amount`, `payment_method`, `payment_status`, `shipping_address_id`, `billing_address_id`, `ordered_at`) VALUES
(2, 'ORD-20241202-0002', 2, 'processing', 149.99, 149.99, 0.00, 0.00, 'PayPal', 'paid', 4, 4, '2024-12-02 15:30:00');

INSERT INTO `order_items` (`order_id`, `product_id`, `product_name`, `product_price`, `quantity`, `line_total`) VALUES
(2, 6, 'Running Shoes', 129.99, 1, 129.99),
(2, 9, 'Leather Belt', 35.99, 1, 35.99);

-- Order 3: Pending order by admin user
INSERT INTO `orders` (`id`, `order_number`, `user_id`, `status`, `total_amount`, `subtotal`, `shipping_amount`, `tax_amount`, `payment_method`, `payment_status`, `shipping_address_id`, `billing_address_id`, `ordered_at`) VALUES
(3, 'ORD-20241203-0003', 1, 'pending', 104.98, 104.98, 0.00, 0.00, 'Credit Card', 'pending', 1, 1, '2024-12-03 12:15:00');

INSERT INTO `order_items` (`order_id`, `product_id`, `product_name`, `product_price`, `quantity`, `line_total`) VALUES
(3, 5, 'Summer Fedora', 45.00, 1, 45.00),
(3, 10, 'Snapback Cap', 24.99, 1, 24.99);

COMMIT;
