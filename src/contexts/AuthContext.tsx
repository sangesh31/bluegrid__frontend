import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, AuthSession, signIn as authSignIn, signUp as authSignUp, signOut as authSignOut, getUserFromToken, getUserProfile, Profile } from '@/lib/api';

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  token: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, phone?: string, address?: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        console.log('AuthContext: Loading user from localStorage...');
        const storedToken = localStorage.getItem('auth_token');
        if (storedToken) {
          console.log('AuthContext: Found stored token, validating...');
          const userData = await getUserFromToken(storedToken);
          if (userData) {
            console.log('AuthContext: User validated:', userData.email);
            setUser(userData);
            setToken(storedToken);
            
            // Load profile
            console.log('AuthContext: Loading profile...');
            const profileData = await getUserProfile(userData.id);
            if (profileData) {
              console.log('AuthContext: Profile loaded:', profileData.role);
              setProfile(profileData);
            }
          } else {
            // Token is invalid, clear it
            console.log('AuthContext: Token invalid, clearing...');
            localStorage.removeItem('auth_token');
          }
        } else {
          console.log('AuthContext: No stored token found');
        }
      } catch (error) {
        console.error('AuthContext: Error loading user:', error);
        localStorage.removeItem('auth_token');
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      console.log('AuthContext: Signing in...', email);
      const session = await authSignIn(email, password);
      console.log('AuthContext: Sign in successful, session:', session);
      setUser(session.user);
      setToken(session.token);
      localStorage.setItem('auth_token', session.token);
      
      // Load profile
      console.log('AuthContext: Loading profile after sign in...');
      const profileData = await getUserProfile(session.user.id);
      if (profileData) {
        console.log('AuthContext: Profile loaded after sign in:', profileData);
        setProfile(profileData);
      } else {
        console.log('AuthContext: No profile found for user:', session.user.id);
      }
    } catch (error) {
      console.error('AuthContext: Sign in error:', error);
      throw error;
    }
  };

  const signUp = async (email: string, password: string, fullName: string, phone?: string, address?: string) => {
    try {
      const session = await authSignUp(email, password, fullName, phone, address);
      setUser(session.user);
      setToken(session.token);
      localStorage.setItem('auth_token', session.token);
      
      // Load profile
      const profileData = await getUserProfile(session.user.id);
      if (profileData) {
        setProfile(profileData);
      }
    } catch (error) {
      console.error('Sign up error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      if (token) {
        await authSignOut(token);
      }
      setUser(null);
      setProfile(null);
      setToken(null);
      localStorage.removeItem('auth_token');
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  };

  const refreshProfile = async () => {
    if (user) {
      const profileData = await getUserProfile(user.id);
      if (profileData) {
        setProfile(profileData);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, token, loading, signIn, signUp, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
