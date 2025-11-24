# PHP Backend for E-commerce React App

Complete PHP REST API backend compatible with your React frontend. Features JWT authentication, CRUD operations, and production-ready architecture.

## 📁 **Backend Structure**

```
backend/
├── .env                     # Environment configuration
├── index.php               # Main API entry point & routing
├── config/
│   └── database.php        # Database connection & helper functions
├── utils/
│   └── jwt.php            # JWT authentication & CORS utilities
├── controllers/
│   ├── AuthController.php   # User registration & login
│   ├── UserController.php   # Profile management & addresses
│   ├── ProductController.php # Product CRUD for admin
│   └── OrderController.php   # Order management & cart/checkout
└── README.md               # This file
```

## 🚀 **Quick Setup**

### **1. Install Dependencies**

```bash
cd backend
composer install
```

### **2. Configure Environment**

Update `backend/.env` file:

```env
DB_HOST=localhost
DB_NAME=ecommerce_db
DB_USER=root
DB_PASS=your_mysql_password
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
```

### **3. Setup Web Server**

#### **Using XAMPP (Recommended)**

1. Copy `backend/` folder to `C:\xampp\htdocs\ecommerce-backend\`
2. Access via: `http://localhost/ecommerce-backend/`

#### **Using PHP Built-in Server**

```bash
cd backend
php -S localhost:8000
```

Access via: `http://localhost:8000/`

## 🔑 **API Endpoints**

### **Authentication**

```
POST /auth/register    # User registration
POST /auth/login       # User login
```

### **Public Routes**

```
GET  /products               # Get products (with pagination/filtering)
GET  /products/{id}          # Get single product
GET  /categories            # Get all categories
```

### **Authenticated User Routes**

```
GET    /profile              # Get user profile + addresses
PUT    /profile              # Update user profile
POST   /profile/addresses    # Add new address
PUT    /profile/addresses/{id} # Update address
DELETE /profile/addresses/{id} # Delete address

GET    /orders               # Get user's order history
GET    /orders/{id}          # Get single order details
POST   /orders               # Create new order (checkout)
DELETE /orders/{id}          # Cancel order
```

### **Admin Routes** (Require authentication)

```
GET  /admin/orders           # Get all orders for admin
PUT  /orders/{id}/status     # Update order status
GET  /admin/products         # Get all products for admin
POST /products               # Create new product
PUT  /products/{id}          # Update product
DELETE /products/{id}        # Delete product
```

## 🧪 **Testing the API**

### **1. Register a new user:**

```bash
curl -X POST http://localhost/backend/ \
  -H "Content-Type: application/json" \
  -d '{
    "first_name": "Test",
    "last_name": "User",
    "email": "test@example.com",
    "password": "password123"
  }'
```

### **2. Login and get token:**

```bash
curl -X POST http://localhost/backend/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### **3. Use authenticated endpoint:**

```bash
curl -X GET http://localhost/backend/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## 🔐 **Authentication Flow**

1. **Register/Login** → Receive JWT token
2. **Send token** in `Authorization: Bearer <token>` header
3. **Token auto-validates** on protected routes
4. **Token expires** after 1 hour (configurable in `.env`)

## 📦 **Frontend Integration**

Replace your React frontend mock calls with real API calls:

```javascript
// Before (mock data):
const [user, setUser] = useState(mockUserData);

// After (real API):
useEffect(() => {
  fetch("/api/profile", {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
    .then((res) => res.json())
    .then(setUser);
}, []);
```

### **Example Integration Points:**

| React Component    | API Method | Endpoint          |
| ------------------ | ---------- | ----------------- |
| LoginPage          | POST       | `/auth/login`     |
| UserProfilePage    | GET        | `/profile`        |
| ProductsPage       | GET        | `/products`       |
| CheckoutPage       | POST       | `/orders`         |
| Admin Product Page | GET        | `/admin/products` |

## 🔧 **Key Features**

### ✅ **Production-Ready**

- **Input validation** and sanitization
- **Error handling** with proper HTTP status codes
- **CORS support** for frontend integration
- **Transaction safety** for multi-step operations

### ✅ **Security Features**

- **Password hashing** with PHP's password_hash()
- **JWT tokens** for stateless authentication
- **SQL injection prevention** with prepared statements
- **User input validation** on all endpoints

### ✅ **Business Logic**

- **Inventory management** (automatic stock updates)
- **Order status tracking** (pending → shipped → delivered)
- **Address management** with default address support
- **Cart validation** before checkout

### ✅ **Admin Functionality**

- **Product CRUD** operations
- **Order management** with status updates
- **User permissions** (admin vs regular users)

## 🚨 **Important Notes**

### **PHP Version Requirements**

- **PHP 7.4+** required
- **PDO extension** must be enabled
- **Composer** for dependency management

### **Database Setup**

Run these commands in MySQL:

```sql
CREATE DATABASE ecommerce_db;
SOURCE database/schema.sql;
SOURCE database/sample_data.sql;
```

### **CORS Configuration**

Update `.env` with your frontend URL:

```env
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

### **JWT Secret**

**IMPORTANT:** Change the JWT secret in `.env` for production:

```env
JWT_SECRET=your_super_secret_jwt_key_here_change_in_production
```

## 🐛 **Troubleshooting**

### **"Database connection failed"**

- Check MySQL server is running
- Verify credentials in `.env`
- Ensure database exists

### **"Undefined function jwt_encode()"**

- Run `composer install` to install dependencies
- Check vendor folder exists

### **CORS errors**

- Update `CORS_ALLOWED_ORIGINS` in `.env`
- Check frontend URL matches exactly

### **503 Service Unavailable**

- Check PHP server is running
- Verify file permissions
- Check error logs

## 📋 **Next Steps**

1. **Test all endpoints** with Postman/cURL
2. **Integrate with React frontend** (replace mock data)
3. **Add file uploads** for product images
4. **Implement payment processing** (Stripe/PayPal)
5. **Add email notifications** for orders
6. **Set up logging** and monitoring

## 🎯 **Production Deployment**

- **Use HTTPS** in production
- **Set secure JWT secrets**
- **Enable database connection pooling**
- **Add rate limiting** for API endpoints
- **Implement Redis** for session storage
- **Add comprehensive logging**

---

**Your backend is now ready! Start with authentication testing, then integrate with your React frontend. All CRUD operations for users, products, orders, and addresses are fully implemented.** 🎉
