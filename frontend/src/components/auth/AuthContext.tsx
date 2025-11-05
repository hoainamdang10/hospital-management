'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from './types';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock users data
const mockUsers: (User & { password: string })[] = [
  {
    id: '1',
    name: 'Nguyễn Văn Admin',
    email: 'admin@hospital.com',
    password: 'admin123',
    role: 'ADMIN',
    avatar: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=100&h=100&fit=crop&crop=face'
  },
  {
    id: '2',
    name: 'Dr. Trần Thị Hương',
    email: 'doctor@hospital.com',
    password: 'doctor123',
    role: 'DOCTOR',
    department: 'Khoa Nội',
    specialization: 'Tim mạch',
    avatar: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=100&h=100&fit=crop&crop=face'
  },
  {
    id: '3',
    name: 'Lê Văn Bệnh Nhân',
    email: 'patient@hospital.com',
    password: 'patient123',
    role: 'PATIENT',
    phone: '0123456789',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=face'
  },
  {
    id: '4',
    name: 'Phạm Thị Lễ Tân',
    email: 'receptionist@hospital.com',
    password: 'receptionist123',
    role: 'RECEPTIONIST',
    department: 'Tiếp nhận',
    avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b977?w=100&h=100&fit=crop&crop=face'
  },
  {
    id: '5',
    name: 'Hoàng Văn Staff',
    email: 'staff@hospital.com',
    password: 'staff123',
    role: 'STAFF',
    department: 'Hành chính',
    avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face'
  },
  {
    id: '6',
    name: 'Super Admin',
    email: 'superadmin@hospital.com',
    password: 'superadmin123',
    role: 'SUPERADMIN',
    avatar: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=100&h=100&fit=crop&crop=face'
  }
];

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if user is logged in from localStorage
    const savedUser = localStorage.getItem('hospital_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
      setIsAuthenticated(true);
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const { authService } = await import("./services");
      const response = await authService.login({ email, password, deviceInfo: {
        platform: "web",
        browser: navigator.userAgent.includes("Chrome") ? "Chrome" : "Other",
        version: navigator.userAgent,
      }});
      
      if (response.success && response.data) {
        setUser(response.data.user);
        setIsAuthenticated(true);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    }
  };

  const logout = async () => {
    try {
      const { authService } = await import("./services");
      await authService.logout();
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('hospital_user');
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}