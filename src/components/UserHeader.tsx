"use client";

import { Avatar, Button, Dropdown } from "antd";
import {
  BellOutlined,
  UserOutlined,
  LogoutOutlined,
  DownOutlined,
} from "@ant-design/icons";
import { Link } from "react-router-dom";
import type { MenuProps } from "antd";


interface UserHeaderProps {
  navigate: (path: string) => void;
  handleLogout: () => void;
  username: string;
}

export const UserHeader = ({
  navigate,
  handleLogout,
  username,
}: UserHeaderProps) => {
  const items: MenuProps["items"] = [
    {
      key: "profile",
      label: (
        <div className="flex items-center" onClick={() => navigate("/user/profile")}>
          <UserOutlined className="mr-2" />
          <span>Profile</span>
        </div>
      ),
    },
    {
      key: "logout",
      label: (
        <div className="flex items-center" onClick={handleLogout}>
          <LogoutOutlined className="mr-2" />
          <span>Logout</span>
        </div>
      ),
    },
  ];

  return (
    <header className="bg-white shadow-sm h-16">
      <div className="w-full h-full px-4 flex items-center justify-between">
        <Link to={"/"} className="flex items-center gap-2">
          {/* <div className="relative w-12 h-12">
            <img src={Logo} alt="Logo" className="object-contain" />
          </div> */}
          <span className="font-bold text-xl hidden sm:inline-block">
          Kerides
          </span>
        </Link>

        <div className="flex items-center gap-2 sm:gap-4">
          <Button
            type="text"
            icon={<BellOutlined className="text-lg" />}
            className="relative flex items-center justify-center"
            size="middle"
          >
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </Button>

          <Dropdown menu={{ items }} placement="bottomRight">
            <Button
              type="text"
              className="flex items-center gap-1 px-1 sm:px-3"
            >
              <Avatar icon={<UserOutlined />} size="small" />
              <span className="hidden sm:inline-block font-medium ml-2">
                {username}
              </span>
              <DownOutlined className="text-xs ml-1" />
            </Button>
          </Dropdown>
        </div>
      </div>
    </header>
  );
};
