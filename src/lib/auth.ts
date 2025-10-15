import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from './db';

const JWT_SECRET = import.meta.env.VITE_JWT_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = '7d'; // Token expires in 7 days

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
  role: 'user' | 'admin' | 'plumber' | 'water_worker';
  created_at: string;
  updated_at: string;
}

// Sign up a new user
export const signUp = async (email: string, password: string, fullName?: string): Promise<AuthSession> => {
  try {
    // Hash the password
    const passwordHash = await bcrypt.hash(password, 10);
    
    // Insert the user
    const userResult = await query(
      'INSERT INTO users (email, password_hash, email_verified) VALUES ($1, $2, $3) RETURNING id, email, created_at, email_verified',
      [email, passwordHash, false]
    );
    
    if (userResult.rows.length === 0) {
      throw new Error('Failed to create user');
    }
    
    const user = userResult.rows[0];
    
    // Update profile with full name if provided
    if (fullName) {
      await query(
        'UPDATE profiles SET full_name = $1 WHERE id = $2',
        [fullName, user.id]
      );
    }
    
    // Create JWT token
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });
    
    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    // Store session in database
    await query(
      'INSERT INTO sessions (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, token, expiresAt.toISOString()]
    );
    
    return {
      user,
      token,
      expiresAt: expiresAt.toISOString(),
    };
  } catch (error: any) {
    if (error.code === '23505') { // Unique violation
      throw new Error('Email already exists');
    }
    throw error;
  }
};

// Sign in an existing user
export const signIn = async (email: string, password: string): Promise<AuthSession> => {
  try {
    // Get user by email
    const userResult = await query(
      'SELECT id, email, password_hash, created_at, email_verified FROM users WHERE email = $1',
      [email]
    );
    
    if (userResult.rows.length === 0) {
      throw new Error('Invalid email or password');
    }
    
    const user = userResult.rows[0];
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }
    
    // Update last sign in
    await query(
      'UPDATE users SET last_sign_in_at = NOW() WHERE id = $1',
      [user.id]
    );
    
    // Create JWT token
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });
    
    // Calculate expiration date
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);
    
    // Store session in database
    await query(
      'INSERT INTO sessions (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [user.id, token, expiresAt.toISOString()]
    );
    
    // Remove password_hash from response
    const { password_hash, ...userWithoutPassword } = user;
    
    return {
      user: userWithoutPassword,
      token,
      expiresAt: expiresAt.toISOString(),
    };
  } catch (error) {
    throw error;
  }
};

// Sign out user
export const signOut = async (token: string): Promise<void> => {
  try {
    await query('DELETE FROM sessions WHERE token = $1', [token]);
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
};

// Get user from token
export const getUserFromToken = async (token: string): Promise<User | null> => {
  try {
    // Verify JWT
    const decoded = jwt.verify(token, JWT_SECRET) as { userId: string; email: string };
    
    // Check if session exists and is not expired
    const sessionResult = await query(
      'SELECT * FROM sessions WHERE token = $1 AND expires_at > NOW()',
      [token]
    );
    
    if (sessionResult.rows.length === 0) {
      return null;
    }
    
    // Get user
    const userResult = await query(
      'SELECT id, email, created_at, email_verified FROM users WHERE id = $1',
      [decoded.userId]
    );
    
    if (userResult.rows.length === 0) {
      return null;
    }
    
    return userResult.rows[0];
  } catch (error) {
    console.error('Get user from token error:', error);
    return null;
  }
};

// Get user profile
export const getUserProfile = async (userId: string): Promise<Profile | null> => {
  try {
    const result = await query(
      'SELECT * FROM profiles WHERE id = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return result.rows[0];
  } catch (error) {
    console.error('Get user profile error:', error);
    return null;
  }
};

// Update user profile
export const updateUserProfile = async (userId: string, data: Partial<Profile>): Promise<Profile> => {
  try {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;
    
    if (data.full_name !== undefined) {
      fields.push(`full_name = $${paramCount++}`);
      values.push(data.full_name);
    }
    
    if (data.phone !== undefined) {
      fields.push(`phone = $${paramCount++}`);
      values.push(data.phone);
    }
    
    if (data.address !== undefined) {
      fields.push(`address = $${paramCount++}`);
      values.push(data.address);
    }
    
    if (fields.length === 0) {
      throw new Error('No fields to update');
    }
    
    values.push(userId);
    
    const result = await query(
      `UPDATE profiles SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    
    if (result.rows.length === 0) {
      throw new Error('Profile not found');
    }
    
    return result.rows[0];
  } catch (error) {
    console.error('Update user profile error:', error);
    throw error;
  }
};

// Clean up expired sessions (call this periodically)
export const cleanupExpiredSessions = async (): Promise<void> => {
  try {
    await query('SELECT cleanup_expired_sessions()');
  } catch (error) {
    console.error('Cleanup expired sessions error:', error);
  }
};
