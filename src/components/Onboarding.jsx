import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { Store, KeyRound, Plus } from 'lucide-react';

const Onboarding = () => {
  const [mode, setMode] = useState(null); // 'create' or 'join'
  const [storeName, setStoreName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreateStore = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error: createError } = await supabase.rpc('create_store', {
        p_name: storeName
      });
      
      if (createError) throw createError;

      // Reload window to trigger AuthContext state update
      window.location.href = '/';
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleJoinStore = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Call our secure RPC function
      const { error: joinError } = await supabase.rpc('join_store_with_code', {
        p_invite_code: inviteCode.trim()
      });

      if (joinError) throw joinError;

      // Reload window to trigger AuthContext state update
      window.location.href = '/';
    } catch (err) {
      setError(err.message || "Failed to join store. Please check the code.");
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 150px)' }}>
      <div className="glass-panel animate-fade-in" style={{ width: '100%', maxWidth: '500px', padding: '2.5rem', textAlign: 'center' }}>
        
        <Store size={48} className="text-gradient" style={{ margin: '0 auto 1.5rem auto' }} />
        <h2 className="text-gradient" style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>Welcome to StockTracker!</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
          To get started, you either need to create a brand new store, or join an existing one using an invite code.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded" style={{ backgroundColor: 'rgba(239, 68, 68, 0.15)', border: '1px solid var(--accent-danger)' }}>
            <p style={{ color: '#fca5a5', fontSize: '0.9rem', margin: 0 }}>{error}</p>
          </div>
        )}

        {!mode ? (
          <div className="flex gap-4">
            <button className="btn btn-primary" style={{ flex: 1, padding: '1.5rem', flexDirection: 'column', gap: '0.5rem' }} onClick={() => setMode('create')}>
              <Plus size={24} />
              <span style={{ fontSize: '1.1rem' }}>Create a Store</span>
            </button>
            <button className="btn btn-secondary" style={{ flex: 1, padding: '1.5rem', flexDirection: 'column', gap: '0.5rem' }} onClick={() => setMode('join')}>
              <KeyRound size={24} />
              <span style={{ fontSize: '1.1rem' }}>Join a Store</span>
            </button>
          </div>
        ) : mode === 'create' ? (
          <form onSubmit={handleCreateStore} className="flex-col gap-4 text-left">
            <div className="form-group">
              <label>Store Name</label>
              <input type="text" value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="My Awesome Store" required />
            </div>
            <div className="flex gap-4 mt-2">
              <button type="button" className="btn btn-secondary" onClick={() => {setMode(null); setError('');}} style={{ flex: 1 }}>Back</button>
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 2 }}>{loading ? 'Creating...' : 'Create Store'}</button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleJoinStore} className="flex-col gap-4 text-left">
            <div className="form-group">
              <label>Invite Code</label>
              <input type="text" value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} placeholder="e.g. A7X9B2" required />
            </div>
            <div className="flex gap-4 mt-2">
              <button type="button" className="btn btn-secondary" onClick={() => {setMode(null); setError('');}} style={{ flex: 1 }}>Back</button>
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 2 }}>{loading ? 'Joining...' : 'Join Store'}</button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};

export default Onboarding;
