import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabaseClient';
import { Store, User, Shield, Save, ArrowRightLeft, Plus, KeyRound, Check } from 'lucide-react';

const Profile = () => {
  const { user, userStores, currentStore, userRole, switchStore, refreshStores } = useAuth();
  const [storeName, setStoreName] = useState(currentStore?.name || '');
  const [inviteCode, setInviteCode] = useState(currentStore?.invite_code || '');
  
  // New Store / Join Store state
  const [newStoreName, setNewStoreName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [actionMode, setActionMode] = useState(null); // 'create' or 'join'
  
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const handleUpdateStore = async (e) => {
    e.preventDefault();
    if (userRole !== 'owner') return;

    setLoading(true);
    setMessage({ type: '', text: '' });

    const { error } = await supabase
      .from('stores')
      .update({ name: storeName })
      .eq('id', currentStore.id);

    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setMessage({ type: 'success', text: 'Store name updated successfully!' });
      refreshStores();
    }
    setLoading(false);
  };

  const handleGenerateCode = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();

    const { error } = await supabase
      .from('stores')
      .update({ invite_code: code })
      .eq('id', currentStore.id);

    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setInviteCode(code);
      setMessage({ type: 'success', text: 'New invite code generated!' });
      refreshStores();
    }
    setLoading(false);
  };

  const handleCreateStore = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const { error: createError } = await supabase.rpc('create_store', { p_name: newStoreName });
      if (createError) throw createError;
      
      setMessage({ type: 'success', text: 'New store created!' });
      setActionMode(null);
      setNewStoreName('');
      await refreshStores();
    } catch (err) {
      setMessage({ type: 'error', text: err.message });
    }
    setLoading(false);
  };

  const handleJoinStore = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });
    try {
      const { error: joinError } = await supabase.rpc('join_store_with_code', { p_invite_code: joinCode.trim() });
      if (joinError) throw joinError;

      setMessage({ type: 'success', text: 'Successfully joined store!' });
      setActionMode(null);
      setJoinCode('');
      await refreshStores();
    } catch (err) {
      setMessage({ type: 'error', text: err.message || "Invalid invite code." });
    }
    setLoading(false);
  };

  // Update local state when currentStore changes from props
  React.useEffect(() => {
    setStoreName(currentStore?.name || '');
    setInviteCode(currentStore?.invite_code || '');
  }, [currentStore]);

  return (
    <div className="flex-col gap-6" style={{ maxWidth: '700px', margin: '0 auto' }}>
      
      <div className="mb-4">
        <h1 className="page-title">Profile</h1>
        <p className="page-subtitle">Manage your account and store settings.</p>
      </div>
      
      {/* Account */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <h2 style={{ fontSize: '1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <User size={18} /> Account
        </h2>
        <div className="flex-col gap-2">
          <div className="flex items-center gap-2" style={{ fontSize: '0.9rem' }}>
            <span style={{ color: 'var(--text-secondary)', minWidth: '60px' }}>Email</span>
            <span style={{ fontWeight: 500 }}>{user?.email}</span>
          </div>
          <div className="flex items-center gap-2" style={{ fontSize: '0.9rem' }}>
            <span style={{ color: 'var(--text-secondary)', minWidth: '60px' }}>User ID</span>
            <span style={{ fontFamily: 'monospace', fontSize: '0.8rem', color: 'var(--text-muted)' }}>{user?.id}</span>
          </div>
        </div>
      </div>

      {/* Stores */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
            <Store size={18} /> Stores ({userStores.length})
          </h2>
          {!actionMode && (
            <div className="flex gap-2">
              <button className="btn btn-secondary" onClick={() => setActionMode('join')} style={{ padding: '0.375rem 0.75rem', fontSize: '0.8rem' }}>
                <KeyRound size={14} /> Join
              </button>
              <button className="btn btn-primary" onClick={() => setActionMode('create')} style={{ padding: '0.375rem 0.75rem', fontSize: '0.8rem' }}>
                <Plus size={14} /> Create
              </button>
            </div>
          )}
        </div>

        {message.text && (
          <div className="mb-4" style={{ 
            padding: '0.625rem 0.75rem', 
            borderRadius: 'var(--radius-sm)',
            backgroundColor: message.type === 'error' ? 'var(--accent-danger-light)' : 'var(--accent-success-light)', 
            border: `1px solid ${message.type === 'error' ? '#fecaca' : '#a7f3d0'}` 
          }}>
            <p style={{ 
              color: message.type === 'error' ? 'var(--accent-danger)' : 'var(--accent-success)', 
              fontSize: '0.85rem', textAlign: 'center', margin: 0 
            }}>{message.text}</p>
          </div>
        )}

        {actionMode === 'create' && (
          <form onSubmit={handleCreateStore} className="flex gap-2 mb-4" style={{ padding: '0.75rem', backgroundColor: 'var(--bg-inset)', borderRadius: 'var(--radius-sm)' }}>
            <input type="text" placeholder="Store name" value={newStoreName} onChange={e => setNewStoreName(e.target.value)} required style={{ flex: 1 }} />
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ fontSize: '0.8rem' }}>Create</button>
            <button type="button" className="btn btn-secondary" onClick={() => setActionMode(null)} style={{ fontSize: '0.8rem' }}>Cancel</button>
          </form>
        )}

        {actionMode === 'join' && (
          <form onSubmit={handleJoinStore} className="flex gap-2 mb-4" style={{ padding: '0.75rem', backgroundColor: 'var(--bg-inset)', borderRadius: 'var(--radius-sm)' }}>
            <input type="text" placeholder="Invite code (e.g. A7X9B2)" value={joinCode} onChange={e => setJoinCode(e.target.value)} required style={{ flex: 1 }} />
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ fontSize: '0.8rem' }}>Join</button>
            <button type="button" className="btn btn-secondary" onClick={() => setActionMode(null)} style={{ fontSize: '0.8rem' }}>Cancel</button>
          </form>
        )}

        {/* Store list */}
        <div className="flex-col gap-2">
          {userStores.map((membership) => {
            const isActive = currentStore?.id === membership.stores.id;
            return (
              <div key={membership.stores.id} className="flex items-center justify-between" 
                   style={{ 
                     padding: '0.75rem 1rem',
                     backgroundColor: isActive ? 'var(--accent-primary-light)' : 'transparent', 
                     border: `1px solid ${isActive ? '#bfdbfe' : 'var(--border-color)'}`,
                     borderRadius: 'var(--radius-sm)',
                     transition: 'all 0.15s ease'
                   }}>
                <div className="flex items-center gap-3">
                  <Store size={18} style={{ color: isActive ? 'var(--accent-primary)' : 'var(--text-muted)' }} />
                  <div>
                    <div style={{ fontWeight: 500, fontSize: '0.95rem' }}>
                      {membership.stores.name}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', textTransform: 'capitalize' }}>
                      {membership.role}
                    </div>
                  </div>
                </div>
                
                {!isActive ? (
                  <button className="btn btn-secondary" onClick={() => switchStore(membership.stores.id)} style={{ padding: '0.3rem 0.6rem', fontSize: '0.8rem' }}>
                    <ArrowRightLeft size={14} /> Switch
                  </button>
                ) : (
                  <span className="badge badge-success" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Check size={12} /> Active
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Active Store Settings */}
      <div className="card" style={{ padding: '1.5rem' }}>
        <h2 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Store Settings — {currentStore?.name}</h2>
        
        <div className="mb-4" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem' }}>
          <Shield size={16} style={{ color: 'var(--accent-primary)' }} />
          <span style={{ color: 'var(--text-secondary)' }}>Your role:</span>
          <span style={{ textTransform: 'capitalize', fontWeight: 600 }}>{userRole}</span>
        </div>

        <form onSubmit={handleUpdateStore} className="flex-col gap-4">
          <div className="form-group">
            <label>Store Name</label>
            <input
              type="text"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              disabled={userRole !== 'owner'}
            />
          </div>
          
          {userRole === 'owner' && (
            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ width: 'fit-content' }}
              disabled={loading}
            >
              <Save size={16} />
              {loading ? 'Saving...' : 'Save'}
            </button>
          )}
        </form>

        {userRole === 'owner' && (
          <div style={{ marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
            <h3 style={{ fontSize: '0.95rem', marginBottom: '0.5rem' }}>Invite Code</h3>
            <p style={{ fontSize: '0.85rem', marginBottom: '0.75rem' }}>
              Share this code with employees so they can join your store as a cashier.
            </p>
            
            <div className="flex gap-3 items-center">
              <div style={{ 
                flex: 1, 
                padding: '0.625rem 0.75rem', 
                backgroundColor: 'var(--bg-inset)', 
                borderRadius: 'var(--radius-sm)', 
                border: '1px solid var(--border-color)',
                fontSize: '1.1rem', 
                fontFamily: 'monospace',
                letterSpacing: '0.15rem',
                textAlign: 'center',
                fontWeight: 600,
                color: inviteCode ? 'var(--text-primary)' : 'var(--text-muted)'
              }}>
                {inviteCode || 'No code'}
              </div>
              <button 
                type="button" 
                className="btn btn-secondary" 
                onClick={handleGenerateCode}
                disabled={loading}
                style={{ whiteSpace: 'nowrap' }}
              >
                {inviteCode ? 'Regenerate' : 'Generate'}
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default Profile;
