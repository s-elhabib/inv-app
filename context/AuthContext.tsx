"use client"

import { createContext, useState, useContext, useEffect, type ReactNode } from "react"

type UserRole = "admin" | "client"

interface User {
  id: string
  name: string
  email?: string
  role: UserRole
}

interface AuthContextType {
  user: User | null
  login: (email: string, password: string) => Promise<boolean>
  logout: () => Promise<void>
  isAuthenticated: boolean
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Static users for development
const STATIC_USERS = {
  admin: {
    id: "admin-uuid",
    name: "Admin User",
    email: "admin@example.com",
    role: "admin" as UserRole,
    password: "admin"
  },
  client: {
    id: "client-uuid",
    name: "Client User",
    email: "client@example.com",
    role: "client" as UserRole,
    password: "client123"
  }
}

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true)
    
    try {
      console.log(`Attempting login with: ${email}/${password}`);
      
      // For static admin user
      if (email === "admin" && password === "admin") {
        console.log("Admin credentials match");
        const adminUser = {
          id: STATIC_USERS.admin.id,
          name: STATIC_USERS.admin.name,
          email: STATIC_USERS.admin.email,
          role: STATIC_USERS.admin.role
        };
        setUser(adminUser);
        return true;
      }
      
      // For static client user
      if (email === "client" && password === "client123") {
        console.log("Client credentials match");
        const clientUser = {
          id: STATIC_USERS.client.id,
          name: STATIC_USERS.client.name,
          email: STATIC_USERS.client.email,
          role: STATIC_USERS.client.role
        };
        setUser(clientUser);
        return true;
      }
      
      console.log("No credential match found");
      return false;
    } catch (error) {
      console.error("Login error:", error);
      return false;
    } finally {
      setIsLoading(false);
    }
  }

  const logout = async () => {
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        isAuthenticated: !!user,
        isLoading
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}