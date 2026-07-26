/**
 * @file App.jsx
 * @description Main entry point and router configuration for the JJTL WMS client application, handling layout wrappers, public and protected routes, authentication guards, and global toast notifications.
 */

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Warehouse from './pages/Warehouse';
import AddItem from './pages/AddItem';
import ScanItem from './pages/ScanItem';
import Logs from './pages/Logs';
import Settings from './pages/Settings';
import InventoryDigitalView from './pages/InventoryDigitalView';

// Layout Components
import Navbar from './components/Navbar';
import ScrollToTop from './components/ScrollToTop';

/**
 * ProtectedLayout Component
 * Wraps protected routes with the persistent Navbar and verifies authentication status.
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render inside the layout
 * @returns {JSX.Element} The rendered layout or a redirect to login
 */
const ProtectedLayout = ({ children }) => {
  const token = localStorage.getItem('token');
  
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      <Navbar />
      
      {/* 
        1. Removed 'max-w-7xl mx-auto' from here.
        2. Set w-full to ensure it fills the screen width.
        3. 'flex-1' ensures it takes remaining vertical space.
      */}
      <main className="flex-1 overflow-y-auto w-full">
        {/* Children components (Dashboard, Warehouse) now manage their own padding */}
        {children}
      </main>
    </div>
  );
};

/**
 * App Component
 * Configures the primary router, scroll management, global toast notifications, and route mapping.
 * 
 * @returns {JSX.Element} The rendered App router
 */
const App = () => {
  return (
    <Router>
      <ScrollToTop />
      <Toaster position="top-center" reverseOrder={false} />
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected Routes (Wrapped in the Layout) */}
        <Route path="/dashboard" element={<ProtectedLayout><Dashboard /></ProtectedLayout>} />
        <Route path="/inventory" element={<ProtectedLayout><Warehouse /></ProtectedLayout>} />
        <Route path="/add-item" element={<ProtectedLayout><AddItem /></ProtectedLayout>} />
        <Route path="/scan" element={<ProtectedLayout><ScanItem /></ProtectedLayout>} />
        <Route path="/logs" element={<ProtectedLayout><Logs /></ProtectedLayout>} />
        <Route path="/settings" element={<ProtectedLayout><Settings /></ProtectedLayout>} />
        <Route path="/inventory-digital-view" element={<ProtectedLayout><InventoryDigitalView /></ProtectedLayout>} />
        
        {/* Catch-all for 404 */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
};

export default App;