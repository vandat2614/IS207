import React, { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalProducts: 0,
    totalOrders: 0,
    recentOrders: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading and set demo stats
    setTimeout(() => {
      setStats({
        totalUsers: 0,
        totalProducts: 0,
        totalOrders: 0,
        recentOrders: []
      });
      setLoading(false);
    }, 1000);
  }, []);

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
              <p className="text-2xl font-bold text-slate-900">{stats.totalUsers}</p>
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
              <p className="text-2xl font-bold text-slate-900">{stats.totalProducts}</p>
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
              <p className="text-2xl font-bold text-slate-900">{stats.totalOrders}</p>
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
              <p className="text-2xl font-bold text-slate-900">$0</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Recent Orders</h2>
          <div className="text-center py-8">
            <span className="material-icons text-4xl text-slate-400 mb-2">receipt_long</span>
            <p className="text-slate-500">No orders yet</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Quick Actions</h2>
          <div className="space-y-3">
            <button className="w-full text-left p-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors">
              <span className="material-icons text-blue-500 mr-3">add_circle</span>
              Add New Product
            </button>
            <button className="w-full text-left p-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors">
              <span className="material-icons text-green-500 mr-3">view_list</span>
              View All Orders
            </button>
            <button className="w-full text-left p-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors">
              <span className="material-icons text-purple-500 mr-3">people</span>
              Manage Customers
            </button>
            <button className="w-full text-left p-3 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors">
              <span className="material-icons text-orange-500 mr-3">settings</span>
              System Settings
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
