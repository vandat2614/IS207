import React, { useEffect, useState } from 'react';
import AdminLayout from '../components/AdminLayout';

interface User {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  created_at: string;
}

const AdminUsers: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingUser, setUpdatingUser] = useState<number | null>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState<number | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      setLoading(true);
      const response = await fetch('http://localhost:8000/admin/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setUsers(data.data?.users || []);
        setError('');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to load users');
      }
    } catch (err) {
      setError('Failed to connect to server');
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: number, newRole: string) => {
    try {
      setUpdatingUser(userId);
      const token = localStorage.getItem('authToken');

      const response = await fetch(`http://localhost:8000/admin/users/role/${userId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ role: newRole })
      });

      if (response.ok) {
        // Update local state
        setUsers(prevUsers =>
          prevUsers.map(user =>
            user.id === userId ? { ...user, role: newRole } : user
          )
        );
        setError('');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to update user role');
      }
    } catch (err) {
      setError('Failed to connect to server');
      console.error('Error updating user role:', err);
    } finally {
      setUpdatingUser(null);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    try {
      const token = localStorage.getItem('authToken');

      const response = await fetch(`http://localhost:8000/admin/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        // Remove from local state
        setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
        setError('');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to delete user');
      }
    } catch (err) {
      setError('Failed to connect to server');
      console.error('Error deleting user:', err);
    } finally {
      setShowConfirmDelete(null);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    return role === 'admin' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800';
  };

  const isCurrentUser = (userId: number) => {
    // This is a simplified check - in a real app you'd get current user ID from JWT
    return false; // Implement properly based on your JWT structure
  };

  return (
    <AdminLayout title="Customer Management">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex justify-between items-center">
          <div>
            <p className="text-slate-600">Manage customer accounts and admin users</p>
          </div>
          {/* <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center transition-colors">
            <span className="material-icons text-sm mr-2">person_add</span>
            Add User
          </button> */}
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative">
            <span className="block sm:inline">{error}</span>
            <button
              className="absolute top-0 bottom-0 right-0 px-4 py-3"
              onClick={() => setError('')}
            >
              <span className="text-red-500">×</span>
            </button>
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-slate-600">Loading users...</p>
            </div>
          ) : users.length === 0 ? (
            <div className="p-8 text-center">
              <span className="material-icons text-4xl text-slate-400 mb-2">people</span>
              <h3 className="text-lg font-medium text-slate-900 mb-2">No users found</h3>
              <p className="text-slate-500 mb-4">Users will appear here after they register</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Joined
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-slate-300 rounded-full flex items-center justify-center mr-3">
                            <span className="material-icons text-slate-600 text-sm">person</span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-slate-900">
                              {user.first_name} {user.last_name}
                            </div>
                            <div className="text-sm text-slate-500">ID: {user.id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {updatingUser === user.id ? (
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mr-2"></div>
                            Updating...
                          </div>
                        ) : (
                          <select
                            value={user.role}
                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                            disabled={updatingUser === user.id}
                            className={`inline-flex px-4 py-1 text-xs font-semibold rounded-full min-w-20 ${
                              user.role === 'admin'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-blue-100 text-blue-800'
                            } border-0 focus:ring-2 focus:ring-blue-500`}
                          >
                            <option value="user">User</option>
                            <option value="admin">Admin</option>
                          </select>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          {!isCurrentUser(user.id) && (
                            <button
                              onClick={() => setShowConfirmDelete(user.id)}
                              className="text-red-600 hover:text-red-900 p-1"
                              title="Delete user"
                            >
                              <span className="material-icons text-base">delete</span>
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {showConfirmDelete && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Confirm Delete</h3>
                <p className="text-slate-600 mb-6">
                  Are you sure you want to delete this user? This action cannot be undone.
                </p>
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => setShowConfirmDelete(null)}
                    className="px-4 py-2 text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDeleteUser(showConfirmDelete)}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                  >
                    Delete User
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Stats Card */}
        {/* {!loading && users.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <div className="flex items-center">
                <div className="p-3 bg-blue-100 rounded-lg mr-4">
                  <span className="material-icons text-blue-600">people</span>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-500">Total Users</h3>
                  <p className="text-2xl font-bold text-slate-900">{users.length}</p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <div className="flex items-center">
                <div className="p-3 bg-red-100 rounded-lg mr-4">
                  <span className="material-icons text-red-600">admin_panel_settings</span>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-500">Admins</h3>
                  <p className="text-2xl font-bold text-slate-900">
                    {users.filter(user => user.role === 'admin').length}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
              <div className="flex items-center">
                <div className="p-3 bg-green-100 rounded-lg mr-4">
                  <span className="material-icons text-green-600">person</span>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-slate-500">Customers</h3>
                  <p className="text-2xl font-bold text-slate-900">
                    {users.filter(user => user.role === 'user').length}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )} */}
      </div>
    </AdminLayout>
  );
};

export default AdminUsers;
