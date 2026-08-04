import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { AlertTriangle, Package, DollarSign, Loader2, Plus, ShoppingCart, ArrowRight } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { currentStore, userRole } = useAuth();
  const navigate = useNavigate();
  
  const [stats, setStats] = useState({
    totalItems: 0,
    lowStock: 0,
    totalValue: 0
  });
  const [lowStockItems, setLowStockItems] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!currentStore) return;
      
      setLoading(true);
      try {
        // Fetch inventory items
        const { data: items, error: itemsError } = await supabase
          .from('items')
          .select('*')
          .eq('store_id', currentStore.id);

        if (itemsError) throw itemsError;

        // Process inventory stats
        if (items) {
          const low = items.filter(item => item.quantity <= item.reorder_level);
          
          setStats({
            totalItems: items.length,
            lowStock: low.length,
            totalValue: items.reduce((acc, item) => acc + (Number(item.price) * Number(item.quantity)), 0)
          });
          setLowStockItems(low.slice(0, 5)); // Just take top 5 for dashboard
        }

        // Fetch recent transactions (last 5)
        const { data: transactions, error: txError } = await supabase
          .from('transactions')
          .select('*')
          .eq('store_id', currentStore.id)
          .order('created_at', { ascending: false })
          .limit(5);

        if (txError) throw txError;
        if (transactions) setRecentTransactions(transactions);

      } catch (err) {
        console.error("Critical error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [currentStore]);

  if (loading) {
    return (
      <div className="flex items-center justify-center w-full" style={{ minHeight: 'calc(100vh - var(--header-height) - 3rem)' }}>
        <Loader2 className="animate-spin" size={32} style={{ color: 'var(--accent-primary)' }} />
      </div>
    );
  }

  // EMPTY STATE
  if (stats.totalItems === 0) {
    return (
      <div className="card empty-state" style={{ marginTop: '2rem' }}>
        <Package size={48} />
        <h2 className="empty-state-title">Welcome to your new store!</h2>
        <p className="empty-state-desc">You don't have any inventory yet. Add your first product to start tracking stock and making sales.</p>
        
        {userRole !== 'cashier' ? (
          <Link to="/add" className="btn btn-primary btn-lg mt-4">
            <Plus size={18} /> Add First Item
          </Link>
        ) : (
          <p className="mt-4" style={{ color: 'var(--text-muted)' }}>Ask your store owner to add some inventory.</p>
        )}
      </div>
    );
  }

  // MAIN DASHBOARD LAYOUT
  return (
    <div className="flex-col gap-6">
      
      {/* Top Stat Cards (3 columns) */}
      <div className="grid md:grid-cols-3 gap-4">
        <div className="card stat-card">
          <p className="stat-label">Total Items</p>
          <p className="stat-value">{stats.totalItems}</p>
        </div>
        
        <div className="card stat-card" style={{ borderLeft: stats.lowStock > 0 ? '4px solid var(--accent-danger)' : '1px solid var(--border-color)' }}>
          <p className="stat-label">Low Stock Alerts</p>
          <div className="flex items-center gap-2">
            <p className="stat-value" style={{ color: stats.lowStock > 0 ? 'var(--accent-danger)' : 'var(--text-primary)' }}>
              {stats.lowStock}
            </p>
            {stats.lowStock > 0 && <AlertTriangle size={20} style={{ color: 'var(--accent-danger)' }} />}
          </div>
        </div>

        <div className="card stat-card">
          <p className="stat-label">Inventory Value</p>
          <p className="stat-value">${stats.totalValue.toFixed(2)}</p>
        </div>
      </div>

      {/* Main Content Grid (2 columns on desktop) */}
      <div className="grid md:grid-cols-2 gap-6">
        
        {/* Left Column: Alerts & Quick Actions */}
        <div className="flex-col gap-6">
          
          {/* Low Stock Card */}
          <div className="card">
            <div className="flex justify-between items-center p-3" style={{ borderBottom: '1px solid var(--border-color)' }}>
              <h2 style={{ fontSize: '0.95rem', fontWeight: 600 }}>Needs Restock</h2>
              {stats.lowStock > 5 && (
                <Link to="/inventory" className="btn btn-ghost" style={{ fontSize: '0.8rem' }}>View All</Link>
              )}
            </div>
            
            <div style={{ padding: '0 1rem' }}>
              {lowStockItems.length > 0 ? (
                lowStockItems.map(item => (
                  <div key={item.id} className="activity-item">
                    <div className="flex items-center gap-3">
                      <div style={{ 
                        width: '32px', height: '32px', borderRadius: 'var(--radius-sm)', 
                        background: 'var(--accent-danger-light)', color: 'var(--accent-danger)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <AlertTriangle size={16} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 500, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{item.name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>{item.quantity} left (reorder at {item.reorder_level})</div>
                      </div>
                    </div>
                    {userRole !== 'cashier' && (
                      <Link to={`/edit/${item.id}`} className="btn btn-secondary" style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}>
                        Restock
                      </Link>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center" style={{ padding: '2rem 1rem' }}>
                  <div style={{ 
                    width: '40px', height: '40px', borderRadius: '50%', background: 'var(--accent-success-light)', 
                    color: 'var(--accent-success)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.5rem' 
                  }}>
                    <svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  </div>
                  <p style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--text-primary)' }}>All stock levels healthy</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="card" style={{ padding: '1.25rem' }}>
            <h2 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '1rem' }}>Quick Actions</h2>
            <div className="grid grid-cols-2 gap-3">
              <button onClick={() => navigate('/checkout')} className="btn btn-primary" style={{ padding: '1rem', flexDirection: 'column', gap: '0.5rem' }}>
                <ShoppingCart size={20} />
                <span>Open POS</span>
              </button>
              {userRole !== 'cashier' && (
                <button onClick={() => navigate('/add')} className="btn btn-secondary" style={{ padding: '1rem', flexDirection: 'column', gap: '0.5rem' }}>
                  <Plus size={20} />
                  <span>Add Item</span>
                </button>
              )}
            </div>
          </div>
          
        </div>

        {/* Right Column: Recent Sales Activity */}
        <div className="card">
          <div className="flex justify-between items-center p-3" style={{ borderBottom: '1px solid var(--border-color)' }}>
            <h2 style={{ fontSize: '0.95rem', fontWeight: 600 }}>Recent Sales</h2>
          </div>
          
          <div style={{ padding: '0 1rem' }}>
            {recentTransactions.length > 0 ? (
              recentTransactions.map(tx => (
                <div key={tx.id} className="activity-item">
                  <div className="activity-time">
                    {new Date(tx.created_at).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}
                  </div>
                  <div className="activity-detail flex items-center gap-2">
                    <div style={{ 
                      width: '28px', height: '28px', borderRadius: '50%', background: 'var(--bg-inset)', 
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)'
                    }}>
                      <DollarSign size={14} />
                    </div>
                    <span>Sale completed</span>
                  </div>
                  <div className="activity-amount" style={{ color: 'var(--accent-success)' }}>
                    ${Number(tx.total_amount).toFixed(2)}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center" style={{ padding: '3rem 1rem' }}>
                <ShoppingCart size={32} style={{ color: 'var(--text-muted)', opacity: 0.5, margin: '0 auto 0.75rem' }} />
                <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>No sales recorded yet today.</p>
              </div>
            )}
          </div>
          
          {recentTransactions.length > 0 && (
            <div className="p-3 text-center" style={{ borderTop: '1px solid var(--border-color)', background: 'var(--bg-inset)', borderBottomLeftRadius: 'var(--radius-md)', borderBottomRightRadius: 'var(--radius-md)' }}>
              <Link to="/checkout" className="btn btn-ghost w-full" style={{ fontSize: '0.85rem' }}>
                Go to Point of Sale <ArrowRight size={14} />
              </Link>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default Dashboard;
