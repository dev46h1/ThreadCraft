import React from "react";
import { Package, Users, Home } from "lucide-react";
import { useNavigate } from "react-router-dom";
import StatCard from "../components/dashboard/StatCard";
import QuickActionButton from "../components/dashboard/QuickActionButton";

function Dashboard() {
  const navigate = useNavigate();

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
        <p className="mt-2 text-gray-600">
          Welcome to ThreadCraft - Your Tailoring Business Manager
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Orders Today" value="0" icon={Package} color="blue" />
        <StatCard title="Total Clients" value="0" icon={Users} color="green" />
        <StatCard
          title="Pending Orders"
          value="0"
          icon={Package}
          color="orange"
        />
        <StatCard
          title="Revenue This Month"
          value="₹0"
          icon={Home}
          color="purple"
        />
      </div>

      <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <QuickActionButton
            icon={Users}
            title="Add New Client"
            description="Register a new client"
            color="blue"
            onClick={() => navigate("/clients")}
          />
          <QuickActionButton
            icon={Package}
            title="Create Order"
            description="Start a new order"
            color="green"
            onClick={() => navigate("/orders")}
          />
          <QuickActionButton
            icon={Users}
            title="Search Client"
            description="Find existing client"
            color="purple"
            onClick={() => navigate("/clients")}
          />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
