import React, { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import AddProductModal from '../components/AddProductModal';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  category_name: string;
  image?: string | null;
  quantity: number;
  created_at: string;
  sku?: string;
  category_id?: number;
  status?: string;
  is_active?: boolean;
}

interface ProductResponse {
  products: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

const AdminProductManagement: React.FC = () => {
  const [selectedProducts, setSelectedProducts] = useState<number[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<number | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [addLoading, setAddLoading] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<ProductResponse['pagination'] | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    fetchProducts(currentPage);
  }, [currentPage]);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (currentPage !== 1) {
        setCurrentPage(1);
      }
      // Re-fetch products when search term changes
      fetchProducts(1, searchTerm);
    }, 1500); // 500ms debounce delay

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const fetchProducts = async (page: number = 1, search: string = '') => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      setLoading(true);
      setIsSearching(search.trim().length > 0);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      });

      if (search.trim()) {
        params.append('search', search.trim());
      }

      const response = await fetch(`http://localhost:8000/admin/products?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setProducts(data.data?.products || []);
        setPagination(data.data?.pagination);
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
      setIsSearching(false);
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
    const product = products.find(p => p.id === productId);
    if (product) {
      setEditingProduct(product);
      setShowAddModal(true);
    } else {
      setError('Product not found');
    }
  };

  const handleDelete = async (productId: number) => {
    try {
      const token = localStorage.getItem('authToken');

      const response = await fetch(`http://localhost:8000/products/${productId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        // Remove from local state
        setProducts(prevProducts => prevProducts.filter(p => p.id !== productId));
        setError('');
        alert('Product deleted successfully');
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
    setEditingProduct(null); // Clear any editing state
    setShowAddModal(true);
  };

  const handleAddProductSubmit = async (productData: any) => {
    console.log('Submitting product data:', productData); // Debug log
    try {
      setAddLoading(true);
      const token = localStorage.getItem('authToken');

      const response = await fetch('http://localhost:8000/admin/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` },
        body: JSON.stringify(productData)
      });

      console.log('Response status:', response.status); // Debug log

      if (response.ok) {
        const data = await response.json();
        console.log('Success response:', data); // Debug log
        setError('');
        alert('Product added successfully');
        setShowAddModal(false);
        // Refresh product list
        await fetchProducts();
      } else {
        const errorData = await response.json();
        console.log('Error response:', errorData); // Debug log
        setError(errorData.message || 'Failed to add product');
      }
    } catch (err) {
      console.error('Network error:', err); // Debug log
      setError('Failed to connect to server');
    } finally {
      setAddLoading(false);
    }
  };

  const handleEditProductSubmit = async (productData: any) => {
    if (!editingProduct) return;

    try {
      setEditLoading(true);
      const token = localStorage.getItem('authToken');

      const response = await fetch(`http://localhost:8000/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` },
        body: JSON.stringify(productData)
      });

      if (response.ok) {
        const data = await response.json();
        setError('');
        alert('Product updated successfully');
        setShowAddModal(false);
        setEditingProduct(null);
        // Refresh product list
        await fetchProducts(currentPage);
      } else {
        const errorData = await response.json();
        setError(errorData.message || 'Failed to update product');
      }
    } catch (err) {
      setError('Failed to connect to server');
      console.error('Error updating product:', err);
    } finally {
      setEditLoading(false);
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <AdminLayout title="Product Management">
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-slate-600">Manage your product catalog and inventory</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm w-64"
              />
              <span className="material-icons absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-lg">
                search
              </span>
              {isSearching && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                </div>
              )}
            </div>
            <button
              onClick={handleAddProduct}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center transition-colors"
            >
              <span className="material-icons text-sm mr-2">add</span>
              Add Product
            </button>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
            <span className="block sm:inline">{success}</span>
            <button
              className="absolute top-0 bottom-0 right-0 px-4 py-3"
              onClick={() => setSuccess('')}
            >
              <span className="text-green-500">×</span>
            </button>
          </div>
        )}

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
                      <td className="px-6 py-4">{product.category_name || 'N/A'}</td>
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
          {pagination && pagination.total_pages > 1 && (
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

        {/* Add/Edit Product Modal */}
        <AddProductModal
          isOpen={showAddModal}
          onClose={() => {
            setShowAddModal(false);
            setEditingProduct(null);
          }}
          onSubmit={editingProduct ? handleEditProductSubmit : handleAddProductSubmit}
          loading={editingProduct ? editLoading : addLoading}
          product={editingProduct ? {
            name: editingProduct.name,
            description: editingProduct.description,
            price: editingProduct.price,
            quantity: editingProduct.quantity,
            sku: editingProduct.sku || '',
            category_id: editingProduct.category_id,
            status: editingProduct.status,
            is_active: editingProduct.is_active
          } : null}
          isEdit={!!editingProduct}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminProductManagement;
