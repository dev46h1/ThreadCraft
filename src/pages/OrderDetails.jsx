import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Package,
  Calendar,
  User,
  Ruler,
  ReceiptIndianRupee,
  Pencil,
  DollarSign,
  Plus,
  X,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { orderService } from "../services/database";

// Measurement field definitions (same as in OrderForm)
const MEASUREMENT_FIELDS = {
  shirt: [
    { name: "length", label: "Length", required: true },
    { name: "shoulder", label: "Shoulder Width", required: true },
    { name: "sleeveLength", label: "Sleeve Length", required: true },
    { name: "chest", label: "Chest/Bust", required: true },
    { name: "waist", label: "Waist", required: true },
    { name: "hip", label: "Hip", required: false },
    { name: "armhole", label: "Armhole", required: false },
    { name: "neck", label: "Neck", required: false },
    { name: "frontNeckDepth", label: "Front Neck Depth", required: false },
    { name: "backNeckDepth", label: "Back Neck Depth", required: false },
  ],
  blouse: [
    { name: "length", label: "Length", required: true },
    { name: "shoulder", label: "Shoulder", required: true },
    { name: "sleeveLength", label: "Sleeve Length", required: true },
    { name: "bust", label: "Bust", required: true },
    { name: "waist", label: "Waist", required: true },
    { name: "underbust", label: "Underbust", required: false },
    { name: "armhole", label: "Armhole", required: false },
    { name: "neckFront", label: "Neck (Front)", required: false },
    { name: "neckBack", label: "Neck (Back)", required: false },
    { name: "backOpeningDepth", label: "Back Opening Depth", required: false },
  ],
  churidar: [
    { name: "topLength", label: "Top Length", required: true },
    { name: "shoulder", label: "Shoulder", required: true },
    { name: "sleeveLength", label: "Sleeve Length", required: true },
    { name: "chest", label: "Chest", required: true },
    { name: "waist", label: "Waist", required: true },
    { name: "hip", label: "Hip", required: true },
    { name: "bottomLength", label: "Bottom Length", required: true },
    { name: "bottomWaist", label: "Bottom Waist", required: true },
    { name: "thigh", label: "Thigh", required: true },
    { name: "bottomOpening", label: "Bottom Opening", required: true },
    { name: "knee", label: "Knee", required: false },
    { name: "dupattaLength", label: "Dupatta Length", required: false },
    { name: "dupattaWidth", label: "Dupatta Width", required: false },
  ],
};

function OrderDetails() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("id");

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newStatus, setNewStatus] = useState("");
  const [statusNotes, setStatusNotes] = useState("");
  const [currentStatus, setCurrentStatus] = useState("");
  const [payment, setPayment] = useState({
    amount: "",
    date: "",
    method: "cash",
    type: "advance",
    receiptNumber: "",
    notes: "",
  });
  const [paymentError, setPaymentError] = useState("");
  const [pendingDeliveryConfirm, setPendingDeliveryConfirm] = useState(false);
  const [showInvoice, setShowInvoice] = useState(false);
  const [isEditingPricing, setIsEditingPricing] = useState(false);
  const [pricingForm, setPricingForm] = useState({
    items: [], // { garmentType, quantity, unitPrice, lineTotal }
    customizations: [],
    discountType: "amount",
    discountValue: 0,
  });
  const [isStatusHistoryCollapsed, setIsStatusHistoryCollapsed] = useState(true);

  useEffect(() => {
    if (orderId) load();
  }, [orderId]);

  const load = async () => {
    setLoading(true);
    const data = await orderService.getById(orderId);
    setOrder(data);
    setNewStatus(data?.status || "");
    setCurrentStatus(data?.status || "");
    // Initialize pricing form from order data
    if (data?.pricing) {
      // Initialize items with pricing from order
      const itemsWithPricing = (data.items || []).map((item) => ({
        garmentType: item.garmentType || "",
        quantity: item.quantity || 0,
        unitPrice: item.unitPrice || 0,
        lineTotal: item.lineTotal || (item.quantity || 0) * (item.unitPrice || 0),
      }));
      
      setPricingForm({
        items: itemsWithPricing,
        customizations: data.pricing.customizations || [],
        discountType: data.pricing.discount?.reason?.includes("%") ? "percent" : "amount",
        discountValue: data.pricing.discount?.amount || 0,
      });
    }
    setLoading(false);
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

  const handleStatusChange = async (e) => {
    if (!order) return;
    const selectedStatus = e.target.value;
    if (selectedStatus === order.status) {
      setCurrentStatus(selectedStatus);
      return;
    }
    // If delivering with outstanding balance, show inline confirmation banner
    if (selectedStatus === "delivered" && (order.balanceDue || 0) > 0) {
      setNewStatus(selectedStatus);
      setCurrentStatus(selectedStatus);
      setPendingDeliveryConfirm(true);
      return;
    }
    setCurrentStatus(selectedStatus);
    await orderService.updateStatus(order.id, selectedStatus, "");
    await load();
  };

  const handleUpdateStatus = async () => {
    if (!order) return;
    if (!newStatus || newStatus === order.status) {
      return;
    }
    // If delivering with outstanding balance, show inline confirmation banner
    if (newStatus === "delivered" && (order.balanceDue || 0) > 0) {
      setPendingDeliveryConfirm(true);
      return;
    }
    await orderService.updateStatus(order.id, newStatus, statusNotes);
    setStatusNotes("");
    await load();
  };

  const proceedDeliverWithPending = async () => {
    if (!order) return;
    await orderService.updateStatus(order.id, "delivered", statusNotes);
    setPendingDeliveryConfirm(false);
    setStatusNotes("");
    await load();
  };

  const cancelDeliverWithPending = () => {
    setPendingDeliveryConfirm(false);
    setCurrentStatus(order?.status || "");
    setNewStatus("");
  };

  const payBalanceAndDeliver = async () => {
    if (!order) return;
    const balance = order.balanceDue || 0;
    if (balance <= 0) {
      await proceedDeliverWithPending();
      return;
    }
    // Record payment for remaining balance, then mark delivered
    await orderService.addPayment(order.id, {
      amount: balance,
      date: new Date().toISOString(),
      method: "cash",
      type: "final",
      receiptNumber: "",
      notes: "Auto-collected at delivery",
    });
    await orderService.updateStatus(order.id, "delivered", statusNotes);
    setPendingDeliveryConfirm(false);
    setStatusNotes("");
    await load();
  };

  const handleEditPricing = () => {
    setIsEditingPricing(true);
  };

  const handleCancelPricing = () => {
    // Reset form to original order data
    if (order?.pricing) {
      const itemsWithPricing = (order.items || []).map((item) => ({
        garmentType: item.garmentType || "",
        quantity: item.quantity || 0,
        unitPrice: item.unitPrice || 0,
        lineTotal: item.lineTotal || (item.quantity || 0) * (item.unitPrice || 0),
      }));
      
      setPricingForm({
        items: itemsWithPricing,
        customizations: order.pricing.customizations || [],
        discountType: order.pricing.discount?.reason?.includes("%") ? "percent" : "amount",
        discountValue: order.pricing.discount?.amount || 0,
      });
    }
    setIsEditingPricing(false);
  };

  const handleSavePricing = async () => {
    if (!order) return;

    // Calculate totals
    const itemsTotal = (pricingForm.items || []).reduce(
      (sum, it) => sum + (Number(it.lineTotal) || 0),
      0
    );
    const custom = (pricingForm.customizations || []).reduce(
      (sum, c) => sum + (Number(c.amount) || 0),
      0
    );
    const subtotal = itemsTotal + custom;
    const discountAmt =
      pricingForm.discountType === "percent"
        ? Math.min(100, Math.max(0, Number(pricingForm.discountValue) || 0)) * (subtotal / 100)
        : Number(pricingForm.discountValue) || 0;
    const total = Math.max(0, Math.round(subtotal - discountAmt));

      // Update pricing and items
      const updatedPricing = {
        itemsTotal,
        customizations: (pricingForm.customizations || []).map((c) => ({
          description: c.description || "",
          amount: Number(c.amount) || 0,
        })),
        subtotal,
        discount: {
          amount: discountAmt,
          reason: pricingForm.discountType === "percent" ? `${pricingForm.discountValue}%` : "",
        },
        total,
      };

      // Update items with new pricing
      const updatedItems = (order.items || []).map((item, idx) => {
        const pricingItem = pricingForm.items[idx];
        if (pricingItem) {
          return {
            ...item,
            unitPrice: Number(pricingItem.unitPrice) || 0,
            lineTotal: Number(pricingItem.lineTotal) || 0,
          };
        }
        return item;
      });

    // Recalculate balance due based on new total
    const newBalanceDue = total - (order.totalPaid || 0);

    await orderService.update(order.id, {
      items: updatedItems,
      pricing: updatedPricing,
      balanceDue: newBalanceDue,
    });

    setIsEditingPricing(false);
    await load();
  };

  const handleAddPayment = async () => {
    if (!order) return;
    const amountNum = Number(payment.amount) || 0;
    if (amountNum <= 0) {
      setPaymentError("Enter a valid payment amount");
      return;
    }
    const balance = order.balanceDue || 0;
    if (amountNum > balance) {
      const excess = amountNum - balance;
      setPaymentError(
        `Payment exceeds balance by ₹${excess.toLocaleString(
          "en-IN"
        )}. Adjust the amount.`
      );
      return;
    }
    await orderService.addPayment(order.id, {
      amount: amountNum,
      date: payment.date
        ? new Date(payment.date).toISOString()
        : new Date().toISOString(),
      method: payment.method,
      type: payment.type,
      receiptNumber: payment.receiptNumber,
      notes: payment.notes,
    });
    setPayment({
      amount: "",
      date: "",
      method: "cash",
      type: "advance",
      receiptNumber: "",
      notes: "",
    });
    setPaymentError("");
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
      {/* Colorful Page Header */}
      <div className="relative overflow-hidden rounded-2xl mb-6 border-2 border-green-100 bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 shadow-lg group">
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="relative z-10 p-5">
          <div className="flex items-center gap-3 mb-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-white/50 rounded-lg transition-colors"
          >
              <ArrowLeft className="h-6 w-6 text-primary" />
          </button>
          <div className="flex-1">
              <h2 className="text-3xl md:text-4xl font-heading font-bold text-primary">
                {order.id}
              </h2>
          </div>
            <select
              className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize border-2 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-200 ${getStatusColor(
                currentStatus || order.status
              )} ${order.status === "delivered" || order.status === "cancelled" ? "cursor-not-allowed opacity-75" : "cursor-pointer hover:opacity-90"}`}
              value={currentStatus || order.status}
              onChange={handleStatusChange}
              disabled={order.status === "delivered" || order.status === "cancelled"}
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
          <button
            onClick={() => navigate(`/orders/edit?id=${order.id}`)}
            className="p-2 hover:bg-white/50 rounded-lg transition-colors"
            title="Edit order"
          >
              <Pencil className="h-5 w-5 text-primary" />
          </button>
          </div>
          
          {/* Client Details and Order Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t border-green-200">
            <div className="flex items-center gap-2 text-sm">
              <User className="h-4 w-4 text-gray-500" />
              <div>
                <div className="text-gray-500 text-xs">Client</div>
                <div className="font-medium text-gray-900">{order.clientName}</div>
              </div>
            </div>
            <div className="text-sm">
              <div className="text-gray-500 text-xs">Phone</div>
              <div className="font-medium text-gray-900">{order.clientPhone}</div>
            </div>
            <div className="text-sm">
              <div className="text-gray-500 text-xs">Order Date</div>
              <div className="font-medium text-gray-900 flex items-center gap-1">
                <Calendar className="h-3 w-3 text-gray-400" />
                {formatDate(order.orderDate)}
              </div>
            </div>
            <div className="text-sm">
              <div className="text-gray-500 text-xs">Delivery Date</div>
              <div className="font-medium text-gray-900">{formatDate(order.deliveryDate)}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-2xl shadow-lg border-2 border-green-100 group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative z-10">
              <h3 className="text-2xl font-heading font-bold text-primary mb-6">
                Measurements Used
              </h3>
              {order.items && order.items.length > 0 ? (
                <div className="space-y-6">
                  {order.items.map((item, idx) => {
                    const snapshot = item.measurementSnapshot || order.measurementSnapshot;
                    const hasMeasurements = snapshot && Object.keys(snapshot).length > 0;
                    
                    if (!hasMeasurements) return null;
                    
                    const garmentType = item.garmentType || "custom";
                    const fields = MEASUREMENT_FIELDS[garmentType] || [];
                    const predefinedFieldNames = new Set(fields.map((f) => f.name));
                    const requiredFields = new Set(
                      fields.filter((f) => f.required).map((f) => f.name)
                    );
                    
                    // Get all predefined field names across ALL garment types
                    const allPredefinedFieldNames = new Set();
                    Object.values(MEASUREMENT_FIELDS).forEach((garmentFields) => {
                      garmentFields.forEach((field) => {
                        allPredefinedFieldNames.add(field.name);
                      });
                    });
                    
                    // Get field label from MEASUREMENT_FIELDS or format the key
                    const getFieldLabel = (key) => {
                      // Try to find in current garment type first
                      const field = fields.find((f) => f.name === key);
                      if (field) return field.label;
                      
                      // Try to find in other garment types
                      for (const garmentFields of Object.values(MEASUREMENT_FIELDS)) {
                        const foundField = garmentFields.find((f) => f.name === key);
                        if (foundField) return foundField.label;
                      }
                      
                      // Format label from camelCase to readable format
                      return key
                        .replace(/([A-Z])/g, " $1")
                        .replace(/^./, (str) => str.toUpperCase())
                        .replace(/_/g, " ")
                        .trim();
                    };
                    
                    // Separate measurements into: required predefined, optional predefined, unused (other types), and custom
                    const requiredMeas = [];
                    const optionalMeas = [];
                    const unusedMeas = [];
                    const customMeas = [];
                    
                    Object.entries(snapshot)
                      .filter(([key, value]) => value !== "" && value !== null && value !== undefined)
                      .forEach(([key, value]) => {
                        if (predefinedFieldNames.has(key)) {
                          // This field is for the current garment type
                          if (requiredFields.has(key)) {
                            requiredMeas.push([key, value]);
                          } else {
                            optionalMeas.push([key, value]);
                          }
                        } else if (allPredefinedFieldNames.has(key)) {
                          // This field is predefined for OTHER garment types (unused for this type)
                          unusedMeas.push([key, value]);
                        } else {
                          // This is a custom field (not in any predefined fields)
                          customMeas.push([key, value]);
                        }
                      });
                    
                    // Sort each category by field order in MEASUREMENT_FIELDS
                    const sortByFieldOrder = (entries) => {
                      return entries.sort(([keyA], [keyB]) => {
                        const idxA = fields.findIndex((f) => f.name === keyA);
                        const idxB = fields.findIndex((f) => f.name === keyB);
                        if (idxA === -1 && idxB === -1) return keyA.localeCompare(keyB);
                        if (idxA === -1) return 1;
                        if (idxB === -1) return -1;
                        return idxA - idxB;
                      });
                    };
                    
                    const sortedRequired = sortByFieldOrder(requiredMeas);
                    const sortedOptional = sortByFieldOrder(optionalMeas);
                    const sortedUnused = unusedMeas.sort(([keyA], [keyB]) => keyA.localeCompare(keyB));
                    const sortedCustom = customMeas.sort(([keyA], [keyB]) => keyA.localeCompare(keyB));
                    
                    // Combine: required first, then optional, then unused (red), then custom
                    const allMeasurements = [...sortedRequired, ...sortedOptional, ...sortedUnused, ...sortedCustom];
                    
                    if (allMeasurements.length === 0) return null;
                    
                    return (
                      <div key={idx} className="border-2 border-green-200 rounded-xl p-4 bg-gradient-to-br from-green-50 to-emerald-50">
                        <div className="flex items-center gap-2 mb-4">
                          <Ruler className="h-5 w-5 text-green-600" />
                          <h4 className="text-lg font-semibold text-primary capitalize">
                            {item.garmentType?.replace(/_/g, " ") || `Item ${idx + 1}`}
                          </h4>
                          <span className="text-xs text-muted">(Qty: {item.quantity || 1})</span>
            </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                          {allMeasurements.map(([key, value], measIdx) => {
                            const isRequired = requiredFields.has(key);
                            const isUnused = unusedMeas.some(([k]) => k === key);
                            const isCustom = !predefinedFieldNames.has(key) && !allPredefinedFieldNames.has(key);
                            return (
                              <div
                                key={key}
                                className={`flex justify-between items-center py-2 border-b border-green-100 last:border-0 ${
                                  isRequired ? "font-semibold" : ""
                                }`}
                              >
                                <span className={`text-sm ${
                                  isRequired 
                                    ? "text-green-700" 
                                    : isUnused 
                                    ? "text-red-600" 
                                    : isCustom 
                                    ? "text-purple-600" 
                                    : "text-gray-600"
                                }`}>
                                  {getFieldLabel(key)}
                                  {isUnused && (
                                    <span className="ml-1 text-xs">
                                      (unused)
                                    </span>
                                  )}
                                  {isCustom && (
                                    <span className="ml-1 text-xs underline decoration-dotted">
                                      (custom)
                                    </span>
                                  )}
                                </span>
                                <span className={`text-sm font-medium ${
                                  isRequired 
                                    ? "text-green-900" 
                                    : isUnused 
                                    ? "text-red-800" 
                                    : isCustom 
                                    ? "text-purple-800" 
                                    : "text-gray-900"
                                }`}>
                                  {value} {order.measurementUnit || "inches"}
                                </span>
          </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                  {order.items.every(item => {
                    const snapshot = item.measurementSnapshot || order.measurementSnapshot;
                    return !snapshot || Object.keys(snapshot).length === 0;
                  }) && (
                    <div className="text-sm text-muted flex items-center gap-2">
                      <Ruler className="h-4 w-4" />
                      No measurements were saved for this order
                    </div>
                  )}
                </div>
              ) : order.measurementSnapshot && Object.keys(order.measurementSnapshot).length > 0 ? (
                (() => {
                  // For legacy orders without items, filter by order's garmentType if available
                  const garmentType = order.garmentType || "custom";
                  const fields = MEASUREMENT_FIELDS[garmentType] || [];
                  const predefinedFieldNames = new Set(fields.map((f) => f.name));
                  const requiredFields = new Set(
                    fields.filter((f) => f.required).map((f) => f.name)
                  );
                  
                  // Get all predefined field names across ALL garment types
                  const allPredefinedFieldNames = new Set();
                  Object.values(MEASUREMENT_FIELDS).forEach((garmentFields) => {
                    garmentFields.forEach((field) => {
                      allPredefinedFieldNames.add(field.name);
                    });
                  });
                  
                  const getFieldLabel = (key) => {
                    // Try to find in current garment type first
                    const field = fields.find((f) => f.name === key);
                    if (field) return field.label;
                    
                    // Try to find in other garment types
                    for (const garmentFields of Object.values(MEASUREMENT_FIELDS)) {
                      const foundField = garmentFields.find((f) => f.name === key);
                      if (foundField) return foundField.label;
                    }
                    
                    return key
                      .replace(/([A-Z])/g, " $1")
                      .replace(/^./, (str) => str.toUpperCase())
                      .replace(/_/g, " ")
                      .trim();
                  };
                  
                  // Separate measurements
                  const requiredMeas = [];
                  const optionalMeas = [];
                  const unusedMeas = [];
                  const customMeas = [];
                  
                  Object.entries(order.measurementSnapshot)
                    .filter(([key, value]) => value !== "" && value !== null && value !== undefined)
                    .forEach(([key, value]) => {
                      if (predefinedFieldNames.has(key)) {
                        if (requiredFields.has(key)) {
                          requiredMeas.push([key, value]);
                        } else {
                          optionalMeas.push([key, value]);
                        }
                      } else if (allPredefinedFieldNames.has(key)) {
                        // This field is predefined for OTHER garment types (unused for this type)
                        unusedMeas.push([key, value]);
                      } else {
                        customMeas.push([key, value]);
                      }
                    });
                  
                  // Sort by field order
                  const sortByFieldOrder = (entries) => {
                    return entries.sort(([keyA], [keyB]) => {
                      const idxA = fields.findIndex((f) => f.name === keyA);
                      const idxB = fields.findIndex((f) => f.name === keyB);
                      if (idxA === -1 && idxB === -1) return keyA.localeCompare(keyB);
                      if (idxA === -1) return 1;
                      if (idxB === -1) return -1;
                      return idxA - idxB;
                    });
                  };
                  
                  const sortedRequired = sortByFieldOrder(requiredMeas);
                  const sortedOptional = sortByFieldOrder(optionalMeas);
                  const sortedUnused = unusedMeas.sort(([keyA], [keyB]) => keyA.localeCompare(keyB));
                  const sortedCustom = customMeas.sort(([keyA], [keyB]) => keyA.localeCompare(keyB));
                  const allMeasurements = [...sortedRequired, ...sortedOptional, ...sortedUnused, ...sortedCustom];
                  
                  if (allMeasurements.length === 0) return null;
                  
                  return (
                    <div className="border-2 border-green-200 rounded-xl p-4 bg-gradient-to-br from-green-50 to-emerald-50">
                      <div className="flex items-center gap-2 mb-4">
                        <Ruler className="h-5 w-5 text-green-600" />
                        <h4 className="text-lg font-semibold text-primary capitalize">
                          {order.garmentType ? `${order.garmentType.replace(/_/g, " ")} Measurements` : "Order Measurements"}
                        </h4>
              </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
                        {allMeasurements.map(([key, value]) => {
                          const isRequired = requiredFields.has(key);
                          const isUnused = unusedMeas.some(([k]) => k === key);
                          const isCustom = !predefinedFieldNames.has(key) && !allPredefinedFieldNames.has(key);
                          return (
                            <div
                              key={key}
                              className={`flex justify-between items-center py-2 border-b border-green-100 last:border-0 ${
                                isRequired ? "font-semibold" : ""
                              }`}
                            >
                              <span className={`text-sm ${
                                isRequired 
                                  ? "text-green-700" 
                                  : isUnused 
                                  ? "text-red-600" 
                                  : isCustom 
                                  ? "text-purple-600" 
                                  : "text-gray-600"
                              }`}>
                                {getFieldLabel(key)}
                                {isUnused && (
                                  <span className="ml-1 text-xs">
                                    (unused)
                                  </span>
                                )}
                                {isCustom && (
                                  <span className="ml-1 text-xs underline decoration-dotted">
                                    (custom)
                                  </span>
                                )}
                              </span>
                              <span className={`text-sm font-medium ${
                                isRequired 
                                  ? "text-green-900" 
                                  : isUnused 
                                  ? "text-red-800" 
                                  : isCustom 
                                  ? "text-purple-800" 
                                  : "text-gray-900"
                              }`}>
                                {value} {order.measurementUnit || "inches"}
                              </span>
              </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })()
              ) : (
                <div className="text-sm text-muted flex items-center gap-2">
                  <Ruler className="h-4 w-4" />
                  No measurements were saved for this order
                </div>
              )}
            </div>
          </div>

          {/* Pricing Section */}
          <div className="bg-white p-8 rounded-2xl shadow-lg border-2 border-purple-100 group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative z-10">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-lg">
                    <DollarSign className="w-6 h-6" />
              </div>
                  <h3 className="text-2xl font-heading font-bold text-primary">
                    Pricing
                  </h3>
            </div>
                {!isEditingPricing && (
                  <button
                    onClick={handleEditPricing}
                    className="px-4 py-2 border-2 border-purple-200 rounded-lg hover:bg-purple-50 text-purple-700 font-medium transition-all duration-200 flex items-center gap-2"
                  >
                    <Pencil className="h-4 w-4" /> Edit
                  </button>
                )}
              </div>

              {isEditingPricing ? (
                <>
                  {/* Items Pricing */}
                  <div className="mt-4">
                    <label className="block text-sm text-gray-600 mb-2">
                      Items Pricing
                    </label>
                    <div className="space-y-3">
                      {(pricingForm.items || []).map((item, idx) => {
                        const lineTotal = (Number(item.quantity) || 0) * (Number(item.unitPrice) || 0);
                        return (
                          <div
                            key={idx}
                            className="grid grid-cols-1 md:grid-cols-12 gap-2 p-3 bg-purple-50 rounded-lg border-2 border-purple-200"
                          >
                            <div className="md:col-span-3 flex items-center">
                              <span className="text-sm font-medium text-gray-700 capitalize">
                                {item.garmentType?.replace("_", " ") || `Item ${idx + 1}`}
                              </span>
            </div>
                            <div className="md:col-span-2">
                              <label className="block text-xs text-gray-500 mb-1">Quantity</label>
                              <input
                                type="number"
                                min="0"
                                readOnly
                                className="w-full border-2 border-purple-200 rounded-lg px-2 py-1.5 text-sm bg-gray-100 text-gray-600"
                                value={item.quantity || 0}
                              />
          </div>
                            <div className="md:col-span-3">
                              <label className="block text-xs text-gray-500 mb-1">Cost per Item (₹)</label>
                              <input
                                type="number"
                                min="0"
                                className="w-full border-2 border-purple-200 rounded-lg px-2 py-1.5 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200"
                                value={item.unitPrice || 0}
                                onChange={(e) => {
                                  const newUnitPrice = Number(e.target.value) || 0;
                                  const newLineTotal = (Number(item.quantity) || 0) * newUnitPrice;
                                  const arr = [...(pricingForm.items || [])];
                                  arr[idx] = {
                                    ...arr[idx],
                                    unitPrice: newUnitPrice,
                                    lineTotal: newLineTotal,
                                  };
                                  setPricingForm((p) => ({
                                    ...p,
                                    items: arr,
                                  }));
                                }}
                              />
              </div>
                            <div className="md:col-span-3">
                              <label className="block text-xs text-gray-500 mb-1">Total Cost (₹)</label>
                              <input
                                type="number"
                                readOnly
                                className="w-full border-2 border-purple-200 rounded-lg px-2 py-1.5 text-sm bg-gray-100 text-gray-700 font-medium"
                                value={lineTotal}
                              />
          </div>
                            <div className="md:col-span-1 flex items-end">
                              <span className="text-xs text-gray-500 mb-1">₹{lineTotal.toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                );
              })}
            </div>
                  </div>

                  {/* Customizations */}
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm text-gray-600">
                        Additional charges
                      </label>
                      <button
                        type="button"
                        className="px-3 py-1 border-2 border-purple-300 rounded-lg text-sm hover:bg-purple-50 text-purple-700 font-medium transition-all duration-200 flex items-center gap-1"
                        onClick={() =>
                          setPricingForm((p) => ({
                            ...p,
                            customizations: [
                              ...(p.customizations || []),
                              { description: "", amount: 0 },
                            ],
                          }))
                        }
                      >
                        <Plus className="h-4 w-4" /> Add item
                      </button>
                    </div>
                    <div className="space-y-2">
                      {(pricingForm.customizations || []).map((item, idx) => (
                        <div
                          key={idx}
                          className="grid grid-cols-1 md:grid-cols-12 gap-2"
                        >
                          <input
                            type="text"
                            placeholder="Description"
                            className="md:col-span-8 border-2 border-purple-200 rounded-lg px-3 py-2 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200"
                            value={item.description}
                            onChange={(e) => {
                              const arr = [...(pricingForm.customizations || [])];
                              arr[idx] = { ...arr[idx], description: e.target.value };
                              setPricingForm((p) => ({
                                ...p,
                                customizations: arr,
                              }));
                            }}
                          />
                          <input
                            type="number"
                            min="0"
                            placeholder="Amount (₹)"
                            className="md:col-span-3 border-2 border-purple-200 rounded-lg px-3 py-2 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200"
                            value={item.amount}
                            onChange={(e) => {
                              const arr = [...(pricingForm.customizations || [])];
                              arr[idx] = { ...arr[idx], amount: e.target.value };
                              setPricingForm((p) => ({
                                ...p,
                                customizations: arr,
                              }));
                            }}
                          />
                          <button
                            type="button"
                            className="md:col-span-1 px-3 py-2 border-2 border-red-200 rounded-lg hover:bg-red-50 text-red-600 font-bold transition-all duration-200 flex items-center justify-center"
                            onClick={() => {
                              const arr = [...(pricingForm.customizations || [])];
                              arr.splice(idx, 1);
                              setPricingForm((p) => ({
                                ...p,
                                customizations: arr,
                              }));
                            }}
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
          </div>
        </div>

                  {/* Discount and totals */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">
                        Discount type
                      </label>
                <select
                        className="w-full border-2 border-purple-200 rounded-lg px-3 py-2 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200"
                        value={pricingForm.discountType}
                        onChange={(e) =>
                          setPricingForm((p) => ({
                            ...p,
                            discountType: e.target.value,
                          }))
                        }
                      >
                        <option value="amount">Amount (₹)</option>
                        <option value="percent">Percent (%)</option>
                </select>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-600 mb-1">
                        Discount value
                      </label>
                      <input
                        type="number"
                        min="0"
                        className="w-full border-2 border-purple-200 rounded-lg px-3 py-2 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200"
                        value={pricingForm.discountValue}
                        onChange={(e) =>
                          setPricingForm((p) => ({
                            ...p,
                            discountValue: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>

                  {(() => {
                    const itemsTotal = (pricingForm.items || []).reduce(
                      (sum, it) => sum + (Number(it.lineTotal) || 0),
                      0
                    );
                    const custom = (pricingForm.customizations || []).reduce(
                      (sum, c) => sum + (Number(c.amount) || 0),
                      0
                    );
                    const subtotal = itemsTotal + custom;
                    const discountAmt =
                      pricingForm.discountType === "percent"
                        ? Math.min(
                            100,
                            Math.max(0, Number(pricingForm.discountValue) || 0)
                          ) *
                          (subtotal / 100)
                        : Number(pricingForm.discountValue) || 0;
                    const total = Math.max(0, Math.round(subtotal - discountAmt));
                    return (
                      <div className="mt-4 bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-lg p-4 max-w-md ml-auto">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Items total</span>
                          <span className="font-medium">
                            ₹{itemsTotal.toLocaleString("en-IN")}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Subtotal</span>
                          <span className="font-medium">
                            ₹{subtotal.toLocaleString("en-IN")}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm mt-1">
                          <span className="text-gray-600">Discount</span>
                          <span className="font-medium">
                            - ₹{Math.round(discountAmt).toLocaleString("en-IN")}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-base mt-2">
                          <span className="text-gray-800 font-semibold">Total</span>
                          <span className="text-gray-900 font-bold">
                            ₹{total.toLocaleString("en-IN")}
                          </span>
                        </div>
                      </div>
                    );
                  })()}

                  <div className="flex items-center justify-end gap-3 mt-6">
                <button
                      onClick={handleCancelPricing}
                      className="px-6 py-2 border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSavePricing}
                      className="px-6 py-3 bg-gradient-to-r from-accent to-yellow-600 text-primary rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 font-semibold hover:scale-105"
                    >
                      Save Pricing
                </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Items Pricing Display */}
                  {order.items && order.items.length > 0 && (
                    <div className="mb-4">
                      <div className="text-sm text-gray-500 mb-2">Items Pricing</div>
                      <div className="space-y-2">
                        {order.items.map((item, idx) => {
                          const lineTotal = item.lineTotal || (item.quantity || 0) * (item.unitPrice || 0);
                          return (
                            <div
                              key={idx}
                              className="flex items-center justify-between text-sm p-2 bg-purple-50 rounded border border-purple-200"
                            >
                              <div className="flex-1">
                                <span className="font-medium text-gray-700 capitalize">
                                  {item.garmentType?.replace("_", " ") || `Item ${idx + 1}`}
                                </span>
                                <span className="text-gray-500 ml-2">(Qty: {item.quantity || 0})</span>
                              </div>
                              <div className="flex items-center gap-4">
                                <span className="text-gray-600">
                                  ₹{(item.unitPrice || 0).toLocaleString("en-IN")} × {item.quantity || 0}
                                </span>
                                <span className="font-semibold text-gray-900">
                                  = ₹{lineTotal.toLocaleString("en-IN")}
                                </span>
                              </div>
                            </div>
                          );
                        })}
              </div>
            </div>
          )}

                  {order.pricing?.customizations?.length > 0 && (
                    <div className="mb-4">
                      <div className="text-sm text-gray-500 mb-2">Additional charges</div>
                      <div className="space-y-1">
                        {order.pricing.customizations.map((c, i) => (
                          <div
                            key={i}
                            className="flex items-center justify-between text-sm"
                          >
                            <span className="text-gray-600">{c.description || "Customization"}</span>
                            <span className="font-medium">
                              ₹{(c.amount || 0).toLocaleString("en-IN")}
                            </span>
              </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(() => {
                    const itemsTotal = (order.items || []).reduce(
                      (sum, it) =>
                        sum + (it.lineTotal || (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0)),
                      0
                    );
                    const custom = (order.pricing?.customizations || []).reduce(
                      (sum, c) => sum + (Number(c.amount) || 0),
                      0
                    );
                    const subtotal = itemsTotal + custom;
                    const discountAmt = order.pricing?.discount?.amount || 0;
                    const total = order.pricing?.total || 0;
                    return (
                      <div className="mt-4 bg-gradient-to-br from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-lg p-4 max-w-md ml-auto">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Items total</span>
                          <span className="font-medium">
                            ₹{itemsTotal.toLocaleString("en-IN")}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">Subtotal</span>
                          <span className="font-medium">
                            ₹{subtotal.toLocaleString("en-IN")}
                          </span>
                        </div>
                        {discountAmt > 0 && (
                          <div className="flex items-center justify-between text-sm mt-1">
                            <span className="text-gray-600">
                              Discount {order.pricing?.discount?.reason ? `(${order.pricing.discount.reason})` : ""}
                            </span>
                            <span className="font-medium">
                              - ₹{Math.round(discountAmt).toLocaleString("en-IN")}
                            </span>
                          </div>
                        )}
                        <div className="flex items-center justify-between text-base mt-2 border-t border-purple-200 pt-2">
                          <span className="text-gray-800 font-semibold">Total</span>
                          <span className="text-gray-900 font-bold">
                            ₹{total.toLocaleString("en-IN")}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm mt-2 pt-2 border-t border-purple-200">
                <span className="text-gray-600">Paid</span>
                          <span className="font-medium text-green-700">
                            ₹{(order.totalPaid || 0).toLocaleString("en-IN")}
                          </span>
              </div>
                        <div className="flex items-center justify-between text-sm mt-1">
                          <span className="text-gray-600">Balance Due</span>
                          <span className="font-medium text-orange-700">
                            ₹{(order.balanceDue || 0).toLocaleString("en-IN")}
                          </span>
              </div>
            </div>
                    );
                  })()}

            <button
              onClick={() => setShowInvoice(true)}
                    className="mt-4 w-full px-4 py-2 border-2 border-purple-200 rounded-lg hover:bg-purple-50 flex items-center justify-center gap-2 transition-all duration-200"
            >
              <ReceiptIndianRupee className="h-4 w-4" /> View Invoice
            </button>
                </>
              )}
            </div>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-lg border-2 border-green-100 group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative z-10">
              <button
                onClick={() => setIsStatusHistoryCollapsed(!isStatusHistoryCollapsed)}
                className="w-full flex items-center justify-between mb-6 hover:opacity-80 transition-opacity"
              >
                <h3 className="text-2xl font-heading font-bold text-primary">
                  Status History
                </h3>
                {isStatusHistoryCollapsed ? (
                  <ChevronDown className="h-5 w-5 text-gray-500" />
                ) : (
                  <ChevronUp className="h-5 w-5 text-gray-500" />
                )}
              </button>
              {!isStatusHistoryCollapsed && (
                <div className="space-y-3">
                  {order.statusHistory?.map((s, idx) => {
                    const isCurrent = s.status === order.status;
                    return (
                      <div
                        key={idx}
                        className={`flex items-center justify-between p-3 rounded-lg border ${
                          isCurrent
                            ? "bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200"
                            : "bg-gradient-to-br from-gray-50 to-slate-50 border-2 border-gray-200"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(
                              s.status
                            )}`}
                          >
                            {formatStatus(s.status)}
                            {isCurrent ? " • current" : ""}
                          </span>
                          <span className="text-sm text-gray-600">
                            {formatDate(s.timestamp)}
                          </span>
                        </div>
                        {s.notes && (
                          <span className="text-sm text-gray-500">{s.notes}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Items */}
        <div className="space-y-6">
          {order.items && order.items.length > 0 && (
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 group relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-yellow-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative z-10">
                <h3 className="text-2xl font-heading font-bold text-primary mb-6">
                  Items
                </h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b-2 border-green-200 bg-green-50">
                        <th className="text-left py-2">Garment</th>
                        <th className="text-right py-2">Qty</th>
                      </tr>
                    </thead>
                    <tbody>
                      {order.items.map((it, i) => (
                        <tr key={i} className="border-b border-green-100 hover:bg-green-50 transition-all duration-200">
                          <td className="py-2 capitalize">
                            {it.garmentType?.replace("_", " ") || "-"}
                          </td>
                          <td className="py-2 text-right">
                            {it.quantity || 0}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Payments */}
          <div className="bg-white p-8 rounded-2xl shadow-lg border-2 border-purple-100 group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <div className="relative z-10">
              <h3 className="text-2xl font-heading font-bold text-primary mb-6">
                Record Payment
              </h3>
            {paymentError && (
                <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                  {paymentError}
                </div>
            )}
            <div className="grid grid-cols-1 gap-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="number"
                  min="0"
                  placeholder="Amount (₹)"
                    className="border-2 border-purple-200 rounded-lg px-3 py-2 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200"
                  value={payment.amount}
                    onChange={(e) =>
                      setPayment((p) => ({ ...p, amount: e.target.value }))
                    }
                />
                <input
                  type="date"
                    className="border-2 border-purple-200 rounded-lg px-3 py-2 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200"
                  value={payment.date}
                    onChange={(e) =>
                      setPayment((p) => ({ ...p, date: e.target.value }))
                    }
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <select
                    className="border-2 border-purple-200 rounded-lg px-3 py-2 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200"
                  value={payment.method}
                    onChange={(e) =>
                      setPayment((p) => ({ ...p, method: e.target.value }))
                    }
                  >
                    {["cash", "upi", "card"].map((m) => (
                      <option key={m} value={m}>
                        {m.toUpperCase()}
                      </option>
                  ))}
                </select>
                <select
                    className="border-2 border-purple-200 rounded-lg px-3 py-2 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200"
                  value={payment.type}
                    onChange={(e) =>
                      setPayment((p) => ({ ...p, type: e.target.value }))
                    }
                  >
                    {["advance", "final"].map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                  ))}
                </select>
              </div>
              <input
                type="text"
                placeholder="Receipt number (optional)"
                className="border border-gray-300 rounded-lg px-3 py-2"
                value={payment.receiptNumber}
                  onChange={(e) =>
                    setPayment((p) => ({ ...p, receiptNumber: e.target.value }))
                  }
              />
              <textarea
                rows={2}
                placeholder="Notes (optional)"
                className="border border-gray-300 rounded-lg px-3 py-2"
                value={payment.notes}
                  onChange={(e) =>
                    setPayment((p) => ({ ...p, notes: e.target.value }))
                  }
              />
              <button
                onClick={handleAddPayment}
                  className="w-full px-6 py-3 bg-gradient-to-r from-accent to-yellow-600 text-primary rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 font-semibold hover:scale-105"
              >
                Add Payment
              </button>
            </div>
            {order.payments?.length > 0 && (
              <div className="mt-6">
                  <h4 className="text-sm font-semibold text-primary mb-2">
                    Payment History
                  </h4>
                <div className="space-y-2 text-sm">
                  {order.payments.map((p, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-lg border border-purple-200"
                      >
                        <div className="text-gray-700">
                          ₹{p.amount.toLocaleString("en-IN")}
                        </div>
                        <div className="text-gray-500">
                          {new Date(p.date).toLocaleDateString("en-IN")}
                        </div>
                        <div className="text-gray-500 capitalize">
                          {p.method}
                        </div>
                      <div className="text-gray-500 capitalize">{p.type}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            </div>
          </div>
        </div>
      </div>

      {/* Inline confirmation banner for delivery with pending balance */}
      {pendingDeliveryConfirm && (
        <div className="fixed left-1/2 -translate-x-1/2 bottom-4 z-50 max-w-xl w-[92%] sm:w-auto bg-amber-50 border border-amber-200 text-amber-900 rounded-lg shadow p-4">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <p className="font-semibold text-sm">Pending Balance</p>
              <p className="text-sm mt-1">
                A balance of ₹{(order.balanceDue || 0).toLocaleString("en-IN")}{" "}
                is still unpaid. Mark as Delivered anyway?
              </p>
            </div>
            <div className="flex items-center gap-2 mt-2 sm:mt-0">
              <button
                onClick={cancelDeliverWithPending}
                className="px-3 py-1.5 border border-amber-300 rounded-lg text-amber-900 hover:bg-amber-100 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={proceedDeliverWithPending}
                className="px-3 py-1.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm"
              >
                Mark Delivered
              </button>
              <button
                onClick={payBalanceAndDeliver}
                className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
              >
                Pay Balance & Deliver
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Simple Invoice Preview Modal */}
      {showInvoice && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
          onClick={() => setShowInvoice(false)}
        >
          <div
            className="bg-white w-full max-w-2xl rounded-lg shadow-lg overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Invoice Preview</h3>
              <button
                className="px-3 py-1.5 border border-gray-300 rounded-lg hover:bg-gray-50"
                onClick={() => window.print()}
              >
                Print
              </button>
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
                    <p className="text-gray-600">
                      Delivery:{" "}
                      {new Date(order.deliveryDate).toLocaleDateString("en-IN")}
                    </p>
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
                    {order.pricing?.customizations?.map((c, i) => (
                      <tr key={i}>
                        <td className="py-1">
                          {c.description || "Customization"}
                        </td>
                        <td className="py-1 text-right">
                          {(c.amount || 0).toLocaleString("en-IN")}
                        </td>
                      </tr>
                    ))}
                    <tr className="border-t border-gray-200">
                      <td className="py-1 font-medium">Subtotal</td>
                      <td className="py-1 text-right font-medium">
                        {(order.pricing?.subtotal || 0).toLocaleString("en-IN")}
                      </td>
                    </tr>
                    {order.pricing?.discount?.amount ? (
                      <tr>
                        <td className="py-1">
                          Discount{" "}
                          {order.pricing.discount?.reason
                            ? `(${order.pricing.discount.reason})`
                            : ""}
                        </td>
                        <td className="py-1 text-right">
                          -{" "}
                          {(order.pricing.discount.amount || 0).toLocaleString(
                            "en-IN"
                          )}
                        </td>
                      </tr>
                    ) : null}
                    <tr className="border-t border-gray-200">
                      <td className="py-1 font-semibold">Total</td>
                      <td className="py-1 text-right font-semibold">
                        {(order.pricing?.total || 0).toLocaleString("en-IN")}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1">Paid</td>
                      <td className="py-1 text-right">
                        {(order.totalPaid || 0).toLocaleString("en-IN")}
                      </td>
                    </tr>
                    <tr>
                      <td className="py-1">Balance Due</td>
                      <td className="py-1 text-right">
                        {(order.balanceDue || 0).toLocaleString("en-IN")}
                      </td>
                    </tr>
                  </tbody>
                </table>
                <p className="text-xs text-gray-500 mt-4">
                  Thank you for your business!
                </p>
              </div>
            </div>
            <div className="p-4 border-t border-gray-200 text-right">
              <button
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                onClick={() => setShowInvoice(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OrderDetails;
