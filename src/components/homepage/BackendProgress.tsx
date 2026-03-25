import { useEffect, useMemo, useState } from 'react';

type ServiceStatus = 'checking' | 'up' | 'down';

type ServiceItem = {
  key: string;
  label: string;
  baseUrl: string;
  status: ServiceStatus;
  latencyMs?: number;
};

const defaultBaseUrl = (service: 'auth' | 'user' | 'driver' | 'booking') => {
  if (!import.meta.env.DEV) return '';

  if (service === 'auth') return 'http://localhost:3001';
  if (service === 'user') return 'http://localhost:3002';
  if (service === 'driver') return 'http://localhost:3003';
  return 'http://localhost:3004';
};

const getHealthUrl = (baseUrl: string) => `${baseUrl.replace(/\/$/, '')}/health`;

const BackendProgress = () => {
  const initialServices: ServiceItem[] = useMemo(
    () => [
      {
        key: 'auth',
        label: 'Auth Service',
        baseUrl: String(import.meta.env.VITE_AUTH_SERVICE_URL || defaultBaseUrl('auth')).trim(),
        status: 'checking',
      },
      {
        key: 'user',
        label: 'User Service',
        baseUrl: String(import.meta.env.VITE_USER_SERVICE_URL || defaultBaseUrl('user')).trim(),
        status: 'checking',
      },
      {
        key: 'driver',
        label: 'Driver Service',
        baseUrl: String(import.meta.env.VITE_DRIVER_SERVICE_URL || defaultBaseUrl('driver')).trim(),
        status: 'checking',
      },
      {
        key: 'booking',
        label: 'Booking Service',
        baseUrl: String(import.meta.env.VITE_BOOKING_SERVICE_URL || defaultBaseUrl('booking')).trim(),
        status: 'checking',
      },
    ],
    [],
  );

  const [services, setServices] = useState<ServiceItem[]>(initialServices);

  useEffect(() => {
    let active = true;

    const checkService = async (service: ServiceItem): Promise<ServiceItem> => {
      if (!service.baseUrl) {
        return { ...service, status: 'down' };
      }

      const startedAt = performance.now();
      const controller = new AbortController();
      const timeoutId = window.setTimeout(() => controller.abort(), 6000);

      try {
        const response = await fetch(getHealthUrl(service.baseUrl), {
          method: 'GET',
          signal: controller.signal,
        });

        const latencyMs = Math.round(performance.now() - startedAt);
        return {
          ...service,
          status: response.ok ? 'up' : 'down',
          latencyMs,
        };
      } catch {
        return {
          ...service,
          status: 'down',
        };
      } finally {
        clearTimeout(timeoutId);
      }
    };

    const load = async () => {
      const results = await Promise.all(initialServices.map((item) => checkService(item)));
      if (active) {
        setServices(results);
      }
    };

    load();
    const intervalId = window.setInterval(load, 30000);

    return () => {
      active = false;
      clearInterval(intervalId);
    };
  }, [initialServices]);

  const upCount = services.filter((item) => item.status === 'up').length;

  return (
    <section className="py-16 lg:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">Backend Progress</h2>
          <p className="mt-3 text-gray-600">
            Live microservice health and Sprint 3 production hardening status.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {services.map((service) => {
            const isUp = service.status === 'up';
            const isChecking = service.status === 'checking';
            return (
              <div
                key={service.key}
                className="rounded-2xl border border-gray-200 p-4 bg-gray-50"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{service.label}</h3>
                  <span
                    className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      isUp
                        ? 'bg-green-100 text-green-700'
                        : isChecking
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {isUp ? 'UP' : isChecking ? 'CHECKING' : 'DOWN'}
                  </span>
                </div>
                <p className="text-xs text-gray-500 truncate">{service.baseUrl || 'Not configured'}</p>
                <p className="text-sm text-gray-700 mt-2">
                  {isUp && typeof service.latencyMs === 'number'
                    ? `Latency: ${service.latencyMs} ms`
                    : isChecking
                      ? 'Running health check...'
                      : 'Unavailable'}
                </p>
              </div>
            );
          })}
        </div>

        <div className="rounded-2xl bg-green-50 border border-green-100 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-green-700 font-semibold">Sprint 3 Status</p>
              <p className="text-gray-800">Production hardening and deployment stabilization</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-green-700">{upCount}/4</p>
              <p className="text-xs text-gray-600">Services healthy</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BackendProgress;
