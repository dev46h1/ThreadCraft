import React, { useState, useEffect } from "react";
import { Package, Users, Home, DollarSign } from "lucide-react";
import { useNavigate } from "react-router-dom";
import StatCard from "../components/dashboard/StatCard";
import QuickActionButton from "../components/dashboard/QuickActionButton";
import { clientService, orderService } from "../services/database";

function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    ordersToday: 0,
    totalClients: 0,
    pendingOrders: 0,
    revenueThisMonth: 0,
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [upcomingDeliveries, setUpcomingDeliveries] = useState([]);
  const [overdueOrders, setOverdueOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Get all clients
      const clients = await clientService.getAll();

      // Get all orders
      const orders = await orderService.getAll();

      // Calculate today's orders
      const today = new Date().toISOString().split("T")[0];
      const ordersToday = orders.filter(
        (order) => order.orderDate.split("T")[0] === today
      ).length;

      // Calculate pending orders (not delivered or cancelled)
      const pendingOrders = orders.filter(
        (order) => order.status !== "delivered" && order.status !== "cancelled"
      ).length;

      // Calculate this month's revenue
      const now = new Date();
      const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const revenueThisMonth = orders
        .filter((order) => {
          const orderDate = new Date(order.orderDate);
          return orderDate >= firstDayOfMonth && orderDate <= now;
        })
        .reduce((sum, order) => sum + (order.pricing?.total || 0), 0);

      // Get recent 5 orders (already sorted desc by orderDate in service)
      const recent = orders.slice(0, 5);

      // Upcoming deliveries next 7 days (excluding delivered/cancelled)
      const todayDate = new Date();
      const weekAhead = new Date();
      weekAhead.setDate(todayDate.getDate() + 7);
      const upcoming = orders
        .filter((o) => {
          if (!o.deliveryDate) return false;
          if (o.status === "delivered" || o.status === "cancelled") return false;
          const d = new Date(o.deliveryDate);
          return d >= todayDate && d <= weekAhead;
        })
        .sort((a, b) => new Date(a.deliveryDate) - new Date(b.deliveryDate))
        .slice(0, 7);

      // Overdue orders (excluding delivered/cancelled)
      const overdue = orders
        .filter((o) => {
          if (!o.deliveryDate) return false;
          if (o.status === "delivered" || o.status === "cancelled") return false;
          return new Date(o.deliveryDate) < new Date();
        })
        .sort((a, b) => new Date(a.deliveryDate) - new Date(b.deliveryDate))
        .slice(0, 7);

      setStats({
        ordersToday,
        totalClients: clients.length,
        pendingOrders,
        revenueThisMonth,
      });

      setRecentOrders(recent);
      setUpcomingDeliveries(upcoming);
      setOverdueOrders(overdue);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      placed: "bg-blue-100 text-blue-700",
      measuring: "bg-purple-100 text-purple-700",
      cutting: "bg-yellow-100 text-yellow-700",
      stitching: "bg-orange-100 text-orange-700",
      fitting: "bg-indigo-100 text-indigo-700",
      finishing: "bg-pink-100 text-pink-700",
      completed: "bg-green-100 text-green-700",
      delivered: "bg-gray-100 text-gray-700",
      cancelled: "bg-red-100 text-red-700",
    };
    return colors[status] || "bg-gray-100 text-gray-700";
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
        <p className="mt-2 text-gray-600">
          Welcome to ThreadCraft - Your Tailoring Business Manager
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Orders Today"
          value={stats.ordersToday}
          icon={Package}
          color="blue"
        />
        <StatCard
          title="Total Clients"
          value={stats.totalClients}
          icon={Users}
          color="green"
        />
        <StatCard
          title="Pending Orders"
          value={stats.pendingOrders}
          icon={Package}
          color="orange"
        />
        <StatCard
          title="Revenue This Month"
          value={`₹${stats.revenueThisMonth.toLocaleString("en-IN")}`}
          icon={DollarSign}
          color="purple"
        />
      </div>

      {/* Quick Actions */}
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

      {/* Recent Orders */}
      {recentOrders.length > 0 && (
        <div className="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Recent Orders
            </h3>
            <button
              onClick={() => navigate("/orders")}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View All →
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Order ID
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Client
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Garment
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Delivery Date
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Status
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                    onClick={() => navigate(`/orders?id=${order.id}`)}
                  >
                    <td className="py-3 px-4 text-sm text-gray-900">
                      {order.id}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900">
                      {order.clientName}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 capitalize">
                      {order.garmentType}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {formatDate(order.deliveryDate)}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(
                          order.status
                        )}`}
                      >
                        {order.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900 text-right font-medium">
                      ₹{order.pricing?.total?.toLocaleString("en-IN") || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Upcoming Deliveries & Overdue */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Upcoming Deliveries (7 days)</h3>
            <button
              onClick={() => navigate("/orders")}
              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            >
              View Orders →
            </button>
          </div>
          {upcomingDeliveries.length === 0 ? (
            <p className="text-sm text-gray-500">No deliveries due in the next week.</p>
          ) : (
            <div className="space-y-2">
              {upcomingDeliveries.map((o) => (
                <div
                  key={o.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer"
                  onClick={() => navigate(`/orders?id=${o.id}`)}
                >
                  <div>
                    <p className="font-medium text-gray-900">{o.clientName}</p>
                    <p className="text-xs text-gray-600">{o.garmentType} • {o.id}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-900">{formatDate(o.deliveryDate)}</p>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(o.status)}`}>{o.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Overdue Orders</h3>
            <span className="text-sm font-semibold text-red-600">{overdueOrders.length}</span>
          </div>
          {overdueOrders.length === 0 ? (
            <p className="text-sm text-gray-500">No overdue orders. Great!</p>
          ) : (
            <div className="space-y-2">
              {overdueOrders.map((o) => (
                <div
                  key={o.id}
                  className="flex items-center justify-between p-3 bg-red-50 rounded-lg hover:bg-red-100 cursor-pointer"
                  onClick={() => navigate(`/orders?id=${o.id}`)}
                >
                  <div>
                    <p className="font-medium text-gray-900">{o.clientName}</p>
                    <p className="text-xs text-gray-600">{o.garmentType} • {o.id}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-red-700">Due {formatDate(o.deliveryDate)}</p>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(o.status)}`}>{o.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
