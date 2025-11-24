import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';

interface CartItem {
  id: number;
  product_id: number;
  product_name: string;
  product_price: number;
  quantity: number;
  sku: string;
  images: string[];
  subtotal: number;
  stock_quantity: number;
}

const CartPage: React.FC = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const getToken = () => localStorage.getItem('authToken');

  useEffect(() => {
    const fetchCart = async () => {
      const token = getToken();
      if (!token) {
        setError('Please login to view your cart');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await fetch('http://localhost:8000/cart', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        console.log('CartPage - Fetching cart data...');
        console.log('Response status:', response.status);

        if (response.ok) {
          const data = await response.json();
          console.log('CartPage - Raw API response:', data);
          console.log('CartPage - Parsed items:', data.data.items);

          // Handle both response structures for flexibility
          let items = data.data ? data.data.items : (data.items || []);
          const totalItems = data.data ? (data.data.total_items || 0) : (data.total_items || 0);
          const totalAmount = data.data ? (data.data.total_amount || 0) : (data.total_amount || 0);

          // Convert API data to proper types (similar to ProductDetailPage fix)
          items = items.map((item: any) => ({
            ...item,
            id: Number(item.id),
            product_id: Number(item.product_id),
            product_price: Number(item.product_price) || 0,
            quantity: Number(item.quantity) || 0,
            subtotal: Number(item.subtotal) || 0,
            stock_quantity: Number(item.stock_quantity) || 0,
            images: Array.isArray(item.images) ? item.images : []
          }));

          console.log('CartPage - Setting items:', items.length, 'items');
          console.log('CartPage - First item:', items[0]);

          setCartItems(items);
          setTotalItems(totalItems);
          setTotalAmount(totalAmount);
        } else {
          if (response.status === 401) {
            setError('Please login to view your cart');
          } else {
            setError('Failed to load cart');
          }
        }
      } catch (err) {
        console.error('Error loading cart:', err);
        setError('Failed to load cart');
      } finally {
        setLoading(false);
      }
    };

    fetchCart();
  }, []);

  const handleUpdateQuantity = async (cartId: number, newQuantity: number) => {
    const token = getToken();
    if (!token) return;

    try {
      const response = await fetch(`http://localhost:8000/cart/${cartId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ quantity: newQuantity }),
      });

      if (response.ok) {
        // Refresh cart data
        const data = await response.json();
        let items = data.data.items || [];
        items = items.map((item: any) => ({
          ...item,
          id: Number(item.id),
          product_id: Number(item.product_id),
          product_price: Number(item.product_price) || 0,
          quantity: Number(item.quantity) || 0,
          subtotal: Number(item.subtotal) || 0,
          stock_quantity: Number(item.stock_quantity) || 0,
          images: Array.isArray(item.images) ? item.images : []
        }));
        setCartItems(items);
        setTotalItems(data.data.total_items || 0);
        setTotalAmount(data.data.total_amount || 0);
      } else {
        alert('Failed to update quantity');
      }
    } catch (err) {
      console.error('Error updating quantity:', err);
      alert('Failed to update quantity');
    }
  };

  const handleRemoveItem = async (cartId: number) => {
    const token = getToken();
    if (!token) return;

    try {
      const response = await fetch(`http://localhost:8000/cart/${cartId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,

      }});

      if (response.ok) {
        // Refresh cart data
        const data = await response.json();
        let items = data.data.items || [];
        items = items.map((item: any) => ({
          ...item,
          id: Number(item.id),
          product_id: Number(item.product_id),
          product_price: Number(item.product_price) || 0,
          quantity: Number(item.quantity) || 0,
          subtotal: Number(item.subtotal) || 0,
          stock_quantity: Number(item.stock_quantity) || 0,
          images: Array.isArray(item.images) ? item.images : []
        }));
        setCartItems(items);
        setTotalItems(data.data.total_items || 0);
        setTotalAmount(data.data.total_amount || 0);
        alert('Item removed from cart');
      } else {
        alert('Failed to remove item');
      }
    } catch (err) {
      console.error('Error removing item:', err);
      alert('Failed to remove item');
    }
  };

  const handleCheckout = () => {
    navigate('/checkout');
  };

  const subtotal = totalAmount;
  const shipping = subtotal > 100 ? 0 : 9.99;
  const tax = subtotal * 0.08; // 8% tax
  const total = subtotal + shipping + tax;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading cart...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => navigate('/login')}>Login</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-8">Shopping Cart</h1>

      {cartItems.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-slate-600 dark:text-slate-400 text-lg mb-4">Your cart is empty</p>
          <Button onClick={() => navigate('/products')}>Continue Shopping</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-6">
            {cartItems.map((item) => (
              <div key={item.id} className="flex gap-6 p-6 bg-white dark:bg-slate-800 rounded-lg shadow-md">
                <img
                  alt={item.product_name}
                  className="w-24 h-24 object-cover rounded-md"
                  src={item.images && item.images.length > 0 ? item.images[0] : 'https://images.unsplash.com/photo-1571910258025-e3a1b0d6a30c?w=200&h=200&fit=crop'}
                />
                <div className="flex-1">
                  <h3 className="font-semibold text-lg">{item.product_name}</h3>
                  <p className="text-slate-600 dark:text-slate-400">SKU: {item.sku}</p>
                  <p className="font-bold text-blue-500 mt-2">${item.product_price.toFixed(2)} each</p>
                  <p className="text-sm text-slate-500 mt-1">Subtotal: ${item.subtotal.toFixed(2)}</p>
                  {item.quantity > item.stock_quantity && (
                    <p className="text-red-500 text-sm mt-1">Only {item.stock_quantity} available</p>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center border rounded-md">
                    <button
                      className="px-3 py-1 hover:bg-slate-100 dark:hover:bg-slate-700"
                      onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                      disabled={item.quantity <= 1}
                    >
                      -
                    </button>
                    <span className="px-3 py-1">{item.quantity}</span>
                    <button
                      className="px-3 py-1 hover:bg-slate-100 dark:hover:bg-slate-700"
                      onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                      disabled={item.quantity >= item.stock_quantity}
                    >
                      +
                    </button>
                  </div>
                  <button
                    className="text-red-500 hover:text-red-700"
                    onClick={() => handleRemoveItem(item.id)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-md h-fit">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
            <div className="space-y-2 mb-4">
              <div className="flex justify-between">
                <span>Subtotal ({totalItems} items)</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax</span>
                <span>${tax.toFixed(2)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-bold">
                <span>Total</span>
                <span>${total.toFixed(2)}</span>
              </div>
            </div>
            <Button size="lg" className="w-full" onClick={handleCheckout}>
              Proceed to Checkout
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;
