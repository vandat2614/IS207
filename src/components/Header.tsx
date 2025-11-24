import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

interface UserData {
  firstName: string;
  lastName: string;
  avatar?: string;
  role?: string;
}

const Header: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [selectedSearchIndex, setSelectedSearchIndex] = useState(-1);
  const location = useLocation();
  const navigate = useNavigate();
  const isLoginPage = location.pathname === '/login';
  const searchInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowSearchDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Clear search on route change
  useEffect(() => {
    setSearchQuery('');
    setSearchResults([]);
    setShowSearchDropdown(false);
    setSelectedSearchIndex(-1);
  }, [location.pathname]);

  const fetchUserProfile = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setUserData(null);
      setIsLoggedIn(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/profile', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const user = data.data ? data.data.user : data.user;
        console.log('Header - User profile data:', user);
        console.log('Header - User role:', user.role);
        setUserData({
          firstName: user.first_name,
          lastName: user.last_name,
          avatar: user.avatar,
          role: user.role
        });
        setIsLoggedIn(true);
      } else {
        console.warn('Failed to fetch user profile');
        setUserData(null);
        setIsLoggedIn(false);
      }
    } catch (error) {
      console.warn('Error fetching user profile:', error);
      setUserData(null);
      setIsLoggedIn(false);
    }
  };

  const fetchCartCount = async () => {
    const token = localStorage.getItem('authToken');
    if (!token) {
      setCartCount(0);
      return;
    }

    try {
      const response = await fetch('http://localhost:8000/cart', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        const count = data.data ? (data.data.total_items || 0) : (data.total_items || 0);
        setCartCount(count);
      }
    } catch (err) {
      console.warn('Failed to fetch cart count:', err);
    }
  };

  // Expose fetchCartCount globally so other components can call it
  (window as any).updateCartCount = fetchCartCount;

  const checkAuthState = () => {
    const token = localStorage.getItem('authToken');
    if (token) {
      // Immediately set as logged in with basic state
      setIsLoggedIn(true);
      setCartCount(0); // Will be updated below

      // Then fetch user data and cart count
      fetchUserProfile();
      fetchCartCount();
    } else {
      setUserData(null);
      setIsLoggedIn(false);
      setCartCount(0);
    }
  };

  useEffect(() => {
    // Check auth state whenever location changes
    checkAuthState();
  }, [location]);

  // Also check auth state immediately on mount
  useEffect(() => {
    checkAuthState();
  }, []);

  const navItems = [
    { name: 'Home', path: '/' },
    { name: 'Categories', path: '/categories' },
    { name: 'Products', path: '/products' },
  ];

  const isActiveLink = (path: string) => {
    if (path === '/' && location.pathname === '/') return true;
    if (path !== '/' && location.pathname.startsWith(path)) return true;
    return false;
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    setIsLoggedIn(false);
    setUserData(null);
    navigate('/');
  };

  const isAdmin = userData?.role === 'admin';
  console.log('Header - isAdmin:', isAdmin, 'userRole:', userData?.role);

  // Enhanced search function with dropdown results
  const performSearch = async (query: string, showResults = true) => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      setSelectedSearchIndex(-1);
      return;
    }

    setIsSearching(true);
    setSelectedSearchIndex(-1);

    try {
      const response = await fetch(`http://localhost:8000/products?search=${encodeURIComponent(trimmedQuery)}&limit=8`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        const products = data.data?.products || [];

        // Process products for display
        const processedProducts = products.map((product: any) => ({
          id: product.id,
          name: product.name,
          price: parseFloat(product.price) || 0,
          image: product.images ? (Array.isArray(product.images) ? product.images[0] : JSON.parse(product.images)[0]) : '/placeholder-product.jpg'
        }));

        setSearchResults(processedProducts);
        if (showResults && processedProducts.length > 0) {
          setShowSearchDropdown(true);
        } else {
          setShowSearchDropdown(false);
        }
      } else {
        console.warn('Search API failed:', response.status);
        setSearchResults([]);
        setShowSearchDropdown(false);
      }
    } catch (err) {
      console.error('Search error:', err);
      setSearchResults([]);
      setShowSearchDropdown(false);
    } finally {
      setIsSearching(false);
    }
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchQuery(value);

    // Debounced search
    if (value.trim()) {
      // Clear previous timeout
      if ((window as any).searchTimeout) {
        clearTimeout((window as any).searchTimeout);
      }

      // Set new timeout for search
      (window as any).searchTimeout = setTimeout(() => {
        performSearch(value);
      }, 300);
    } else {
      setSearchResults([]);
      setShowSearchDropdown(false);
      setSelectedSearchIndex(-1);
    }
  };

  // Handle search form submission
  const handleSearchSubmit = () => {
    if (selectedSearchIndex >= 0 && selectedSearchIndex < searchResults.length) {
      // Navigate to selected product
      const product = searchResults[selectedSearchIndex];
      setSearchQuery('');
      setShowSearchDropdown(false);
      setSelectedSearchIndex(-1);
      navigate(`/product/${product.id}`);
    } else if (searchResults.length > 0) {
      // Navigate to first result
      const product = searchResults[0];
      setSearchQuery('');
      setShowSearchDropdown(false);
      setSelectedSearchIndex(-1);
      navigate(`/product/${product.id}`);
    }
  };

  // Handle Enter key in search input
  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSearchSubmit();
    } else if (e.key === 'Escape') {
      setShowSearchDropdown(false);
      setSelectedSearchIndex(-1);
      searchInputRef.current?.blur();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!showSearchDropdown && searchResults.length > 0) {
        setShowSearchDropdown(true);
      } else if (showSearchDropdown && searchResults.length > 0) {
        setSelectedSearchIndex(prev =>
          prev < searchResults.length - 1 ? prev + 1 : 0
        );
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (showSearchDropdown && searchResults.length > 0) {
        setSelectedSearchIndex(prev =>
          prev > 0 ? prev - 1 : searchResults.length - 1
        );
      }
    }
  };

  // Handle product selection from dropdown
  const handleProductSelect = (productId: number) => {
    setSearchQuery('');
    setShowSearchDropdown(false);
    setSelectedSearchIndex(-1);
    navigate(`/product/${productId}`);
  };

  // Handle search input focus
  const handleSearchFocus = () => {
    if (searchResults.length > 0) {
      setShowSearchDropdown(true);
    }
  };

  return (
    <header className="bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-sm sticky top-0 z-50 border-b border-slate-200 dark:border-slate-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="font-bold text-2xl text-slate-900 dark:text-white">
              LOGO
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6 ml-10">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`text-sm font-medium transition-colors ${
                    isActiveLink(item.path)
                      ? 'text-blue-500'
                      : 'text-slate-700 dark:text-slate-300 hover:text-blue-500 dark:hover:text-blue-500'
                  }`}
                >
                  {item.name}
                </Link>
              ))}

              {/* Admin Panel Link - Only for admins */}
              {isAdmin && (
                <Link
                  to="/admin/orders"
                  className={`text-sm font-medium transition-colors ${
                    isActiveLink('/admin')
                      ? 'text-red-500'
                      : 'text-slate-700 dark:text-slate-300 hover:text-red-500 dark:hover:text-red-500'
                  }`}
                >
                  Admin Panel
                </Link>
              )}
            </nav>
          </div>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            {/* Desktop Search - Hidden on login page */}
            {!isLoginPage && (
              <div className="hidden sm:block relative" ref={dropdownRef}>
                <span className="material-icons-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">
                  search
                </span>
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onKeyDown={handleSearchKeyPress}
                  onFocus={handleSearchFocus}
                  disabled={isSearching}
                  className="w-80 pl-10 pr-4 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:opacity-50"
                />

                {/* Search Dropdown */}
                {showSearchDropdown && searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-96 overflow-y-auto z-50">
                    <div className="p-2">
                      <div className="text-xs text-slate-500 dark:text-slate-400 px-2 py-1 mb-1">
                        {searchResults.length} product{searchResults.length !== 1 ? 's' : ''} found
                      </div>
                      {searchResults.map((product, index) => (
                        <div
                          key={product.id}
                          className={`flex items-center space-x-3 px-3 py-3 rounded-md cursor-pointer transition-colors ${
                            index === selectedSearchIndex
                              ? 'bg-blue-50 dark:bg-blue-900/30'
                              : 'hover:bg-slate-50 dark:hover:bg-slate-700'
                          }`}
                          onClick={() => handleProductSelect(product.id)}
                        >
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-10 h-10 rounded-lg object-cover"
                            onError={(e) => {
                              e.currentTarget.src = '/placeholder-product.jpg';
                            }}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                              {product.name}
                            </div>
                            <div className="text-sm text-slate-500 dark:text-slate-400">
                              ${product.price.toFixed(2)}
                            </div>
                          </div>
                          <span className="material-icons-outlined text-slate-400 text-lg">
                            arrow_forward_ios
                          </span>
                        </div>
                      ))}

                      {/* View all results link */}
                      <div className="border-t border-slate-200 dark:border-slate-600 mt-2 pt-2">
                        <Link
                          to={`/products?search=${encodeURIComponent(searchQuery)}`}
                          className="flex items-center justify-center space-x-2 w-full px-3 py-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                          onClick={() => {
                            setSearchQuery('');
                            setShowSearchDropdown(false);
                            setSelectedSearchIndex(-1);
                          }}
                        >
                          <span>View all results</span>
                          <span className="material-icons-outlined text-base">east</span>
                        </Link>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Profile */}
            {isLoggedIn ? (
              // Logged in state - show user avatar and name
              <Link
                to="/profile"
                className="flex items-center space-x-2 p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                title="Profile"
              >
                {userData?.avatar ? (
                  <img
                    src={`/${userData.avatar}`}
                    alt={`${userData.firstName} ${userData.lastName}`}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 bg-slate-300 dark:bg-slate-600 rounded-full flex items-center justify-center">
                    <span className="material-icons-outlined text-slate-600 dark:text-slate-400 text-lg">
                      person
                    </span>
                  </div>
                )}
                <span className="hidden sm:block text-slate-700 dark:text-slate-300 text-sm">
                  {userData ? `${userData.firstName} ${userData.lastName}` : 'Account'}
                </span>
              </Link>
            ) : (
              // Not logged in - show login link
              <Link
                to="/login"
                className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
                title="Login"
              >
                <span className="material-icons-outlined text-slate-700 dark:text-slate-300">
                  person_outline
                </span>
              </Link>
            )}

            {/* Cart */}
            <Link
              to="/cart"
              className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors relative"
              title="Shopping Cart"
            >
              <span className="material-icons-outlined text-slate-700 dark:text-slate-300">
                shopping_cart
              </span>
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-blue-500 text-xs font-medium text-white">
                {cartCount}
              </span>
            </Link>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 rounded-md hover:bg-slate-200 dark:hover:bg-slate-800"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              title="Menu"
            >
              <span className="material-icons-outlined text-slate-700 dark:text-slate-300">
                {isMobileMenuOpen ? 'close' : 'menu'}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 dark:border-slate-800 py-4">
            {/* Mobile Search - Hidden on login page */}
            {!isLoginPage && (
              <div className="mb-4 px-0">
                <div className="relative">
                  <span className="material-icons-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xl">
                    search
                  </span>
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    onKeyDown={handleSearchKeyPress}
                    onFocus={handleSearchFocus}
                    disabled={isSearching}
                    className="w-full pl-10 pr-4 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors disabled:opacity-50"
                  />

                  {/* Mobile Search Dropdown */}
                  {showSearchDropdown && searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg max-h-64 overflow-y-auto z-50">
                      <div className="p-2">
                        <div className="text-xs text-slate-500 dark:text-slate-400 px-2 py-1 mb-1">
                          {searchResults.length} product{searchResults.length !== 1 ? 's' : ''} found
                        </div>
                        {searchResults.map((product, index) => (
                          <div
                            key={product.id}
                            className={`flex items-center space-x-2 px-2 py-2 rounded-md cursor-pointer transition-colors ${
                              index === selectedSearchIndex
                                ? 'bg-blue-50 dark:bg-blue-900/30'
                                : 'hover:bg-slate-50 dark:hover:bg-slate-700'
                            }`}
                            onClick={() => handleProductSelect(product.id)}
                          >
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-8 h-8 rounded object-cover"
                              onError={(e) => {
                                e.currentTarget.src = '/placeholder-product.jpg';
                              }}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                                {product.name}
                              </div>
                            </div>
                          </div>
                        ))}

                        {/* Mobile View all results link */}
                        <div className="border-t border-slate-200 dark:border-slate-600 mt-1 pt-1">
                          <Link
                            to={`/products?search=${encodeURIComponent(searchQuery)}`}
                            className="flex items-center justify-center space-x-1 w-full px-2 py-2 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
                            onClick={() => {
                              setSearchQuery('');
                              setShowSearchDropdown(false);
                              setSelectedSearchIndex(-1);
                              setIsMobileMenuOpen(false);
                            }}
                          >
                            <span>View all</span>
                            <span className="material-icons-outlined text-sm">east</span>
                          </Link>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Mobile Nav Items */}
            <nav className="flex flex-col space-y-4">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`text-sm font-medium transition-colors ${
                    isActiveLink(item.path)
                      ? 'text-blue-500'
                      : 'text-slate-700 dark:text-slate-300 hover:text-blue-500 dark:hover:text-blue-500'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}

              {/* Admin Panel Link - Only for admins in mobile menu */}
              {isAdmin && (
                <Link
                  to="/admin/orders"
                  className={`text-sm font-medium transition-colors ${
                    isActiveLink('/admin')
                      ? 'text-red-500'
                      : 'text-slate-700 dark:text-slate-300 hover:text-red-500 dark:hover:text-red-500'
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Admin Panel
                </Link>
              )}

              {isLoggedIn && (
                <button
                  onClick={() => {
                    handleLogout();
                    setIsMobileMenuOpen(false);
                  }}
                  className="text-left text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-blue-500 dark:hover:text-blue-500 flex items-center space-x-2"
                >
                  <span className="material-icons-outlined text-base">logout</span>
                  <span>Logout</span>
                </button>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
