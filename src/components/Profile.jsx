import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabaseClient';
import { Store, User, Shield, Save, LogOut, ArrowRightLeft, Plus, KeyRound } from 'lucide-react';

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
      setMessage({ type: 'success', text: 'New Invite Code generated!' });
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
    <div className="flex-col gap-6" style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 0' }}>
      
      <div className="glass-panel" style={{ padding: '2rem' }}>
        <h2 className="text-gradient" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <User size={24} />
          My Profile
        </h2>
        <div className="flex-col gap-2">
          <p><strong>Email:</strong> {user?.email}</p>
          <p><strong>User ID:</strong> <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{user?.id}</span></p>
        </div>
      </div>

      <div className="glass-panel" style={{ padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 className="text-gradient" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: 0 }}>
            <Store size={24} />
            My Stores ({userStores.length})
          </h2>
          {!actionMode && (
            <div className="flex gap-2">
              <button className="btn btn-secondary" onClick={() => setActionMode('join')} style={{ padding: '0.5rem 1rem' }}>
                <KeyRound size={16} /> Join
              </button>
              <button className="btn btn-primary" onClick={() => setActionMode('create')} style={{ padding: '0.5rem 1rem' }}>
                <Plus size={16} /> Create
              </button>
            </div>
          )}
        </div>

        {message.text && (
          <div className="mb-4 p-3 rounded" style={{ 
            backgroundColor: message.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)', 
            border: `1px solid ${message.type === 'error' ? 'var(--accent-danger)' : 'var(--accent-success)'}` 
          }}>
            <p style={{ 
              color: message.type === 'error' ? '#fca5a5' : '#6ee7b7', 
              fontSize: '0.9rem', textAlign: 'center', margin: 0 
            }}>{message.text}</p>
          </div>
        )}

        {actionMode === 'create' && (
          <form onSubmit={handleCreateStore} className="flex gap-3 mb-6 p-4 rounded" style={{ backgroundColor: 'rgba(0,0,0,0.1)' }}>
            <input type="text" placeholder="New Store Name" value={newStoreName} onChange={e => setNewStoreName(e.target.value)} required style={{ flex: 1 }} />
            <button type="submit" className="btn btn-primary" disabled={loading}>Create</button>
            <button type="button" className="btn btn-secondary" onClick={() => setActionMode(null)}>Cancel</button>
          </form>
        )}

        {actionMode === 'join' && (
          <form onSubmit={handleJoinStore} className="flex gap-3 mb-6 p-4 rounded" style={{ backgroundColor: 'rgba(0,0,0,0.1)' }}>
            <input type="text" placeholder="Invite Code (e.g. A7X9B2)" value={joinCode} onChange={e => setJoinCode(e.target.value)} required style={{ flex: 1 }} />
            <button type="submit" className="btn btn-primary" disabled={loading}>Join</button>
            <button type="button" className="btn btn-secondary" onClick={() => setActionMode(null)}>Cancel</button>
          </form>
        )}

        <div className="flex-col gap-4 mb-6">
          {userStores.map((membership) => (
            <div key={membership.stores.id} className="flex items-center justify-between" 
                 style={{ 
                   padding: '1.25rem',
                   backgroundColor: currentStore?.id === membership.stores.id ? 'rgba(99, 102, 241, 0.1)' : 'rgba(255, 255, 255, 0.02)', 
                   border: `1px solid ${currentStore?.id === membership.stores.id ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.1)'}`,
                   borderRadius: '12px',
                   boxShadow: currentStore?.id === membership.stores.id ? '0 0 20px rgba(99, 102, 241, 0.15)' : 'none',
                   transition: 'all 0.3s ease'
                 }}>
              <div className="flex items-center gap-4">
                <div style={{ 
                  display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  width: '44px', height: '44px', 
                  borderRadius: '10px', 
                  backgroundColor: currentStore?.id === membership.stores.id ? 'var(--accent-primary)' : 'rgba(255, 255, 255, 0.05)',
                  color: '#fff'
                }}>
                  <Store size={22} />
                </div>
                <div>
                  <div style={{ fontWeight: '600', fontSize: '1.15rem', marginBottom: '0.2rem', color: 'var(--text-primary)' }}>
                    {membership.stores.name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    <Shield size={14} style={{ color: currentStore?.id === membership.stores.id ? 'var(--accent-primary)' : 'inherit' }} />
                    <span style={{ textTransform: 'capitalize', fontWeight: '500' }}>{membership.role}</span>
                  </div>
                </div>
              </div>
              
              {currentStore?.id !== membership.stores.id ? (
                <button className="btn btn-secondary" onClick={() => switchStore(membership.stores.id)} style={{ padding: '0.5rem 1rem', borderRadius: '8px' }}>
                  <ArrowRightLeft size={16} /> Switch
                </button>
              ) : (
                <div style={{ 
                  display: 'flex', alignItems: 'center', gap: '0.4rem', 
                  padding: '0.4rem 0.8rem', 
                  backgroundColor: 'rgba(16, 185, 129, 0.15)', 
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  borderRadius: '20px',
                  color: '#10b981', 
                  fontWeight: 'bold', 
                  fontSize: '0.8rem',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase'
                }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#10b981', boxShadow: '0 0 8px #10b981' }}></div>
                  Active
                </div>
              )}
            </div>
          ))}
        </div>

        <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid var(--border-color)' }}>
          <h3 style={{ marginBottom: '1.5rem', color: 'var(--text-primary)' }}>Active Store Settings: {currentStore?.name}</h3>
          
          <div style={{ marginBottom: '2rem', padding: '1rem', backgroundColor: 'var(--bg-card)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
            <p style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', margin: 0 }}>
              <Shield size={18} style={{ color: 'var(--accent-primary)' }} />
              <strong>Your Role:</strong> 
              <span style={{ textTransform: 'capitalize', color: 'var(--accent-primary)', fontWeight: 'bold' }}>
                {userRole}
              </span>
            </p>
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
                <Save size={18} />
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            )}
          </form>

          {userRole === 'owner' && (
            <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid var(--border-color)' }}>
              <h3 style={{ marginBottom: '1rem' }}>Invite Team Members</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                Generate an Invite Code and send it to your employees. When they create an account, they can use this code to securely join your store as a Cashier.
              </p>
              
              <div className="flex gap-4 items-center">
                <div style={{ 
                  flex: 1, 
                  padding: '1rem', 
                  backgroundColor: 'rgba(0,0,0,0.2)', 
                  borderRadius: '8px', 
                  fontSize: '1.25rem', 
                  fontFamily: 'monospace',
                  letterSpacing: '0.2rem',
                  textAlign: 'center',
                  fontWeight: 'bold',
                  color: inviteCode ? 'var(--text-primary)' : 'var(--text-secondary)'
                }}>
                  {inviteCode || 'NO CODE'}
                </div>
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={handleGenerateCode}
                  disabled={loading}
                >
                  {inviteCode ? 'Generate New Code' : 'Generate Code'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default Profile;
