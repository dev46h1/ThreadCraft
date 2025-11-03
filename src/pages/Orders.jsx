import React, { useEffect, useMemo, useState } from "react";
import { Package, Filter } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { orderService } from "../services/database";

function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: "", client: "", start: "", end: "" });

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    const list = await orderService.getAll();
    setOrders(list);
    setLoading(false);
  };

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (filters.status && o.status !== filters.status) return false;
      if (filters.client && !o.clientName.toLowerCase().includes(filters.client.toLowerCase())) return false;
      if (filters.start && new Date(o.orderDate) < new Date(filters.start)) return false;
      if (filters.end && new Date(o.orderDate) > new Date(filters.end)) return false;
      return true;
    });
  }, [orders, filters]);

  const getDueColor = (deliveryDate, status) => {
    if (!deliveryDate) return "";
    const today = new Date();
    const d = new Date(deliveryDate);
    const diffDays = Math.floor((d - today) / (1000 * 60 * 60 * 24));
    if (status === "delivered" || status === "cancelled") return "";
    if (diffDays < 0) return "bg-red-50";
    if (diffDays === 0) return "bg-orange-50";
    if (diffDays <= 7) return "bg-yellow-50";
    return "";
  };

  const formatDate = (value) => {
    if (!value) return "-";
    const d = new Date(value);
    if (isNaN(d)) return value;
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Orders</h2>
          <p className="mt-2 text-gray-600">Track and manage all orders</p>
        </div>
        <button
          onClick={() => navigate("/orders/new")}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          + New Order
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <input
            placeholder="Search client"
            className="border border-gray-300 rounded-lg px-3 py-2"
            value={filters.client}
            onChange={(e) => setFilters((p) => ({ ...p, client: e.target.value }))}
          />
          <select
            className="border border-gray-300 rounded-lg px-3 py-2"
            value={filters.status}
            onChange={(e) => setFilters((p) => ({ ...p, status: e.target.value }))}
          >
            <option value="">All Status</option>
            {["placed","fabric_received","cutting","stitching","trial","alterations","completed","ready","delivered","cancelled"].map((s) => (
              <option key={s} value={s}>{s.replace("_", " ")}</option>
            ))}
          </select>
          <input
            type="date"
            className="border border-gray-300 rounded-lg px-3 py-2"
            value={filters.start}
            onChange={(e) => setFilters((p) => ({ ...p, start: e.target.value }))}
          />
          <input
            type="date"
            className="border border-gray-300 rounded-lg px-3 py-2"
            value={filters.end}
            onChange={(e) => setFilters((p) => ({ ...p, end: e.target.value }))}
          />
          <button
            onClick={load}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
          >
            <Filter className="h-4 w-4" /> Refresh
          </button>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading orders...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders found</h3>
          <p className="text-gray-600 mb-4">Adjust filters or create a new order</p>
          <button
            onClick={() => navigate("/orders/new")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Create Order
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Order ID</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Client</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Garment</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Order Date</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Delivery Date</th>
                <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Status</th>
                <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">Amount</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((o) => (
                <tr
                  key={o.id}
                  className={`border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${getDueColor(o.deliveryDate, o.status)}`}
                  onClick={() => navigate(`/orders/details?id=${o.id}`)}
                >
                  <td className="py-3 px-4 text-sm text-gray-900">{o.id}</td>
                  <td className="py-3 px-4 text-sm text-gray-700">{o.clientName}</td>
                  <td className="py-3 px-4 text-sm text-gray-600 capitalize">{o.garmentType}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{formatDate(o.orderDate)}</td>
                  <td className="py-3 px-4 text-sm text-gray-600">{formatDate(o.deliveryDate)}</td>
                  <td className="py-3 px-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize bg-gray-100 text-gray-700">
                      {o.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-gray-900 text-right font-medium">
                    ₹{o.pricing?.total?.toLocaleString("en-IN") || 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Orders;
