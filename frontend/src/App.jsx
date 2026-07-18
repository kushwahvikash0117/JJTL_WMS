import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Pages
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Warehouse from './pages/Warehouse';
import AddItem from './pages/AddItem';
import ScanItem from './pages/ScanItem';
import Logs from './pages/Logs';
import Settings from './pages/Settings';

// Layout Components
import Navbar from './components/Navbar';
import ScrollToTop from './components/ScrollToTop';

// This wrapper handles the Navbar visibility and Auth protection
// ... (imports remain the same)

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

// ... (Rest of the App component remains the same)

const App = () => {
  return (
    <Router>
      <ScrollToTop/>
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
        
        {/* Catch-all for 404 */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
};

export default App;