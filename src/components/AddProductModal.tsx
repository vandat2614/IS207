import React, { useState, useEffect } from 'react';

interface Category {
  id: number;
  name: string;
}

interface AddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (product: ProductData, files?: File[]) => void;
  loading: boolean;
  product?: ProductData | null;
  isEdit?: boolean;
  modalMode?: 'add' | 'edit' | 'sale';
}

interface ProductData {
  id?: number;
  name: string;
  description?: string;
  price: number;
  quantity: number;
  sku?: string;
  category_id?: number;
  status?: string;
  is_active?: boolean;
  images?: string[];
  sale_percentage?: number;
  sale_start_date?: string;
  sale_end_date?: string;
}

type ProductErrors = Partial<Record<keyof ProductData, string>>;

const AddProductModal: React.FC<AddProductModalProps> = ({ isOpen, onClose, onSubmit, loading, product, isEdit, modalMode = 'add' }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [formData, setFormData] = useState<ProductData>({
    name: '',
    description: '',
    price: 0,
    quantity: 0,
    sku: '',
    category_id: undefined,
    status: 'in_stock',
    is_active: true,
    images: []
  });
  const [errors, setErrors] = useState<ProductErrors>({});
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  // Fetch categories on mount
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const token = localStorage.getItem('authToken');
        const response = await fetch('http://localhost:8000/categories', {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          setCategories(data.data?.categories || data.categories || []);
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      }
    };

    if (isOpen) {
      fetchCategories();
    }
  }, [isOpen]);

  // Reset form when modal opens or when product changes
  useEffect(() => {
    if (isOpen) {
      if (product) {
        // Load existing product data
        setFormData({
          name: product.name || '',
          description: product.description || '',
          price: typeof product.price === 'string' ? parseFloat(product.price) || 0 : product.price || 0,
          quantity: typeof product.quantity === 'string' ? parseInt(product.quantity) || 0 : product.quantity || 0,
          sku: product.sku || '',
          category_id: product.category_id,
          status: product.status || 'in_stock',
          is_active: product.is_active !== undefined ? product.is_active : true,
          // Always load sale data for edit/sale modes
          sale_percentage: modalMode === 'edit' || modalMode === 'sale' ? product.sale_percentage : undefined,
          sale_start_date: modalMode === 'edit' || modalMode === 'sale' ? product.sale_start_date : undefined,
          sale_end_date: modalMode === 'edit' || modalMode === 'sale' ? product.sale_end_date : undefined
        });
      } else {
        // New product
        setFormData({
          name: '',
          description: '',
          price: 0,
          quantity: 0,
          sku: '',
          category_id: undefined,
          status: 'in_stock',
          is_active: true
        });
      }
      setErrors({});
    }
  }, [isOpen, product, modalMode]);

  const validateForm = (): boolean => {
    const newErrors: ProductErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Product name is required';
    }

    if (formData.price <= 0) {
      newErrors.price = 'Price must be greater than 0';
    }

    if (formData.quantity < 0) {
      newErrors.quantity = 'Quantity cannot be negative';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Form submitted, validating...'); // Debug log
    console.log('Current formData:', formData); // Debug log
    console.log('Uploaded files:', uploadedFiles); // Debug log
    if (validateForm()) {
      console.log('Validation passed, submitting formData:', formData); // Debug log
      // Pass both formData and uploadedFiles to parent
      onSubmit(formData, uploadedFiles);
    }
  };

  const handleInputChange = (field: keyof ProductData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleNumberInput = (field: keyof ProductData, value: string) => {
    let numValue: number;
    if (field === 'price') {
      const parsed = parseFloat(value);
      numValue = Number.isNaN(parsed) ? 0 : parsed;
    } else {
      const parsed = parseInt(value);
      numValue = Number.isNaN(parsed) ? 0 : parsed;
    }

    console.log(`Setting ${field}:`, numValue); // Debug log
    setFormData(prev => ({ ...prev, [field]: numValue }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleImageUpload = async (files: FileList) => {
    if (!files.length) return;

    setUploadingImages(true);

    try {
      // For new products, just store images locally - don't create product yet
      if (!isEdit) {
        // Convert files to local preview URLs and store actual files
        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          // Create local preview URL
          const previewUrl = URL.createObjectURL(file);
          setUploadedImages(prev => [...prev, previewUrl]);
          setUploadedFiles(prev => [...prev, file]);
          setFormData(prev => ({
            ...prev,
            images: [...(prev.images || []), previewUrl]
          }));
        }
      } else {
        // For editing existing products, upload images to server immediately
        const token = localStorage.getItem('authToken');
        const productId = product?.id;
        if (!productId) return;

        for (let i = 0; i < files.length; i++) {
          const file = files[i];
          const formDataUpload = new FormData();
          formDataUpload.append('image', file);

          const uploadResponse = await fetch(`http://localhost:8000/products/${productId}/images/upload`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            body: formDataUpload
          });

          if (uploadResponse.ok) {
            const uploadResult = await uploadResponse.json();
            setUploadedImages(prev => [...prev, uploadResult.data.image_path]);
            setFormData(prev => ({
              ...prev,
              images: [...(prev.images || []), uploadResult.data.image_path]
            }));
          }
        }
      }
    } catch (error) {
      console.error('Image upload error:', error);
      alert('Failed to upload images. Please try again.');
    } finally {
      setUploadingImages(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      handleImageUpload(files);
    }
  };

  const removeImage = (index: number) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
    setFormData(prev => ({
      ...prev,
      images: prev.images?.filter((_, i) => i !== index) || []
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-900">
            {modalMode === 'sale' ? 'Manage Sale' :
             modalMode === 'edit' ? 'Edit Product' :
             'Add New Product'}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <span className="material-icons">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Product Details - Only show in add/edit modes */}
          {modalMode !== 'sale' && (
            <>
              {/* Product Name */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.name ? 'border-red-500' : 'border-slate-300'
                  }`}
                  placeholder="Enter product name"
                  disabled={loading}
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                  placeholder="Enter product description"
                  disabled={loading}
                />
              </div>

              {/* Price */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Price *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.price}
                  onChange={(e) => handleNumberInput('price', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.price ? 'border-red-500' : 'border-slate-300'
                  }`}
                  placeholder="0.00"
                  disabled={loading}
                />
                {errors.price && <p className="mt-1 text-sm text-red-600">{errors.price}</p>}
              </div>

              {/* Quantity */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Quantity *
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.quantity}
                  onChange={(e) => handleNumberInput('quantity', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.quantity ? 'border-red-500' : 'border-slate-300'
                  }`}
                  placeholder="0"
                  disabled={loading}
                />
                {errors.quantity && <p className="mt-1 text-sm text-red-600">{errors.quantity}</p>}
              </div>

              {/* Category */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Category
                </label>
                <select
                  value={formData.category_id || ''}
                  onChange={(e) => handleInputChange('category_id', e.target.value ? parseInt(e.target.value) : undefined)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                >
                  <option value="">Select a category</option>
                  {(categories || []).map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                >
                  <option value="in_stock">In Stock</option>
                  <option value="low_stock">Low Stock</option>
                  <option value="out_of_stock">Out of Stock</option>
                </select>
              </div>

              {/* Active Status */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="is_active"
                  checked={formData.is_active}
                  onChange={(e) => handleInputChange('is_active', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
                  disabled={loading}
                />
                <label htmlFor="is_active" className="ml-2 text-sm text-slate-700">
                  Active (visible to customers)
                </label>
              </div>
            </>
          )}

          {/* Sale Configuration - Show only in sale mode */}
          {modalMode === 'sale' && (
            <div>
              {/* Sale Percentage */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Sale Percentage (0-100%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.sale_percentage || ''}
                  onChange={(e) => handleNumberInput('sale_percentage', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                  disabled={loading}
                />
                <p className="text-xs text-slate-500 mt-1">
                  Leave empty or 0 for no sale. Sale price = original price × (1 - percentage/100)
                </p>
              </div>

              {/* Sale Start Date */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Sale Start Date
                </label>
                <input
                  type="datetime-local"
                  value={formData.sale_start_date || ''}
                  onChange={(e) => handleInputChange('sale_start_date', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                />
                <p className="text-xs text-slate-500 mt-1">
                  When the sale should automatically start
                </p>
              </div>

              {/* Sale End Date */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Sale End Date (Optional)
                </label>
                <input
                  type="datetime-local"
                  value={formData.sale_end_date || ''}
                  onChange={(e) => handleInputChange('sale_end_date', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                />
                <p className="text-xs text-slate-500 mt-1">
                  Leave empty for indefinite sale. Sale automatically ends at this date/time.
                </p>
              </div>

              {/* Remove Sale Button */}
              {(formData.sale_percentage && formData.sale_percentage > 0) && (
                <div className="mb-4">
                  <button
                    type="button"
                    onClick={() => {
                      setFormData(prev => ({
                        ...prev,
                        sale_percentage: 0,
                        sale_start_date: undefined,
                        sale_end_date: undefined
                      }));
                    }}
                    className="px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg transition-colors"
                    disabled={loading}
                  >
                    Remove Sale
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Image Upload - Only show in add/edit modes */}
          {modalMode !== 'sale' && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Product Images
              </label>
              <div className="space-y-4">
                {/* Upload Area */}
                <div
                  className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
                    uploadingImages
                      ? 'border-blue-300 bg-blue-50'
                      : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
                  }`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    const files = e.dataTransfer.files;
                    if (files.length > 0) {
                      handleImageUpload(files);
                    }
                  }}
                >
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="image-upload"
                    disabled={loading || uploadingImages}
                  />
                  <label htmlFor="image-upload" className="cursor-pointer">
                    {uploadingImages ? (
                      <div className="flex flex-col items-center">
                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-2"></div>
                        <p className="text-sm text-slate-600">Uploading images...</p>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <span className="material-icons text-4xl text-slate-400 mb-2">cloud_upload</span>
                        <p className="text-sm text-slate-600 mb-1">
                          <span className="font-medium text-blue-600">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-slate-500">PNG, JPG, GIF, WebP up to 5MB each</p>
                      </div>
                    )}
                  </label>
                </div>

                {/* Image Preview */}
                {uploadedImages.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {uploadedImages.map((imagePath, index) => (
                      <div key={index} className="relative group">
                        <img
                          src={`/${imagePath}`}
                          alt={`Product image ${index + 1}`}
                          className="w-full h-24 object-cover rounded-lg border border-slate-200"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          disabled={loading || uploadingImages}
                        >
                          <span className="material-icons text-sm">close</span>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {uploadedImages.length === 0 && (
                  <p className="text-xs text-slate-500 text-center">No images uploaded yet</p>
                )}
              </div>
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-slate-700 bg-slate-200 hover:bg-slate-300 rounded-lg transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors flex items-center"
              disabled={loading}
            >
              {loading && (
                <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              )}
              {modalMode === 'sale' ? 'Update Sale' :
               modalMode === 'edit' ? 'Update Product' :
               'Add Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProductModal;
