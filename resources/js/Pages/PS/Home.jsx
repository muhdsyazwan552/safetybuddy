import React, { useState } from 'react';
import { Head, Link } from '@inertiajs/react';

export default function Home({ auth }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  
  // Dummy data for banners
  const banners = [
    {
      id: 1,
      image: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=1200',
      title: 'Construction Materials Sale',
      subtitle: 'Up to 50% off on building supplies'
    },
    {
      id: 2,
      image: 'https://images.unsplash.com/photo-1581092335871-4e5c5e6b5a8f?w=1200',
      title: 'Professional Services',
      subtitle: 'Hire certified contractors'
    },
    {
      id: 3,
      image: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=1200',
      title: 'Tools & Equipment',
      subtitle: 'Free delivery on orders over $500'
    }
  ];

  // Categories
  const categories = [
    { id: 1, name: 'Building Materials', icon: '🏗️', color: 'bg-blue-100' },
    { id: 2, name: 'Tools & Hardware', icon: '🔧', color: 'bg-orange-100' },
    { id: 3, name: 'Electrical', icon: '⚡', color: 'bg-yellow-100' },
    { id: 4, name: 'Plumbing', icon: '💧', color: 'bg-cyan-100' },
    { id: 5, name: 'Painting', icon: '🎨', color: 'bg-purple-100' },
    { id: 6, name: 'Safety Equipment', icon: '⛑️', color: 'bg-red-100' },
    { id: 7, name: 'Heavy Machinery', icon: '🏭', color: 'bg-gray-100' },
    { id: 8, name: 'Renovation', icon: '🏠', color: 'bg-green-100' }
  ];

  // Featured products
  const featuredProducts = [
    {
      id: 1,
      name: 'Portable Concrete Mixer',
      price: 299.99,
      originalPrice: 399.99,
      rating: 4.5,
      reviews: 128,
      image: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=400',
      badge: '-25%',
      sold: 245
    },
    {
      id: 2,
      name: 'Professional Power Drill Set',
      price: 159.99,
      originalPrice: 199.99,
      rating: 4.8,
      reviews: 342,
      image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=400',
      badge: '-20%',
      sold: 512
    },
    {
      id: 3,
      name: 'Safety Helmet with Visor',
      price: 45.99,
      originalPrice: 69.99,
      rating: 4.6,
      reviews: 89,
      image: 'https://images.unsplash.com/photo-1581092335871-4e5c5e6b5a8f?w=400',
      badge: '-34%',
      sold: 167
    },
    {
      id: 4,
      name: 'High-Grade Cement (50kg)',
      price: 12.99,
      originalPrice: 15.99,
      rating: 4.7,
      reviews: 456,
      image: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=400',
      badge: 'Bestseller',
      sold: 1234
    },
    {
      id: 5,
      name: 'Welding Machine Industrial',
      price: 499.99,
      originalPrice: 699.99,
      rating: 4.9,
      reviews: 67,
      image: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=400',
      badge: '-28%',
      sold: 89
    },
    {
      id: 6,
      name: 'LED Work Light 5000W',
      price: 89.99,
      originalPrice: 129.99,
      rating: 4.4,
      reviews: 234,
      image: 'https://images.unsplash.com/photo-1565049786474-1dea82a8b995?w=400',
      badge: '-30%',
      sold: 678
    }
  ];

  // Services
  const services = [
    {
      id: 1,
      name: 'Construction & Building',
      provider: 'ABC Construction',
      price: 'Starting from $500',
      rating: 4.8,
      image: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=400',
      category: 'Construction'
    },
    {
      id: 2,
      name: 'Electrical Installation',
      provider: 'Spark Electric Co.',
      price: 'Starting from $150',
      rating: 4.9,
      image: 'https://images.unsplash.com/photo-1565049786474-1dea82a8b995?w=400',
      category: 'Electrical'
    },
    {
      id: 3,
      name: 'Plumbing Services',
      provider: 'Flow Plumbing',
      price: 'Starting from $100',
      rating: 4.7,
      image: 'https://images.unsplash.com/photo-1581092335871-4e5c5e6b5a8f?w=400',
      category: 'Plumbing'
    },
    {
      id: 4,
      name: 'Interior Design',
      provider: 'Dream Spaces',
      price: 'Starting from $800',
      rating: 4.9,
      image: 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=400',
      category: 'Design'
    }
  ];

  // Flash deals
  const flashDeals = [
    { id: 1, name: 'Hammer Set', price: 19.99, originalPrice: 39.99, image: 'https://images.unsplash.com/photo-1504148455328-c376907d081c?w=200', sold: '75%' },
    { id: 2, name: 'Measuring Tape', price: 5.99, originalPrice: 12.99, image: 'https://images.unsplash.com/photo-1581092335871-4e5c5e6b5a8f?w=200', sold: '82%' },
    { id: 3, name: 'Safety Gloves', price: 8.99, originalPrice: 19.99, image: 'https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=200', sold: '68%' },
    { id: 4, name: 'Paint Brush Set', price: 12.99, originalPrice: 24.99, image: 'https://images.unsplash.com/photo-1565049786474-1dea82a8b995?w=200', sold: '91%' }
  ];

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % banners.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + banners.length) % banners.length);
  };

  return (
    <>
      <Head title="Home - Construction Marketplace" />
      
      <div className="min-h-screen bg-gray-50">
        {/* Header with search - Similar to Shopee/Zalora */}
        <header className="bg-white shadow-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center gap-4">
              {/* Logo */}
              <Link href="/" className="text-2xl font-bold text-blue-600 flex items-center gap-2">
                <span className="text-3xl">🏗️</span>
                <span>BuildMart</span>
              </Link>

              {/* Search Bar */}
              <div className="flex-1 max-w-2xl">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search for construction materials, tools, or services..."
                    className="w-full px-4 py-2 pl-10 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-500"
                  />
                  <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
                  <button className="absolute right-1 top-1 px-4 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                    Search
                  </button>
                </div>
              </div>

              {/* User Actions */}
              <div className="flex items-center gap-4">
                <Link href="/account" className="flex items-center gap-1 hover:text-blue-600">
                  <span>👤</span>
                  <span className="hidden md:inline">Account</span>
                </Link>
                <Link href="/wishlist" className="relative">
                  <span>❤️</span>
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    0
                  </span>
                </Link>
                <Link href="/cart" className="relative">
                  <span>🛒</span>
                  <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    0
                  </span>
                </Link>
              </div>
            </div>
          </div>
        </header>

        {/* Hero Banner Carousel */}
        <div className="relative mt-2 container mx-auto px-4">
          <div className="relative overflow-hidden rounded-xl">
            <div 
              className="flex transition-transform duration-300 ease-in-out"
              style={{ transform: `translateX(-${currentSlide * 100}%)` }}
            >
              {banners.map((banner) => (
                <div key={banner.id} className="w-full flex-shrink-0 relative">
                  <img 
                    src={banner.image} 
                    alt={banner.title}
                    className="w-full h-64 md:h-96 object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-40 flex items-center justify-center">
                    <div className="text-center text-white">
                      <h2 className="text-3xl md:text-5xl font-bold mb-2">{banner.title}</h2>
                      <p className="text-lg md:text-xl">{banner.subtitle}</p>
                      <button className="mt-4 px-6 py-2 bg-blue-600 rounded-lg hover:bg-blue-700">
                        Shop Now
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Carousel Controls */}
            <button 
              onClick={prevSlide}
              className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full hover:bg-white"
            >
              ◀
            </button>
            <button 
              onClick={nextSlide}
              className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full hover:bg-white"
            >
              ▶
            </button>
          </div>
        </div>

        {/* Categories Section */}
        <div className="container mx-auto px-4 mt-8">
          <div className="bg-white rounded-lg p-6">
            <h2 className="text-xl font-bold mb-4">Shop by Category</h2>
            <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
              {categories.map((category) => (
                <Link 
                  key={category.id}
                  href={`/category/${category.id}`}
                  className="flex flex-col items-center group"
                >
                  <div className={`${category.color} p-3 rounded-full mb-2 group-hover:scale-110 transition-transform text-2xl`}>
                    {category.icon}
                  </div>
                  <span className="text-sm text-center">{category.name}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Flash Deals - Similar to Shopee */}
        <div className="container mx-auto px-4 mt-6">
          <div className="bg-white rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">⚡</span>
                <h2 className="text-xl font-bold">Flash Sales</h2>
                <div className="flex gap-1 ml-4">
                  <div className="bg-red-500 text-white px-2 py-1 rounded">02</div>
                  <span>:</span>
                  <div className="bg-red-500 text-white px-2 py-1 rounded">15</div>
                  <span>:</span>
                  <div className="bg-red-500 text-white px-2 py-1 rounded">42</div>
                </div>
              </div>
              <Link href="/flash-sales" className="text-blue-600 hover:text-blue-700">
                View All ▶
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {flashDeals.map((deal) => (
                <div key={deal.id} className="border rounded-lg p-3 hover:shadow-lg transition">
                  <img src={deal.image} alt={deal.name} className="w-full h-40 object-cover rounded" />
                  <div className="mt-2">
                    <h3 className="font-semibold">{deal.name}</h3>
                    <div className="text-red-500 font-bold">${deal.price}</div>
                    <div className="text-gray-400 line-through text-sm">${deal.originalPrice}</div>
                    <div className="mt-2 bg-gray-200 rounded-full h-2">
                      <div className="bg-red-500 h-2 rounded-full" style={{ width: deal.sold }}></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">Sold: {deal.sold}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Features Banner */}
        <div className="container mx-auto px-4 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-4 rounded-lg flex items-center gap-3">
              <span className="text-3xl">🚚</span>
              <div>
                <h3 className="font-semibold">Free Delivery</h3>
                <p className="text-sm text-gray-600">On orders over $500</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg flex items-center gap-3">
              <span className="text-3xl">🛡️</span>
              <div>
                <h3 className="font-semibold">Secure Payment</h3>
                <p className="text-sm text-gray-600">100% secure transactions</p>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg flex items-center gap-3">
              <span className="text-3xl">⏰</span>
              <div>
                <h3 className="font-semibold">24/7 Support</h3>
                <p className="text-sm text-gray-600">Dedicated customer service</p>
              </div>
            </div>
          </div>
        </div>

        {/* Featured Products */}
        <div className="container mx-auto px-4 mt-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Recommended for You</h2>
            <Link href="/products" className="text-blue-600">View All</Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {featuredProducts.map((product) => (
              <div key={product.id} className="bg-white rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                <div className="relative">
                  <img src={product.image} alt={product.name} className="w-full h-48 object-cover" />
                  {product.badge && (
                    <span className="absolute top-2 left-2 bg-red-500 text-white text-xs px-2 py-1 rounded">
                      {product.badge}
                    </span>
                  )}
                  <button className="absolute top-2 right-2 bg-white p-1 rounded-full">
                    ❤️
                  </button>
                </div>
                <div className="p-3">
                  <h3 className="font-semibold text-sm line-clamp-2">{product.name}</h3>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-yellow-400">⭐</span>
                    <span className="text-sm">{product.rating}</span>
                    <span className="text-xs text-gray-400">({product.reviews})</span>
                  </div>
                  <div className="mt-1">
                    <span className="text-red-500 font-bold">${product.price}</span>
                    <span className="text-gray-400 line-through text-sm ml-2">${product.originalPrice}</span>
                  </div>
                  <div className="text-xs text-gray-500 mt-1">Sold: {product.sold}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Services Section */}
        <div className="container mx-auto px-4 mt-6">
          <div className="bg-gradient-to-r from-brand-500 to-brand-700 rounded-lg p-6">
            <h2 className="text-xl font-bold text-white mb-4">Professional Services</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {services.map((service) => (
                <div key={service.id} className="bg-white rounded-lg overflow-hidden hover:shadow-lg transition">
                  <img src={service.image} alt={service.name} className="w-full h-48 object-cover" />
                  <div className="p-4">
                    <h3 className="font-semibold">{service.name}</h3>
                    <p className="text-sm text-gray-600">{service.provider}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-yellow-400">⭐</span>
                      <span className="text-sm">{service.rating}</span>
                    </div>
                    <p className="text-blue-600 font-semibold mt-2">{service.price}</p>
                    <button className="mt-3 w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700">
                      Book Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-gray-800 text-white mt-8 py-8">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">🏗️</span>
                  <h3 className="font-bold text-lg">BuildMart</h3>
                </div>
                <p className="text-sm text-gray-400">Your one-stop construction marketplace</p>
              </div>
              <div>
                <h4 className="font-semibold mb-3">Customer Service</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li><Link href="/help">Help Center</Link></li>
                  <li><Link href="/returns">Returns Policy</Link></li>
                  <li><Link href="/delivery">Delivery Info</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-3">About Us</h4>
                <ul className="space-y-2 text-sm text-gray-400">
                  <li><Link href="/about">Company Info</Link></li>
                  <li><Link href="/careers">Careers</Link></li>
                  <li><Link href="/press">Press</Link></li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-3">Download App</h4>
                <div className="flex gap-2">
                  <div className="bg-white rounded p-2 text-black text-xs">App Store</div>
                  <div className="bg-white rounded p-2 text-black text-xs">Google Play</div>
                </div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}