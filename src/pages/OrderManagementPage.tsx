import React, { useState } from 'react';
import AdminLayout from '../components/AdminLayout';

const OrderManagementPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Mock orders data
  const orders = [
    {
      id: 'ORD-00124',
      customer: 'John Doe',
      date: '2023-10-26',
      total: 150.00,
      status: 'Pending',
      statusColor: 'yellow'
    },
    {
      id: 'ORD-00123',
      customer: 'Jane Smith',
      date: '2023-10-25',
      total: 79.99,
      status: 'Shipped',
      statusColor: 'blue'
    },
    {
      id: 'ORD-00122',
      customer: 'Sam Wilson',
      date: '2023-10-24',
      total: 250.50,
      status: 'Delivered',
      statusColor: 'green'
    },
    {
      id: 'ORD-00121',
      customer: 'Emily Brown',
      date: '2023-10-23',
      total: 45.00,
      status: 'Cancelled',
      statusColor: 'gray'
    }
  ];

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.customer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status.toLowerCase() === statusFilter.toLowerCase();

    return matchesSearch && matchesStatus;
  });

  const getStatusClass = (statusColor: string) => {
    switch (statusColor) {
      case 'yellow':
        return 'px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'blue':
        return 'px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'green':
        return 'px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'gray':
        return 'px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default:
        return 'px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const handleStatusChange = (orderId: string, newStatus: string) => {
    console.log(`Changing order ${orderId} status to ${newStatus}`);
    // TODO: Implement status update
  };

  return (
    <AdminLayout title="Order Management">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex justify-between items-center">
          <div>
            <p className="text-slate-600">View and manage customer orders</p>
          </div>
          <div className="flex space-x-4">
            <input
              type="text"
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
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
              <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                <tr>
                  <th className="px-6 py-3" scope="col">Order ID</th>
                  <th className="px-6 py-3" scope="col">Customer</th>
                  <th className="px-6 py-3" scope="col">Date</th>
                  <th className="px-6 py-3" scope="col">Total</th>
                  <th className="px-6 py-3" scope="col">Status</th>
                  <th className="px-6 py-3" scope="col">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr key={order.id} className="bg-white border-b border-slate-200 hover:bg-slate-50">
                    <td className="px-6 py-4 font-medium whitespace-nowrap text-slate-900">
                      {order.id}
                    </td>
                    <td className="px-6 py-4">{order.customer}</td>
                    <td className="px-6 py-4">{order.date}</td>
                    <td className="px-6 py-4">${order.total.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className={getStatusClass(order.statusColor)}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex gap-2">
                        <button className="px-3 py-1.5 rounded-md border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 text-xs font-medium">
                          View Details
                        </button>
                        <button className="px-3 py-1.5 rounded-md border border-green-300 bg-green-50 hover:bg-green-100 text-green-700 text-xs font-medium">
                          Update Status
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <nav aria-label="Table navigation" className="flex items-center justify-between p-4 border-t border-slate-200">
            <span className="text-sm font-normal text-slate-500">
              Showing <span className="font-semibold text-slate-900">1-{filteredOrders.length}</span> of <span className="font-semibold text-slate-900">{orders.length}</span>
            </span>
            <ul className="inline-flex items-center -space-x-px">
              <li>
                <button className="px-3 py-2 ml-0 leading-tight text-slate-500 bg-white border border-slate-300 rounded-l-lg hover:bg-slate-100 hover:text-slate-700">
                  Previous
                </button>
              </li>
              <li>
                <button aria-current="page" className="z-10 px-3 py-2 leading-tight text-white border border-blue-300 bg-blue-600 hover:bg-blue-100 hover:text-blue-700">
                  1
                </button>
              </li>
              <li>
                <button className="px-3 py-2 leading-tight text-slate-500 bg-white border border-slate-300 rounded-r-lg hover:bg-slate-100 hover:text-slate-700">
                  Next
                </button>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </AdminLayout>
  );
};

export default OrderManagementPage;
