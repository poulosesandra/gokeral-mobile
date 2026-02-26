import { beforeEach, describe, expect, it, vi } from 'vitest';
import { authService, getLoginPathForRole } from './authServices';

describe('auth redirection', () => {
  const mockRedirect = vi.fn();

  beforeEach(() => {
    localStorage.clear();
    authService.clearAuth();
    mockRedirect.mockClear();
  });

  it('resolves login path from role', () => {
    expect(getLoginPathForRole('DRIVER')).toBe('/driver/login');
    expect(getLoginPathForRole('driver')).toBe('/driver/login');
    expect(getLoginPathForRole('USER')).toBe('/user/login');
    expect(getLoginPathForRole(undefined)).toBe('/user/login');
  });

  it('logout uses role-based default redirect', () => {
    localStorage.setItem('userRole', 'DRIVER');

    authService.logout(undefined, mockRedirect);

    expect(mockRedirect).toHaveBeenCalledWith('/driver/login');
  });

  it('logout honors explicit redirect target', () => {
    localStorage.setItem('userRole', 'DRIVER');

    authService.logout('/user/login', mockRedirect);

    expect(mockRedirect).toHaveBeenCalledWith('/user/login');
  });

  it('logout clears token and stored user data', () => {
    authService.setToken('abc');
    authService.setCurrentUser({ id: '1', role: 'DRIVER', email: 'a@b.com' });

    authService.logout('/driver/login', mockRedirect);

    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('userData')).toBeNull();
    expect(localStorage.getItem('userRole')).toBeNull();
    expect(mockRedirect).toHaveBeenCalledWith('/driver/login');
  });
});
