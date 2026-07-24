import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Package, LayoutDashboard, PlusCircle, ShoppingCart } from 'lucide-react';
import Dashboard from './components/Dashboard';
import InventoryList from './components/InventoryList';
import ItemForm from './components/ItemForm';
import Checkout from './components/Checkout';
import './App.css';

const Navigation = () => {
  const location = useLocation();
  
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
        <Link to="/add" className={`nav-link ${location.pathname === '/add' ? 'active' : ''}`}>
          <PlusCircle size={18} />
          Add Item
        </Link>
      </div>
    </nav>
  );
};

function App() {
  return (
    <Router>
      <Navigation />
      <main className="container animate-fade-in">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/inventory" element={<InventoryList />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/add" element={<ItemForm />} />
          <Route path="/edit/:id" element={<ItemForm />} />
        </Routes>
      </main>
    </Router>
  );
}

export default App;
