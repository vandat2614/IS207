import React from 'react';
import AdminSidebar from './AdminSidebar';

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children, title }) => {
  return (
    <div className="flex min-h-screen bg-slate-100">
      {/* Fixed Sidebar */}
      <AdminSidebar />

      {/* Main Content */}
      <div className="flex-1 ml-64">
        {/* Content Header */}
        {title && (
          <div className="bg-white shadow-sm border-b border-slate-200 px-8 py-6">
            <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          </div>
        )}

        {/* Page Content */}
        <div className="p-8">
          {children}
        </div>
      </div>
    </div>
  );
};

export default AdminLayout;
