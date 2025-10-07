'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

type User = { 
  id: string; 
  full_name: string;
  username: string; 
  email: string; 
  role: 'system_admin' | 'employee' | 'customer';
};

type Permissions = { [key: string]: boolean };

interface AuthContextType {
  user: User | null;
  permissions: Permissions;
  loading: boolean;
  login: (userData: User) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [permissions, setPermissions] = useState<Permissions>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Attempt to load user data from localStorage on initial load
    try {
      const storedUser = localStorage.getItem('user');
      const storedPerms = localStorage.getItem('permissions');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      if (storedPerms) {
        setPermissions(JSON.parse(storedPerms));
      }
    } catch (error) {
      console.error("Failed to parse auth data from localStorage", error);
      localStorage.removeItem('user');
      localStorage.removeItem('permissions');
    } finally {
        setLoading(false);
    }
  }, []);

  const login = useCallback(async (userData: User) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));

    // Fetch permissions for the user
    try {
      const response = await fetch(`/api/permissions/${userData.id}`);
      let userPermissions: Permissions;

      if (response.status === 404) {
          const isAdmin = userData.role === 'system_admin';
          userPermissions = allPermissions.reduce((acc, perm) => ({ ...acc, [perm]: isAdmin }), {});
      } else if (!response.ok) {
        throw new Error('Failed to fetch permissions');
      } else {
        const data = await response.json();
        userPermissions = data.permissions;
      }
      
      setPermissions(userPermissions);
      localStorage.setItem('permissions', JSON.stringify(userPermissions));
    } catch (error) {
      console.error("Login - permission fetch error:", error);
      // Fallback for admins if API fails
      if(userData.role === 'system_admin') {
         const adminPerms = allPermissions.reduce((acc, perm) => ({ ...acc, [perm]: true }), {});
         setPermissions(adminPerms);
         localStorage.setItem('permissions', JSON.stringify(adminPerms));
      } else {
        setPermissions({});
        localStorage.removeItem('permissions');
      }
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setPermissions({});
    localStorage.removeItem('user');
    localStorage.removeItem('permissions');
  }, []);

  const value = { user, permissions, loading, login, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Helper array of all permissions, assuming it's static
const allPermissions = [
    'pos', 'statistics', 'orders', 'daily-summary', 'online-orders', 
    'delivery', 'customers', 'complaints', 'hospitality', 'email', 
    'coupons', 'categories', 'recipes', 'purchases', 'inventory', 
    'needs', 'accounting-fund', 'expenses', 'debts', 'employees', 
    'accounts', 'peak-hours', 'settings'
];
