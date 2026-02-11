import { useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import { authService } from '../services/authServices';

export const useNotifications = (intervalMs = 10000) => {
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);

  const fetchCount = useCallback(async () => {
    try {
      setLoading(true);
      const role = authService.getUserRole();
      if (role === 'DRIVER') {
        const res = await api.get('/bookings/pending-for-driver');
        const data = res.data;
        setCount(Array.isArray(data) ? data.length : (data?.length ?? 0));
      } else {
        const res = await api.get('/bookings/my-bookings/pending');
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
    fetchCount();
    const id = setInterval(fetchCount, intervalMs);
    const onFocus = () => fetchCount();
    window.addEventListener('focus', onFocus);
    return () => {
      clearInterval(id);
      window.removeEventListener('focus', onFocus);
    };
  }, [fetchCount, intervalMs]);

  return { count, loading, refresh: fetchCount };
};