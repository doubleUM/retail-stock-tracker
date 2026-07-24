import React, { useState, useEffect } from 'react';
import { getItems } from '../store';
import { AlertTriangle, PackageSearch, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalItems: 0,
    lowStock: 0,
    totalValue: 0
  });
  const [lowStockItems, setLowStockItems] = useState([]);

  useEffect(() => {
    const items = getItems();
    const low = items.filter(item => item.quantity <= item.reorderLevel);
    
    setStats({
      totalItems: items.length,
      lowStock: low.length,
      totalValue: items.reduce((acc, item) => acc + (Number(item.price) * Number(item.quantity)), 0)
    });
    setLowStockItems(low);
  }, []);

  return (
    <div className="flex-col gap-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-gradient" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Overview</h1>
          <p>Welcome back! Here's what's happening with your stock today.</p>
        </div>
        <Link to="/add" className="btn btn-primary">Add New Item</Link>
      </div>

      <div className="grid md:grid-cols-3 gap-6 mb-8">
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div className="flex items-center gap-4 mb-2">
            <div style={{ padding: '10px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '10px', color: 'var(--accent-primary)' }}>
              <PackageSearch size={24} />
            </div>
            <h3 style={{ color: 'var(--text-secondary)' }}>Total Unique Items</h3>
          </div>
          <p style={{ fontSize: '2rem', fontWeight: '700', marginTop: '0.5rem' }}>{stats.totalItems}</p>
        </div>
        
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div className="flex items-center gap-4 mb-2">
            <div style={{ padding: '10px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '10px', color: 'var(--accent-danger)' }}>
              <AlertTriangle size={24} />
            </div>
            <h3 style={{ color: 'var(--text-secondary)' }}>Low Stock Alerts</h3>
          </div>
          <p style={{ fontSize: '2rem', fontWeight: '700', marginTop: '0.5rem' }}>{stats.lowStock}</p>
        </div>

        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div className="flex items-center gap-4 mb-2">
            <div style={{ padding: '10px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '10px', color: 'var(--accent-success)' }}>
              <DollarSign size={24} />
            </div>
            <h3 style={{ color: 'var(--text-secondary)' }}>Inventory Value</h3>
          </div>
          <p style={{ fontSize: '2rem', fontWeight: '700', marginTop: '0.5rem' }}>${stats.totalValue.toFixed(2)}</p>
        </div>
      </div>

      <div className="glass-panel">
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
          <h2>Items Needing Attention</h2>
        </div>
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>SKU</th>
                <th>Item Name</th>
                <th>Category</th>
                <th>Current Stock</th>
                <th>Reorder Level</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {lowStockItems.length > 0 ? lowStockItems.map(item => (
                <tr key={item.id}>
                  <td><span className="badge badge-neutral">{item.sku}</span></td>
                  <td style={{ fontWeight: 500 }}>{item.name}</td>
                  <td>{item.category}</td>
                  <td>
                    <span className="badge badge-danger" style={{ display: 'flex', gap: '0.25rem', width: 'fit-content' }}>
                      <AlertTriangle size={14} /> {item.quantity}
                    </span>
                  </td>
                  <td>{item.reorderLevel}</td>
                  <td>
                    <Link to={`/edit/${item.id}`} className="btn btn-secondary" style={{ padding: '0.4rem 0.8rem', fontSize: '0.85rem' }}>
                      Restock
                    </Link>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    All stock levels are optimal. Great job!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
