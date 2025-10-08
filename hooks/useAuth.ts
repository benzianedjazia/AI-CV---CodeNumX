import { useState, useEffect } from 'react';

// For simplicity, we'll store users in localStorage.
// In a real app, this would be an API call.
// The password is not stored, which is a massive security flaw,
// but for this mock, it's fine.
const USERS_KEY = 'ai-cv-users';

interface User {
  email: string;
}

type SocialProvider = 'google' | 'facebook' | 'instagram' | 'linkedin';

const getStoredUsers = (): Record<string, string> => {
  try {
    const users = localStorage.getItem(USERS_KEY);
    return users ? JSON.parse(users) : {};
  } catch {
    return {};
  }
};

const setStoredUsers = (users: Record<string, string>) => {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
};

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(() => {
    try {
        const sessionUser = sessionStorage.getItem('ai-cv-user');
        return sessionUser ? JSON.parse(sessionUser) : null;
    } catch {
        return null;
    }
  });

  useEffect(() => {
    if (user) {
      sessionStorage.setItem('ai-cv-user', JSON.stringify(user));
    } else {
      sessionStorage.removeItem('ai-cv-user');
    }
  }, [user]);

  const login = (email: string, pass: string): boolean => {
    const users = getStoredUsers();
    // Super secure password check for this mock :)
    if (users[email.toLowerCase()] === pass) {
      const loggedInUser = { email: email.toLowerCase() };
      setUser(loggedInUser);
      return true;
    }
    return false;
  };

  const signup = (email: string, pass: string): boolean => {
    const users = getStoredUsers();
    if (users[email.toLowerCase()]) {
      return false; // User already exists
    }
    users[email.toLowerCase()] = pass;
    setStoredUsers(users);
    const newUser = { email: email.toLowerCase() };
    setUser(newUser);
    return true;
  };

  const socialLogin = (provider: SocialProvider) => {
    const mockEmail = `user@${provider}.com`;
    const mockPass = 'social_login_mock_password';
    
    const users = getStoredUsers();

    // If user doesn't exist, sign them up first.
    if (!users[mockEmail]) {
      users[mockEmail] = mockPass;
      setStoredUsers(users);
    }

    // Now log them in.
    const loggedInUser = { email: mockEmail };
    setUser(loggedInUser);
    return true;
  };


  const logout = () => {
    setUser(null);
  };

  return {
    user,
    login,
    signup,
    logout,
    socialLogin,
    isAuthenticated: !!user,
  };
};