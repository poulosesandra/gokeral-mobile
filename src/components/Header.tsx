"use client";

import { Avatar, Button, Dropdown, Modal, List, Typography } from "antd";
import { useEffect, useState } from "react";
import { BellOutlined, UserOutlined, LogoutOutlined, DownOutlined, LeftOutlined, MenuOutlined } from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import type { MenuProps } from "antd";
import { authService } from '../services/authServices';
import api, { bookingApi } from '../services/api';

interface HeaderProps {
  navigate?: (path: string) => void;
  handleLogout: () => void;
  username: string;
  onMenuToggle?: () => void;
  showMenuIcon?: boolean;
  profileImage?: string | null;
  onProfileClick?: () => void;
  onBack?: () => void;
}

export const Header = ({
  navigate,
  handleLogout,
  username,
  onMenuToggle,
  showMenuIcon = false,
  profileImage,
  onProfileClick,
  onBack,
}: HeaderProps) => {
  const navigateHook = useNavigate();

  const items: MenuProps["items"] = [
    { key: "profile", label: <div className="flex items-center"><UserOutlined className="mr-2" /><span>Profile</span></div> },
    { key: "logout", label: <div className="flex items-center"><LogoutOutlined className="mr-2" /><span>Logout</span></div> },
  ];

  const role = authService.getUserRole();
  const [count, setCount] = useState<number>(0);
  const [notifModalVisible, setNotifModalVisible] = useState(false);
  const [notifications, setNotifications] = useState<Array<{ id: string; message: string; time?: string }>>([]);

  const safeNavigate = (path: string) => {
    try {
      if (navigate) {
        navigate(path);
        return;
      }
      navigateHook(path);
    } catch (err) {
      // If react-router isn't available, fallback to full-page navigation
      try {
        window.location.assign(path);
      } catch {
        console.error('Navigation failed for path', path, err);
      }
    }
  };

  const handleMenuClick: MenuProps["onClick"] = (info) => {
    if (info.key === "profile") {
      if (onProfileClick) onProfileClick();
      else safeNavigate("/user/profile");
    } else if (info.key === "logout") {
      handleLogout();
    }
  };

  const openBookings = (bookingId?: string) => {
    const base = role === 'DRIVER' ? '/driver/profile?tab=bookings' : '/user/profile?tab=bookings';
    const path = bookingId ? `${base}&bookingId=${encodeURIComponent(bookingId)}` : base;

    console.log('[Header] openBookings called', { bookingId, path });
    safeNavigate(path);
    setNotifModalVisible(false);

    try {
      window.dispatchEvent(new CustomEvent('open-booking', { detail: { bookingId } }));
      console.log('[Header] open-booking dispatched', bookingId);
    } catch (e) {
      console.warn('[Header] dispatch open-booking failed', e);
    }
  };

  const fetchNotificationCount = async (): Promise<number> => {
    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) return 0;

      const url = role === 'DRIVER' ? '/bookings/pending-for-driver' : '/bookings/my-bookings/pending';
      const res = await bookingApi.get(url);
      const d = res.data;

      let cnt = 0;
      if (Array.isArray(d)) cnt = d.length;
      else if (Array.isArray(d?.bookings)) cnt = d.bookings.length;
      else if (Array.isArray(d?.data)) cnt = d.data.length;
      else if (typeof d?.count === 'number') cnt = d.count;

      setCount(cnt);
      return cnt;
    } catch (err: any) {
      // Suppress noisy errors when backend endpoints are not implemented yet (Sprint-2).
      if (err?.response?.status === 404) {
        // endpoint not ready — return 0 silently
        return 0;
      }
      console.error('Failed to fetch notification count', err);
      return 0;
    }
  };

  const onBellClick = async () => {
    try {
      const items = await fetchNotificationDetails();
      setNotifications(items);
      setNotifModalVisible(true);
      setCount(items.length);
    } catch (e) {
      console.error('Notification fetch failed', e);
      setNotifications([]);
      setNotifModalVisible(true);
    }
  };

  const fetchNotificationDetails = async () => {
    try {
      const currentUser = authService.getCurrentUser();
      if (!currentUser) return [];

      const url = role === 'DRIVER' ? '/bookings/pending-for-driver' : '/bookings/my-bookings/pending';
      const res = await bookingApi.get(url);
      const d = res.data;

      const arr = Array.isArray(d) ? d : Array.isArray(d?.bookings) ? d.bookings : Array.isArray(d?.data) ? d.data : [];

      const items = (arr || []).slice(0, 10).map((b: any) => {
        const id = (b._id || b.id || b.bookingId || '').toString();
        if (role === 'DRIVER') {
          const customer = b.customerName || b.userInfo?.name || b.user?.fullName || 'Customer';
          const pickup = b.pickupLocation || b.origin?.address || b.pickupAddress || 'Pickup';
          const message = `New ride request from ${customer} • ${String(pickup).slice(0, 60)}`;
          return { id, message, time: b.bookingTime || b.timestamp || undefined };
        } else {
          const status = (b.status || '').toUpperCase() || 'PENDING';
          const pickup = b.pickupLocation || b.origin?.address || b.pickupAddress || '';
          const message = status === 'PENDING' ? `Your booking is pending • ${String(pickup).slice(0, 60)}` :
                          status === 'ACCEPTED' ? `Driver accepted your booking • ${String(pickup).slice(0, 60)}` :
                          `${status} • ${String(pickup).slice(0, 60)}`;
          return { id, message, time: b.bookingTime || b.timestamp || undefined };
        }
      });

      return items;
    } catch (err) {
      console.error('Failed to fetch notification details', err);
      return [];
    }
  };

  const [user, setUser] = useState({} as { username: string; profileImage: string | null; });

  useEffect(() => {
    const fetchUser = async () => {
      try {
        // Get user data from authService (already in localStorage)
        const currentUser = authService.getCurrentUser();
        if (currentUser) {
          setUser({
            username: currentUser.fullName || currentUser.name || 'User',
            profileImage: currentUser.profileImage || null,
          });
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (role) {
      fetchNotificationCount().catch(() => {});
    }
  }, [role]);

  useEffect(() => {
    const onRideRequest = (evt: Event) => {
      if (role === 'DRIVER') {
        setCount((c) => c + 1);
      }
    };
    window.addEventListener('ride-request', onRideRequest as EventListener);
    return () => {
      window.removeEventListener('ride-request', onRideRequest as EventListener);
    };
  }, [role]);

  return (
    <header className="bg-white shadow-sm h-16 sticky top-0 z-50">
      <div className="w-full h-full px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {onBack && !showMenuIcon && (
            <Button
              type="text"
              icon={<LeftOutlined style={{ fontSize: "18px" }} />}
              onClick={onBack}
              className="hidden md:flex items-center justify-center mr-2"
              size="large"
              title="Back to map"
              aria-label="Back to map"
              style={{ width: "40px", height: "40px" }}
            />
          )}

          <Link to={"/"} className="flex items-center gap-2 pl-1">
            <span className="font-bold text-xl hidden sm:inline-block">Kerides</span>
          </Link>

          {showMenuIcon && (
            <Button
              type="text"
              icon={<MenuOutlined style={{ fontSize: "20px" }} />}
              className="md:hidden bg-white hover:bg-blue-50 transition-colors"
              onClick={() => onMenuToggle?.()}
              size="large"
              style={{ width: "40px", height: "40px", display: "flex", alignItems: "center", justifyContent: "center" }}
            />
          )}
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <Button
            type="text"
            icon={<BellOutlined className="text-lg" />}
            className="relative flex items-center justify-center"
            size="middle"
            onClick={onBellClick}
            aria-label="Notifications"
            title="Notifications"
          >
            {count > 0 && (
              <span className="absolute top-0 -right-1 min-w-[18px] h-5 px-1 text-xs flex items-center justify-center bg-red-500 text-white rounded-full">
                {count > 99 ? '99+' : count}
              </span>
            )}
          </Button>

          <Dropdown menu={{ items, onClick: handleMenuClick }} placement="bottomRight">
            <Button type="text" className="flex items-center gap-1 px-1 sm:px-3">
              {user.profileImage ? <Avatar src={user.profileImage} size="small" /> : <Avatar icon={<UserOutlined />} size="small" />}
              <span className="hidden sm:inline-block font-medium ml-2">{user.username}</span>
              <DownOutlined className="text-xs ml-1" />
            </Button>
          </Dropdown>
        </div>
      </div>

      <Modal
        title="Notifications"
        open={notifModalVisible}
        onCancel={() => setNotifModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setNotifModalVisible(false)}>Close</Button>,
          <Button key="openBookings" type="primary" onClick={() => openBookings()}>
            Go to Bookings
          </Button>
        ]}
      >
        {notifications.length === 0 ? (
          <Typography.Text>No notifications</Typography.Text>
        ) : (
          <List
            dataSource={notifications}
            renderItem={(item) => (
              <List.Item
                actions={[
                  <Button type="link" onClick={() => openBookings(item.id)}>
                    Open
                  </Button>
                ]}
              >
                <List.Item.Meta
                  title={item.message}
                  description={item.time ? new Date(item.time).toLocaleString() : null}
                />
              </List.Item>
            )}
          />
        )}
      </Modal>
    </header>
  );
};

export default Header;
