-- Sample Data for E-commerce Database
-- Matches the mock data used in React components
USE `ecommerce_db`;

-- Insert sample user (matches UserProfilePage mock data)
INSERT INTO `users` (`id`, `first_name`, `last_name`, `email`, `password_hash`, `phone`) VALUES
(1, 'Eleanor', 'Vance', 'eleanor@example.com', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', '+1-555-0123');

-- Insert sample user addresses (matches UserProfilePage)
INSERT INTO `user_addresses` (`user_id`, `address_type`, `first_name`, `last_name`, `street_address`, `apartment`, `city`, `state_province`, `postal_code`, `country`, `is_default`) VALUES
(1, 'Home Address', 'Eleanor', 'Vance', '123 Dream Lane', 'Apt 4B', 'Faketown', 'FS', '54321', 'United States', TRUE),
(1, 'Work Address', 'Eleanor', 'Vance', '456 Business Blvd', 'Suite 900', 'Metropolis', 'MS', '12345', 'United States', FALSE);

-- Insert sample categories
INSERT INTO `categories` (`id`, `name`, `slug`, `description`) VALUES
(1, 'Shoes', 'shoes', 'Footwear for all occasions'),
(2, 'Shirts', 'shirts', 'Casual and formal shirts'),
(3, 'Pants', 'pants', 'Comfortable and stylish pants'),
(4, 'Caps', 'caps', 'Headwear accessories'),
(5, 'Hats', 'hats', 'Various hat styles');

-- Insert sample products (matches ProductManagementPage)
INSERT INTO `products` (`id`, `category_id`, `name`, `slug`, `description`, `price`, `quantity`, `sku`, `images`, `status`) VALUES
(1, 1, 'Black High-Tops', 'black-high-tops', 'Comfortable canvas sneakers perfect for everyday wear', 69.99, 120, 'SK-BHT-001', '["https://lh3.googleusercontent.com/aida-public/AB6AXuAeIe8kmDJYDdxHQNZQYZ7KRF1cLerDkSQ2KKjS-840fFvMIj5YvqaQaeaVw6tQtGsSxdc1nh-aOBv20s-T4MwYqSugmeHdK44lX8PCmvfCpUzCAfc4u2Z85z_6lN1CEG2bz7w2WI4qllNdG201v9uRT5Y1d-lkvSLuynQ3UcGfAgfxIBkAylcd3qEi6fZKSn2PyDoQhl78t_L2CjUDnwLoLsl0rtn9YVHU8BuJ8-M9NEy4TerdlbegaRGDCXjsgOUktAHyrdL02ikD"]', 'in_stock'),
(2, 2, 'Classic White Tee', 'classic-white-tee', 'Essential white cotton t-shirt for your wardrobe', 25.00, 350, 'SH-CWT-002', '["https://lh3.googleusercontent.com/aida-public/AB6AXuCIbCzzzsduMACucxIsnAsDCVxI_CvZ0xgJvNzLnqW5didkV2fT4rfjl1BJ8bICu4AiOd5A9ExaxrVklEBc-nYx_kCmKEg6Y6WZq3c4VYPiowoDb5pThx836oEy9W4FjvzDFPdO1oYv4FhqaXiLOo9C85JHGEa_p28osQ0JX-RQ32XFogqRZgwYVg5i8tuDOHNJlvSVDQzbLc5WYWwP8d8dgltaly3l9jYOPhwa0dIHOyvEJQxAqJyD7a7hfaW4Gl6jKNCDiu8sxeI1"]', 'in_stock'),
(3, 3, 'Slim Fit Pants', 'slim-fit-pants', 'Modern slim fit pants with excellent comfort', 89.50, 75, 'PT-SFP-003', '["https://lh3.googleusercontent.com/aida-public/AB6AXuD0PWBsso3dWbx_Vgr-Di_UjzT1UAxpXbYRhqlq824hWCUR9DopukqpE1989mloQjrYkRJX5JuZLuRbQ85t4St9ywvIsiojemWgvd6JY6f1Fn3PjrYiB6g6N3qEXOOUQSP9PaifBIuiWAsoJkQVepzZk9oYkc3LUkoHzIRKOy2itt_lVOxVI3lc-CwsTU6pFrm4wYw6wchG2cMgDr4Q19xOtKfslgcRingS2D4Dk17RZy7UgY4aursYgxrp23-fvac2x3bdP6y2ezKa"]', 'in_stock'),
(4, 4, 'Beige Baseball Cap', 'beige-baseball-cap', 'Classic baseball cap in neutral beige color', 19.99, 0, 'CP-BBC-004', '["https://lh3.googleusercontent.com/aida-public/AB6AXuAsfrR43V-LhpGyKHZZGjew1R_yGWlPp9vSq1SB7NoCMpPc23nyPBFJBFcllxV3jMpjURvXlnenJBy7yTDmXmZp1lADKwPHpieMFq5rRIwIgLtVP6JOMKpCY4gej1H8iSpPXO5DieVaZwKhiTOIHhwJK4TqbMPrf7IMB9eoV0r8tiQr6X_wQspQ9kP6nFUv6AegV6vqEn1pddo471H4CYR76M1snTQ30AWtsfflXXsuyqMdWoCZURU39853FP1SqnddT5owVWYXs9Ag"]', 'out_of_stock'),
(5, 5, 'Summer Fedora', 'summer-fedora', 'Elegant fedora hat perfect for summer outings', 45.00, 25, 'HT-SF-005', '["https://lh3.googleusercontent.com/aida-public/AB6AXuC08fFVv9xJJvKrKQZ4J5y3nCorY4DWvmfnjlGqwI9aIc8IzQNcSuM3PaqJoCsUUHfBRa2wn37qE8pVwU-CnV0x5FuZTMJFwrynAtfJnv4lo4kukdvGl3BEBh5leaZ3V9v0WW_A_tMGoVI5gnt_N6xSg6Q3dB1cEyujqXGd4aYhs1-UnoKyC9L5r3Icwz0DfiDTiZ6pGvkpj6HIvobRnw5r7tNEmqfp4SS5EWA3wmE6PhaPQ3O-bVvLgc1t5uj0f7t7nZbmyIyR-LMC"]', 'low_stock');

-- Insert sample shopping cart items (matches CheckoutPage mock data)
INSERT INTO `shopping_cart` (`user_id`, `product_id`, `quantity`) VALUES
(1, 1, 1),
(1, 2, 2);

-- Insert sample order (matches CheckoutPage and OrderHistory)
INSERT INTO `orders` (`id`, `order_number`, `user_id`, `status`, `total_amount`, `subtotal`, `shipping_amount`, `tax_amount`, `payment_method`, `payment_status`, `shipping_address_id`, `ordered_at`) VALUES
(1, 'ORD-240119-0001', 1, 'delivered', 226.78, 199.99, 9.99, 16.80, 'Credit Card', 'paid', 1, '2024-01-19 10:00:00');

-- Insert order items (matches the order above)
INSERT INTO `order_items` (`order_id`, `product_id`, `product_name`, `product_price`, `quantity`, `line_total`) VALUES
(1, 1, 'Black High-Tops', 69.99, 1, 69.99),
(1, 2, 'Classic White Tee', 25.00, 2, 50.00);

-- Update order total based on items
UPDATE `orders` SET `subtotal` = 119.99 WHERE `id` = 1;

-- Insert another sample order
INSERT INTO `orders` (`id`, `order_number`, `user_id`, `status`, `total_amount`, `subtotal`, `shipping_amount`, `tax_amount`, `payment_method`, `payment_status`, `shipping_address_id`, `ordered_at`) VALUES
(2, 'ORD-240119-0002', 1, 'shipped', 245.50, 245.50, 0.00, 0.00, 'Credit Card', 'paid', 1, '2024-01-12 14:30:00');

-- Insert order items
INSERT INTO `order_items` (`order_id`, `product_id`, `product_name`, `product_price`, `quantity`, `line_total`) VALUES
(2, 1, 'Black High-Tops', 69.99, 3, 209.97),
(2, 4, 'Beige Baseball Cap', 19.99, 1, 19.99),
(2, 5, 'Summer Fedora', 45.00, 1, 45.00);

COMMIT;
