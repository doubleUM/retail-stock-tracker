import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Edit, Trash2, ArrowUpDown, Loader2, Package, Plus } from 'lucide-react';

const InventoryList = () => {
  const { currentStore, userRole } = useAuth();
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'ascending' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItems = async () => {
      if (!currentStore) return;
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('items')
          .select('*')
          .eq('store_id', currentStore.id);
        
        if (error) {
          console.error("Error fetching items:", error);
        } else if (data) {
          setItems(data);
        }
      } catch (err) {
        console.error("Critical error fetching inventory:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [currentStore]);

  const handleDelete = async (id) => {
    if (userRole === 'cashier') {
      alert("Cashiers do not have permission to delete items.");
      return;
    }

    if (window.confirm('Are you sure you want to delete this item?')) {
      const { error } = await supabase
        .from('items')
        .delete()
        .eq('id', id);
        
      if (error) {
        alert(error.message);
      } else {
        setItems(items.filter(item => item.id !== id));
      }
    }
  };

  const handleSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const sortedItems = [...items].sort((a, b) => {
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === 'ascending' ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === 'ascending' ? 1 : -1;
    }
    return 0;
  });

  const filteredItems = sortedItems.filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sku.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return createPortal(
      <div className="flex items-center justify-center" style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 9999 }}>
        <Loader2 className="animate-spin" size={32} style={{ color: 'var(--accent-primary)' }} />
      </div>,
      document.body
    );
  }

  // EMPTY STATE (No items at all)
  if (items.length === 0) {
    return (
      <div className="card empty-state" style={{ marginTop: '2rem' }}>
        <Package size={48} />
        <h2 className="empty-state-title">Your inventory is empty</h2>
        <p className="empty-state-desc">You haven't added any products to this store yet. Start building your catalog.</p>
        
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

  return (
    <div className="flex-col gap-4">
      <div className="flex justify-between items-center flex-wrap gap-4 mb-2">
        <div style={{ position: 'relative', width: '100%', maxWidth: '360px' }}>
          <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={16} />
          <input 
            type="text" 
            placeholder="Search products by name or SKU..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ paddingLeft: '2.25rem', paddingRight: '1rem', paddingTop: '0.625rem', paddingBottom: '0.625rem', borderRadius: 'var(--radius-full)' }}
          />
        </div>
        
        {userRole !== 'cashier' && (
          <Link to="/add" className="btn btn-primary">
            <Plus size={16} /> Add Item
          </Link>
        )}
      </div>

      <div className="card">
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th onClick={() => handleSort('sku')} style={{ cursor: 'pointer' }}>
                  <div className="flex items-center gap-1">SKU <ArrowUpDown size={12} style={{ opacity: 0.5 }}/></div>
                </th>
                <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>
                  <div className="flex items-center gap-1">Item Name <ArrowUpDown size={12} style={{ opacity: 0.5 }}/></div>
                </th>
                <th onClick={() => handleSort('category')} style={{ cursor: 'pointer' }}>
                  <div className="flex items-center gap-1">Category <ArrowUpDown size={12} style={{ opacity: 0.5 }}/></div>
                </th>
                <th onClick={() => handleSort('price')} style={{ cursor: 'pointer' }}>
                  <div className="flex items-center gap-1">Price <ArrowUpDown size={12} style={{ opacity: 0.5 }}/></div>
                </th>
                <th onClick={() => handleSort('quantity')} style={{ cursor: 'pointer' }}>
                  <div className="flex items-center gap-1">Stock <ArrowUpDown size={12} style={{ opacity: 0.5 }}/></div>
                </th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length > 0 ? filteredItems.map(item => (
                <tr key={item.id}>
                  <td><span className="badge badge-neutral" style={{ fontFamily: 'monospace' }}>{item.sku}</span></td>
                  <td style={{ fontWeight: 500 }}>{item.name}</td>
                  <td>{item.category}</td>
                  <td>${Number(item.price).toFixed(2)}</td>
                  <td>
                    <span className={`badge ${item.quantity <= item.reorder_level ? 'badge-danger' : 'badge-success'}`}>
                      {item.quantity}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div className="flex items-center justify-end gap-2">
                      <Link to={`/edit/${item.id}`} className="btn btn-secondary" style={{ padding: '0.3rem 0.5rem' }}>
                        <Edit size={14} />
                      </Link>
                      {userRole !== 'cashier' && (
                        <button onClick={() => handleDelete(item.id)} className="btn btn-danger" style={{ padding: '0.3rem 0.5rem' }}>
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '4rem 1rem' }}>
                    <Search size={32} style={{ color: 'var(--text-muted)', opacity: 0.3, margin: '0 auto 0.75rem' }} />
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>No items found matching "{searchTerm}"</p>
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

export default InventoryList;
