import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
import { Package, LayoutDashboard, PlusCircle, ShoppingCart, LogOut, User, Menu, X, Store, Sun, Moon } from 'lucide-react';
import Dashboard from './components/Dashboard';
import InventoryList from './components/InventoryList';
import ItemForm from './components/ItemForm';
import Checkout from './components/Checkout';
import Login from './components/Login';
import Profile from './components/Profile';
import Onboarding from './components/Onboarding';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import './App.css';

const AppLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const { user, currentStore, userRole, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const getPageTitle = (pathname) => {
    if (pathname === '/') return 'Dashboard';
    if (pathname === '/inventory') return 'Inventory';
    if (pathname === '/checkout') return 'Point of Sale';
    if (pathname === '/add') return 'Add Item';
    if (pathname.startsWith('/edit/')) return 'Edit Item';
    if (pathname === '/profile') return 'Profile';
    return 'Retail Tracker';
  };

  // Login and Onboarding don't use the sidebar shell
  if (location.pathname === '/login' || location.pathname === '/onboarding') {
    return <div className="full-page">{children}</div>;
  }

  // If we somehow get here without a store (and not on login/onboarding), redirect
  if (!currentStore) return <Navigate to="/onboarding" replace />;

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="app-shell">
      {/* Mobile Overlay */}
      <div 
        className={`sidebar-overlay ${sidebarOpen ? 'open' : ''}`} 
        onClick={closeSidebar}
      />

      {/* Sidebar Navigation */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <Link to="/" className="sidebar-logo" onClick={closeSidebar}>
          <Package size={24} />
          <span>StockTracker</span>
        </Link>
        
        <nav className="sidebar-nav">
          <Link to="/" className={`sidebar-link ${location.pathname === '/' ? 'active' : ''}`} onClick={closeSidebar}>
            <LayoutDashboard size={18} />
            Dashboard
          </Link>
          <Link to="/inventory" className={`sidebar-link ${location.pathname === '/inventory' ? 'active' : ''}`} onClick={closeSidebar}>
            <Package size={18} />
            Inventory
          </Link>
          <Link to="/checkout" className={`sidebar-link ${location.pathname === '/checkout' ? 'active' : ''}`} onClick={closeSidebar}>
            <ShoppingCart size={18} />
            Point of Sale
          </Link>
          
          {userRole !== 'cashier' && (
            <Link to="/add" className={`sidebar-link ${location.pathname === '/add' ? 'active' : ''}`} onClick={closeSidebar}>
              <PlusCircle size={18} />
              Add Item
            </Link>
          )}
        </nav>

        <div className="sidebar-bottom">
          <button onClick={toggleTheme} className="sidebar-link w-full text-left bg-transparent border-none" style={{ width: '100%', cursor: 'pointer', textAlign: 'left', background: 'none', border: 'none' }}>
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            {theme === 'light' ? 'Dark Mode' : 'Light Mode'}
          </button>
          <Link to="/profile" className={`sidebar-link ${location.pathname === '/profile' ? 'active' : ''}`} onClick={closeSidebar}>
            <User size={18} />
            Profile
          </Link>
          <button onClick={() => { logout(); closeSidebar(); }} className="sidebar-link" style={{ color: 'var(--text-sidebar)' }}>
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="main-area">
        {/* Top Header */}
        <header className="top-header">
          <div className="flex items-center gap-3">
            <button className="mobile-menu-btn" onClick={() => setSidebarOpen(true)}>
              <Menu size={20} />
            </button>
            <h1 className="top-header-title">{getPageTitle(location.pathname)}</h1>
          </div>
          
          <div className="store-badge">
            <Store size={14} />
            <span className="hide-mobile">{currentStore.name}</span>
          </div>
        </header>

        {/* Page Content */}
        <main className="page-content animate-fade-in">
          {children}
        </main>
      </div>
    </div>
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
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <AppLayout>
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
          </AppLayout>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
