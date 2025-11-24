import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const AdminSidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const isAdminPage = location.pathname.startsWith('/admin');
  if (!isAdminPage) return null;

  const menuItems = [
    {
      name: 'Dashboard',
      path: '/admin/dashboard',
      icon: 'dashboard',
      description: 'Overview and analytics'
    },
    {
      name: 'Orders',
      path: '/admin/orders',
      icon: 'shopping_cart',
      description: 'Manage customer orders'
    },
    {
      name: 'Products',
      path: '/admin/products',
      icon: 'inventory',
      description: 'Add, edit, delete products'
    },
    {
      name: 'Customers',
      path: '/admin/users',
      icon: 'people',
      description: 'User management'
    },
    {
      name: 'Settings',
      path: '/admin/settings',
      icon: 'settings',
      description: 'System configuration'
    }
  ];

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    navigate('/');
  };

  const isActiveLink = (path: string) => {
    if (path === '/admin/dashboard' && location.pathname === '/admin/dashboard') return true;
    if (path !== '/admin/dashboard' && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-slate-900 text-white shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-center h-16 border-b border-slate-700">
        <h2 className="text-lg font-bold text-slate-100">Admin Panel</h2>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 py-6 px-4">
        <ul className="space-y-2">
          {menuItems.map((item) => (
            <li key={item.path}>
              <Link
                to={item.path}
                className={`group flex items-center px-3 py-3 text-sm font-medium rounded-lg transition-colors duration-200 ${
                  isActiveLink(item.path)
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
                title={item.description}
              >
                <span className={`material-icons text-base mr-3 ${
                  isActiveLink(item.path) ? 'text-white' : 'text-slate-400 group-hover:text-slate-300'
                }`}>
                  {item.icon}
                </span>
                {item.name}
              </Link>
            </li>
          ))}
        </ul>

        {/* Logout Button */}
        <div className="mt-8 pt-6 border-t border-slate-700">
          <Link
            to="/"
            className="w-full group flex items-center px-3 py-2 mb-2 text-slate-400 hover:bg-slate-800 text-sm font-medium rounded-lg transition-colors duration-200"
            title="Return to homepage"
          >
            <span className="material-icons text-base mr-3 group-hover:text-slate-300">home</span>
            Back to Homepage
          </Link>
          <button
            onClick={handleLogout}
            className="w-full group flex items-center px-3 py-2 text-slate-400 hover:bg-red-600 hover:text-white text-sm font-medium rounded-lg transition-colors duration-200"
            title="Logout from admin panel"
          >
            <span className="material-icons text-base mr-3 text-slate-400 group-hover:text-white">logout</span>
            Logout
          </button>
        </div>
      </nav>

      {/* Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-700">
        <p className="text-xs text-slate-400 text-center">
          Ecommerce Admin v1.0
        </p>
      </div>
    </div>
  );
};

export default AdminSidebar;
