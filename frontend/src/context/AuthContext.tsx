import React, { createContext, useContext, useState, useEffect } from 'react';
import type { AuthUser, LoginCredentials, RegisterData, UserRole } from '../types/auth';

interface AuthContextType {
  user: AuthUser | null;
  role: UserRole;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<AuthUser>;
  register: (data: RegisterData) => Promise<AuthUser>;
  logout: () => void;
  clearError: () => void;
  setRole: (role: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const saved = localStorage.getItem('bharat_traffic_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [role, setRoleState] = useState<UserRole>(() => {
    return user ? user.role : 'admin';
  });

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      localStorage.setItem('bharat_traffic_user', JSON.stringify(user));
      setRoleState(user.role);
    } else {
      localStorage.removeItem('bharat_traffic_user');
    }
  }, [user]);

  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    if (user) {
      setUser({ ...user, role: newRole });
    }
  };

  const clearError = () => setError(null);

  const login = async (credentials: LoginCredentials): Promise<AuthUser> => {
    setIsLoading(true);
    setError(null);

    // Simulate network authentication delay
    await new Promise((resolve) => setTimeout(resolve, 800));

    // Mock validation logic
    if (!credentials.email || !credentials.password) {
      setIsLoading(false);
      const msg = 'Please enter both email and password';
      setError(msg);
      throw new Error(msg);
    }

    if (credentials.password.length < 6) {
      setIsLoading(false);
      const msg = 'Invalid credentials. Password must be at least 6 characters.';
      setError(msg);
      throw new Error(msg);
    }

    const nameFromEmail = credentials.email.split('@')[0];
    const mockUser: AuthUser = {
      id: `usr-${Date.now()}`,
      name: nameFromEmail.charAt(0).toUpperCase() + nameFromEmail.slice(1),
      email: credentials.email,
      role: credentials.role,
    };

    setUser(mockUser);
    setRoleState(credentials.role);
    setIsLoading(false);
    return mockUser;
  };

  const register = async (data: RegisterData): Promise<AuthUser> => {
    setIsLoading(true);
    setError(null);

    await new Promise((resolve) => setTimeout(resolve, 900));

    if (!data.email || !data.password || !data.name) {
      setIsLoading(false);
      const msg = 'Please fill in all required fields';
      setError(msg);
      throw new Error(msg);
    }

    if (data.password !== data.confirmPassword) {
      setIsLoading(false);
      const msg = 'Passwords do not match';
      setError(msg);
      throw new Error(msg);
    }

    const newUser: AuthUser = {
      id: `usr-${Date.now()}`,
      name: data.name,
      email: data.email,
      role: data.role,
    };

    setUser(newUser);
    setRoleState(data.role);
    setIsLoading(false);
    return newUser;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('bharat_traffic_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        isAuthenticated: !!user,
        isLoading,
        error,
        login,
        register,
        logout,
        clearError,
        setRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
