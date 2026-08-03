import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { Save, X, Package, Loader2 } from 'lucide-react';

const ItemForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentStore } = useAuth();
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    category: '',
    price: '',
    quantity: '',
    reorder_level: ''
  });

  useEffect(() => {
    const fetchItem = async () => {
      if (id) {
        setLoading(true);
        const { data, error } = await supabase
          .from('items')
          .select('*')
          .eq('id', id)
          .single();
        
        if (data) {
          setFormData(data);
        }
        setLoading(false);
      }
    };
    fetchItem();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const itemData = {
      store_id: currentStore.id,
      sku: formData.sku,
      name: formData.name,
      category: formData.category,
      price: Number(formData.price),
      quantity: Number(formData.quantity),
      reorder_level: Number(formData.reorder_level)
    };

    if (id) {
      await supabase.from('items').update(itemData).eq('id', id);
    } else {
      await supabase.from('items').insert([itemData]);
    }
    
    setLoading(false);
    navigate('/inventory');
  };

  return (
    <div className="flex-col gap-6" style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div className="flex items-center gap-4">
        <button className="btn btn-ghost" onClick={() => navigate(-1)} style={{ padding: '0.5rem' }}>
          <X size={20} />
        </button>
        <div>
          <h1 className="page-title">{id ? 'Edit Item' : 'Add New Item'}</h1>
          <p className="page-subtitle">{id ? 'Update product details and stock.' : 'Add a new product to your inventory.'}</p>
        </div>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} style={{ padding: '1.5rem' }}>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="form-group">
              <label htmlFor="sku">SKU</label>
              <input 
                type="text" 
                id="sku" 
                name="sku" 
                value={formData.sku} 
                onChange={handleChange} 
                required 
                placeholder="e.g. SKU-123"
              />
            </div>
            <div className="form-group">
              <label htmlFor="category">Category</label>
              <input 
                type="text" 
                id="category" 
                name="category" 
                value={formData.category} 
                onChange={handleChange} 
                required 
                placeholder="e.g. Electronics"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="name">Item Name</label>
            <input 
              type="text" 
              id="name" 
              name="name" 
              value={formData.name} 
              onChange={handleChange} 
              required 
              placeholder="Enter product name"
            />
          </div>

          <div className="grid md:grid-cols-3 gap-4">
            <div className="form-group">
              <label htmlFor="price">Price ($)</label>
              <input 
                type="number" 
                id="price" 
                name="price" 
                value={formData.price} 
                onChange={handleChange} 
                required 
                min="0" 
                step="0.01"
              />
            </div>
            <div className="form-group">
              <label htmlFor="quantity">Initial Stock</label>
              <input 
                type="number" 
                id="quantity" 
                name="quantity" 
                value={formData.quantity} 
                onChange={handleChange} 
                required 
                min="0"
              />
            </div>
            <div className="form-group">
              <label htmlFor="reorder_level">Reorder Level</label>
              <input 
                type="number" 
                id="reorder_level" 
                name="reorder_level" 
                value={formData.reorder_level} 
                onChange={handleChange} 
                required 
                min="0"
              />
            </div>
          </div>

          <div className="flex justify-end gap-3" style={{ marginTop: '1rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
            <button type="button" className="btn btn-secondary" onClick={() => navigate(-1)} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} 
              {loading ? 'Saving...' : 'Save Item'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ItemForm;
