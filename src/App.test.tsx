import React from 'react';
import { render } from '@testing-library/react';
import { vi } from 'vitest';
import App from './App';

vi.mock('./contexts/AuthContext', () => ({
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  useAuth: () => ({
    isAuthenticated: false,
    loading: true,
    isAdmin: false,
    authScreen: 'login',
  }),
}));

test('renders splash screen while loading', () => {
  const { container } = render(<App />);
  expect(container.querySelector('.spinner')).toBeInTheDocument();
});
