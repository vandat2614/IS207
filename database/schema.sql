-- E-commerce Database Schema
-- Compatible with PHP backend integration
SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET AUTOCOMMIT = 0;
START TRANSACTION;

-- Database creation
CREATE DATABASE IF NOT EXISTS `ecommerce_db`;
USE `ecommerce_db`;

-- --------------------------------------------------------
-- Table: users
-- Maps to: UserProfilePage (user info, addresses)
-- --------------------------------------------------------

CREATE TABLE `users` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `first_name` VARCHAR(50) NOT NULL,
  `last_name` VARCHAR(50) NOT NULL,
  `email` VARCHAR(100) NOT NULL UNIQUE,
  `password_hash` VARCHAR(255) NOT NULL,
  `phone` VARCHAR(20),
  `avatar` VARCHAR(255) COMMENT 'Path to uploaded avatar image',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_email` (`email`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table: user_addresses
-- Maps to: UserProfilePage (saved addresses)
-- --------------------------------------------------------

CREATE TABLE `user_addresses` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `user_id` INT(11) NOT NULL,
  `address_type` VARCHAR(50) NOT NULL COMMENT 'Home Address, Work Address, etc.',
  `first_name` VARCHAR(50),
  `last_name` VARCHAR(50),
  `street_address` VARCHAR(255) NOT NULL,
  `apartment` VARCHAR(100),
  `city` VARCHAR(100) NOT NULL,
  `state_province` VARCHAR(100),
  `postal_code` VARCHAR(20),
  `country` VARCHAR(100) NOT NULL DEFAULT 'United States',
  `is_default` BOOLEAN DEFAULT FALSE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  INDEX `idx_user_default` (`user_id`, `is_default`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table: categories
-- Maps to: Product Management (product categories)
-- --------------------------------------------------------

CREATE TABLE `categories` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL UNIQUE,
  `slug` VARCHAR(120) NOT NULL UNIQUE,
  `description` TEXT,
  `image` VARCHAR(255),
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  INDEX `idx_slug` (`slug`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table: products
-- Maps to: ProductManagementPage (admin products table)
-- --------------------------------------------------------

CREATE TABLE `products` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `category_id` INT(11),
  `name` VARCHAR(255) NOT NULL,
  `slug` VARCHAR(255) NOT NULL UNIQUE,
  `description` TEXT,
  `price` DECIMAL(10,2) NOT NULL,
  `quantity` INT(11) NOT NULL DEFAULT 0,
  `sku` VARCHAR(100) UNIQUE,
  `images` JSON COMMENT 'Array of image URLs',
  `status` ENUM('in_stock', 'low_stock', 'out_of_stock') DEFAULT 'in_stock',
  `brand` VARCHAR(100) COMMENT 'Product brand/manufacturer',
  `tags` JSON COMMENT 'Search tags and keywords for filtering',
  `rating` DECIMAL(3,2) DEFAULT 0.00 COMMENT 'Average product rating (0-5)',
  `is_active` BOOLEAN DEFAULT TRUE,
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`) ON DELETE SET NULL,
  INDEX `idx_category` (`category_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_brand` (`brand`),
  INDEX `idx_rating` (`rating`),
  INDEX `idx_active` (`is_active`),
  INDEX `idx_slug` (`slug`)
  -- Note: JSON tags indexing removed for MySQL compatibility
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table: shopping_cart
-- Maps to: CartPage (shopping cart functionality)
-- --------------------------------------------------------

CREATE TABLE `shopping_cart` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `user_id` INT(11),
  `session_id` VARCHAR(255) COMMENT 'For non-logged users',
  `product_id` INT(11) NOT NULL,
  `quantity` INT(11) NOT NULL DEFAULT 1,
  `size` VARCHAR(50) DEFAULT NULL COMMENT 'Selected size variant',
  `color` VARCHAR(50) DEFAULT NULL COMMENT 'Selected color variant',
  `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  UNIQUE KEY `unique_cart_item_variant` (`user_id`, `session_id`, `product_id`, `size`, `color`),
  INDEX `idx_user_session` (`user_id`, `session_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table: orders
-- Maps to: OrderManagementPage + CheckoutPage
-- --------------------------------------------------------

CREATE TABLE `orders` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `order_number` VARCHAR(20) NOT NULL UNIQUE,
  `user_id` INT(11) NOT NULL,
  `status` ENUM('pending', 'processing', 'shipped', 'delivered', 'cancelled') DEFAULT 'pending',
  `total_amount` DECIMAL(10,2) NOT NULL,
  `subtotal` DECIMAL(10,2) NOT NULL,
  `shipping_amount` DECIMAL(10,2) DEFAULT 0.00,
  `tax_amount` DECIMAL(10,2) DEFAULT 0.00,
  `payment_method` VARCHAR(50),
  `payment_status` ENUM('pending', 'paid', 'failed', 'refunded') DEFAULT 'pending',
  `shipping_address_id` INT(11),
  `billing_address_id` INT(11),
  `notes` TEXT,
  `ordered_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  `shipped_at` TIMESTAMP NULL,
  `delivered_at` TIMESTAMP NULL,
  `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`shipping_address_id`) REFERENCES `user_addresses` (`id`) ON DELETE SET NULL,
  FOREIGN KEY (`billing_address_id`) REFERENCES `user_addresses` (`id`) ON DELETE SET NULL,
  INDEX `idx_user` (`user_id`),
  INDEX `idx_status` (`status`),
  INDEX `idx_order_number` (`order_number`),
  INDEX `idx_ordered_at` (`ordered_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table: order_items
-- Maps to: CheckoutPage (cart items converted to order)
-- --------------------------------------------------------

CREATE TABLE `order_items` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `order_id` INT(11) NOT NULL,
  `product_id` INT(11) NOT NULL,
  `product_name` VARCHAR(255) NOT NULL COMMENT 'Snapshot at time of order',
  `product_price` DECIMAL(10,2) NOT NULL COMMENT 'Price at time of order',
  `quantity` INT(11) NOT NULL,
  `line_total` DECIMAL(10,2) NOT NULL,
  PRIMARY KEY (`id`),
  FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE CASCADE,
  FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE,
  INDEX `idx_order` (`order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Note: Order numbers are generated by PHP application logic
-- instead of triggers to avoid race conditions and ensure uniqueness
-- --------------------------------------------------------

-- Update order total when status changes
DELIMITER ;;
CREATE TRIGGER `update_order_timestamps` BEFORE UPDATE ON `orders`
FOR EACH ROW
BEGIN
  IF NEW.status = 'shipped' AND OLD.status != 'shipped' THEN
    SET NEW.shipped_at = NOW();
  END IF;
  IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
    SET NEW.delivered_at = NOW();
  END IF;
END;;
DELIMITER ;

COMMIT;
