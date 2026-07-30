import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [userStores, setUserStores] = useState([]);
  const [currentStore, setCurrentStore] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadStoreContext = async (userId) => {
    let { data: memberships, error } = await supabase
      .from('store_users')
      .select('role, stores(id, name, invite_code)')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error("Error loading store context:", error);
      return;
    }

    if (!memberships || memberships.length === 0) {
      setUserStores([]);
      setCurrentStore(null);
      setUserRole(null);
    } else {
      setUserStores(memberships);
      setCurrentStore(memberships[0].stores);
      setUserRole(memberships[0].role);
    }
  };

  const switchStore = (storeId) => {
    const targetMembership = userStores.find(m => m.stores.id === storeId);
    if (targetMembership) {
      setCurrentStore(targetMembership.stores);
      setUserRole(targetMembership.role);
    }
  };

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) {
        await loadStoreContext(session.user.id);
      }
      setLoading(false);
    };
    
    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        setLoading(true);
        await loadStoreContext(session.user.id);
        setLoading(false);
      } else {
        setUserStores([]);
        setCurrentStore(null);
        setUserRole(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email, password) => {
    return supabase.auth.signInWithPassword({ email, password });
  };

  const register = async (email, password) => {
    return supabase.auth.signUp({ email, password });
  };

  const logout = async () => {
    return supabase.auth.signOut();
  };

  const value = {
    user,
    userStores,
    currentStore,
    userRole,
    switchStore,
    refreshStores: () => user ? loadStoreContext(user.id) : null,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
