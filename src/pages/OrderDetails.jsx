import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Package, Calendar, User, Ruler, ReceiptIndianRupee } from "lucide-react";
import { orderService } from "../services/database";

function OrderDetails() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("id");

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newStatus, setNewStatus] = useState("");
  const [statusNotes, setStatusNotes] = useState("");
  const [payment, setPayment] = useState({ amount: "", date: "", method: "cash", type: "advance", receiptNumber: "", notes: "" });
  const [showInvoice, setShowInvoice] = useState(false);

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

  const handleAddPayment = async () => {
    if (!order) return;
    const amountNum = Number(payment.amount) || 0;
    if (amountNum <= 0) {
      alert("Enter a valid amount");
      return;
    }
    await orderService.addPayment(order.id, {
      amount: amountNum,
      date: payment.date ? new Date(payment.date).toISOString() : new Date().toISOString(),
      method: payment.method,
      type: payment.type,
      receiptNumber: payment.receiptNumber,
      notes: payment.notes,
    });
    setPayment({ amount: "", date: "", method: "cash", type: "advance", receiptNumber: "", notes: "" });
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
            <button
              onClick={() => setShowInvoice(true)}
              className="mt-4 w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center justify-center gap-2"
            >
              <ReceiptIndianRupee className="h-4 w-4" /> View Invoice
            </button>
          </div>

          {/* Payments */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Record Payment</h3>
            <div className="grid grid-cols-1 gap-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="number"
                  min="0"
                  placeholder="Amount (₹)"
                  className="border border-gray-300 rounded-lg px-3 py-2"
                  value={payment.amount}
                  onChange={(e) => setPayment((p) => ({ ...p, amount: e.target.value }))}
                />
                <input
                  type="date"
                  className="border border-gray-300 rounded-lg px-3 py-2"
                  value={payment.date}
                  onChange={(e) => setPayment((p) => ({ ...p, date: e.target.value }))}
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <select
                  className="border border-gray-300 rounded-lg px-3 py-2"
                  value={payment.method}
                  onChange={(e) => setPayment((p) => ({ ...p, method: e.target.value }))}
                >
                  {['cash','upi','card'].map((m) => (
                    <option key={m} value={m}>{m.toUpperCase()}</option>
                  ))}
                </select>
                <select
                  className="border border-gray-300 rounded-lg px-3 py-2"
                  value={payment.type}
                  onChange={(e) => setPayment((p) => ({ ...p, type: e.target.value }))}
                >
                  {['advance','final'].map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <input
                type="text"
                placeholder="Receipt number (optional)"
                className="border border-gray-300 rounded-lg px-3 py-2"
                value={payment.receiptNumber}
                onChange={(e) => setPayment((p) => ({ ...p, receiptNumber: e.target.value }))}
              />
              <textarea
                rows={2}
                placeholder="Notes (optional)"
                className="border border-gray-300 rounded-lg px-3 py-2"
                value={payment.notes}
                onChange={(e) => setPayment((p) => ({ ...p, notes: e.target.value }))}
              />
              <button
                onClick={handleAddPayment}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add Payment
              </button>
            </div>
            {order.payments?.length > 0 && (
              <div className="mt-6">
                <h4 className="text-sm font-semibold text-gray-900 mb-2">Payment History</h4>
                <div className="space-y-2 text-sm">
                  {order.payments.map((p, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div className="text-gray-700">₹{p.amount.toLocaleString('en-IN')}</div>
                      <div className="text-gray-500">{new Date(p.date).toLocaleDateString('en-IN')}</div>
                      <div className="text-gray-500 capitalize">{p.method}</div>
                      <div className="text-gray-500 capitalize">{p.type}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Simple Invoice Preview Modal */}
      {showInvoice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowInvoice(false)}>
          <div className="bg-white w-full max-w-2xl rounded-lg shadow-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Invoice Preview</h3>
              <button className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50" onClick={() => window.print()}>Print</button>
            </div>
            <div className="p-6 print:p-0">
              <div className="print:p-6">
                <div className="text-center mb-4">
                  <h2 className="text-xl font-bold">ThreadCraft</h2>
                  <p className="text-sm text-gray-600">Invoice</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                  <div>
                    <p className="text-gray-500">Bill To</p>
                    <p className="font-medium">{order.clientName}</p>
                    <p className="text-gray-600">{order.clientPhone}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-500">Order ID</p>
                    <p className="font-medium">{order.id}</p>
                    <p className="text-gray-600">Delivery: {new Date(order.deliveryDate).toLocaleDateString('en-IN')}</p>
                  </div>
                </div>
                <table className="w-full text-sm border-t border-b border-gray-200">
                  <thead>
                    <tr className="text-left">
                      <th className="py-2">Description</th>
                      <th className="py-2 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="py-1">Base stitching ({order.garmentType})</td>
                      <td className="py-1 text-right">{(order.pricing?.baseCharge || 0).toLocaleString('en-IN')}</td>
                    </tr>
                    {order.pricing?.customizations?.map((c, i) => (
                      <tr key={i}>
                        <td className="py-1">{c.description || 'Customization'}</td>
                        <td className="py-1 text-right">{(c.amount || 0).toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                    {order.pricing?.materialCharges ? (
                      <tr>
                        <td className="py-1">Material charges</td>
                        <td className="py-1 text-right">{(order.pricing.materialCharges || 0).toLocaleString('en-IN')}</td>
                      </tr>
                    ) : null}
                    {order.pricing?.urgentCharges ? (
                      <tr>
                        <td className="py-1">Urgent charges</td>
                        <td className="py-1 text-right">{(order.pricing.urgentCharges || 0).toLocaleString('en-IN')}</td>
                      </tr>
                    ) : null}
                    <tr className="border-t border-gray-200">
                      <td className="py-1 font-medium">Subtotal</td>
                      <td className="py-1 text-right font-medium">{(order.pricing?.subtotal || 0).toLocaleString('en-IN')}</td>
                    </tr>
                    {order.pricing?.discount?.amount ? (
                      <tr>
                        <td className="py-1">Discount {order.pricing.discount?.reason ? `(${order.pricing.discount.reason})` : ''}</td>
                        <td className="py-1 text-right">- {(order.pricing.discount.amount || 0).toLocaleString('en-IN')}</td>
                      </tr>
                    ) : null}
                    <tr className="border-t border-gray-200">
                      <td className="py-1 font-semibold">Total</td>
                      <td className="py-1 text-right font-semibold">{(order.pricing?.total || 0).toLocaleString('en-IN')}</td>
                    </tr>
                    <tr>
                      <td className="py-1">Paid</td>
                      <td className="py-1 text-right">{(order.totalPaid || 0).toLocaleString('en-IN')}</td>
                    </tr>
                    <tr>
                      <td className="py-1">Balance Due</td>
                      <td className="py-1 text-right">{(order.balanceDue || 0).toLocaleString('en-IN')}</td>
                    </tr>
                  </tbody>
                </table>
                <p className="text-xs text-gray-500 mt-4">Thank you for your business!</p>
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 text-right">
              <button className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50" onClick={() => setShowInvoice(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrderDetails;


