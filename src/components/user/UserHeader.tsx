"use client";

import { Button, Dropdown } from "antd";
import {
  BellOutlined,
  UserOutlined,
  LogoutOutlined,
  DownOutlined,
  MenuOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";
import type { MenuProps } from "antd";

interface UserHeaderProps {
  navigate: (path: string) => void;
  handleLogout: () => void;
  username: string;
  onMenuToggle?: () => void;
  showMenuIcon?: boolean;
  profileImage?: string | null;
  onProfileClick?: () => void;
}

export const UserHeader = ({
  navigate,
  handleLogout,
  username,
  onMenuToggle,
  showMenuIcon = false,
  onProfileClick,
}: UserHeaderProps) => {
  const items: MenuProps["items"] = [
    { key: "profile", label: <div className="flex items-center"><UserOutlined className="mr-2" /><span>Profile</span></div> },
    { key: "logout", label: <div className="flex items-center"><LogoutOutlined className="mr-2" /><span>Logout</span></div> },
  ];

  const handleMenuClick: MenuProps["onClick"] = (info) => {
    if (info.key === "profile") {
      if (onProfileClick) onProfileClick();
      else navigate("/user/profile");
    } else if (info.key === "logout") {
      handleLogout();
    }
  };

  return (
    <header className="bg-white shadow-sm h-16">
      <div className="w-full h-full px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
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

          <Link to={"/"} className="flex items-center gap-2">
            <span className="font-bold text-xl hidden sm:inline-block">Kerides</span>
          </Link>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          <Button
            type="text"
            icon={<BellOutlined className="text-lg" />}
            className="relative flex items-center justify-center"
            size="middle"
          >
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </Button>

          <Button type="text" onClick={() => onMenuToggle?.()} size="middle" title="Open profile sidebar" className="flex items-center justify-center">
            <UserOutlined style={{ fontSize: 18 }} />
          </Button>

          <Dropdown menu={{ items, onClick: handleMenuClick }} placement="bottomRight">
            <Button type="text" className="flex items-center gap-1 px-1 sm:px-3">
              <span className="hidden sm:inline-block font-medium ml-2">{username}</span>
              <DownOutlined className="text-xs ml-1" />
            </Button>
          </Dropdown>
        </div>
      </div>
    </header>
  );
};