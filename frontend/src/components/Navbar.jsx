import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react'; // Ensure lucide-react is installed

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  const isActive = (path) => 
    location.pathname === path ? "text-cyan-400 font-bold" : "hover:text-cyan-400";

  return (
    <nav className="bg-gray-900 text-white shadow-lg border-b border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo and Brand */}
          <div className="flex-shrink-0 flex items-center gap-3">
            <Link to="/dashboard" className="flex items-center gap-3">
              <img src="/jj-logo.jpeg" alt="JJTL WMS Logo" className="h-10 w-10 object-contain" />
              <span className="text-2xl font-bold tracking-wider text-cyan-400">JJTL WMS</span>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex space-x-6">
            <Link to="/dashboard" className={`${isActive('/dashboard')} transition`}>Dashboard</Link>
            <Link to="/scan" className={`${isActive('/scan')} transition`}>Scan Item</Link>
            <Link to="/inventory" className={`${isActive('/inventory')} transition`}>Inventory</Link>
            <Link to="/add-item" className={`${isActive('/add-item')} transition`}>Add Item</Link>
            <Link to="/logs" className={`${isActive('/logs')} transition`}>Audit Logs</Link>
            <Link to="/settings" className={`${isActive('/settings')} transition`}>Settings</Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button onClick={() => setIsOpen(!isOpen)} className="text-gray-300 hover:text-white">
              {isOpen ? <X size={28} /> : <Menu size={28} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Links */}
      {isOpen && (
        <div className="md:hidden bg-gray-800 px-4 pt-2 pb-4 space-y-2">
          <Link to="/dashboard" onClick={() => setIsOpen(false)} className={`block py-2 ${isActive('/dashboard')}`}>Dashboard</Link>
          <Link to="/inventory" onClick={() => setIsOpen(false)} className={`block py-2 ${isActive('/inventory')}`}>Inventory</Link>
          <Link to="/add-item" onClick={() => setIsOpen(false)} className={`block py-2 ${isActive('/add-item')}`}>Add Item</Link>
          <Link to="/logs" onClick={() => setIsOpen(false)} className={`block py-2 ${isActive('/logs')}`}>Audit Logs</Link>
          <Link to="/settings" onClick={() => setIsOpen(false)} className={`block py-2 ${isActive('/settings')}`}>Settings</Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;