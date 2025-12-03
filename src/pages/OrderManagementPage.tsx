import React, { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';

interface Order {
  id: number;
  order_number: string;
  user_id: number;
  status: string;
  total_amount: number;
  ordered_at: string;
  first_name: string;
  last_name: string;
  email: string;
  shipping_city?: string;
  shipping_country?: string;
}

interface OrderResponse {
  orders: Order[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

const OrderManagementPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<OrderResponse['pagination'] | null>(null);
  const [updatingOrder, setUpdatingOrder] = useState<number | null>(null);
  const [hasInteractedWithSearch, setHasInteractedWithSearch] = useState(false);

  const fetchOrders = async (page: number = 1, status: string = '') => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      });

      if (status && status !== '') {
        params.append('status', status);
      }

      const response = await fetch(`http://localhost:8000/admin/orders?${params}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('API Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error response:', errorText);
        throw new Error(`Failed to fetch orders: ${response.status} - ${errorText}`);
      }

      const responseData = await response.json();
      console.log('Orders received:', responseData.data?.orders?.length || 0, 'orders');

      // Apply client-side search filtering if search term exists
      let ordersToDisplay = responseData.data?.orders || [];
      if (searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase();
        ordersToDisplay = ordersToDisplay.filter((order: Order) =>
          order.order_number.toLowerCase().includes(searchLower) ||
          `${order.first_name} ${order.last_name}`.toLowerCase().includes(searchLower) ||
          order.email.toLowerCase().includes(searchLower)
        );
      }

      setOrders(ordersToDisplay);
      setPagination(responseData.data?.pagination);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(currentPage, statusFilter);
  }, [currentPage, statusFilter]);

  useEffect(() => {
    // Only trigger search if user has interacted with the search input
    if (!hasInteractedWithSearch) return;

    // Debounce search - reset to page 1 when search term changes
    const timeoutId = setTimeout(() => {
      if (currentPage !== 1) {
        setCurrentPage(1);
      }
      // Re-fetch orders when search term changes
      fetchOrders(1, statusFilter);
    }, 1500);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, hasInteractedWithSearch]);



  const getStatusClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'processing':
        return 'px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'shipped':
        return 'px-2 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300';
      case 'delivered':
        return 'px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'cancelled':
        return 'px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default:
        return 'px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const handleStatusChange = async (orderId: number, newStatus: string) => {
    setUpdatingOrder(orderId);

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`http://localhost:8000/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error(`Failed to update order status: ${response.status}`);
      }

      // Refresh orders to show updated status
      await fetchOrders(currentPage, statusFilter);
    } catch (err) {
      console.error('Error updating order status:', err);
      setError(err instanceof Error ? err.message : 'Failed to update order status');
    } finally {
      setUpdatingOrder(null);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  if (loading) {
    return (
      <AdminLayout title="Order Management">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-slate-600">Loading orders...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout title="Order Management">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading orders</h3>
              <p className="mt-2 text-sm text-red-700">{error}</p>
              <button
                onClick={() => fetchOrders(currentPage, statusFilter)}
                className="mt-3 bg-red-100 hover:bg-red-200 text-red-800 px-3 py-2 rounded-md text-sm font-medium"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Order Management">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex justify-between items-center">
          <div>
            <p className="text-slate-600">View and manage customer orders</p>
          </div>
          <div className="flex space-x-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search orders..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => setHasInteractedWithSearch(true)}
                onClick={() => setHasInteractedWithSearch(true)}
                className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                search
              </span>
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Orders Table */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-blue-500 text-white">
                <tr>
                  <th className="px-6 py-3" scope="col">Order #</th>
                  <th className="px-6 py-3" scope="col">Customer</th>
                  <th className="px-6 py-3" scope="col">Location</th>
                  <th className="px-6 py-3" scope="col">Date</th>
                  <th className="px-6 py-3" scope="col">Total</th>
                  <th className="px-6 py-3" scope="col">Status</th>
                  <th className="px-6 py-3" scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {(() => {
                  console.log('Render time - orders:', orders);
                  console.log('Render time - orders.length:', orders?.length);
                  console.log('Render time - condition check:', !orders || orders.length === 0);
                  return (!orders || orders.length === 0) ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                        No orders found
                      </td>
                    </tr>
                  ) : (
                    orders.map((order) => (
                      <tr key={order.id} className="bg-white border-b border-slate-200 hover:bg-slate-50">
                        <td className="px-6 py-4 font-medium whitespace-nowrap text-slate-900">
                          {order.order_number}
                        </td>
                        <td className="px-6 py-4">
                          <div>
                            <div className="font-medium text-slate-900">
                              {order.first_name} {order.last_name}
                            </div>
                            <div className="text-slate-500 text-xs">
                              {order.email}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-600">
                          {order.shipping_city && order.shipping_country
                            ? `${order.shipping_city}, ${order.shipping_country}`
                            : 'N/A'
                          }
                        </td>
                        <td className="px-6 py-4">{formatDate(order.ordered_at)}</td>
                        <td className="px-6 py-4 font-medium">${Number(order.total_amount).toFixed(2)}</td>
                        <td className="px-6 py-4">
                          <span className={getStatusClass(order.status)}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <select
                            value={order.status}
                            onChange={(e) => handleStatusChange(order.id, e.target.value)}
                            disabled={updatingOrder === order.id}
                            className="px-3 py-1.5 text-xs border border-slate-300 rounded-md bg-white disabled:opacity-50"
                          >
                            <option value="pending">Pending</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                      </tr>
                    ))
                  );
                })()}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination && pagination.total_pages > 1 && orders && orders.length > 0 && (
            <nav aria-label="Table navigation" className="flex items-center justify-between p-4 border-t border-slate-200">
              <span className="text-sm font-normal text-slate-500">
                Showing <span className="font-semibold text-slate-900">
                  {((pagination.page - 1) * pagination.limit) + 1}
                </span> to <span className="font-semibold text-slate-900">
                  {Math.min(pagination.page * pagination.limit, pagination.total)}
                </span> of <span className="font-semibold text-slate-900">
                  {pagination.total}
                </span>
              </span>
              <ul className="inline-flex items-center -space-x-px">
                <li>
                  <button
                    onClick={() => handlePageChange(pagination.page - 1)}
                    disabled={pagination.page <= 1}
                    className="px-3 py-2 ml-0 leading-tight text-slate-500 bg-white border border-slate-300 rounded-l-lg hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Previous
                  </button>
                </li>
                {Array.from({ length: pagination.total_pages }, (_, i) => i + 1).map((page) => (
                  <li key={page}>
                    <button
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-2 leading-tight border ${
                        page === pagination.page
                          ? 'text-white border-blue-300 bg-blue-600 hover:bg-blue-100 hover:text-blue-700'
                          : 'text-slate-500 bg-white border-slate-300 hover:bg-slate-100 hover:text-slate-700'
                      }`}
                    >
                      {page}
                    </button>
                  </li>
                ))}
                <li>
                  <button
                    onClick={() => handlePageChange(pagination.page + 1)}
                    disabled={pagination.page >= pagination.total_pages}
                    className="px-3 py-2 leading-tight text-slate-500 bg-white border border-slate-300 rounded-r-lg hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                  </button>
                </li>
              </ul>
            </nav>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default OrderManagementPage;
