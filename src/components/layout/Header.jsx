import React from "react";
import { Menu, X } from "lucide-react";
import { Link } from "react-router-dom";

function Header({ onMenuToggle, isSidebarOpen }) {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200 fixed top-0 left-0 right-0 z-50">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <button
              onClick={onMenuToggle}
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100 lg:mr-2"
              aria-label="Toggle menu"
            >
              {isSidebarOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
            <Link to="/">
              <h1 className="text-2xl font-bold text-blue-600 ml-2">
                ThreadCraft
              </h1>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-gray-900">Welcome Back</p>
              <p className="text-xs text-gray-500">
                {new Date().toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
