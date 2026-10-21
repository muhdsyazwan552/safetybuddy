import React from 'react';
import { Head, Link } from '@inertiajs/react';

export default function Layout({ children }) {
    return (
        <>
          <header className="bg-white shadow-lg">
    {/* First Banner - Branding */}
<div className="bg-ink-900 text-white border-b-2 border-brand-500">
    <div className="container mx-auto px-2 lg:px-4 py-2 flex flex-col lg:flex-row justify-between items-start lg:items-center space-y-2 lg:space-y-0">
        <div className="flex items-center space-x-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span className="text-sm font-medium">Safety Buddy — Control. Performance. Report.</span>
        </div>

        <div className="flex flex-col lg:flex-row lg:space-x-4 text-sm space-y-1 lg:space-y-0">
            <span></span>
            <span></span>
        </div>
    </div>
</div>


    {/* Second Banner - Main Navigation */}
    <div className="container mx-auto px-4 py-4">
        <div className="flex justify-between items-center">
            {/* Logo/Brand */}
           <Link href="/" className="flex items-center" aria-label="Safety Buddy home">
  <img 
    src="/images/sbc-header.png"
    alt="Safety Buddy – Cmeri"
    className="h-20 w-auto max-w-[240px] object-contain"
  />
</Link>

            {/* Main Navigation */}
            {/* <nav className="hidden md:flex space-x-8">
                <Link 
                    href="/" 
                    className="px-3 py-2 text-gray-700 hover:text-blue-600 font-medium transition-colors border-b-2 border-transparent hover:border-blue-600"
                >
                    Home
                </Link>
                <Link 
                    href="/shop" 
                    className="px-3 py-2 text-gray-700 hover:text-blue-600 font-medium transition-colors border-b-2 border-transparent hover:border-blue-600"
                >
                    Shop
                </Link>
                <Link 
                    href="/booking" 
                    className="px-3 py-2 text-gray-700 hover:text-blue-600 font-medium transition-colors border-b-2 border-transparent hover:border-blue-600"
                >
                    Book Courts
                </Link>
                <Link 
                    href="/about" 
                    className="px-3 py-2 text-gray-700 hover:text-blue-600 font-medium transition-colors border-b-2 border-transparent hover:border-blue-600"
                >
                    About Us
                </Link>
            </nav> */}

            {/* User Actions */}
            {/* <div className="flex items-center space-x-4">
                <Link 
                    href="/cart" 
                    className="p-2 text-gray-600 hover:text-blue-600 relative"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                        3
                    </span>
                </Link>
                <Link 
                    href="/profile" 
                    className="p-2 text-gray-600 hover:text-blue-600"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                </Link>
            </div> */}
        </div>
    </div>
</header>
            
            <main className='bg-slate-100 w-auto min-h-screen py-4'>
                {children}
            </main>
            
            <footer className="bg-ink-900 text-gray-300 py-8 mt-2">
                <div className="container mx-auto px-4 text-center">
                    &copy; {new Date().getFullYear()} Safety Buddy
                </div>
            </footer>
        </>
    );
}
