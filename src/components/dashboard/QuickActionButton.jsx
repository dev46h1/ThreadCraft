import React from "react";

function QuickActionButton({ icon: Icon, title, description, color, onClick }) {
  const gradientClasses = {
    blue: "bg-gradient-to-br from-blue-500 to-blue-600",
    green: "bg-gradient-to-br from-green-500 to-emerald-600",
    purple: "bg-gradient-to-br from-purple-500 to-indigo-600",
  };

  return (
    <button
      onClick={onClick}
      className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border border-gray-100 group relative overflow-hidden text-left"
    >
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-yellow-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Content */}
      <div className="relative z-10">
        <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${gradientClasses[color]} text-white shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 mb-4`}>
          <Icon className="w-6 h-6" />
        </div>
        <h4 className="text-xl font-heading font-semibold text-primary group-hover:text-accent transition-colors mb-2">{title}</h4>
        <p className="text-sm text-muted">{description}</p>
      </div>
    </button>
  );
}

export default QuickActionButton;
