import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { Package, LayoutDashboard, PlusCircle, ShoppingCart, LogOut, User } from 'lucide-react';
import Dashboard from './components/Dashboard';
import InventoryList from './components/InventoryList';
import ItemForm from './components/ItemForm';
import Checkout from './components/Checkout';
import Login from './components/Login';
import Profile from './components/Profile';
import Onboarding from './components/Onboarding';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import './App.css';

const Navigation = () => {
  const location = useLocation();
  const { user, currentStore, userRole, logout } = useAuth();
  
  if (!user) return null; // Don't show navbar if not logged in
  if (!currentStore && location.pathname === '/onboarding') {
    // Show a simplified navbar during onboarding (just logout)
    return (
      <nav className="navbar">
        <div className="logo">
          <Package className="text-gradient" />
          <span>StockTracker</span>
        </div>
        <div className="nav-links">
          <button onClick={() => logout()} className="nav-link" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </nav>
    );
  }
  if (!currentStore) return null;

  return (
    <nav className="navbar">
      <Link to="/" className="logo">
        <Package className="text-gradient" />
        <span>StockTracker</span>
      </Link>
      <div className="nav-links">
        <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
          <LayoutDashboard size={18} />
          Dashboard
        </Link>
        <Link to="/inventory" className={`nav-link ${location.pathname === '/inventory' ? 'active' : ''}`}>
          <Package size={18} />
          Inventory
        </Link>
        <Link to="/checkout" className={`nav-link ${location.pathname === '/checkout' ? 'active' : ''}`}>
          <ShoppingCart size={18} />
          POS Checkout
        </Link>
        {userRole !== 'cashier' && (
          <Link to="/add" className={`nav-link ${location.pathname === '/add' ? 'active' : ''}`}>
            <PlusCircle size={18} />
            Add Item
          </Link>
        )}
        <Link to="/profile" className={`nav-link ${location.pathname === '/profile' ? 'active' : ''}`}>
          <User size={18} />
          Profile
        </Link>
        <button onClick={() => logout()} className="nav-link" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
          <LogOut size={18} />
          Logout
        </button>
      </div>
    </nav>
  );
};

const ProtectedRoute = ({ children, requireStore = true }) => {
  const { user, currentStore } = useAuth();
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (requireStore && !currentStore) {
    return <Navigate to="/onboarding" replace />;
  }
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Navigation />
        <main className="container animate-fade-in">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/onboarding" element={<ProtectedRoute requireStore={false}><Onboarding /></ProtectedRoute>} />
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/inventory" element={<ProtectedRoute><InventoryList /></ProtectedRoute>} />
            <Route path="/checkout" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
            <Route path="/add" element={<ProtectedRoute><ItemForm /></ProtectedRoute>} />
            <Route path="/edit/:id" element={<ProtectedRoute><ItemForm /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </Router>
    </AuthProvider>
  );
}

export default App;
