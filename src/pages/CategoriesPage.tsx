import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  productCount: number;
  featured: boolean;
}

const CategoriesPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      // Try to fetch from API, fallback to sample data
      const response = await fetch('http://localhost:8000/categories');
      if (response.ok) {
        const data = await response.json();
        const categoriesData = data.data || [];

        // Process categories with enhanced data
        const processedCategories = categoriesData.map((cat: any, index: number) => ({
          id: cat.id,
          name: cat.name,
          slug: cat.slug,
          description: getCategoryDescription(cat.slug),
          image: getCategoryImage(cat.slug),
          productCount: getCategoryProductCount(index),
          featured: isFeaturedCategory(cat.slug)
        }));

        setCategories(processedCategories);
      } else {
        // Use sample categories if API fails
        setCategories(getSampleCategories());
      }
    } catch (err) {
      console.error('Error fetching categories:', err);
      setCategories(getSampleCategories());
    } finally {
      setLoading(false);
    }
  };

  const getCategoryDescription = (slug: string): string => {
    const descriptions: { [key: string]: string } = {
      'shoes': 'Complete your look with our stylish shoe collection',
      'shirts': 'Comfortable and trendy shirts for every occasion',
      'pants': 'Find the perfect fit with our premium pants selection',
      'caps': 'Top off your style with our trendy headwear'
    };
    return descriptions[slug] || 'Discover amazing products in this category';
  };

  const getCategoryImage = (slug: string): string => {
    const images: { [key: string]: string } = {
      'shoes': 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&h=400&fit=crop',
      'shirts': 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=400&fit=crop',
      'pants': 'https://images.unsplash.com/photo-1544638748-267ef3d7d5a?w=600&h=400&fit=crop',
      'caps': 'https://images.unsplash.com/photo-1571910258025-e3a1b0d6a30c?w=600&h=400&fit=crop'
    };
    return images[slug] || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&h=400&fit=crop';
  };

  const getCategoryProductCount = (index: number): number => {
    // Sample product counts for demo
    return [24, 18, 12, 9][index] || 15;
  };

  const isFeaturedCategory = (slug: string): boolean => {
    return ['shoes', 'shirts'].includes(slug);
  };

  const getSampleCategories = (): Category[] => [
    {
      id: 1,
      name: 'Shoes',
      slug: 'shoes',
      description: 'Complete your look with our stylish shoe collection',
      image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=600&h=400&fit=crop',
      productCount: 24,
      featured: true
    },
    {
      id: 2,
      name: 'Shirts',
      slug: 'shirts',
      description: 'Comfortable and trendy shirts for every occasion',
      image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600&h=400&fit=crop',
      productCount: 18,
      featured: true
    },
    {
      id: 3,
      name: 'Pants',
      slug: 'pants',
      description: 'Find the perfect fit with our premium pants selection',
      image: 'https://images.unsplash.com/photo-1544638748-267ef3d7d5a?w=600&h=400&fit=crop',
      productCount: 12,
      featured: false
    },
    {
      id: 4,
      name: 'Caps',
      slug: 'caps',
      description: 'Top off your style with our trendy headwear',
      image: 'https://images.unsplash.com/photo-1571910258025-e3a1b0d6a30c?w=600&h=400&fit=crop',
      productCount: 9,
      featured: false
    }
  ];

  if (loading) {
    return (
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-slate-600 dark:text-slate-400">Loading categories...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">Shop by Category</h1>
        <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          Discover our carefully curated collections. Find exactly what you're looking for.
        </p>
      </div>

      {/* Categories Grid */}
      <div className="relative">
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10 opacity-30">
          <div className="absolute top-20 left-10 w-32 h-32 bg-blue-200 rounded-full blur-xl"></div>
          <div className="absolute bottom-20 right-10 w-40 h-40 bg-purple-200 rounded-full blur-xl"></div>
          <div className="absolute top-40 right-20 w-24 h-24 bg-pink-200 rounded-full blur-xl"></div>
        </div>

        <div className="categories-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {categories.map((category, index) => (
            <div key={category.id} className="bg-white dark:bg-slate-800 rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300">
              <Link to={`/products?category=${category.slug}`}>
                <img
                  src={category.image}
                  alt={category.name}
                  className="w-full h-64 object-cover hover:scale-105 transition-transform duration-300"
                  loading="lazy"
                />
              </Link>
              <div className="p-6">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-lg text-slate-900 dark:text-white">
                    {category.name}
                  </h3>
                  {category.featured && (
                    <span className="inline-block bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 px-2 py-1 rounded-full text-xs font-medium">
                      Featured
                    </span>
                  )}
                </div>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                  {category.description}
                </p>
                <div className="flex items-center justify-between mt-4">
                  <span className="text-sm text-slate-600 dark:text-slate-300">
                    {category.productCount} items
                  </span>
                  <Link
                    to={`/products?category=${category.slug}`}
                    className="w-8 h-8 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors flex items-center justify-center"
                    title="Browse category"
                  >
                    <span className="material-icons text-lg">arrow_forward</span>
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom CTA Section */}
      <div className="text-center mt-16">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-slate-800 dark:to-slate-700 rounded-2xl p-8">
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
            Can't find what you're looking for?
          </h3>
          <p className="text-slate-600 dark:text-slate-400 mb-6 max-w-md mx-auto">
            Browse our complete collection or use our advanced search to discover more products.
          </p>
          <Link
            to="/products"
            className="inline-flex items-center px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
          >
            Browse All Products
            <span className="material-icons ml-2 text-lg">arrow_forward</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default CategoriesPage;
