import React from "react";

function StatCard({ title, value, icon: Icon, color }) {
  const gradientClasses = {
    blue: "bg-gradient-to-br from-blue-500 to-blue-600",
    green: "bg-gradient-to-br from-green-500 to-emerald-600",
    orange: "bg-gradient-to-br from-orange-500 to-red-600",
    purple: "bg-gradient-to-br from-purple-500 to-indigo-600",
  };

  return (
    <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 group relative overflow-hidden">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-yellow-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Content */}
      <div className="relative z-10">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted mb-2">{title}</p>
            <p className="text-3xl md:text-4xl font-heading font-bold text-primary">
              {value}
            </p>
          </div>
          <div
            className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${gradientClasses[color]} text-white shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}
          >
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default StatCard;
