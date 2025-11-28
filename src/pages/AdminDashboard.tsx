import React, { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend);

interface DashboardStats {
  error: boolean;
  message: string;
  data: {
    stats: {
      total_users: number;
      total_products: number;
      total_orders: number;
      total_revenue: number;
      order_status_breakdown: Array<{
        status: string;
        count: number;
      }>;
      monthly_revenue: Array<{
        month: string;
        revenue: number;
      }>;
    };
    recent_orders: Array<{
      id: number;
      order_number: string;
      total_amount: number;
      status: string;
      ordered_at: string;
      first_name: string;
      last_name: string;
      email: string;
    }>;
  };
}

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardStats = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch('http://localhost:8000/admin/dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch dashboard stats: ${response.status}`);
      }

      const data = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getStatusClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800';
      case 'processing':
        return 'px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800';
      case 'shipped':
        return 'px-2 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-800';
      case 'delivered':
        return 'px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800';
      case 'cancelled':
        return 'px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800';
      default:
        return 'px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-slate-600">Loading dashboard...</p>
          </div>
        </div>
      </AdminLayout>
    );
  }

  if (error || !stats) {
    return (
      <AdminLayout title="Dashboard">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading dashboard</h3>
              <p className="mt-2 text-sm text-red-700">{error || 'Failed to load dashboard data'}</p>
              <button
                onClick={() => fetchDashboardStats()}
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
    <AdminLayout title="Dashboard">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg mr-4">
              <span className="material-icons text-blue-600">people</span>
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-500">Total Users</h3>
              <p className="text-2xl font-bold text-slate-900">{stats.data.stats.total_users}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg mr-4">
              <span className="material-icons text-green-600">inventory</span>
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-500">Total Products</h3>
              <p className="text-2xl font-bold text-slate-900">{stats.data.stats.total_products}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-purple-100 rounded-lg mr-4">
              <span className="material-icons text-purple-600">shopping_cart</span>
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-500">Total Orders</h3>
              <p className="text-2xl font-bold text-slate-900">{stats.data.stats.total_orders}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-yellow-100 rounded-lg mr-4">
              <span className="material-icons text-yellow-600">analytics</span>
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-500">Revenue</h3>
              <p className="text-2xl font-bold text-slate-900">{formatCurrency(stats.data.stats.total_revenue)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Orders</h2>
          {stats.data.recent_orders.length > 0 ? (
            <div className="space-y-3">
              {stats.data.recent_orders.map((order: any) => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{order.order_number}</p>
                    <p className="text-sm text-slate-600">{order.first_name} {order.last_name}</p>
                    <p className="text-xs text-slate-500">{formatDate(order.ordered_at)}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-slate-900">{formatCurrency(order.total_amount)}</p>
                    <span className={getStatusClass(order.status)}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <span className="material-icons text-4xl text-slate-400 mb-2">receipt_long</span>
              <p className="text-slate-500">No orders yet</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Order Status Distribution</h2>
          <div className="h-64">
            <Pie
              data={{
                labels: stats.data.stats.order_status_breakdown.map(item =>
                  item.status.charAt(0).toUpperCase() + item.status.slice(1)
                ),
                datasets: [{
                  data: stats.data.stats.order_status_breakdown.map(item => item.count),
                  backgroundColor: [
                    '#fef3c7', // yellow-100 (pending)
                    '#e0e7ff', // indigo-100 (shipped)
                    '#fecaca', // red-200 (cancelled - light red)
                    '#dbeafe', // blue-100 (processing)
                    '#dcfce7', // green-100 (delivered)
                  ],
                  borderColor: [
                    '#f59e0b', // yellow-500
                    '#6366f1', // indigo-500
                    '#dc2626', // red-600
                    '#3b82f6', // blue-500
                    '#10b981', // green-500
                  ],
                  borderWidth: 2,
                }],
              }}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'bottom' as const,
                    labels: {
                      padding: 20,
                      usePointStyle: true,
                    },
                  },
                  tooltip: {
                    callbacks: {
                      label: function(context) {
                        const label = context.label || '';
                        const value = context.parsed || 0;
                        const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                        const percentage = total > 0 ? Math.round((value / total) * 100) : 0;
                        return `${label}: ${value} (${percentage}%)`;
                      }
                    }
                  }
                },
              }}
            />
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
