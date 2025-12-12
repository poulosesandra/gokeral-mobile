"use client";

import React, { useEffect, useRef } from "react";
import { Avatar, Menu, Button } from "antd";
import {
  UserOutlined,
  HomeOutlined,
  BookOutlined,
  LockOutlined,
  EyeOutlined,
  DatabaseOutlined,
  LogoutOutlined,
} from "@ant-design/icons";
import type { UserData, TabKey } from "./UserProfilePage";

interface UserSidebarProps {
  userData: UserData;
  activeTab: TabKey;
  handleTabChange: (key: TabKey) => void;
  handleLogout: () => void;
  sidebarOpen: boolean;
  windowWidth: number;
  toggleSidebar: () => void;
}

export const UserSidebar: React.FC<UserSidebarProps> = ({
  userData,
  activeTab,
  handleTabChange,
  handleLogout,
  sidebarOpen,
  windowWidth,
  toggleSidebar,
}) => {
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        windowWidth <= 768 &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node)
      ) {
        const menuButton = document.querySelector(".md\\:hidden.fixed");
        if (menuButton && !menuButton.contains(event.target as Node)) {
          toggleSidebar();
        }
      }
    };

    if (sidebarOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [sidebarOpen, toggleSidebar, windowWidth]);

  const menuItems = [
    { key: "home", icon: <HomeOutlined />, label: "Home" },
    { key: "personal", icon: <UserOutlined />, label: "Personal Info" },
    { key: "bookings", icon: <BookOutlined />, label: "My Bookings" },
    { key: "security", icon: <LockOutlined />, label: "Sign-in & Security" },
    { key: "privacy", icon: <EyeOutlined />, label: "Privacy" },
    { key: "data", icon: <DatabaseOutlined />, label: "Data Management" },
  ];

  return (
    <>
      {/* Overlay for mobile */}
      {sidebarOpen && windowWidth <= 768 && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-10"
          onClick={toggleSidebar}
        />
      )}

      <div
        ref={sidebarRef}
        className={`fixed md:relative top-0 left-0 h-full bg-gray-800 text-white z-20 transition-transform duration-300 ease-in-out ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 ${windowWidth > 768 ? "w-64" : "w-64"}`}
      >
        <div className="flex flex-col h-full">
          <div className="p-5 text-center border-b border-gray-700">
            <Avatar size={80} src={userData.profileImage} icon={<UserOutlined />} className="border-2 border-blue-400" />
            <h3 className="mt-3 text-lg font-semibold truncate">{userData.name}</h3>
            <p className="text-xs text-gray-400 truncate">{userData.email}</p>
          </div>
          <Menu theme="dark" mode="inline" selectedKeys={[activeTab]} onClick={({ key }) => handleTabChange(key as TabKey)} items={menuItems} className="flex-grow bg-gray-800" />
          <div className="p-4 border-t border-gray-700">
            <Button type="primary" danger icon={<LogoutOutlined />} onClick={handleLogout} className="w-full">Logout</Button>
          </div>
        </div>
      </div>
    </>
  );
};