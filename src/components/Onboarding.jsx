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
    <div className="flex items-center justify-center w-full" style={{ minHeight: 'calc(100vh - 150px)' }}>
      <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '400px', padding: '2.5rem 2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>

          <Store size={36} style={{ margin: '0 auto 1rem auto', color: 'var(--accent-primary)' }} />
          <h2 style={{ fontSize: '1.375rem', marginBottom: '0.375rem' }}>Get Started</h2>
          <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            Create a new store or join an existing one with an invite code.
          </p>
        </div>

        {error && (
          <div className="mb-4" style={{ padding: '0.625rem 0.75rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--accent-danger-light)', border: '1px solid #fecaca' }}>
            <p style={{ color: 'var(--accent-danger)', fontSize: '0.85rem', margin: 0 }}>{error}</p>
          </div>
        )}

        {!mode ? (
          <div className="flex gap-3">
            <button className="btn btn-primary" style={{ flex: 1, padding: '1rem', flexDirection: 'column', gap: '0.5rem' }} onClick={() => setMode('create')}>
              <Plus size={20} />
              <span>Create Store</span>
            </button>
            <button className="btn btn-secondary" style={{ flex: 1, padding: '1rem', flexDirection: 'column', gap: '0.5rem' }} onClick={() => setMode('join')}>
              <KeyRound size={20} />
              <span>Join Store</span>
            </button>
          </div>
        ) : mode === 'create' ? (
          <form onSubmit={handleCreateStore} className="flex-col gap-4 text-left">
            <div className="form-group">
              <label>Store Name</label>
              <input type="text" value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="My Store" required />
            </div>
            <div className="flex gap-3 mt-2">
              <button type="button" className="btn btn-secondary" onClick={() => { setMode(null); setError(''); }} style={{ flex: 1 }}>Back</button>
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 2 }}>{loading ? 'Creating...' : 'Create Store'}</button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleJoinStore} className="flex-col gap-4 text-left">
            <div className="form-group">
              <label>Invite Code</label>
              <input type="text" value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} placeholder="e.g. A7X9B2" required />
            </div>
            <div className="flex gap-3 mt-2">
              <button type="button" className="btn btn-secondary" onClick={() => { setMode(null); setError(''); }} style={{ flex: 1 }}>Back</button>
              <button type="submit" className="btn btn-primary" disabled={loading} style={{ flex: 2 }}>{loading ? 'Joining...' : 'Join Store'}</button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};

export default Onboarding;
