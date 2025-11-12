import React, { useState, useEffect } from "react";
import {
  Package,
  Users,
  Home,
  DollarSign,
  Plus,
  Clock,
  AlertCircle,
  ShoppingBag,
  TrendingUp,
  Eye,
  EyeOff,
} from "lucide-react";
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
  const [isRevenueHidden, setIsRevenueHidden] = useState(true);

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
          if (o.status === "delivered" || o.status === "cancelled")
            return false;
          const d = new Date(o.deliveryDate);
          return d >= todayDate && d <= weekAhead;
        })
        .sort((a, b) => new Date(a.deliveryDate) - new Date(b.deliveryDate))
        .slice(0, 7);

      // Overdue orders (excluding delivered/cancelled)
      const overdue = orders
        .filter((o) => {
          if (!o.deliveryDate) return false;
          if (o.status === "delivered" || o.status === "cancelled")
            return false;
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
      fabric_received: "bg-teal-100 text-teal-700",
      cutting: "bg-yellow-100 text-yellow-700",
      stitching: "bg-orange-100 text-orange-700",
      trial: "bg-indigo-100 text-indigo-700",
      alterations: "bg-pink-100 text-pink-700",
      completed: "bg-green-100 text-green-700",
      ready: "bg-emerald-100 text-emerald-700",
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

  const formatStatus = (status) =>
    (status || "")
      .split("_")
      .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ""))
      .join(" ");

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
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-4xl md:text-5xl font-heading font-bold text-primary">
              Dashboard
            </h2>
            <p className="mt-2 text-lg text-muted">
              Welcome to ThreadCraft - Your Tailoring Business Manager
            </p>
          </div>
          <button
            onClick={() => navigate("/orders/new")}
            className="px-6 py-3 bg-gradient-to-r from-accent to-yellow-600 text-primary rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 font-semibold flex items-center gap-2 hover:scale-105"
          >
            <Plus className="h-5 w-5" />
            Create Order
          </button>
        </div>
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
        {/* Revenue Card with Hide/Show functionality */}
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 group relative overflow-hidden">
          {/* Background gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-yellow-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

          {/* Content */}
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium text-muted">
                    Revenue/Month
                  </p>
                  <button
                    onClick={() => setIsRevenueHidden(!isRevenueHidden)}
                    className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
                    title={isRevenueHidden ? "Show revenue" : "Hide revenue"}
                  >
                    {isRevenueHidden ? (
                      <EyeOff className="w-4 h-4 text-gray-500" />
                    ) : (
                      <Eye className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                </div>
                <p className="text-3xl md:text-4xl font-heading font-bold text-primary">
                  {isRevenueHidden
                    ? "₹" + "*".repeat(6)
                    : `₹${stats.revenueThisMonth.toLocaleString("en-IN")}`}
                </p>
              </div>
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 bg-white p-8 rounded-2xl shadow-lg border border-teal-100 group relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-cyan-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-lg">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-2xl font-heading font-bold text-primary">
              Quick Actions
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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

      {/* Recent Orders */}
      {recentOrders.length > 0 && (
        <div className="mt-8 bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-blue-100 group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg">
                  <ShoppingBag className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-heading font-bold text-primary">
                  Recent Orders
                </h3>
              </div>
              <button
                onClick={() => navigate("/orders")}
                className="text-sm text-accent hover:text-accent/80 font-medium transition-colors"
              >
                View All →
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-blue-200 bg-blue-50">
                    <th className="text-left py-3 px-4 text-sm font-semibold text-primary">
                      Order ID
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-primary">
                      Client
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-primary">
                      Garment
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-primary">
                      Delivery Date
                    </th>
                    <th className="text-left py-3 px-4 text-sm font-semibold text-primary">
                      Status
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-semibold text-primary">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-blue-100 hover:bg-blue-50 cursor-pointer transition-all duration-200"
                      onClick={() => navigate(`/orders/details?id=${order.id}`)}
                    >
                      <td className="py-3 px-4 text-sm text-primary">
                        {order.id}
                      </td>
                      <td className="py-3 px-4 text-sm text-primary">
                        {order.clientName}
                      </td>
                      <td className="py-3 px-4 text-sm text-muted capitalize">
                        {order.garmentType}
                      </td>
                      <td className="py-3 px-4 text-sm text-muted">
                        {formatDate(order.deliveryDate)}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(
                            order.status
                          )}`}
                        >
                          {formatStatus(order.status)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-primary text-right font-medium">
                        ₹{order.pricing?.total?.toLocaleString("en-IN") || 0}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Upcoming Deliveries & Overdue */}
      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-orange-100 group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-red-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-lg">
                  <Clock className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-heading font-bold text-primary">
                  Upcoming Deliveries (7 days)
                </h3>
              </div>
              <button
                onClick={() => navigate("/orders")}
                className="text-sm text-accent hover:text-accent/80 font-medium transition-colors"
              >
                View Orders →
              </button>
            </div>
            {upcomingDeliveries.length === 0 ? (
              <p className="text-sm text-muted">
                No deliveries due in the next week.
              </p>
            ) : (
              <div className="space-y-3">
                {upcomingDeliveries.map((o) => (
                  <div
                    key={o.id}
                    className="flex items-center justify-between p-4 bg-gradient-to-br from-orange-50 to-red-50 rounded-xl hover:from-orange-100 hover:to-red-100 cursor-pointer transition-all duration-200 border-2 border-orange-200 hover:border-orange-300"
                    onClick={() => navigate(`/orders/details?id=${o.id}`)}
                  >
                    <div>
                      <p className="font-medium text-primary">{o.clientName}</p>
                      <p className="text-xs text-muted">
                        {o.garmentType} • {o.id}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-primary">
                        {formatDate(o.deliveryDate)}
                      </p>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(
                          o.status
                        )}`}
                      >
                        {formatStatus(o.status)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 border border-red-100 group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-pink-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-pink-600 text-white shadow-lg">
                  <AlertCircle className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-heading font-bold text-primary">
                  Overdue Orders
                </h3>
              </div>
              <span className="text-sm font-semibold text-red-600">
                {overdueOrders.length}
              </span>
            </div>
            {overdueOrders.length === 0 ? (
              <p className="text-sm text-muted">No overdue orders. Great!</p>
            ) : (
              <div className="space-y-3">
                {overdueOrders.map((o) => (
                  <div
                    key={o.id}
                    className="flex items-center justify-between p-4 bg-gradient-to-br from-red-50 to-pink-50 rounded-xl hover:from-red-100 hover:to-pink-100 cursor-pointer transition-all duration-200 border-2 border-red-200 hover:border-red-300"
                    onClick={() => navigate(`/orders/details?id=${o.id}`)}
                  >
                    <div>
                      <p className="font-medium text-primary">{o.clientName}</p>
                      <p className="text-xs text-muted">
                        {o.garmentType} • {o.id}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-red-700">
                        Due {formatDate(o.deliveryDate)}
                      </p>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(
                          o.status
                        )}`}
                      >
                        {formatStatus(o.status)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
