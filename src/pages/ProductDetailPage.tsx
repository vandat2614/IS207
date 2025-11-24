import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Button from '../components/Button';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  images: string[];
  quantity: number;
  sku: string;
}

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addToCartLoading, setAddToCartLoading] = useState(false);

  // Mock attributes for now (could be added to database later)
  const productSizes = ['7', '8', '9', '10', '11'];
  const productColors = ['White', 'Black', 'Blue'];

  const handleSizeSelect = (size: string) => {
    setSelectedSize(selectedSize === size ? null : size);
  };

  const handleColorSelect = (color: string) => {
    setSelectedColor(selectedColor === color ? null : color);
  };

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`http://localhost:8000/products/${id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Product not found');
        }

        const data = await response.json();
        console.log('API Response:', data);
        console.log('Product data:', data.data?.product);
        console.log('Error status:', data.error);

        // Backend returns: { error: false, message: "...", data: { product: {...} } }
        if (data && data.error === false && data.data && data.data.product) {
          console.log('Setting product from API response');
          const productData = data.data.product;
          const processedProduct = {
            ...productData,
            id: Number(productData.id),
            price: Number(productData.price),
            quantity: Number(productData.quantity),
            images: Array.isArray(productData.images) ? productData.images : []
          };
          setProduct(processedProduct);
        } else if (data && data.product) {
          // Alternative response structure
          console.log('Using alternative product structure');
          const productData = data.product;
          const processedProduct = {
            ...productData,
            id: Number(productData.id),
            price: Number(productData.price),
            quantity: Number(productData.quantity),
            images: Array.isArray(productData.images) ? productData.images : []
          };
          setProduct(processedProduct);
        } else {
          console.error('Unexpected response structure:', data);
          throw new Error('Invalid response structure from backend');
        }

      } catch (err) {
        console.error('Error loading product:', err);
        console.log('Error details:', err instanceof Error ? err.message : 'Unknown error');
        setError(null); // Clear error so we show mock data instead

        // Always set fallback mock data on error for debugging
        console.log('Setting fallback mock data');
        setProduct({
          id: parseInt(id || '1', 10),
          name: 'Classic Fedora (Demo)',
          description: 'This is demo data. The backend API call failed, so showing fallback content. Check browser console for details.\n\nTimeless accessory for any sophisticated look. Crafted from premium wool felt with a classic shape and grosgrain ribbon band.',
          price: 99.99,
          images: ['https://images.unsplash.com/photo-1571910258025-e3a1b0d6a30c?w=400&h=300&fit=crop'],
          quantity: 25,
          sku: 'CLF-001'
        });
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchProduct();
    }
  }, [id]);

  // Reset selected quantity when product changes
  useEffect(() => {
    setSelectedQuantity(1);
  }, [product?.id]);

  const handleQuantityChange = (newQuantity: number) => {
    if (!product) return;

    if (newQuantity >= 1 && newQuantity <= Math.min(10, product.quantity)) {
      setSelectedQuantity(newQuantity);
    }
  };

  const fetchUpdatedProduct = async () => {
    if (!id) return;

    try {
      const response = await fetch(`http://localhost:8000/products/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        if (data && data.error === false && data.data && data.data.product) {
          const productData = data.data.product;
          const processedProduct = {
            ...productData,
            id: Number(productData.id),
            price: Number(productData.price),
            quantity: Number(productData.quantity),
            images: Array.isArray(productData.images) ? productData.images : []
          };
          setProduct(processedProduct);
        }
      }
    } catch (error) {
      console.error('Error fetching updated product stock:', error);
    }
  };

  const handleAddToCart = async () => {
    const token = localStorage.getItem('authToken');

    if (!token) {
      alert('Please login to add items to cart');
      navigate('/login');
      return;
    }

    if (!product) return;

    // Validate size and color selection
    if (!selectedSize) {
      alert('Please select a size before adding to cart');
      return;
    }

    if (!selectedColor) {
      alert('Please select a color before adding to cart');
      return;
    }

    try {
      setAddToCartLoading(true);

      const response = await fetch('http://localhost:8000/cart/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          product_id: product.id,
          quantity: selectedQuantity,
          size: selectedSize,
          color: selectedColor,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        alert(`Product added to cart successfully! Size: ${selectedSize}, Color: ${selectedColor}, Quantity: ${selectedQuantity}`);
        // Update cart count in header immediately
        if ((window as any).updateCartCount) {
          (window as any).updateCartCount();
        }
        // Refresh product stock information
        await fetchUpdatedProduct();
      } else {
        if (data.message.includes('login') || data.message.includes('token')) {
          alert('Session expired. Please login again.');
          navigate('/login');
        } else {
          alert(data.message || 'Failed to add to cart');
        }
      }
    } catch (err) {
      console.error('Error adding to cart:', err);
      alert('Failed to add to cart. Please try again.');
    } finally {
      setAddToCartLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading product...</p>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || 'Product not found'}</p>
          <Button onClick={() => navigate('/products')}>Back to Products</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Product Image */}
        <div>
          <img
            alt={product.name}
            className="w-full h-96 object-cover rounded-lg"
            src={product.images && product.images.length > 0 ? product.images[0] : 'https://images.unsplash.com/photo-1571910258025-e3a1b0d6a30c?w=600&h=400&fit=crop'}
          />
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
              {product.name}
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-lg">
              {product.description}
            </p>
            <p className="text-sm text-slate-500 mt-2">SKU: {product.sku}</p>
          </div>

          <div>
            <span className="text-3xl font-bold text-blue-500">
              ${product.price.toFixed(2)}
            </span>
            {product.quantity > 0 ? (
              <p className="text-green-600 mt-1">In Stock ({product.quantity} available)</p>
            ) : (
              <p className="text-red-600 mt-1">Out of Stock</p>
            )}
          </div>

          {/* Size Selection */}
          <div>
            <h3 className="text-lg font-semibold mb-3">
              Size {!selectedSize && <span className="text-red-500 text-sm">*</span>}
            </h3>
            <div className="flex gap-2 flex-wrap">
              {productSizes.map((size: string) => (
                <button
                  key={size}
                  onClick={() => handleSizeSelect(size)}
                  className={`px-4 py-2 border rounded-md transition-all ${
                    selectedSize === size
                      ? 'border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300'
                      : 'border-slate-300 dark:border-slate-700 hover:border-blue-500'
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Color Selection */}
          <div>
            <h3 className="text-lg font-semibold mb-3">
              Color {!selectedColor && <span className="text-red-500 text-sm">*</span>}
            </h3>
            <div className="flex gap-2 flex-wrap">
              {productColors.map((color: string) => (
                <button
                  key={color}
                  onClick={() => handleColorSelect(color)}
                  className={`px-4 py-2 border rounded-md transition-all ${
                    selectedColor === color
                      ? 'border-green-500 bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-300'
                      : 'border-slate-300 dark:border-slate-700 hover:border-green-500'
                  }`}
                >
                  {color}
                </button>
              ))}
            </div>
          </div>

          {/* Quantity Selection */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Quantity</h3>
            <div className="flex items-center gap-3">
              <button
                onClick={() => handleQuantityChange(selectedQuantity - 1)}
                disabled={selectedQuantity <= 1}
                className="px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md hover:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                -
              </button>
              <input
                type="number"
                value={selectedQuantity}
                onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                min="1"
                max={Math.min(10, product.quantity)}
                className="w-16 px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md text-center"
              />
              <button
                onClick={() => handleQuantityChange(selectedQuantity + 1)}
                disabled={selectedQuantity >= Math.min(10, product.quantity)}
                className="px-3 py-2 border border-slate-300 dark:border-slate-700 rounded-md hover:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                +
              </button>
            </div>
          </div>

          {/* Add to Cart */}
          <div className="pt-4">
            <Button
              size="lg"
              className="w-full"
              onClick={handleAddToCart}
              disabled={addToCartLoading || product.quantity <= 0}
            >
              {addToCartLoading ? 'Adding to Cart...' : `Add to Cart (${selectedQuantity})`}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetailPage;
