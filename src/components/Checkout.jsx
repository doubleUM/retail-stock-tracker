import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { ShoppingCart, Trash2, CreditCard, Scan, Plus, Minus, Printer, Loader2, CheckCircle2 } from 'lucide-react';

const Checkout = () => {
  const { currentStore } = useAuth();
  const [cart, setCart] = useState([]);
  const [manualSku, setManualSku] = useState('');
  const [scanFeedback, setScanFeedback] = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutSuccess, setCheckoutSuccess] = useState(false);
  const [lastOrderTotal, setLastOrderTotal] = useState(0);
  
  const barcodeBuffer = useRef('');
  const lastKeyTime = useRef(0);
  const skuInputRef = useRef(null);

  // Auto-focus SKU input on load
  useEffect(() => {
    if (skuInputRef.current) {
      skuInputRef.current.focus();
    }
  }, [checkoutSuccess]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;

      const currentTime = Date.now();
      if (currentTime - lastKeyTime.current > 100) {
        barcodeBuffer.current = '';
      }
      lastKeyTime.current = currentTime;

      if (e.key === 'Enter') {
        if (barcodeBuffer.current.length > 0) {
          handleScan(barcodeBuffer.current);
          barcodeBuffer.current = '';
        }
      } else if (e.key.length === 1) {
        barcodeBuffer.current += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const showFeedback = (message, type) => {
    setScanFeedback({ message, type });
    setTimeout(() => setScanFeedback(null), 3000);
  };

  const handleScan = async (sku) => {
    if (!currentStore) return;
    
    try {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('store_id', currentStore.id)
        .eq('sku', sku)
        .single();

      if (error || !data) {
        showFeedback(`Item not found for SKU: ${sku}`, 'error');
        return;
      }

      if (data.quantity <= 0) {
        showFeedback(`Out of stock: ${data.name}`, 'error');
        return;
      }

      addToCart(data);
      showFeedback(`Added: ${data.name}`, 'success');
      setManualSku('');
    } catch (err) {
      showFeedback(`Error finding item: ${sku}`, 'error');
    }
  };

  const handleManualAdd = (e) => {
    e.preventDefault();
    if (manualSku.trim()) {
      handleScan(manualSku.trim());
    }
  };

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        if (existing.cartQuantity >= item.quantity) {
          showFeedback(`Not enough stock for ${item.name}`, 'error');
          return prev;
        }
        return prev.map(i => i.id === item.id ? { ...i, cartQuantity: i.cartQuantity + 1 } : i);
      }
      return [...prev, { ...item, cartQuantity: 1 }];
    });
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateCartItemQuantity = (id, newQuantity) => {
    if (newQuantity < 1) {
      removeFromCart(id);
      return;
    }
    
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        if (newQuantity > item.quantity) {
           showFeedback(`Only ${item.quantity} in stock for ${item.name}`, 'error');
           return item;
        }
        return { ...item, cartQuantity: newQuantity };
      }
      return item;
    }));
  };

  const total = cart.reduce((sum, item) => sum + (item.price * item.cartQuantity), 0);

  const handleCheckout = async (printReceipt = false) => {
    if (cart.length === 0 || !currentStore) return;
    setCheckoutLoading(true);

    try {
      const transaction = {
        store_id: currentStore.id,
        total_amount: total,
        items: cart.map(item => ({
          id: item.id,
          sku: item.sku,
          name: item.name,
          price: item.price,
          quantity: item.cartQuantity
        }))
      };

      const { error: txError } = await supabase.from('transactions').insert([transaction]);
      if (txError) throw txError;

      await Promise.all(cart.map(async (item) => {
        const newQuantity = Math.max(0, item.quantity - item.cartQuantity);
        return supabase.from('items').update({ quantity: newQuantity }).eq('id', item.id);
      }));

      if (printReceipt) {
         setTimeout(() => { window.print(); }, 100);
      }

      setLastOrderTotal(total);
      setCart([]);
      setCheckoutSuccess(true);
    } catch (err) {
      showFeedback('Checkout failed: ' + err.message, 'error');
    } finally {
      setCheckoutLoading(false);
    }
  };

  const startNewSale = () => {
    setCheckoutSuccess(false);
    setScanFeedback(null);
    setManualSku('');
  };

  // SUCCESS STATE (Receipt)
  if (checkoutSuccess) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 120px)' }}>
        <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '400px', padding: '3rem 2rem', textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'var(--accent-success-light)', color: 'var(--accent-success)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem' }}>
            <CheckCircle2 size={32} />
          </div>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>Checkout Complete</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
            Transaction recorded successfully.
          </p>
          
          <div style={{ padding: '1.5rem', background: 'var(--bg-inset)', borderRadius: 'var(--radius-md)', marginBottom: '2rem' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.25rem' }}>Total Paid</p>
            <p style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>${lastOrderTotal.toFixed(2)}</p>
          </div>

          <button onClick={startNewSale} className="btn btn-primary btn-lg w-full">
            New Sale
          </button>
        </div>
      </div>
    );
  }

  // MAIN POS LAYOUT
  return (
    <div className="checkout-layout flex gap-6" style={{ height: 'calc(100vh - 120px)' }}>
      
      {/* Left Column: Cart & Scanner Input */}
      <div className="flex-col gap-4" style={{ flex: '1 1 600px', height: '100%' }}>
        
        {/* Prominent SKU Input Bar */}
        <form onSubmit={handleManualAdd} className="sku-input-bar">
          <Scan size={24} />
          <input 
            ref={skuInputRef}
            type="text" 
            value={manualSku}
            onChange={e => setManualSku(e.target.value)}
            placeholder="Scan barcode or type SKU and press Enter..." 
            style={{ width: '100%', padding: '0.25rem 0' }}
          />
          <button type="submit" className="btn btn-primary" style={{ padding: '0.5rem 1rem' }}>Add</button>
        </form>

        {scanFeedback && (
          <div className={`feedback-bar animate-fade-in ${scanFeedback.type}`}>
             {scanFeedback.message}
          </div>
        )}

        {/* Cart Container */}
        <div className="card flex-col" style={{ flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-inset)' }}>
            <h2 className="flex items-center gap-2" style={{ fontSize: '0.95rem', margin: 0 }}>
              <ShoppingCart size={18} /> Cart Items ({cart.length})
            </h2>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {cart.length > 0 ? (
              <div className="flex-col">
                {cart.map(item => (
                  <div key={item.id} className="flex items-center justify-between" style={{ padding: '1rem 1.25rem', borderBottom: '1px solid var(--border-color)' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{item.name}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{item.sku}</div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="flex items-center" style={{ background: 'var(--bg-inset)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)' }}>
                        <button onClick={() => updateCartItemQuantity(item.id, item.cartQuantity - 1)} className="btn-ghost" style={{ padding: '0.4rem', borderRight: '1px solid var(--border-color)' }}>
                          <Minus size={14}/>
                        </button>
                        <span style={{ width: '40px', textAlign: 'center', fontSize: '0.9rem', fontWeight: 500 }}>{item.cartQuantity}</span>
                        <button onClick={() => updateCartItemQuantity(item.id, item.cartQuantity + 1)} className="btn-ghost" style={{ padding: '0.4rem', borderLeft: '1px solid var(--border-color)' }}>
                          <Plus size={14}/>
                        </button>
                      </div>
                      
                      <div style={{ width: '70px', textAlign: 'right', fontWeight: 600 }}>
                        ${(item.price * item.cartQuantity).toFixed(2)}
                      </div>
                      
                      <button onClick={() => removeFromCart(item.id)} className="btn-ghost" style={{ color: 'var(--accent-danger)' }}>
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state" style={{ padding: '4rem 2rem' }}>
                <Scan size={48} />
                <h3 className="empty-state-title">Cart is empty</h3>
                <p className="empty-state-desc">Scan a barcode or enter a SKU to start adding items to the cart.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Order Summary */}
      <div className="checkout-summary card flex-col" style={{ width: '340px', flexShrink: 0, height: '100%' }}>
        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-inset)' }}>
          <h2 style={{ fontSize: '0.95rem', margin: 0 }}>Order Summary</h2>
        </div>
        
        <div className="flex-col" style={{ padding: '1.5rem', flex: 1, overflowY: 'auto' }}>
          <div className="flex justify-between mb-3" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            <span>Subtotal ({cart.reduce((s, i) => s + i.cartQuantity, 0)} items)</span>
            <span>${total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between mb-3" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
            <span>Tax (0%)</span>
            <span>$0.00</span>
          </div>
          
          <div style={{ marginTop: 'auto' }}>
            <div className="flex justify-between items-center mb-6" style={{ borderTop: '2px dashed var(--border-color)', paddingTop: '1.5rem', marginTop: '1rem' }}>
               <span style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-primary)' }}>Total</span>
               <span style={{ fontSize: '1.75rem', fontWeight: 700, color: 'var(--text-primary)' }}>${total.toFixed(2)}</span>
            </div>

            <div className="flex-col gap-3">
              <button 
                onClick={() => handleCheckout(false)} 
                disabled={cart.length === 0 || checkoutLoading}
                className="btn btn-primary btn-lg w-full" 
                style={{ opacity: (cart.length === 0 || checkoutLoading) ? 0.6 : 1 }}
              >
                 {checkoutLoading ? <Loader2 className="animate-spin" size={20} /> : <CreditCard size={20} />} 
                 {checkoutLoading ? 'Processing...' : 'Charge'}
              </button>

              <button 
                onClick={() => handleCheckout(true)} 
                disabled={cart.length === 0 || checkoutLoading}
                className="btn btn-secondary w-full" 
                style={{ padding: '0.75rem', opacity: (cart.length === 0 || checkoutLoading) ? 0.6 : 1 }}
              >
                 <Printer size={16} /> Charge & Print Receipt
              </button>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};

export default Checkout;
