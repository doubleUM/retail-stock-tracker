import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Search, Edit, Trash2, ArrowUpDown, Loader2 } from 'lucide-react';

const InventoryList = () => {
  const { currentStore, userRole } = useAuth();
  const [items, setItems] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'ascending' });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchItems = async () => {
      if (!currentStore) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('store_id', currentStore.id);
      
      if (error) {
        console.error("Error fetching items:", error);
      } else if (data) {
        setItems(data);
      }
      setLoading(false);
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
    return (
      <div className="flex items-center justify-center" style={{ minHeight: '50vh' }}>
        <Loader2 className="animate-spin text-gradient" size={48} />
      </div>
    );
  }

  return (
    <div className="flex-col gap-6">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-gradient" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Inventory</h1>
          <p>Manage all your stock items.</p>
        </div>
        {userRole !== 'cashier' && (
          <Link to="/add" className="btn btn-primary">Add New Item</Link>
        )}
      </div>

      <div className="glass-panel">
        <div className="flex justify-between items-center" style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)' }}>
          <div style={{ position: 'relative', width: '300px' }}>
            <Search style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={18} />
            <input 
              type="text" 
              placeholder="Search by name or SKU..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '2.5rem' }}
            />
          </div>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th onClick={() => handleSort('sku')} style={{ cursor: 'pointer' }}>
                  <div className="flex items-center gap-2">SKU <ArrowUpDown size={14} /></div>
                </th>
                <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>
                  <div className="flex items-center gap-2">Item Name <ArrowUpDown size={14} /></div>
                </th>
                <th onClick={() => handleSort('category')} style={{ cursor: 'pointer' }}>
                  <div className="flex items-center gap-2">Category <ArrowUpDown size={14} /></div>
                </th>
                <th onClick={() => handleSort('price')} style={{ cursor: 'pointer' }}>
                  <div className="flex items-center gap-2">Price <ArrowUpDown size={14} /></div>
                </th>
                <th onClick={() => handleSort('quantity')} style={{ cursor: 'pointer' }}>
                  <div className="flex items-center gap-2">Stock <ArrowUpDown size={14} /></div>
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredItems.length > 0 ? filteredItems.map(item => (
                <tr key={item.id}>
                  <td><span className="badge badge-neutral">{item.sku}</span></td>
                  <td style={{ fontWeight: 500 }}>{item.name}</td>
                  <td>{item.category}</td>
                  <td>${Number(item.price).toFixed(2)}</td>
                  <td>
                    <span className={`badge ${item.quantity <= item.reorder_level ? 'badge-danger' : 'badge-success'}`}>
                      {item.quantity}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Link to={`/edit/${item.id}`} className="btn btn-secondary" style={{ padding: '0.4rem', borderRadius: '4px' }}>
                        <Edit size={16} />
                      </Link>
                      {userRole !== 'cashier' && (
                        <button onClick={() => handleDelete(item.id)} className="btn btn-danger" style={{ padding: '0.4rem', borderRadius: '4px' }}>
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                    No items found matching your search.
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
