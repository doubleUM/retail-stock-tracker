import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, UserPlus } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, login, register } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegistering) {
        const { error } = await register(email, password);
        if (error) throw error;
        navigate('/');
      } else {
        const { error } = await login(email, password);
        if (error) throw error;
        navigate('/');
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 150px)' }}>
      <div className="card animate-fade-in" style={{ width: '100%', maxWidth: '400px', padding: '2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.375rem', marginBottom: '0.375rem' }}>
            {isRegistering ? 'Create Account' : 'Sign in'}
          </h2>
          <p style={{ fontSize: '0.9rem' }}>
            {isRegistering ? 'Set up your StockTracker account' : 'Welcome back to StockTracker'}
          </p>
        </div>

        {error && (
          <div className="mb-4" style={{ padding: '0.625rem 0.75rem', borderRadius: 'var(--radius-sm)', backgroundColor: 'var(--accent-danger-light)', border: '1px solid #fecaca' }}>
            <p style={{ color: 'var(--accent-danger)', fontSize: '0.85rem', textAlign: 'center', margin: 0 }}>{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex-col gap-4">
          <div className="form-group" style={{ marginBottom: '0.75rem' }}>
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>

          <div className="form-group" style={{ marginBottom: '1.25rem' }}>
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={6}
            />
          </div>

          <button 
            type="submit" 
            className="btn btn-primary" 
            style={{ width: '100%', padding: '0.625rem', justifyContent: 'center' }}
            disabled={loading}
          >
            {loading ? 'Processing...' : isRegistering ? (
              <><UserPlus size={16} /> Sign Up</>
            ) : (
              <><LogIn size={16} /> Sign In</>
            )}
          </button>
        </form>

        <div style={{ marginTop: '1.25rem', textAlign: 'center' }}>
          <button 
            type="button" 
            onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
            style={{ background: 'none', border: 'none', color: 'var(--accent-primary)', cursor: 'pointer', fontSize: '0.85rem' }}
          >
            {isRegistering ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
