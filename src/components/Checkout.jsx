import React, { useState, useEffect, useRef } from 'react';
import { getItemBySku, updateQuantity, saveTransaction } from '../store';
import { ShoppingCart, Trash2, CreditCard, Scan, Plus, Minus, Printer } from 'lucide-react';

const Checkout = () => {
  const [cart, setCart] = useState([]);
  const [manualSku, setManualSku] = useState('');
  const [scanFeedback, setScanFeedback] = useState(null);
  
  // Use ref for barcode buffer so we don't need to re-bind event listener on every character
  const barcodeBuffer = useRef('');
  const lastKeyTime = useRef(0);

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Ignore if typing in an input field (unless it's the manual SKU input which we handle on form submit)
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      const currentTime = Date.now();
      
      // If it's been more than 100ms since the last key, it might be a new scan or manual typing. 
      // We clear the buffer if it's too slow to be a scanner.
      if (currentTime - lastKeyTime.current > 100) {
        barcodeBuffer.current = '';
      }
      
      lastKeyTime.current = currentTime;

      if (e.key === 'Enter') {
        if (barcodeBuffer.current.length > 0) {
          handleScan(barcodeBuffer.current);
          barcodeBuffer.current = ''; // clear after processing
        }
      } else if (e.key.length === 1) {
        // Only add printable characters to buffer
        barcodeBuffer.current += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []); // Empty dependency array because we use functional state updates inside handleScan

  const handleScan = (sku) => {
    const item = getItemBySku(sku);
    if (item) {
      if (item.quantity <= 0) {
        showFeedback(`Item "${item.name}" is out of stock!`, 'error');
        return;
      }
      
      setCart(prevCart => {
        const existing = prevCart.find(i => i.id === item.id);
        if (existing) {
          // Check if we have enough stock
          if (existing.cartQuantity >= item.quantity) {
             showFeedback(`Cannot add more "${item.name}", stock limit reached!`, 'error');
             return prevCart;
          }
          showFeedback(`Added another "${item.name}"`);
          return prevCart.map(i => i.id === item.id ? { ...i, cartQuantity: i.cartQuantity + 1 } : i);
        } else {
          showFeedback(`Added "${item.name}"`);
          return [...prevCart, { ...item, cartQuantity: 1 }];
        }
      });
    } else {
      showFeedback(`SKU "${sku}" not found!`, 'error');
    }
  };

  const showFeedback = (message, type = 'success') => {
    setScanFeedback({ message, type });
    setTimeout(() => setScanFeedback(null), 3000);
  };

  const handleManualAdd = (e) => {
    e.preventDefault();
    if (manualSku.trim()) {
      handleScan(manualSku.trim());
      setManualSku('');
    }
  };

  const updateCartItemQuantity = (id, newQty) => {
    setCart(prevCart => prevCart.map(item => {
      if (item.id === id) {
        const qty = Math.max(1, Math.min(newQty, item.quantity));
        return { ...item, cartQuantity: qty };
      }
      return item;
    }));
  };

  const removeFromCart = (id) => {
    setCart(prevCart => prevCart.filter(item => item.id !== id));
  };

  const total = cart.reduce((sum, item) => sum + (item.price * item.cartQuantity), 0);

  const handleCheckout = (printReceipt = false) => {
    if (cart.length === 0) return;

    // Deduct stock for all items
    cart.forEach(item => {
      updateQuantity(item.id, -item.cartQuantity);
    });

    // Save transaction
    const transaction = {
      items: cart.map(i => ({ id: i.id, name: i.name, sku: i.sku, price: i.price, quantity: i.cartQuantity })),
      total: total
    };
    saveTransaction(transaction);

    if (printReceipt) {
       // Open print dialog
       setTimeout(() => {
          window.print();
       }, 100);
    }

    // Clear cart and show success
    setCart([]);
    showFeedback('Checkout completed successfully!', 'success');
  };

  return (
    <div style={{ display: 'flex', gap: '1.5rem', height: 'calc(100vh - 180px)', overflow: 'hidden' }}>
      {/* Left Column: Cart & Scanner Input */}
      <div className="flex-col gap-6" style={{ flex: '1 1 600px', display: 'flex', flexDirection: 'column', height: '100%' }}>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-gradient" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Point of Sale</h1>
            <p>Scan items to add them to the cart, or enter SKU manually.</p>
          </div>
        </div>

        {scanFeedback && (
          <div className={`glass-panel mb-4 animate-fade-in`} style={{ padding: '1rem', flexShrink: 0, backgroundColor: scanFeedback.type === 'error' ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)', border: `1px solid ${scanFeedback.type === 'error' ? 'var(--accent-danger)' : 'var(--accent-success)'}` }}>
             <p style={{ color: scanFeedback.type === 'error' ? '#fca5a5' : '#6ee7b7', fontWeight: 600 }}>{scanFeedback.message}</p>
          </div>
        )}

        <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
          <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
            <h2 className="flex items-center gap-2" style={{ whiteSpace: 'nowrap', margin: 0 }}><ShoppingCart size={20} /> Current Cart</h2>
            
            <form onSubmit={handleManualAdd} className="flex gap-2" style={{ flexGrow: 1, maxWidth: '350px', justifyContent: 'flex-end' }}>
              <div style={{ position: 'relative', width: '100%' }}>
                 <Scan style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} size={16} />
                 <input 
                   type="text" 
                   value={manualSku}
                   onChange={e => setManualSku(e.target.value)}
                   placeholder="Manual SKU entry..." 
                   style={{ paddingLeft: '2.2rem', width: '100%' }}
                 />
              </div>
              <button type="submit" className="btn btn-secondary" style={{ whiteSpace: 'nowrap' }}>Add</button>
            </form>
          </div>

          <div className="table-container" style={{ flex: 1, overflowY: 'auto' }}>
            {cart.length > 0 ? (
              <table>
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Price</th>
                    <th>Qty</th>
                    <th>Subtotal</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {cart.map(item => (
                    <tr key={item.id}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{item.name}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{item.sku}</div>
                      </td>
                      <td>${Number(item.price).toFixed(2)}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <button onClick={() => updateCartItemQuantity(item.id, item.cartQuantity - 1)} className="btn btn-secondary" style={{ padding: '0.25rem' }}><Minus size={14}/></button>
                          <span style={{ width: '24px', textAlign: 'center' }}>{item.cartQuantity}</span>
                          <button onClick={() => updateCartItemQuantity(item.id, item.cartQuantity + 1)} className="btn btn-secondary" style={{ padding: '0.25rem' }}><Plus size={14}/></button>
                        </div>
                      </td>
                      <td>${(item.price * item.cartQuantity).toFixed(2)}</td>
                      <td>
                        <button onClick={() => removeFromCart(item.id)} className="btn btn-danger" style={{ padding: '0.4rem' }}>
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                <ShoppingCart size={48} style={{ opacity: 0.2, margin: '0 auto 1rem' }} />
                <p>Cart is empty. Scan an item to begin.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right Column: Order Summary */}
      <div className="glass-panel" style={{ width: '100%', maxWidth: '380px', flexShrink: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-color)', flexShrink: 0 }}>
          <h2 style={{ margin: 0 }}>Order Summary</h2>
        </div>
        
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', flex: 1, overflowY: 'auto' }}>
          <div className="flex justify-between mb-4" style={{ color: 'var(--text-secondary)' }}>
            <span>Items ({cart.reduce((s, i) => s + i.cartQuantity, 0)})</span>
            <span>${total.toFixed(2)}</span>
          </div>
          <div className="flex justify-between mb-4" style={{ color: 'var(--text-secondary)' }}>
            <span>Tax (0%)</span>
            <span>$0.00</span>
          </div>
          
          <div style={{ marginTop: 'auto' }}>
            <div className="flex justify-between mb-6" style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem', marginTop: '0.5rem' }}>
               <span style={{ fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-primary)' }}>Total</span>
               <span style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--accent-primary)' }}>${total.toFixed(2)}</span>
            </div>

            <div className="flex-col gap-4">
              <button 
                onClick={() => handleCheckout(false)} 
                disabled={cart.length === 0}
                className="btn btn-primary" 
                style={{ width: '100%', padding: '0.85rem', fontSize: '1.05rem', opacity: cart.length === 0 ? 0.5 : 1, cursor: cart.length === 0 ? 'not-allowed' : 'pointer', justifyContent: 'center' }}
              >
                 <CreditCard size={20} /> Checkout
              </button>

              <button 
                onClick={() => handleCheckout(true)} 
                disabled={cart.length === 0}
                className="btn btn-secondary" 
                style={{ width: '100%', padding: '0.85rem', opacity: cart.length === 0 ? 0.5 : 1, cursor: cart.length === 0 ? 'not-allowed' : 'pointer', justifyContent: 'center' }}
              >
                 <Printer size={18} /> Checkout & Print
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
