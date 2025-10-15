// API client for backend communication
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Export API_URL for use in other components
export { API_URL };

export interface User {
  id: string;
  email: string;
  created_at: string;
  email_verified: boolean;
}

export interface AuthSession {
  user: User;
  token: string;
  expiresAt: string;
}

export interface Profile {
  id: string;
  full_name: string;
  phone: string | null;
  address: string | null;
  role: 'resident' | 'panchayat_officer' | 'maintenance_technician' | 'water_flow_controller';
  created_at: string;
  updated_at: string;
}

// Sign up a new user
export const signUp = async (email: string, password: string, fullName: string, phone?: string, address?: string): Promise<AuthSession> => {
  const response = await fetch(`${API_URL}/api/auth/signup`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password, fullName, phone, address }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Sign up failed');
  }

  return response.json();
};

// Sign in an existing user
export const signIn = async (email: string, password: string): Promise<AuthSession> => {
  const response = await fetch(`${API_URL}/api/auth/signin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Sign in failed');
  }

  return response.json();
};

// Sign out user
export const signOut = async (token: string): Promise<void> => {
  const response = await fetch(`${API_URL}/api/auth/signout`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Sign out failed');
  }
};

// Get user from token
export const getUserFromToken = async (token: string): Promise<User | null> => {
  const response = await fetch(`${API_URL}/api/auth/user`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    return null;
  }

  const data = await response.json();
  return data.user;
};

// Get user profile
export const getUserProfile = async (userId: string): Promise<Profile | null> => {
  const token = localStorage.getItem('auth_token');
  if (!token) return null;

  const response = await fetch(`${API_URL}/api/profile`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    return null;
  }

  return response.json();
};

// Update user profile
export const updateUserProfile = async (userId: string, data: Partial<Profile>): Promise<Profile> => {
  const token = localStorage.getItem('auth_token');
  if (!token) throw new Error('Not authenticated');

  const response = await fetch(`${API_URL}/api/profile`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Update failed');
  }

  return response.json();
};
