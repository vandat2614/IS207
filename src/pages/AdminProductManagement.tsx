import React, { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string | null;
  quantity: number;
  created_at: string;
}

const AdminProductManagement: React.FC = () => {
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      setLoading(true);
      const response = await fetch('http://localhost:8000/admin/products', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setProducts(data.data?.products || []);
        setError('');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to load products');
      }
    } catch (err) {
      setError('Failed to connect to server');
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedProducts(products.map(p => p.id));
    } else {
      setSelectedProducts([]);
    }
  };

  const handleSelectProduct = (productId: number) => {
    setSelectedProducts(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const getStatusClass = (quantity: number) => {
    if (quantity === 0) {
      return 'px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800';
    } else if (quantity < 10) {
      return 'px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800';
    } else {
      return 'px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800';
    }
  };

  const getStatusText = (quantity: number) => {
    if (quantity === 0) return 'Out of Stock';
    if (quantity < 10) return 'Low Stock';
    return 'In Stock';
  };

  const handleEdit = (productId: number) => {
    console.log('Edit product:', productId);
    // TODO: Implement edit modal
  };

  const handleDelete = async (productId: number) => {
    try {
      const token = localStorage.getItem('authToken');

      const response = await fetch(`http://localhost:8000/admin/products/${productId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        // Remove from local state
        setProducts(prevProducts => prevProducts.filter(p => p.id !== productId));
        setError('');
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to delete product');
      }
    } catch (err) {
      setError('Failed to connect to server');
      console.error('Error deleting product:', err);
    } finally {
      setShowDeleteConfirm(null);
    }
  };

  const handleAddProduct = () => {
    console.log('Add new product');
    // TODO: Implement add product modal
  };

  return (
    <AdminLayout title="Product Management">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex justify-between items-center">
          <div>
            <p className="text-slate-600">Manage your product catalog and inventory</p>
          </div>
          <button
            onClick={handleAddProduct}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
          >
            <span className="material-icons text-sm mr-2">add</span>
            Add Product
          </button>
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

        {/* Products Table */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
              <p className="text-slate-600">Loading products...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="p-8 text-center">
              <span className="material-icons text-4xl text-slate-400 mb-2">inventory_2</span>
              <h3 className="text-lg font-medium text-slate-900 mb-2">No products found</h3>
              <p className="text-slate-500 mb-4">Start by adding your first product</p>
              <button
                onClick={handleAddProduct}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg flex items-center mx-auto"
              >
                <span className="material-icons text-sm mr-2">add</span>
                Add First Product
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-700 uppercase bg-slate-50">
                  <tr>
                    <th className="p-4" scope="col">
                      <input
                        type="checkbox"
                        checked={selectedProducts.length === products.length}
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded border-slate-300"
                      />
                    </th>
                    <th className="px-6 py-3" scope="col">Product Name</th>
                    <th className="px-6 py-3" scope="col">Category</th>
                    <th className="px-6 py-3" scope="col">Price</th>
                    <th className="px-6 py-3" scope="col">Quantity</th>
                    <th className="px-6 py-3" scope="col">Status</th>
                    <th className="px-6 py-3" scope="col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.id} className="bg-white border-b border-slate-200 hover:bg-slate-50">
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={selectedProducts.includes(product.id)}
                          onChange={() => handleSelectProduct(product.id)}
                          className="rounded border-slate-300"
                        />
                      </td>
                      <th className="px-6 py-4 font-medium whitespace-nowrap text-slate-900 flex items-center" scope="row">
                        <div className="w-10 h-10 bg-slate-200 rounded-md mr-4 flex items-center justify-center overflow-hidden">
                          {product.image ? (
                            <img
                              alt={product.name}
                              className="w-full h-full object-cover"
                              src={`/${product.image}`}
                              onError={(e) => {
                                (e.target as HTMLImageElement).style.display = 'none';
                                (e.target as HTMLImageElement).nextElementSibling!.classList.remove('hidden');
                              }}
                            />
                          ) : null}
                          <span className="material-icons text-slate-500 text-base">image</span>
                        </div>
                        <div>
                          <div className="text-sm font-medium text-slate-900">{product.name}</div>
                          <div className="text-xs text-slate-500">ID: {product.id}</div>
                        </div>
                      </th>
                      <td className="px-6 py-4">{product.category || 'N/A'}</td>
                      <td className="px-6 py-4">${Number(product.price || 0).toFixed(2)}</td>
                      <td className="px-6 py-4">{product.quantity || 0}</td>
                      <td className="px-6 py-4">
                        <span className={getStatusClass(product.quantity || 0)}>
                          {getStatusText(product.quantity || 0)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleEdit(product.id)}
                          className="text-blue-500 hover:text-blue-900 mr-2"
                          title="Edit"
                        >
                          <span className="material-icons text-base">edit</span>
                        </button>
                        <button
                          onClick={() => setShowDeleteConfirm(product.id)}
                          className="text-red-500 hover:text-red-900"
                          title="Delete"
                        >
                          <span className="material-icons text-base">delete</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {showDeleteConfirm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Confirm Delete</h3>
                <p className="text-slate-600 mb-6">
                  Are you sure you want to delete this product? This action cannot be undone.
                </p>
                <div className="flex justify-end space-x-4">
                  <button
                    onClick={() => setShowDeleteConfirm(null)}
                    className="px-4 py-2 text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleDelete(showDeleteConfirm)}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
                  >
                    Delete Product
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Pagination */}
          {!loading && products.length > 0 && (
            <nav aria-label="Table navigation" className="flex items-center justify-between p-4 border-t border-slate-200">
              <span className="text-sm font-normal text-slate-500">
                Showing <span className="font-semibold text-slate-900">1-{products.length}</span> of <span className="font-semibold text-slate-900">{products.length}</span>
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
                  <button className="px-3 py-2 leading-tight text-slate-500 bg-white border border-slate-300 hover:bg-slate-100 hover:text-slate-700">
                    2
                  </button>
                </li>
                <li>
                  <button className="px-3 py-2 leading-tight text-slate-500 bg-white border border-slate-300 hover:bg-slate-100 hover:text-slate-700">
                    3
                  </button>
                </li>
                <li>
                  <button className="px-3 py-2 leading-tight text-slate-500 bg-white border border-slate-300 rounded-r-lg hover:bg-slate-100 hover:text-slate-700">
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

export default AdminProductManagement;
