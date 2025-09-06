import React from 'react';
import { navigateTo } from '../lib/navigation';

const PublicNavbar = () => {
  return (
    <nav className="bg-white shadow-lg fixed w-full top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <a 
              href="/"
              className="flex items-center cursor-pointer"
            >
              <div className="w-8 h-8 bg-gradient-to-br from-slate-700 to-slate-900 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">T</span>
              </div>
              <span className="ml-2 text-xl font-bold text-slate-900">TrackFlow</span>
            </a>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:block">
            <div className="ml-10 flex items-baseline space-x-4">
              <a
                href="/home"
                className="px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-gradient-to-r hover:from-slate-700 hover:to-slate-900 hover:text-white hover:shadow-lg transform hover:scale-105 transition-all duration-300 ease-in-out"
              >
                Home
              </a>
              <a
                href="/about"
                className="px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-gradient-to-r hover:from-slate-700 hover:to-slate-900 hover:text-white hover:shadow-lg transform hover:scale-105 transition-all duration-300 ease-in-out"
              >
                About
              </a>
              <a
                href="/tracking"
                className="px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-gradient-to-r hover:from-slate-700 hover:to-slate-900 hover:text-white hover:shadow-lg transform hover:scale-105 transition-all duration-300 ease-in-out"
              >
                Track Parcel
              </a>
              <a
                href="/contact"
                className="px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-gradient-to-r hover:from-slate-700 hover:to-slate-900 hover:text-white hover:shadow-lg transform hover:scale-105 transition-all duration-300 ease-in-out"
              >
                Contact
              </a>
              <a
                href="/faq"
                className="px-3 py-2 rounded-md text-sm font-medium text-slate-700 hover:bg-gradient-to-r hover:from-slate-700 hover:to-slate-900 hover:text-white hover:shadow-lg transform hover:scale-105 transition-all duration-300 ease-in-out"
              >
                FAQ
              </a>
            </div>
          </div>

          {/* Sign In Button */}
          <div>
            <a
              href="/"
              className="bg-gradient-to-r from-slate-700 to-slate-900 text-white px-4 py-2 rounded-md text-sm font-medium transition-all duration-300 hover:from-slate-600 hover:to-slate-800 hover:shadow-xl transform hover:scale-105 active:scale-95"
            >
              Sign In
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default PublicNavbar;
