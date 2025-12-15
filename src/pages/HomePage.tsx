import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  const [currentHeroSlide, setCurrentHeroSlide] = useState(0);
  const [heroAutoSlide, setHeroAutoSlide] = useState(true);

  // Auto-slide configuration
  const AUTO_SLIDE_INTERVAL = 5000; // 5 seconds
  const PAUSE_AFTER_INTERACTION = 10000; // 10 seconds pause after user interaction
  const HERO_AUTO_SLIDE_INTERVAL = 6000; // 6 seconds for hero

  const autoSlideRef = useRef<NodeJS.Timeout | null>(null);
  const pauseTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const heroSlideRef = useRef<NodeJS.Timeout | null>(null);

  // Hero slides data
  const heroSlides = [
    {
      id: 1,
      title: "Discover Your Signature Style",
      subtitle: "Explore the latest trends and timeless classics in our diverse clothing collection. Quality, comfort, and fashion in every stitch.",
      ctaText: "Shop Now",
      ctaLink: "/products",
      background: "/banner2.jpg",
      gradient: "from-blue-600/80 to-purple-600/80"
    },
    {
      id: 2,
      title: "New Season Collection",
      subtitle: "Be the first to explore our latest arrivals. Fresh styles, premium materials, and unbeatable comfort for the modern fashion enthusiast.",
      ctaText: "View Collection",
      ctaLink: "/products?filter=new",
      background: "https://images.unsplash.com/photo-1513094735237-8f2714d57c13?q=80&w=2000&h=1200&fit=crop",
      gradient: "from-green-600/80 to-blue-600/80"
    },
    {
      id: 3,
      title: "Exclusive Offers",
      subtitle: "Limited time deals on premium fashion. Save up to 40% on selected items. Quality never goes out of style, but our prices might!",
      ctaText: "Shop Deals",
      ctaLink: "/products?filter=sale",
      background: "https://images.unsplash.com/photo-1551232864-3f0890e580d9?q=80&w=2000&h=1200&fit=crop",
      gradient: "from-orange-600/80 to-red-600/80"
    }
  ];

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

  // Hero auto-slide effect
  useEffect(() => {
    if (heroSlideRef.current) {
      clearInterval(heroSlideRef.current);
    }
    heroSlideRef.current = setInterval(() => {
      if (heroAutoSlide) {
        setCurrentHeroSlide((prev) => (prev + 1) % heroSlides.length);
      }
    }, HERO_AUTO_SLIDE_INTERVAL);

    return () => {
      if (heroSlideRef.current) {
        clearInterval(heroSlideRef.current);
      }
    };
  }, [heroAutoSlide, heroSlides.length]);

  // Hero slide navigation functions
  const goToHeroSlide = (index: number) => {
    setCurrentHeroSlide(index);
    setHeroAutoSlide(false);
    setTimeout(() => setHeroAutoSlide(true), PAUSE_AFTER_INTERACTION);
  };

  const nextHeroSlide = () => {
    setCurrentHeroSlide((prev) => (prev + 1) % heroSlides.length);
    setHeroAutoSlide(false);
    setTimeout(() => setHeroAutoSlide(true), PAUSE_AFTER_INTERACTION);
  };

  const prevHeroSlide = () => {
    setCurrentHeroSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
    setHeroAutoSlide(false);
    setTimeout(() => setHeroAutoSlide(true), PAUSE_AFTER_INTERACTION);
  };

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
      {/* Enhanced Hero Section */}
      <section className="relative h-[60vh] md:h-[80vh] w-full overflow-hidden">
        {/* Hero Slides */}
        {heroSlides.map((slide, index) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-1000 ${
              index === currentHeroSlide ? 'opacity-100' : 'opacity-0'
            }`}
            style={{
              backgroundImage: `url(${slide.background})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}
          >
          </div>
        ))}

        {/* Navigation Arrows */}
        <button
          onClick={prevHeroSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
          aria-label="Previous slide"
        >
          <span className="material-icons">chevron_left</span>
        </button>
        <button
          onClick={nextHeroSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
          aria-label="Next slide"
        >
          <span className="material-icons">chevron_right</span>
        </button>

        {/* Content */}
        <div className="relative z-10 container mx-auto px-4 sm:px-6 lg:px-8 h-full flex items-center justify-start">
          <div className="max-w-lg text-white animate-fade-in">
            <h1 className="text-4xl md:text-6xl font-bold mb-4 animate-slide-up">
              {heroSlides[currentHeroSlide].title}
            </h1>
            <p className="text-lg md:text-xl mb-8 text-slate-200 animate-slide-up animation-delay-200">
              {heroSlides[currentHeroSlide].subtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 animate-slide-up animation-delay-400">
              <Link to={heroSlides[currentHeroSlide].ctaLink}>
                <Button size="lg" className="text-slate-900 bg-white hover:bg-blue-500 hover:shadow-xl hover:scale-105 hover:text-white font-semibold px-8 transition-all duration-300">
                  {heroSlides[currentHeroSlide].ctaText}
                </Button>
              </Link>
              <Link to="/products">
                <Button size="lg" variant="secondary" className="border-2 border-white text-slate-900 bg-white hover:bg-slate-300 hover:shadow-xl hover:scale-105 transition-all duration-300">
                  Explore All
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Slide Indicators */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex space-x-3">
          {heroSlides.map((_, index) => (
            <button
              key={index}
              onClick={() => goToHeroSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentHeroSlide
                  ? 'bg-white scale-125'
                  : 'bg-white/50 hover:bg-white/75'
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 right-8 z-20 animate-bounce">
          <div className="w-6 h-10 border-2 border-white/50 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-white/50 rounded-full mt-2 animate-pulse"></div>
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

      {/* Footer */}
      <footer className="bg-gradient-to-r from-[#003A8C] via-[#2D3191] to-[#386BB4] text-slate-300">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
            <div className="md:col-span-1">
              <h3 className="text-2xl font-bold text-white mb-4">LOGO</h3>
              <p className="text-slate-300">Your trusted online shopping destination for quality products at great prices.</p>
              <div className="flex space-x-4 mt-4">
                <a className="text-slate-300 hover:text-white transition-colors" href="#">
                  <svg aria-hidden="true" className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path clipRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" fillRule="evenodd"></path>
                  </svg>
                </a>
                <a className="text-slate-300 hover:text-white transition-colors" href="#">
                  <svg aria-hidden="true" className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.71v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path>
                  </svg>
                </a>
                <a className="text-slate-300 hover:text-white transition-colors" href="#">
                  <svg aria-hidden="true" className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path clipRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.024.06 1.378.06 3.808s-.012 2.784-.06 3.808c-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.024.048-1.378.06-3.808.06s-2.784-.012-3.808-.06c-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.048-1.024-.06-1.378-.06-3.808s.012-2.784.06-3.808c.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 016.345 2.525c.636-.247 1.363-.416 2.427-.465C9.793 2.013 10.147 2 12.315 2zm-1.003 3.636c-2.404.0-4.35 1.946-4.35 4.35s1.946 4.35 4.35 4.35 4.35-1.946 4.35-4.35S13.716 5.636 11.312 5.636zM12 15.11a3.11 3.11 0 110-6.22 3.11 3.11 0 010 6.22zm4.85-8.235a1.166 1.166 0 11-2.332 0 1.166 1.166 0 012.332 0z" fillRule="evenodd"></path>
                  </svg>
                </a>
              </div>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Quick Links</h4>
              <ul className="space-y-2">
                <li><Link className="text-slate-300 hover:text-white hover:underline transition-colors" to="/about">About Us</Link></li>
                <li><Link className="text-slate-300 hover:text-white hover:underline transition-colors" to="/contact">Contact</Link></li>
                <li><Link className="text-slate-300 hover:text-white hover:underline transition-colors" to="/faq">FAQ</Link></li>
                <li><Link className="text-slate-300 hover:text-white hover:underline transition-colors" to="/shipping">Shipping Info</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Categories</h4>
              <ul className="space-y-2">
                <li><a className="text-slate-300 hover:text-white hover:underline transition-colors" href="#">Shoes</a></li>
                <li><a className="text-slate-300 hover:text-white hover:underline transition-colors" href="#">Fashion</a></li>
                <li><a className="text-slate-300 hover:text-white hover:underline transition-colors" href="#">Home & Garden</a></li>
                <li><a className="text-slate-300 hover:text-white hover:underline transition-colors" href="#">Sports</a></li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Newsletter</h4>
              <p className="text-slate-300 mb-4">Subscribe to get updates on new products and offers.</p>
              <form className="flex">
                <input className="w-full rounded-l-lg border-0 py-2 px-3 text-slate-900 focus:ring-2 focus:ring-inset focus:ring-primary" placeholder="Enter your email" type="email"/>
                <button className="bg-primary text-white font-semibold px-4 py-2 rounded-r-lg hover:bg-blue-600 transition-colors">Subscribe</button>
              </form>
            </div>
          </div>
          <div className="border-t border-slate-700 mt-12 pt-8 text-center text-slate-400">
            <p>© 2025 Your Store. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
