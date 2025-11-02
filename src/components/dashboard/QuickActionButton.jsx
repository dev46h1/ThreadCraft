import React from "react";

function QuickActionButton({ icon: Icon, title, description, color, onClick }) {
  const colorClasses = {
    blue: "bg-blue-50 text-blue-600 hover:bg-blue-100",
    green: "bg-green-50 text-green-600 hover:bg-green-100",
    purple: "bg-purple-50 text-purple-600 hover:bg-purple-100",
  };

  return (
    <button
      onClick={onClick}
      className={`p-4 rounded-lg text-left transition-colors ${colorClasses[color]}`}
    >
      <Icon className="h-8 w-8 mb-2" />
      <h4 className="font-semibold text-gray-900">{title}</h4>
      <p className="text-sm text-gray-600 mt-1">{description}</p>
    </button>
  );
}

export default QuickActionButton;
