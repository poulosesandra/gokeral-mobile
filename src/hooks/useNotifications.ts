import { useEffect, useState, useCallback } from 'react';
import { bookingApi } from '../services/api';
import { authService } from '../services/authServices';

export const useNotifications = (_intervalMs = 10000) => {
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchCount = useCallback(async () => {
    try {
      setLoading(true);
      const role = authService.getUserRole();
      if (role === 'DRIVER') {
        const res = await bookingApi.get('/ride-requests/pending');
        const data = res.data;
        setCount(Array.isArray(data) ? data.length : (data?.length ?? 0));
      } else {
        const res = await bookingApi.get('/bookings/my-bookings');
        const data = res.data;
        setCount(Array.isArray(data) ? data.length : (data?.length ?? 0));
      }
    } catch (err) {
      console.error('Failed to fetch notification count', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Polling disabled: do a one-off fetch on mount and refresh on window focus.
    // Use the returned `refresh()` to request updates manually.
    fetchCount();
    const onFocus = () => fetchCount();
    window.addEventListener('focus', onFocus);
    return () => {
      window.removeEventListener('focus', onFocus);
    };
  }, [fetchCount]);

  return { count, loading, refresh: fetchCount };
};