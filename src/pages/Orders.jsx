import React, { useEffect, useMemo, useState } from "react";
import { Package, Filter, ShoppingBag, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { orderService } from "../services/database";

function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: "",
    client: "",
    start: "",
    end: "",
  });
  const [editingStatusOrderId, setEditingStatusOrderId] = useState(null);

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
      if (
        filters.client &&
        !o.clientName.toLowerCase().includes(filters.client.toLowerCase())
      )
        return false;
      if (filters.start && new Date(o.orderDate) < new Date(filters.start))
        return false;
      if (filters.end && new Date(o.orderDate) > new Date(filters.end))
        return false;
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
    return d.toLocaleDateString("en-IN", {
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

  return (
    <div>
      {/* Colorful Page Header */}
      <div className="relative overflow-hidden rounded-2xl mb-6 border-2 border-green-100 bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 shadow-lg group">
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="relative z-10 flex items-center justify-between p-5">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-3xl md:text-4xl font-heading font-bold text-primary">
                Orders
              </h2>
              <p className="mt-1 text-base text-muted">
                Track and manage all orders
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate("/orders/new")}
            className="px-6 py-3 bg-gradient-to-r from-accent to-yellow-600 text-primary rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 font-semibold hover:scale-105"
          >
            + New Order
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-8 rounded-2xl shadow-lg border-2 border-green-100 mb-6 group relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <input
              placeholder="Search client"
              className="border-2 border-green-200 rounded-lg px-3 py-2 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-200"
              value={filters.client}
              onChange={(e) =>
                setFilters((p) => ({ ...p, client: e.target.value }))
              }
            />
            <select
              className="border-2 border-green-200 rounded-lg px-3 py-2 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-200"
              value={filters.status}
              onChange={(e) =>
                setFilters((p) => ({ ...p, status: e.target.value }))
              }
            >
              <option value="">All Status</option>
              {[
                "placed",
                "fabric_received",
                "cutting",
                "stitching",
                "trial",
                "alterations",
                "completed",
                "ready",
                "delivered",
                "cancelled",
              ].map((s) => (
                <option key={s} value={s}>
                  {s.replace("_", " ")}
                </option>
              ))}
            </select>
            <input
              type="date"
              className="border-2 border-green-200 rounded-lg px-3 py-2 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-200"
              value={filters.start}
              onChange={(e) =>
                setFilters((p) => ({ ...p, start: e.target.value }))
              }
            />
            <input
              type="date"
              className="border-2 border-green-200 rounded-lg px-3 py-2 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-200"
              value={filters.end}
              onChange={(e) =>
                setFilters((p) => ({ ...p, end: e.target.value }))
              }
            />
            <button
              onClick={load}
              className="px-4 py-2 border-2 border-green-200 rounded-lg hover:bg-green-50 flex items-center justify-center gap-2 transition-all duration-200"
            >
              <Filter className="h-4 w-4" /> Refresh
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-muted">Loading orders...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg mb-6">
            <Package className="h-8 w-8" />
          </div>
          <h3 className="text-2xl font-heading font-bold text-primary mb-2">
            No orders found
          </h3>
          <p className="text-muted mb-6">
            Adjust filters or create a new order
          </p>
          <button
            onClick={() => navigate("/orders/new")}
            className="px-6 py-3 bg-gradient-to-r from-accent to-yellow-600 text-primary rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 font-semibold hover:scale-105"
          >
            Create Order
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white p-8 rounded-2xl shadow-lg border-2 border-green-100 group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative z-10">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-green-200 bg-green-50">
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
                    Order Date
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
                {filtered.map((o) => (
                  <tr
                    key={o.id}
                    className={`border-b border-green-100 hover:bg-green-50 cursor-pointer transition-all duration-200 ${getDueColor(
                      o.deliveryDate,
                      o.status
                    )}`}
                    onClick={() => navigate(`/orders/details?id=${o.id}`)}
                  >
                    <td className="py-3 px-4 text-sm text-primary">{o.id}</td>
                    <td className="py-3 px-4 text-sm text-primary">
                      {o.clientName}
                    </td>
                    <td className="py-3 px-4 text-sm text-muted capitalize">
                      {o.items?.length > 1 ? "Multiple" : o.garmentType}
                    </td>
                    <td className="py-3 px-4 text-sm text-muted">
                      {formatDate(o.orderDate)}
                    </td>
                    <td className="py-3 px-4 text-sm text-muted">
                      {formatDate(o.deliveryDate)}
                    </td>
                    <td className="py-3 px-4">
                      {editingStatusOrderId === o.id ? (
                        <select
                          className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize border-2 focus:outline-none focus:ring-2 ${getStatusColor(
                            o.status
                          )}`}
                          value={o.status}
                          onChange={async (e) => {
                            const newStatus = e.target.value;
                            if (newStatus !== o.status) {
                              // If changing to delivered and there's a balance, navigate to order details
                              if (
                                newStatus === "delivered" &&
                                (o.balanceDue || 0) > 0
                              ) {
                                setEditingStatusOrderId(null);
                                navigate(
                                  `/orders/details?id=${o.id}&pendingDelivery=true`
                                );
                                return;
                              }
                              await orderService.updateStatus(
                                o.id,
                                newStatus,
                                ""
                              );
                              await load();
                            }
                            setEditingStatusOrderId(null);
                          }}
                          onBlur={() => setEditingStatusOrderId(null)}
                          autoFocus
                          onClick={(e) => e.stopPropagation()}
                        >
                          {[
                            "placed",
                            "fabric_received",
                            "cutting",
                            "stitching",
                            "trial",
                            "alterations",
                            "completed",
                            "ready",
                            "delivered",
                            "cancelled",
                          ].map((s) => (
                            <option key={s} value={s}>
                              {formatStatus(s)}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize cursor-pointer hover:opacity-80 transition-opacity ${getStatusColor(
                            o.status
                          )}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingStatusOrderId(o.id);
                          }}
                          title="Click to update status"
                        >
                          {formatStatus(o.status)}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-sm text-primary text-right font-medium">
                      ₹{o.pricing?.total?.toLocaleString("en-IN") || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default Orders;
