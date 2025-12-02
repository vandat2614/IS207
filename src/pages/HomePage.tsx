import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import Button from '../components/Button';

const banner2 = new URL('../public/banner2.jpg', import.meta.url).href;

const HomePage: React.FC = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const [isAutoSliding, setIsAutoSliding] = useState(true);
  const [isHovered, setIsHovered] = useState(false);

  // Auto-slide configuration
  const AUTO_SLIDE_INTERVAL = 5000; // 5 seconds
  const PAUSE_AFTER_INTERACTION = 10000; // 10 seconds pause after user interaction

  const autoSlideRef = useRef<NodeJS.Timeout | null>(null);
  const pauseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null);

      let categoriesLoaded = false;
      let productsLoaded = false;

      // Fetch categories independently
      try {
        const categoriesResponse = await fetch('http://localhost:8000/categories');
        if (categoriesResponse.ok) {
          const categoriesData = await categoriesResponse.json();
          console.log('Homepage categories API response:', categoriesData);

          const categoriesArray = categoriesData.data?.categories || categoriesData.data || [];
          console.log('Homepage categories data:', categoriesArray);

          // Process categories with real data from database
          const processedCategories = categoriesArray.map((cat: any) => ({
            name: cat.name,
            image: cat.image || 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&h=400&fit=crop',
            slug: cat.slug,
          }));

          console.log('Homepage processed categories:', processedCategories);
          setCategories(processedCategories);
          categoriesLoaded = true;
        }
      } catch (err) {
        console.warn('Failed to load categories:', err);
      }

      // Fetch featured products independently
      try {
        const productsResponse = await fetch('http://localhost:8000/products?page=1&limit=4');
        if (productsResponse.ok) {
          const productsData = await productsResponse.json();
          const processedProducts = productsData.data.products.map((product: any) => ({
            id: product.id,
            image: product.images?.[0] || 'https://images.unsplash.com/photo-1571910258025-e3a1b0d6a30c?w=400&h=300&fit=crop',
            title: product.name,
            description: product.description || `Premium ${product.name} for your style`,
            price: parseFloat(product.price),
          }));
          setFeaturedProducts(processedProducts);
          productsLoaded = true;
        }
      } catch (err) {
        console.warn('Failed to load featured products:', err);
      }

      // Only show mock data if both APIs failed
      if (!categoriesLoaded && !productsLoaded) {
        console.log('Both APIs failed, showing mock data');
        setCategories([
          {
            name: 'Shoes',
            image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=300&fit=crop',
          },
          {
            name: 'Shirts',
            image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=300&fit=crop',
          },
          {
            name: 'Pants',
            image: 'https://images.unsplash.com/photo-1544638748-267ef3d7d5a?w=400&h=300&fit=crop',
          },
          {
            name: 'Caps',
            image: 'https://images.unsplash.com/photo-1575428652377-a2d80e666850?w=400&h=300&fit=crop',
          },
        ]);
        setFeaturedProducts([
          {
            id: 1,
            image: 'https://images.unsplash.com/photo-1571910258025-e3a1b0d6a30c?w=400&h=300&fit=crop',
            title: 'Classic Fedora',
            description: 'A timeless accessory for any look.',
            price: 99.99,
          },
          {
            id: 2,
            image: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=300&fit=crop',
            title: 'Canvas Sneakers',
            description: 'Comfortable and stylish for everyday wear.',
            price: 79.99,
          },
          {
            id: 3,
            image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=300&fit=crop',
            title: 'Graphic T-Shirt',
            description: 'Make a statement with this unique tee.',
            price: 39.99,
          },
          {
            id: 4,
            image: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=400&h=300&fit=crop',
            title: 'Denim Baseball Cap',
            description: 'A casual staple for any wardrobe.',
            price: 29.99,
          },
        ]);
      } else if (!categoriesLoaded && productsLoaded) {
        // Categories failed but products loaded - show empty categories (no fallback)
        console.log('Categories failed but products loaded, showing no categories');
        setCategories([]);
      }
      // If categories loaded but products failed, keep existing categories and don't set mock products

      setLoading(false);
    };

    fetchData();
  }, []);

  const handleAddToCart = (productId: number) => {
    console.log('Add to cart:', productId);
    // TODO: Implement cart functionality
  };

  // Category carousel functions
  const nextCategories = () => {
    if (categories.length > 4) {
      pauseAutoSlide();
      setCurrentCategoryIndex((prevIndex) =>
        prevIndex + 4 >= categories.length ? 0 : prevIndex + 4
      );
    }
  };

  const prevCategories = () => {
    if (categories.length > 4) {
      pauseAutoSlide();
      setCurrentCategoryIndex((prevIndex) =>
        prevIndex - 4 < 0 ? Math.max(0, categories.length - 4) : prevIndex - 4
      );
    }
  };

  // Auto-slide functions
  const startAutoSlide = () => {
    if (autoSlideRef.current) {
      clearInterval(autoSlideRef.current);
    }
    autoSlideRef.current = setInterval(() => {
      if (isAutoSliding && !isHovered && categories.length > 4) {
        setCurrentCategoryIndex((prevIndex) =>
          prevIndex + 4 >= categories.length ? 0 : prevIndex + 4
        );
      }
    }, AUTO_SLIDE_INTERVAL);
  };

  const pauseAutoSlide = () => {
    setIsAutoSliding(false);
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current);
    }
    pauseTimeoutRef.current = setTimeout(() => {
      setIsAutoSliding(true);
    }, PAUSE_AFTER_INTERACTION);
  };

  const stopAutoSlide = () => {
    if (autoSlideRef.current) {
      clearInterval(autoSlideRef.current);
      autoSlideRef.current = null;
    }
    if (pauseTimeoutRef.current) {
      clearTimeout(pauseTimeoutRef.current);
      pauseTimeoutRef.current = null;
    }
  };

  // Auto-slide effect
  useEffect(() => {
    if (categories.length > 4 && !loading) {
      startAutoSlide();
    }

    return () => {
      stopAutoSlide();
    };
  }, [categories.length, loading, isAutoSliding, isHovered]);

  // Handle dot clicks with pause
  const handleDotClick = (index: number) => {
    pauseAutoSlide();
    setCurrentCategoryIndex(index * 4);
  };

  // Get visible categories (max 4 at a time)
  const visibleCategories = categories.slice(currentCategoryIndex, currentCategoryIndex + 4);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-slate-600 dark:text-slate-400">Loading homepage...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Hero Section */}
      <section className="relative h-[60vh] md:h-[80vh] w-full overflow-hidden" style={{ backgroundImage: 'url(/banner2.jpg)', backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="absolute inset-0 bg-black/30"></div>
        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-start">
          <div className="max-w-lg text-white">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              Discover Your Signature Style
            </h1>
            <p className="text-lg md:text-xl mb-8 text-slate-200">
              Explore the latest trends and timeless classics in our diverse clothing collection. Quality, comfort, and fashion in every stitch.
            </p>
            {/* <Button size="lg">
              Shop Now
            </Button> */}
          </div>
        </div>
      </section>

      {/* Shop by Category */}
      <section className="py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12 text-slate-900 dark:text-white">
            Shop by Category
          </h2>

          {/* Category Carousel */}
          <div
            className="relative"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
          >
            {/* Navigation Arrows */}
            {categories.length > 4 && (
              <>
                <button
                  onClick={prevCategories}
                  className="absolute left-0 top-1/2 -translate-y-1/2 z-10 text-slate-400 hover:text-blue-500 transition-colors duration-200 text-4xl hover:scale-110"
                  aria-label="Previous categories"
                >
                  <span className="material-icons">chevron_left</span>
                </button>
                <button
                  onClick={nextCategories}
                  className="absolute right-0 top-1/2 -translate-y-1/2 z-10 text-slate-400 hover:text-blue-500 transition-colors duration-200 text-4xl hover:scale-110"
                  aria-label="Next categories"
                >
                  <span className="material-icons">chevron_right</span>
                </button>
              </>
            )}

            {/* Categories Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 px-12">
              {visibleCategories.map((category, index) => (
                <Link
                  key={`${currentCategoryIndex}-${index}`}
                  to={`/products?category=${category.slug}`}
                  className="group relative overflow-hidden rounded-lg block animate-slide-in-right"
                  style={{
                    animationDelay: `${index * 200}ms`,
                    animationFillMode: 'both'
                  }}
                >
                  <img
                    alt={category.name}
                    className="w-full h-64 object-cover transform group-hover:scale-105 transition-transform duration-300"
                    src={category.image}
                  />
                  <div className="absolute inset-0 bg-black/40"></div>
                  <div className="absolute bottom-0 left-0 p-6">
                    <h3 className="text-xl font-semibold text-white">
                      {category.name}
                    </h3>
                  </div>
                </Link>
              ))}
            </div>

            {/* Dots Indicator */}
            {categories.length > 4 && (
              <div className="flex justify-center mt-8 space-x-2">
                {Array.from({ length: Math.ceil(categories.length / 4) }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => handleDotClick(i)}
                    className={`w-3 h-3 rounded-full transition-all duration-200 ${
                      Math.floor(currentCategoryIndex / 4) === i
                        ? 'bg-blue-500'
                        : 'bg-slate-300 dark:bg-slate-600 hover:bg-slate-400 dark:hover:bg-slate-500'
                    }`}
                    aria-label={`Go to category set ${i + 1}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="bg-slate-100 dark:bg-slate-800 py-16 sm:py-24">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12 text-slate-900 dark:text-white">
            Featured Products
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {featuredProducts.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                image={product.image}
                title={product.title}
                description={product.description}
                price={product.price}
                onAddToCart={handleAddToCart}
              />
            ))}
          </div>
          <div className="text-center mt-12">
            <Button
              variant="secondary"
              size="lg"
              onClick={() => window.location.href = '/products'}
            >
              View All Products
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
