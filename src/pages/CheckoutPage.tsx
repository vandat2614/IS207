import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

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

interface Address {
  id: number;
  address_type: string;
  first_name: string;
  last_name: string;
  street_address: string;
  apartment: string;
  city: string;
  state_province: string;
  postal_code: string;
  country: string;
}

const CheckoutPage: React.FC = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [paymentMethod, setPaymentMethod] = useState('Credit Card');
  const [cardInfo, setCardInfo] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: ''
  });

  const getToken = () => localStorage.getItem('authToken');

  // Fetch cart and addresses on component mount
  useEffect(() => {
    const fetchCheckoutData = async () => {
      const token = getToken();
      if (!token) {
        setError('Please login to checkout');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Fetch cart data
        const cartResponse = await fetch('http://localhost:8000/cart', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (cartResponse.ok) {
          const cartData = await cartResponse.json();
          const items = cartData.data.items || [];
          setCartItems(items);

          // Redirect to cart if empty
          if (items.length === 0) {
            navigate('/cart');
            return;
          }
        } else {
          throw new Error('Failed to load cart');
        }

        // Fetch user addresses
        const profileResponse = await fetch('http://localhost:8000/profile', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (profileResponse.ok) {
          const profileData = await profileResponse.json();
          const userAddresses = profileData.data.addresses || [];
          setAddresses(userAddresses);

          // Auto-select first address if available
          if (userAddresses.length > 0) {
            setSelectedAddressId(userAddresses[0].id);
          }
        }

      } catch (err) {
        console.error('Error loading checkout data:', err);
        setError('Failed to load checkout information');
      } finally {
        setLoading(false);
      }
    };

    fetchCheckoutData();
  }, [navigate]);

  const handleCardChange = (field: string, value: string) => {
    setCardInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const token = getToken();
    if (!token) {
      setError('Please login to place order');
      return;
    }

    if (!selectedAddressId) {
      setError('Please select a shipping address');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // Prepare cart items for order
      const cartItemsForOrder = cartItems.map(item => ({
        id: item.product_id,
        quantity: item.quantity
      }));

      const orderData = {
        cart_items: cartItemsForOrder,
        shipping_address_id: selectedAddressId,
        payment_method: paymentMethod,
        notes: 'Order placed through website'
      };

      const response = await fetch('http://localhost:8000/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(orderData),
      });

      const data = await response.json();

      if (response.ok && data.error === false) {
        alert(`Order placed successfully! Order number: ${data.data.order.order_number}`);
        navigate('/profile'); // Redirect to profile to see order
      } else {
        setError(data.message || 'Failed to place order');
      }

    } catch (err) {
      console.error('Error placing order:', err);
      setError('Failed to place order. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // Calculate totals
  const subtotal = cartItems.reduce((sum, item) => sum + item.subtotal, 0);
  const shipping = subtotal > 100 ? 0 : 9.99;
  const tax = subtotal * 0.08; // 8% tax
  const total = subtotal + shipping + tax;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading checkout...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-8">Checkout</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 xl:gap-12">
          {/* Shipping and Payment Form */}
          <div className="lg:col-span-2 space-y-8">
            {/* Shipping Address Selection */}
            <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6">
                Shipping Address
              </h2>

              {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded">
                  <p className="text-red-600 text-sm">{error}</p>
                </div>
              )}

              {addresses.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-slate-600 dark:text-slate-400 mb-4">No shipping addresses found.</p>
                  <p className="text-sm text-slate-500">Please add an address in your profile to continue.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {addresses.map((address) => (
                    <div key={address.id} className="border border-slate-200 dark:border-slate-600 rounded-lg p-4">
                      <label className="flex items-start space-x-3 cursor-pointer">
                        <input
                          type="radio"
                          name="shipping_address"
                          value={address.id}
                          checked={selectedAddressId === address.id}
                          onChange={(e) => setSelectedAddressId(parseInt(e.target.value))}
                          className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300"
                        />
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="font-medium text-slate-900 dark:text-white capitalize">
                              {address.address_type.toLowerCase()}
                            </span>
                          </div>
                          <div className="text-sm text-slate-600 dark:text-slate-400 space-y-1">
                            <p>{address.first_name} {address.last_name}</p>
                            <p>{address.street_address}</p>
                            {address.apartment && <p>{address.apartment}</p>}
                            <p>{address.city}, {address.state_province} {address.postal_code}</p>
                            <p>{address.country}</p>
                          </div>
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Payment Method */}
            <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6">
                Payment Method
              </h2>

              <div className="space-y-6">
                <div className="flex items-center">
                  <input
                    id="credit-card"
                    name="payment-method"
                    type="radio"
                    value="Credit Card"
                    checked={paymentMethod === 'Credit Card'}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 dark:border-slate-600"
                  />
                  <label htmlFor="credit-card" className="ml-3 block text-sm font-medium text-slate-900 dark:text-white">
                    Credit Card
                  </label>
                </div>

                <div className="space-y-6 ml-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      Card Number
                    </label>
                    <input
                      type="text"
                      placeholder="0000 0000 0000 0000"
                      value={cardInfo.cardNumber}
                      onChange={(e) => handleCardChange('cardNumber', e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        Expiry Date (MM/YY)
                      </label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        value={cardInfo.expiryDate}
                        onChange={(e) => handleCardChange('expiryDate', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                        CVV
                      </label>
                      <input
                        type="text"
                        placeholder="CVV"
                        value={cardInfo.cvv}
                        onChange={(e) => handleCardChange('cvv', e.target.value)}
                        className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-lg shadow-sm sticky top-24">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6">
                Order Summary
              </h2>

              <div className="space-y-4">
                {cartItems.map((item) => (
                  <div key={item.id} className="flex justify-between text-slate-600 dark:text-slate-400 text-sm">
                    <span>{item.product_name} x {item.quantity}</span>
                    <span>${item.subtotal.toFixed(2)}</span>
                  </div>
                ))}

                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>Subtotal</span>
                  <span>${subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>Shipping</span>
                  <span>{shipping === 0 ? 'Free' : `$${shipping.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between text-slate-600 dark:text-slate-300">
                  <span>Tax</span>
                  <span>${tax.toFixed(2)}</span>
                </div>

                <hr className="border-slate-200 dark:border-slate-700" />

                <div className="flex justify-between text-lg font-bold text-slate-900 dark:text-white">
                  <span>Total</span>
                  <span>${total.toFixed(2)}</span>
                </div>
              </div>

              <button
                onClick={handleSubmit}
                disabled={submitting || !selectedAddressId}
                className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-lg mt-8 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {submitting ? 'Placing Order...' : 'Place Order'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
