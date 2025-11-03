import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Package, Calendar, User, Ruler } from "lucide-react";
import { orderService } from "../services/database";

function OrderDetails() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("id");

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newStatus, setNewStatus] = useState("");
  const [statusNotes, setStatusNotes] = useState("");

  useEffect(() => {
    if (orderId) load();
  }, [orderId]);

  const load = async () => {
    setLoading(true);
    const data = await orderService.getById(orderId);
    setOrder(data);
    setNewStatus(data?.status || "");
    setLoading(false);
  };

  const formatDate = (value) => {
    if (!value) return "-";
    const d = new Date(value);
    if (isNaN(d)) return value;
    return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
  };

  const getStatusColor = (status) => {
    const colors = {
      placed: "bg-blue-100 text-blue-700",
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

  const handleUpdateStatus = async () => {
    if (!order) return;
    await orderService.updateStatus(order.id, newStatus, statusNotes);
    setStatusNotes("");
    await load();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading order...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Order not found</p>
        <button
          onClick={() => navigate("/orders")}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Back to Orders
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-6 w-6 text-gray-600" />
        </button>
        <div className="flex-1">
          <h2 className="text-3xl font-bold text-gray-900">{order.id}</h2>
          <p className="text-sm text-gray-500">Order Details</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusColor(order.status)}`}>
          {order.status}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Client</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="flex items-center gap-2 text-gray-700"><User className="h-4 w-4" /> {order.clientName}</div>
              <div className="text-gray-700">{order.clientPhone}</div>
              <div className="text-gray-500">{order.clientId}</div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Garment</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="text-gray-500">Type</div>
                <div className="font-medium capitalize">{order.garmentType}</div>
              </div>
              <div>
                <div className="text-gray-500">Quantity</div>
                <div className="font-medium">{order.quantity}</div>
              </div>
              <div>
                <div className="text-gray-500">Order Date</div>
                <div className="font-medium flex items-center gap-2"><Calendar className="h-4 w-4 text-gray-400" />{formatDate(order.orderDate)}</div>
              </div>
              <div>
                <div className="text-gray-500">Delivery Date</div>
                <div className="font-medium">{formatDate(order.deliveryDate)}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Fabric & Design</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div>
                <div className="text-gray-500">Fabric Type</div>
                <div className="font-medium">{order.fabricDetails?.type || "-"}</div>
              </div>
              <div>
                <div className="text-gray-500">Provided By</div>
                <div className="font-medium capitalize">{order.fabricDetails?.providedBy || "-"}</div>
              </div>
              <div>
                <div className="text-gray-500">Fabric Measurements</div>
                <div className="font-medium">{order.fabricDetails?.measurements || "-"}</div>
              </div>
              <div className="md:col-span-3">
                <div className="text-gray-500">Design Description</div>
                <div className="font-medium whitespace-pre-wrap">{order.designDetails?.description || "-"}</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Measurements Used</h3>
            {order.measurementId ? (
              <div className="text-sm text-gray-700 flex items-center gap-2">
                <Ruler className="h-4 w-4" /> v{order.measurementSnapshot?.version || "-"} • snapshot saved
              </div>
            ) : (
              <div className="text-sm text-gray-500">No measurement linked</div>
            )}
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Status History</h3>
            <div className="space-y-3">
              {order.statusHistory?.map((s, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(s.status)}`}>{s.status}</span>
                    <span className="text-sm text-gray-600">{formatDate(s.timestamp)}</span>
                  </div>
                  {s.notes && <span className="text-sm text-gray-500">{s.notes}</span>}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: status update & amounts */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Update Status</h3>
            <div className="space-y-3">
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2 capitalize"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
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
                    {s.replace("_", " ")}
                  </option>
                ))}
              </select>
              <textarea
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                placeholder="Optional notes"
                rows={3}
                value={statusNotes}
                onChange={(e) => setStatusNotes(e.target.value)}
              />
              <button
                onClick={handleUpdateStatus}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save Status
              </button>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Amounts</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Total</span>
                <span className="font-semibold">₹{order.pricing?.total?.toLocaleString("en-IN") || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Paid</span>
                <span className="font-semibold">₹{order.totalPaid?.toLocaleString("en-IN") || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Balance</span>
                <span className="font-semibold">₹{order.balanceDue?.toLocaleString("en-IN") || 0}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default OrderDetails;


