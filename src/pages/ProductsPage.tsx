import React, { useState, useEffect } from 'react';
import ProductCard from '../components/ProductCard';

const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize with fallback categories
  useEffect(() => {
    setCategories([
      { id: 1, name: 'Shoes', slug: 'shoes' },
      { id: 2, name: 'Shirts', slug: 'shirts' },
      { id: 3, name: 'Pants', slug: 'pants' },
      { id: 4, name: 'Caps', slug: 'caps' },
      { id: 5, name: 'Hats', slug: 'hats' },
    ]);
  }, []);

  // Filter states
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedPriceRange, setSelectedPriceRange] = useState<string>('all');
  const [selectedAvailability, setSelectedAvailability] = useState<string>('all');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch categories for filter dropdown
        const categoriesResponse = await fetch('http://localhost:8000/categories');
        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json();
          setCategories(categoriesData.data || []);
        } else {
          // Fallback categories if API fails
          setCategories([
            { id: 1, name: 'Shoes', slug: 'shoes' },
            { id: 2, name: 'Shirts', slug: 'shirts' },
            { id: 3, name: 'Pants', slug: 'pants' },
            { id: 4, name: 'Caps', slug: 'caps' },
            { id: 5, name: 'Hats', slug: 'hats' },
          ]);
        }

      } catch (err) {
        console.error('Error loading initial data:', err);
        setCategories([
          { id: 1, name: 'Shoes', slug: 'shoes' },
          { id: 2, name: 'Shirts', slug: 'shirts' },
          { id: 3, name: 'Pants', slug: 'pants' },
          { id: 4, name: 'Caps', slug: 'caps' },
          { id: 5, name: 'Hats', slug: 'hats' },
        ]);
      } finally {
        setLoading(false); // Ensure loading is set to false after categories fetch
      }
    };

    fetchData();
  }, []);

  // Load initial products or filtered products based on URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const categoryParam = urlParams.get('category');

    if (categoryParam && categoryParam !== 'all') {
      // If category param exists, fetch filtered products directly
      const fetchFilteredProducts = async () => {
        try {
          setLoading(true);
          const response = await fetch(`http://localhost:8000/products?category=${categoryParam}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (response.ok) {
            const productsData = await response.json();
            const processedProducts = productsData.data.products.map((product: any) => {
              let images = [];
              if (product.images) {
                try {
                  images = typeof product.images === 'string' ? JSON.parse(product.images) : product.images;
                } catch (e) {
                  console.warn('Failed to parse product images:', product.images);
                }
              }

              return {
                id: product.id,
                category: product.category_name,
                category_slug: product.category_slug,
                brand: product.brand,
                image: images?.[0] || 'https://images.unsplash.com/photo-1571910258025-e3a1b0d6a30c?w=400&h=300&fit=crop',
                title: product.name,
                description: product.description || `Premium ${product.name} for your style`,
                price: parseFloat(product.price),
                quantity: parseInt(product.quantity) || 0,
                rating: parseFloat(product.rating) || 0,
              };
            });
            setProducts(processedProducts);
          } else {
            // Fallback to mock products if API fails
            generateMockProducts();
            setSelectedCategory(categoryParam);
          }
        } catch (err) {
          console.error('Error fetching filtered products:', err);
          generateMockProducts();
          setSelectedCategory(categoryParam);
        } finally {
          setLoading(false);
        }
      };
      fetchFilteredProducts();
    } else {
      // Normal load - all products
      generateMockProducts();
    }
  }, []);

  // Apply filters when filter states change
  useEffect(() => {
    applyFilters();
  }, [selectedCategory, selectedPriceRange, selectedAvailability, selectedBrand, sortBy, searchQuery, products]);

  const applyFilters = () => {
    let filtered = [...products];

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(product =>
        product.category_slug === selectedCategory ||
        product.category?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Filter by price range
    if (selectedPriceRange !== 'all') {
      switch (selectedPriceRange) {
        case '0-50':
          filtered = filtered.filter(product => product.price <= 50);
          break;
        case '50-100':
          filtered = filtered.filter(product => product.price > 50 && product.price <= 100);
          break;
        case '100-200':
          filtered = filtered.filter(product => product.price > 100 && product.price <= 200);
          break;
        case '200+':
          filtered = filtered.filter(product => product.price > 200);
          break;
      }
    }

    // Filter by availability
    if (selectedAvailability !== 'all') {
      switch (selectedAvailability) {
        case 'in_stock':
          filtered = filtered.filter(product => product.quantity > 10);
          break;
        case 'low_stock':
          filtered = filtered.filter(product => product.quantity > 0 && product.quantity <= 10);
          break;
        case 'out_stock':
          filtered = filtered.filter(product => product.quantity === 0);
          break;
      }
    }

    // Filter by brand
    if (selectedBrand !== 'all') {
      filtered = filtered.filter(product =>
        product.brand?.toLowerCase() === selectedBrand.toLowerCase()
      );
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(product =>
        product.title.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query)
      );
    }

    // Sort products
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price_low':
          return a.price - b.price;
        case 'price_high':
          return b.price - a.price;
        case 'name':
          return a.title.localeCompare(b.title);
        case 'newest':
        default:
          return b.id - a.id; // Assuming higher ID = newer
      }
    });

    setFilteredProducts(filtered);
  };

  const fetchProductsWithFilters = async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query parameters for API filtering
      const params = new URLSearchParams();

      if (selectedCategory !== 'all') params.append('category', selectedCategory);
      if (selectedPriceRange !== 'all') params.append('price_range', selectedPriceRange);
      if (selectedAvailability !== 'all') params.append('availability', selectedAvailability);
      if (selectedBrand !== 'all') params.append('brand', selectedBrand);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      if (sortBy !== 'newest') params.append('sort', sortBy);

      const response = await fetch(`http://localhost:8000/products?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const productsData = await response.json();
        const processedProducts = productsData.data.products.map((product: any) => {
          let images = [];
          if (product.images) {
            try {
              images = typeof product.images === 'string' ? JSON.parse(product.images) : product.images;
            } catch (e) {
              console.warn('Failed to parse product images:', product.images);
            }
          }

          return {
            id: product.id,
            category: product.category_name,
            category_slug: product.category_slug,
            brand: product.brand,
            image: images?.[0] || 'https://images.unsplash.com/photo-1571910258025-e3a1b0d6a30c?w=400&h=300&fit=crop',
            title: product.name,
            description: product.description || `Premium ${product.name} for your style`,
            price: parseFloat(product.price),
            quantity: parseInt(product.quantity) || 0,
            rating: parseFloat(product.rating) || 0,
          };
        });
        setProducts(processedProducts);
      } else {
        throw new Error('Failed to fetch products');
      }

    } catch (err) {
      console.error('Error fetching filtered products:', err);
      // Fallback to mock data if API fails
      generateMockProducts();
    } finally {
      setLoading(false);
    }
  };

  const generateMockProducts = () => {
    const mockProducts = [
      {
        id: 1,
        category: 'Caps',
        category_slug: 'caps',
        brand: 'Premium Style',
        image: 'https://images.unsplash.com/photo-1571910258025-e3a1b0d6a30c?w=400&h=300&fit=crop',
        title: 'Classic Fedora',
        description: 'A timeless accessory for any look.',
        price: 99.99,
        quantity: 25,
        rating: 4.5,
      },
      {
        id: 2,
        category: 'Shoes',
        category_slug: 'shoes',
        brand: 'Urban Comfort',
        image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=300&fit=crop',
        title: 'Canvas Sneakers',
        description: 'Comfortable and stylish for everyday wear.',
        price: 79.99,
        quantity: 15,
        rating: 4.2,
      },
      {
        id: 3,
        category: 'Shirts',
        category_slug: 'shirts',
        brand: 'Modern Wear',
        image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=300&fit=crop',
        title: 'Graphic T-Shirt',
        description: 'Make a statement with this unique tee.',
        price: 39.99,
        quantity: 8,
        rating: 4.0,
      },
      {
        id: 4,
        category: 'Caps',
        category_slug: 'caps',
        brand: 'Casual Essentials',
        image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=400&h=300&fit=crop',
        title: 'Denim Baseball Cap',
        description: 'A casual staple for any wardrobe.',
        price: 29.99,
        quantity: 30,
        rating: 4.7,
      },
      {
        id: 5,
        category: 'Pants',
        category_slug: 'pants',
        brand: 'Premium Style',
        image: 'https://images.unsplash.com/photo-1544638748-267ef3d7d5a?w=400&h=300&fit=crop',
        title: 'Slim Fit Jeans',
        description: 'Premium denim with modern comfort.',
        price: 89.99,
        quantity: 5,
        rating: 4.1,
      },
      {
        id: 6,
        category: 'Shoes',
        category_slug: 'shoes',
        brand: 'Urban Comfort',
        image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=300&fit=crop',
        title: 'Running Shoes',
        description: 'Engineered for performance and comfort.',
        price: 129.99,
        quantity: 0,
        rating: 4.8,
      },
    ];

    setProducts(mockProducts);
  };

  const handleFilterApply = () => {
    fetchProductsWithFilters();
  };

  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleAddToCart = (productId: number) => {
    console.log('Add to cart:', productId);
    // TODO: Implement cart functionality
  };

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">Products</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Discover our complete collection of fashion items.
        </p>
      </div>

      {/* Search Bar */}
      {/* <div className="mb-6">
        <div className="flex gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={handleSearchInput}
              className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button
            onClick={() => fetchProductsWithFilters()}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Search
          </button>
        </div>
      </div> */}

      {/* Filter/Sort Controls */}
      <div className="mb-8 p-6 bg-white dark:bg-slate-800 rounded-lg shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Filters</h2>
          <button
            onClick={() => {
              setSelectedCategory('all');
              setSelectedPriceRange('all');
              setSelectedAvailability('all');
              setSelectedBrand('all');
              setSortBy('newest');
              setSearchQuery('');
              generateMockProducts();
            }}
            className="px-3 py-2 text-sm bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors"
          >
            Clear All
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Category Filter */}
          <div>
            <label className="block text-sm font-medium mb-2">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Categories</option>
              {Array.isArray(categories) && categories.map((category: any) => (
                <option key={category.id || category.slug} value={category.slug}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          {/* Price Range Filter */}
          <div>
            <label className="block text-sm font-medium mb-2">Price Range</label>
            <select
              value={selectedPriceRange}
              onChange={(e) => setSelectedPriceRange(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Prices</option>
              <option value="0-50">$0 - $50</option>
              <option value="50-100">$50 - $100</option>
              <option value="100-200">$100 - $200</option>
              <option value="200+">$200+</option>
            </select>
          </div>

          {/* Availability Filter */}
          <div>
            <label className="block text-sm font-medium mb-2">Availability</label>
            <select
              value={selectedAvailability}
              onChange={(e) => setSelectedAvailability(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Products</option>
              <option value="in_stock">In Stock</option>
              <option value="low_stock">Low Stock</option>
              <option value="out_stock">Out of Stock</option>
            </select>
          </div>

          {/* Brand Filter */}
          <div>
            <label className="block text-sm font-medium mb-2">Brand</label>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">All Brands</option>
              <option value="Premium Style">Premium Style</option>
              <option value="Urban Comfort">Urban Comfort</option>
              <option value="Modern Wear">Modern Wear</option>
              <option value="Casual Essentials">Casual Essentials</option>
            </select>
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-sm font-medium mb-2">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="newest">Newest</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
              <option value="name">Name: A-Z</option>
            </select>
          </div>
        </div>

        {/* Results Summary */}
        {(filteredProducts.length > 0 || products.length > 0) && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <p className="text-sm text-slate-600">
              Showing {filteredProducts.length} of {products.length} products
            </p>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
            <p className="text-slate-600">Loading products...</p>
          </div>
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-slate-400 mb-4">
            <span className="material-icons text-6xl">search_off</span>
          </div>
          <h3 className="text-xl font-semibold text-slate-900 mb-2">No products found</h3>
          <p className="text-slate-600 mb-4">Try adjusting your filters or search terms</p>
          <button
            onClick={() => {
              setSelectedCategory('all');
              setSelectedPriceRange('all');
              setSelectedAvailability('all');
              setSelectedBrand('all');
              setSortBy('newest');
              setSearchQuery('');
              generateMockProducts();
            }}
            className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            Clear Filters & Show All
          </button>
        </div>
      ) : (
        /* Products Grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <div key={product.id} className="relative">
              <ProductCard
                id={product.id}
                image={product.image}
                title={product.title}
                description={product.description}
                price={product.price}
                onAddToCart={handleAddToCart}
              />
              {/* Rating display - consistent for all access methods */}
              <div className="absolute top-2 left-2 bg-white/90 backdrop-blur-sm rounded px-2 py-1 text-sm flex items-center">
                <span className="material-icons text-yellow-500 text-sm">star</span>
                {(product.rating && product.rating > 0) ? product.rating.toFixed(1) : '4.5'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductsPage;
