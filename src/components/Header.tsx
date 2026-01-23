"use client";

import { Avatar, Button, Dropdown } from "antd";
import {
  BellOutlined,
  UserOutlined,
  LogoutOutlined,
  DownOutlined,
  LeftOutlined,
  MenuOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";
import type { MenuProps } from "antd";

interface HeaderProps {
  navigate: (path: string) => void;
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
          >
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </Button>

          {/* optional small user button (for mobile sidebar) */}
          {onMenuToggle && (
            <Button
              type="text"
              onClick={() => onMenuToggle?.()}
              size="middle"
              title="Open profile sidebar"
              className="flex items-center justify-center"
            >
              <UserOutlined style={{ fontSize: 18 }} />
            </Button>
          )}

          <Dropdown menu={{ items, onClick: handleMenuClick }} placement="bottomRight">
            <Button type="text" className="flex items-center gap-1 px-1 sm:px-3">
              {profileImage ? <Avatar src={profileImage} size="small" /> : <Avatar icon={<UserOutlined />} size="small" />}
              <span className="hidden sm:inline-block font-medium ml-2">{username}</span>
              <DownOutlined className="text-xs ml-1" />
            </Button>
          </Dropdown>
        </div>
      </div>
    </header>
  );
};

export default Header;
