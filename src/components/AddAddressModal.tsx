import React, { useState, useEffect } from 'react';

interface AddAddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (address: AddressData) => void;
  loading: boolean;
  address?: AddressData | null;
  isEdit?: boolean;
  userFirstName?: string;
  userLastName?: string;
}

interface AddressData {
  address_type: string;
  first_name?: string;
  last_name?: string;
  street_address: string;
  apartment?: string;
  city: string;
  state_province?: string;
  postal_code: string;
  country: string;
  is_default?: boolean;
}

type AddressErrors = Partial<Record<keyof AddressData, string>>;

const AddAddressModal: React.FC<AddAddressModalProps> = ({ isOpen, onClose, onSubmit, loading, address, isEdit, userFirstName, userLastName }) => {
  const [formData, setFormData] = useState<AddressData>({
    address_type: 'Home Address',
    first_name: '',
    last_name: '',
    street_address: '',
    apartment: '',
    city: '',
    state_province: '',
    postal_code: '',
    country: 'United States',
    is_default: false
  });
  const [errors, setErrors] = useState<AddressErrors>({});

  // Reset form when modal opens or when address/isEdit changes
  useEffect(() => {
    if (isOpen) {
      if (isEdit && address) {
        setFormData({
          address_type: address.address_type || 'Home Address',
          first_name: userFirstName || '',
          last_name: userLastName || '',
          street_address: address.street_address || '',
          apartment: address.apartment || '',
          city: address.city || '',
          state_province: address.state_province || '',
          postal_code: address.postal_code || '',
          country: address.country || 'United States',
          is_default: address.is_default || false
        });
      } else {
        setFormData({
          address_type: 'Home Address',
          first_name: userFirstName || '',
          last_name: userLastName || '',
          street_address: '',
          apartment: '',
          city: '',
          state_province: '',
          postal_code: '',
          country: 'United States',
          is_default: false
        });
      }
      setErrors({});
    }
  }, [isOpen, address, isEdit, userFirstName, userLastName]);

  const validateForm = (): boolean => {
    const newErrors: AddressErrors = {};

    if (!formData.address_type.trim()) {
      newErrors.address_type = 'Address type is required';
    }

    if (!formData.street_address.trim()) {
      newErrors.street_address = 'Street address is required';
    }

    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }

    if (!formData.postal_code.trim()) {
      newErrors.postal_code = 'Postal code is required';
    }

    if (!formData.country.trim()) {
      newErrors.country = 'Country is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      // Filter out empty optional fields
      const submitData = {
        ...formData,
        apartment: formData.apartment?.trim() || undefined,
        state_province: formData.state_province?.trim() || undefined,
        first_name: formData.first_name?.trim() || undefined,
        last_name: formData.last_name?.trim() || undefined
      };
      onSubmit(submitData);
    }
  };

  const handleInputChange = (field: keyof AddressData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-900">{isEdit ? 'Edit Address' : 'Add New Address'}</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
            <span className="material-icons">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Address Type */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Address Type *
            </label>
            <select
              value={formData.address_type}
              onChange={(e) => handleInputChange('address_type', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.address_type ? 'border-red-500' : 'border-slate-300'
              }`}
              disabled={loading}
            >
              <option value="Home Address">Home Address</option>
              <option value="Work Address">Work Address</option>
              <option value="Billing Address">Billing Address</option>
              <option value="Shipping Address">Shipping Address</option>
            </select>
            {errors.address_type && <p className="mt-1 text-sm text-red-600">{errors.address_type}</p>}
          </div>

          {/* First Name & Last Name */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                First Name
              </label>
              <input
                type="text"
                value={formData.first_name}
                onChange={(e) => handleInputChange('first_name', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter first name"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Last Name
              </label>
              <input
                type="text"
                value={formData.last_name}
                onChange={(e) => handleInputChange('last_name', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter last name"
                disabled={loading}
              />
            </div>
          </div>

          {/* Street Address */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Street Address *
            </label>
            <input
              type="text"
              value={formData.street_address}
              onChange={(e) => handleInputChange('street_address', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.street_address ? 'border-red-500' : 'border-slate-300'
              }`}
              placeholder="Enter street address"
              disabled={loading}
            />
            {errors.street_address && <p className="mt-1 text-sm text-red-600">{errors.street_address}</p>}
          </div>

          {/* Apartment/Suite */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Apartment/Suite (Optional)
            </label>
            <input
              type="text"
              value={formData.apartment}
              onChange={(e) => handleInputChange('apartment', e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Apt, Suite, Unit, Building (optional)"
              disabled={loading}
            />
          </div>

          {/* City & State/Province */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                City *
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.city ? 'border-red-500' : 'border-slate-300'
                }`}
                placeholder="Enter city"
                disabled={loading}
              />
              {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                State/Province (Optional)
              </label>
              <input
                type="text"
                value={formData.state_province}
                onChange={(e) => handleInputChange('state_province', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter state/province"
                disabled={loading}
              />
            </div>
          </div>

          {/* Postal Code & Country */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Postal Code *
              </label>
              <input
                type="text"
                value={formData.postal_code}
                onChange={(e) => handleInputChange('postal_code', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.postal_code ? 'border-red-500' : 'border-slate-300'
                }`}
                placeholder="Enter postal code"
                disabled={loading}
              />
              {errors.postal_code && <p className="mt-1 text-sm text-red-600">{errors.postal_code}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Country *
              </label>
              <select
                value={formData.country}
                onChange={(e) => handleInputChange('country', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.country ? 'border-red-500' : 'border-slate-300'
                }`}
                disabled={loading}
              >
                <option value="United States">United States</option>
                <option value="Canada">Canada</option>
                <option value="United Kingdom">United Kingdom</option>
                <option value="Australia">Australia</option>
                <option value="Germany">Germany</option>
                <option value="France">France</option>
                <option value="Japan">Japan</option>
                <option value="Other">Other</option>
              </select>
              {errors.country && <p className="mt-1 text-sm text-red-600">{errors.country}</p>}
            </div>
          </div>

          {/* Default Address */}
          <div className="flex items-center">
            <input
              type="checkbox"
              id="is_default"
              checked={formData.is_default}
              onChange={(e) => handleInputChange('is_default', e.target.checked)}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-slate-300 rounded"
              disabled={loading}
            />
            <label htmlFor="is_default" className="ml-2 text-sm text-slate-700">
              Set as default address
            </label>
          </div>

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
              {isEdit ? 'Update Address' : 'Add Address'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddAddressModal;
