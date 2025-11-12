import React, { useEffect, useMemo, useState } from "react";
import {
  clientService,
  measurementService,
  orderService,
} from "../../services/database";
import ClientForm from "../clients/ClientForm";
import MeasurementForm from "../measurements/MeasurementForm";
import {
  Plus,
  X,
  User,
  ShoppingBag,
  Calendar,
  DollarSign,
  FileText,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

// Measurement field definitions (imported from MeasurementForm logic)
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

// Helper function to generate measurement for a garment type from client's measurements
const generateMeasurementForGarmentType = (clientMeasurements, garmentType) => {
  if (!clientMeasurements || !clientMeasurements.measurements) {
    return { measurements: {}, missing: [], available: [], custom: [] };
  }

  const allFields = MEASUREMENT_FIELDS[garmentType] || [];
  const hasPredefinedFields = allFields.length > 0;

  const generated = {};
  const missing = [];
  const available = [];
  const custom = [];

  if (hasPredefinedFields) {
    // If garment type has predefined fields, check against those
    const predefinedFieldNames = new Set(allFields.map((f) => f.name));

    allFields.forEach((field) => {
      const value = clientMeasurements.measurements[field.name];
      if (value !== undefined && value !== null && value !== "") {
        generated[field.name] = value;
        available.push(field.name);
      } else if (field.required) {
        missing.push(field.name);
      }
    });

    // Also include any custom measurements that aren't in predefined fields
    Object.entries(clientMeasurements.measurements).forEach(([key, value]) => {
      if (
        value !== undefined &&
        value !== null &&
        value !== "" &&
        !predefinedFieldNames.has(key)
      ) {
        generated[key] = value;
        custom.push(key);
      }
    });
  } else {
    // If no predefined fields, show ALL available measurements
    Object.entries(clientMeasurements.measurements).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        generated[key] = value;
        available.push(key);
      }
    });
  }

  return {
    measurements: generated,
    missing,
    available,
    custom,
    unit: clientMeasurements.unit || "inches",
  };
};

// Helper function to check if a measurement is compatible with a garment type
const isMeasurementCompatible = (measurement, garmentType) => {
  if (!measurement || !measurement.measurements) return false;

  const requiredFields =
    MEASUREMENT_FIELDS[garmentType]?.filter((f) => f.required) || [];
  if (requiredFields.length === 0) return true; // If no required fields defined, allow it

  // Check if all required fields are present in the measurement
  return requiredFields.every((field) => {
    const fieldValue = measurement.measurements[field.name];
    return fieldValue !== undefined && fieldValue !== null && fieldValue !== "";
  });
};

function OrderForm({ isOpen = true, onClose, onSuccess, defaultClientId }) {
  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState(
    defaultClientId || ""
  );
  const [clientMeasurements, setClientMeasurements] = useState([]);
  const [clientMeasurementRecord, setClientMeasurementRecord] = useState(null);
  const [errors, setErrors] = useState({ clientId: "" });
  const [isClientFormOpen, setIsClientFormOpen] = useState(false);
  const [isMeasurementFormOpen, setIsMeasurementFormOpen] = useState(false);
  const [measurementFormForItemIndex, setMeasurementFormForItemIndex] =
    useState(null);
  const [isPricingCollapsed, setIsPricingCollapsed] = useState(true);

  // Helper function to calculate delivery date (5 days after order date)
  const calculateDeliveryDate = (orderDate) => {
    const date = new Date(orderDate);
    date.setDate(date.getDate() + 5);
    return date.toISOString().split("T")[0];
  };

  const [form, setForm] = useState({
    orderDate: new Date().toISOString().split("T")[0],
    deliveryDate: calculateDeliveryDate(new Date().toISOString().split("T")[0]),
    priority: "normal",
    items: [],
    fabricDetails: {
      type: "",
      providedBy: "client",
      measurements: "",
      notes: "",
    },
    designDetails: { description: "", referenceNumber: "" },
    specialInstructions: "",
    pricing: {
      customizations: [], // { description, amount }
      discountType: "amount", // amount | percent
      discountValue: 0,
    },
  });

  const garmentOptions = [
    "shirt",
    "blouse",
    "churidar",
    "salwar",
    "pants",
    "skirt",
    "lehenga",
    "saree_blouse",
    "kids_wear",
    "custom",
  ];

  useEffect(() => {
    loadClients();
  }, []);

  const loadClients = () => {
    clientService.getAll().then(setClients);
  };

  const loadMeasurements = async () => {
    if (!selectedClientId) {
      setClientMeasurements([]);
      setClientMeasurementRecord(null);
      return;
    }
    try {
      const list = await measurementService.getByClientId(selectedClientId);
      if (list && list.length > 0) {
        const measurement = list[0]; // Unified measurement record
        setClientMeasurementRecord(measurement);
        setClientMeasurements([measurement]); // For backward compatibility
      } else {
        setClientMeasurementRecord(null);
        setClientMeasurements([]);
      }
    } catch (error) {
      console.error("Error loading measurements:", error);
      setClientMeasurementRecord(null);
      setClientMeasurements([]);
    }
  };

  useEffect(() => {
    loadMeasurements();
  }, [selectedClientId]);

  const selectedClient = useMemo(
    () => clients.find((c) => c.id === selectedClientId),
    [clients, selectedClientId]
  );

  // Helper to get generated measurement for a garment type
  const getMeasurementForGarmentType = (garmentType) => {
    if (!garmentType || !clientMeasurementRecord) {
      return { measurements: {}, missing: [], available: [], custom: [] };
    }
    return generateMeasurementForGarmentType(
      clientMeasurementRecord,
      garmentType
    );
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => {
      const updated = { ...prev, [name]: value };
      // Auto-update delivery date when order date changes
      if (name === "orderDate") {
        // Only auto-update delivery date if it hasn't been manually edited
        // or if the current delivery date matches the calculated one
        const calculatedDeliveryDate = calculateDeliveryDate(value);
        const currentDeliveryDate = updated.deliveryDate;
        // If delivery date matches the previously calculated date, update it
        // Otherwise, keep the manually set delivery date
        if (currentDeliveryDate === calculateDeliveryDate(form.orderDate)) {
          updated.deliveryDate = calculatedDeliveryDate;
        }
      }
      return updated;
    });
    if (name === "deliveryDate" && errors.deliveryDate) {
      setErrors((prev) => ({ ...prev, deliveryDate: "" }));
    }
  };

  const handleNestedChange = (section, name, value) => {
    setForm((prev) => ({
      ...prev,
      [section]: { ...prev[section], [name]: value },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = { clientId: "" };
    if (!selectedClient) newErrors.clientId = "Please select a client";
    setErrors(newErrors);
    if (newErrors.clientId) return;

    // Get measurements for each item (generate from client measurements)
    const itemMeasurements = await Promise.all(
      (form.items || []).map(async (it, idx) => {
        if (selectedClientId) {
          const clientMeas = await measurementService.getClientMeasurements(
            selectedClientId
          );
          const generated = generateMeasurementForGarmentType(
            clientMeas,
            it.garmentType
          );
          return {
            itemIndex: idx,
            measurement: generated,
            unit: clientMeas?.unit || "inches",
          };
        }
        return { itemIndex: idx, measurement: null, unit: "inches" };
      })
    );

    // Get the measurement unit from client measurements (use first item's unit)
    const measurementUnit =
      itemMeasurements[0]?.unit || clientMeasurementRecord?.unit || "inches";

    const totals = (() => {
      const itemsTotal = (form.items || []).reduce(
        (sum, it) =>
          sum +
          (Number(it.lineTotal) ||
            (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0)),
        0
      );
      const custom = (form.pricing.customizations || []).reduce(
        (sum, c) => sum + (Number(c.amount) || 0),
        0
      );
      const subtotal = itemsTotal + custom;
      const discountAmt =
        form.pricing.discountType === "percent"
          ? Math.min(
              100,
              Math.max(0, Number(form.pricing.discountValue) || 0)
            ) *
            (subtotal / 100)
          : Number(form.pricing.discountValue) || 0;
      const total = Math.max(0, Math.round(subtotal - discountAmt));
      return { itemsTotal, subtotal, discountAmt, total };
    })();

    const created = await orderService.create({
      clientId: selectedClient.id,
      clientName: selectedClient.name,
      clientPhone: selectedClient.phoneNumber,
      deliveryDate: new Date(form.deliveryDate).toISOString(),
      items: (form.items || []).map((it, idx) => {
        const itemMeas = itemMeasurements.find((im) => im.itemIndex === idx);
        const unitPrice = Number(it.unitPrice) || 0;
        const quantity = Number(it.quantity) || 0;
        const lineTotal = Number(it.lineTotal) || unitPrice * quantity;
        return {
          garmentType: it.garmentType,
          quantity: quantity,
          unitPrice: unitPrice,
          lineTotal: lineTotal,
          measurementId: clientMeasurementRecord?.id || null,
          measurementSnapshot: itemMeas?.measurement?.measurements || {},
        };
      }),
      garmentType:
        form.items && form.items.length > 1
          ? "multiple"
          : (form.items && form.items[0]?.garmentType) || "shirt",
      quantity:
        (form.items || []).reduce(
          (s, it) => s + (Number(it.quantity) || 0),
          0
        ) || 1,
      priority: form.priority,
      fabricDetails: form.fabricDetails,
      designDetails: form.designDetails,
      // Legacy fields for backward compatibility (use first item's measurement if available)
      measurementId: itemMeasurements[0]?.measurement?.id || null,
      measurementSnapshot: itemMeasurements[0]?.measurement?.measurements || {},
      measurementUnit: measurementUnit,
      specialInstructions: form.specialInstructions,
      pricing: {
        itemsTotal: totals.itemsTotal,
        customizations: (form.pricing.customizations || []).map((c) => ({
          description: c.description || "",
          amount: Number(c.amount) || 0,
        })),
        subtotal: totals.subtotal,
        discount: {
          amount: totals.discountAmt,
          reason:
            form.pricing.discountType === "percent"
              ? `${form.pricing.discountValue}%`
              : "",
        },
        total: totals.total,
      },
    });

    if (onSuccess) onSuccess(created);
  };

  if (!isOpen) return null;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Step 1: Client selection */}
      <div className="bg-white p-8 rounded-2xl shadow-lg border border-blue-100 group relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg">
                <User className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-heading font-bold text-primary">
                Client
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setIsClientFormOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-accent to-yellow-600 text-primary rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 font-semibold flex items-center gap-2 hover:scale-105 text-sm"
            >
              <Plus className="h-4 w-4" />
              Create Client
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Select client
              </label>
              <select
                className="w-full border-2 border-blue-200 rounded-lg px-3 py-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all duration-200"
                value={selectedClientId}
                onChange={(e) => {
                  setSelectedClientId(e.target.value);
                  if (errors.clientId)
                    setErrors((prev) => ({ ...prev, clientId: "" }));
                }}
              >
                <option value="">-- Choose client --</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.phoneNumber})
                  </option>
                ))}
              </select>
              {errors.clientId && (
                <p className="mt-1 text-sm text-red-600">{errors.clientId}</p>
              )}
            </div>
            {selectedClient && (
              <div className="text-sm text-gray-700 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-4">
                <div className="font-semibold text-blue-900 mb-1">
                  {selectedClient.name}
                </div>
                <div className="text-blue-700">
                  {selectedClient.phoneNumber}
                </div>
                <div className="text-xs text-blue-600 mt-1">
                  {selectedClient.id}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Step 2: Items - Only show when client is selected */}
      {selectedClientId && (
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-green-100 group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-heading font-bold text-primary">
                Items
              </h3>
            </div>
            <div className="space-y-4">
              {(form.items || []).length > 0 && (
                <div className="hidden md:grid md:grid-cols-12 gap-2 text-xs font-semibold text-green-700 mb-2 px-1 bg-green-50 rounded-lg p-2">
                  <div className="md:col-span-5">Item</div>
                  <div className="md:col-span-4">Quantity</div>
                  <div className="md:col-span-3 text-right">Actions</div>
                </div>
              )}
              {(form.items || []).map((it, idx) => (
                <div
                  key={idx}
                  className="border-2 border-green-200 rounded-lg p-4 space-y-3 bg-white hover:bg-green-50 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-emerald-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative z-10 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
                      <select
                        className="md:col-span-5 border-2 border-green-200 rounded-lg px-3 py-2 capitalize focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-200"
                        value={it.garmentType}
                        onChange={(e) => {
                          const arr = [...(form.items || [])];
                          arr[idx] = {
                            ...arr[idx],
                            garmentType: e.target.value,
                            measurementId: "",
                          };
                          setForm((p) => ({ ...p, items: arr }));
                        }}
                      >
                        {garmentOptions.map((g) => (
                          <option key={g} value={g}>
                            {g.replace("_", " ")}
                          </option>
                        ))}
                      </select>
                      <input
                        type="number"
                        min="0"
                        className="md:col-span-4 border-2 border-green-200 rounded-lg px-3 py-2 focus:border-green-500 focus:ring-2 focus:ring-green-200 transition-all duration-200"
                        placeholder="Quantity"
                        value={it.quantity}
                        onChange={(e) => {
                          const arr = [...(form.items || [])];
                          arr[idx] = { ...arr[idx], quantity: e.target.value };
                          setForm((p) => ({ ...p, items: arr }));
                        }}
                      />
                      <button
                        type="button"
                        className="md:col-span-3 flex items-center justify-end md:justify-end"
                        onClick={() => {
                          const arr = [...(form.items || [])];
                          arr.splice(idx, 1);
                          setForm((p) => ({
                            ...p,
                            items: arr,
                          }));
                        }}
                      >
                        <div className="p-2 rounded-lg hover:bg-red-50 text-red-600 hover:text-red-700 transition-colors">
                          <X className="h-5 w-5" />
                        </div>
                      </button>
                    </div>
                    {selectedClientId && (
                      <div className="pt-2 border-t border-gray-100">
                        <div className="space-y-2">
                          {/* Auto-generated measurement display */}
                          {(() => {
                            const generatedMeas = getMeasurementForGarmentType(
                              it.garmentType
                            );
                            const hasMissing = generatedMeas.missing.length > 0;

                            return (
                              <>
                                <div className="flex items-center justify-between mb-2">
                                  <label className="block text-sm text-gray-600">
                                    Measurement for{" "}
                                    {it.garmentType.replace("_", " ")}
                                    {hasMissing && (
                                      <span className="ml-2 text-xs text-orange-600 font-medium">
                                        ({generatedMeas.missing.length} missing)
                                      </span>
                                    )}
                                  </label>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setMeasurementFormForItemIndex(idx);
                                      setIsMeasurementFormOpen(true);
                                    }}
                                    className="px-3 py-1.5 bg-gradient-to-r from-accent to-yellow-600 text-primary rounded-lg shadow-md hover:shadow-lg transition-all duration-300 font-semibold flex items-center gap-1.5 hover:scale-105 text-xs"
                                  >
                                    <Plus className="h-3.5 w-3.5" />
                                    {hasMissing ? "Add Missing" : "Add/Edit"}
                                  </button>
                                </div>
                                {/* Available measurements */}
                                {Object.keys(generatedMeas.measurements)
                                  .length > 0 &&
                                  (() => {
                                    // Get required fields for this garment type
                                    const requiredFields = new Set(
                                      (MEASUREMENT_FIELDS[it.garmentType] || [])
                                        .filter((f) => f.required)
                                        .map((f) => f.name)
                                    );

                                    // Sort measurements: required first, then non-required
                                    const sortedMeasurements = Object.entries(
                                      generatedMeas.measurements
                                    ).sort(([keyA], [keyB]) => {
                                      const aRequired =
                                        requiredFields.has(keyA);
                                      const bRequired =
                                        requiredFields.has(keyB);
                                      if (aRequired && !bRequired) return -1;
                                      if (!aRequired && bRequired) return 1;
                                      return 0;
                                    });

                                    return (
                                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                        <div className="flex items-center justify-between mb-2">
                                          <p className="text-sm font-medium text-blue-900">
                                            Available Measurements
                                            {generatedMeas.custom &&
                                              generatedMeas.custom.length >
                                                0 && (
                                                <span className="ml-2 text-xs text-blue-600 font-normal">
                                                  (
                                                  {
                                                    generatedMeas.available
                                                      .length
                                                  }{" "}
                                                  standard,{" "}
                                                  {generatedMeas.custom.length}{" "}
                                                  custom)
                                                </span>
                                              )}
                                          </p>
                                          <span className="text-xs text-blue-600">
                                            {generatedMeas.unit === "cm"
                                              ? "cm"
                                              : "in"}
                                          </span>
                                        </div>
                                        <div className="max-h-48 overflow-auto pr-1">
                                          <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
                                            {sortedMeasurements.map(
                                              ([k, v]) => {
                                                const isRequired =
                                                  requiredFields.has(k);
                                                const isCustom =
                                                  generatedMeas.custom &&
                                                  generatedMeas.custom.includes(
                                                    k
                                                  );
                                                return (
                                                  <React.Fragment key={k}>
                                                    <dt
                                                      className={`capitalize ${
                                                        isRequired
                                                          ? "text-green-700 font-semibold"
                                                          : "text-red-600"
                                                      } ${
                                                        isCustom
                                                          ? "underline decoration-dotted"
                                                          : ""
                                                      }`}
                                                    >
                                                      {k.replace(/_/g, " ")}
                                                      {isCustom && (
                                                        <span className="ml-1 text-[10px] text-blue-600">
                                                          (custom)
                                                        </span>
                                                      )}
                                                    </dt>
                                                    <dd
                                                      className={`font-medium ${
                                                        isRequired
                                                          ? "text-green-900"
                                                          : "text-red-800"
                                                      }`}
                                                    >
                                                      {v}
                                                    </dd>
                                                  </React.Fragment>
                                                );
                                              }
                                            )}
                                          </dl>
                                        </div>
                                      </div>
                                    );
                                  })()}

                                {/* Missing measurements */}
                                {hasMissing && (
                                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                                    <div className="flex items-center justify-between mb-2">
                                      <p className="text-sm font-medium text-orange-900">
                                        Missing Required (
                                        {generatedMeas.missing.length})
                                      </p>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setMeasurementFormForItemIndex(idx);
                                          setIsMeasurementFormOpen(true);
                                        }}
                                        className="text-xs text-orange-700 hover:text-orange-900 font-medium underline"
                                      >
                                        Add Now
                                      </button>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                      {generatedMeas.missing.map(
                                        (fieldName) => {
                                          const field = MEASUREMENT_FIELDS[
                                            it.garmentType
                                          ]?.find((f) => f.name === fieldName);
                                          return (
                                            <span
                                              key={fieldName}
                                              className="text-xs px-2 py-1 bg-orange-100 text-orange-800 rounded border border-orange-300"
                                            >
                                              {field?.label ||
                                                fieldName.replace(/_/g, " ")}
                                            </span>
                                          );
                                        }
                                      )}
                                    </div>
                                  </div>
                                )}

                                {Object.keys(generatedMeas.measurements)
                                  .length === 0 &&
                                  !hasMissing && (
                                    <p className="text-xs text-gray-500 text-center py-2">
                                      No measurements available. Click
                                      "Add/Edit" to add measurements.
                                    </p>
                                  )}
                              </>
                            );
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {(form.items || []).length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p className="text-sm mb-3">No items added yet.</p>
                  <p className="text-xs">
                    Click the button below to add an item.
                  </p>
                </div>
              )}
              <button
                type="button"
                className="px-4 py-2 rounded-lg text-sm bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:from-green-600 hover:to-emerald-700 shadow-md hover:shadow-lg transition-all duration-300 font-semibold flex items-center gap-2 hover:scale-105"
                onClick={() =>
                  setForm((p) => ({
                    ...p,
                    items: [
                      ...(p.items || []),
                      {
                        garmentType: "shirt",
                        quantity: 1,
                        unitPrice: 0,
                        lineTotal: 0,
                        measurementId: "",
                      },
                    ],
                  }))
                }
              >
                <Plus className="h-4 w-4" />
                Add item
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Order details - Only show when items are added */}
      {selectedClientId && form.items && form.items.length > 0 && (
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-orange-100 group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-red-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-lg">
                <Calendar className="w-6 h-6" />
              </div>
              <h3 className="text-2xl font-heading font-bold text-primary">
                Order Details
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Order date
                </label>
                <input
                  type="date"
                  name="orderDate"
                  className="w-full border-2 border-orange-200 rounded-lg px-3 py-2 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all duration-200"
                  value={form.orderDate}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Delivery date
                  <span className="ml-2 text-xs text-gray-400 italic">
                    (Auto: 5 days from order date)
                  </span>
                </label>
                <input
                  type="date"
                  name="deliveryDate"
                  className="w-full border-2 border-orange-200 rounded-lg px-3 py-2 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all duration-200"
                  value={form.deliveryDate}
                  onChange={handleChange}
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">
                  Priority
                </label>
                <select
                  name="priority"
                  className="w-full border-2 border-orange-200 rounded-lg px-3 py-2 capitalize focus:border-orange-500 focus:ring-2 focus:ring-orange-200 transition-all duration-200"
                  value={form.priority}
                  onChange={handleChange}
                >
                  <option value="normal">Normal</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Pricing - Only show when items are added */}
      {selectedClientId && form.items && form.items.length > 0 && (
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-purple-100 group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative z-10">
            <button
              type="button"
              onClick={() => setIsPricingCollapsed(!isPricingCollapsed)}
              className="w-full flex items-center justify-between mb-6 hover:opacity-80 transition-opacity"
            >
              <div className="flex items-center gap-3">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-lg">
                  <DollarSign className="w-6 h-6" />
                </div>
                <h3 className="text-2xl font-heading font-bold text-primary">
                  Pricing
                </h3>
              </div>
              {isPricingCollapsed ? (
                <ChevronDown className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronUp className="h-5 w-5 text-gray-500" />
              )}
            </button>

            {!isPricingCollapsed && (
              <>
                {/* Items Pricing */}
                {form.items && form.items.length > 0 && (
                  <div className="mt-4">
                    <label className="block text-sm text-gray-600 mb-2">
                      Items Pricing
                    </label>
                    <div className="space-y-3">
                      {form.items.map((item, idx) => {
                        const unitPrice = item.unitPrice || 0;
                        const quantity = Number(item.quantity) || 0;
                        const lineTotal =
                          item.lineTotal || unitPrice * quantity;
                        return (
                          <div
                            key={idx}
                            className="grid grid-cols-1 md:grid-cols-12 gap-2 p-3 bg-purple-50 rounded-lg border-2 border-purple-200"
                          >
                            <div className="md:col-span-3 flex items-center">
                              <span className="text-sm font-medium text-gray-700 capitalize">
                                {item.garmentType?.replace("_", " ") ||
                                  `Item ${idx + 1}`}
                              </span>
                            </div>
                            <div className="md:col-span-2">
                              <label className="block text-xs text-gray-500 mb-1">
                                Quantity
                              </label>
                              <input
                                type="number"
                                min="0"
                                readOnly
                                className="w-full border-2 border-purple-200 rounded-lg px-2 py-1.5 text-sm bg-gray-100 text-gray-600"
                                value={item.quantity || 0}
                              />
                            </div>
                            <div className="md:col-span-3">
                              <label className="block text-xs text-gray-500 mb-1">
                                Cost per Item (₹)
                              </label>
                              <input
                                type="number"
                                min="0"
                                className="w-full border-2 border-purple-200 rounded-lg px-2 py-1.5 text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200"
                                value={unitPrice}
                                onChange={(e) => {
                                  const newUnitPrice =
                                    Number(e.target.value) || 0;
                                  const newLineTotal = quantity * newUnitPrice;
                                  const arr = [...(form.items || [])];
                                  arr[idx] = {
                                    ...arr[idx],
                                    unitPrice: newUnitPrice,
                                    lineTotal: newLineTotal,
                                  };
                                  setForm((p) => ({
                                    ...p,
                                    items: arr,
                                  }));
                                }}
                              />
                            </div>
                            <div className="md:col-span-3">
                              <label className="block text-xs text-gray-500 mb-1">
                                Total Cost (₹)
                              </label>
                              <input
                                type="number"
                                readOnly
                                className="w-full border-2 border-purple-200 rounded-lg px-2 py-1.5 text-sm bg-gray-100 text-gray-700 font-medium"
                                value={lineTotal}
                              />
                            </div>
                            <div className="md:col-span-1 flex items-end">
                              <span className="text-xs text-gray-500 mb-1">
                                ₹{lineTotal.toLocaleString("en-IN")}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Customizations */}
                <div className="mt-4">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm text-gray-600">
                      Additional charges
                    </label>
                    <button
                      type="button"
                      className="px-3 py-1 border-2 border-purple-300 rounded-lg text-sm hover:bg-purple-50 text-purple-700 font-medium transition-all duration-200"
                      onClick={() =>
                        setForm((p) => ({
                          ...p,
                          pricing: {
                            ...p.pricing,
                            customizations: [
                              ...(p.pricing.customizations || []),
                              { description: "", amount: 0 },
                            ],
                          },
                        }))
                      }
                    >
                      + Add item
                    </button>
                  </div>
                  <div className="space-y-2">
                    {(form.pricing.customizations || []).map((item, idx) => (
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
                            const arr = [
                              ...(form.pricing.customizations || []),
                            ];
                            arr[idx] = {
                              ...arr[idx],
                              description: e.target.value,
                            };
                            setForm((p) => ({
                              ...p,
                              pricing: { ...p.pricing, customizations: arr },
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
                            const arr = [
                              ...(form.pricing.customizations || []),
                            ];
                            arr[idx] = { ...arr[idx], amount: e.target.value };
                            setForm((p) => ({
                              ...p,
                              pricing: { ...p.pricing, customizations: arr },
                            }));
                          }}
                        />
                        <button
                          type="button"
                          className="md:col-span-1 px-3 py-2 border-2 border-red-200 rounded-lg hover:bg-red-50 text-red-600 font-bold transition-all duration-200"
                          onClick={() => {
                            const arr = [
                              ...(form.pricing.customizations || []),
                            ];
                            arr.splice(idx, 1);
                            setForm((p) => ({
                              ...p,
                              pricing: { ...p.pricing, customizations: arr },
                            }));
                          }}
                        >
                          ×
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
                      value={form.pricing.discountType}
                      onChange={(e) =>
                        handleNestedChange(
                          "pricing",
                          "discountType",
                          e.target.value
                        )
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
                      value={form.pricing.discountValue}
                      onChange={(e) =>
                        handleNestedChange(
                          "pricing",
                          "discountValue",
                          e.target.value
                        )
                      }
                    />
                  </div>
                </div>

                {(() => {
                  const itemsTotal = (form.items || []).reduce(
                    (sum, it) =>
                      sum +
                      (Number(it.lineTotal) ||
                        (Number(it.quantity) || 0) *
                          (Number(it.unitPrice) || 0)),
                    0
                  );
                  const custom = (form.pricing.customizations || []).reduce(
                    (sum, c) => sum + (Number(c.amount) || 0),
                    0
                  );
                  const subtotal = itemsTotal + custom;
                  const discountAmt =
                    form.pricing.discountType === "percent"
                      ? Math.min(
                          100,
                          Math.max(0, Number(form.pricing.discountValue) || 0)
                        ) *
                        (subtotal / 100)
                      : Number(form.pricing.discountValue) || 0;
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
                        <span className="text-gray-800 font-semibold">
                          Total
                        </span>
                        <span className="text-gray-900 font-bold">
                          ₹{total.toLocaleString("en-IN")}
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          className="px-6 py-3 border-2 border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200 font-medium"
          onClick={onClose}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={!form.items || form.items.length === 0}
          className="px-6 py-3 bg-gradient-to-r from-accent to-yellow-600 text-primary rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 font-semibold hover:scale-105 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-lg"
        >
          <FileText className="h-5 w-5" />
          Create Order
        </button>
      </div>

      {/* Global error summary (bottom-left) */}
      {Object.values(errors).some((m) => m) && (
        <div className="fixed left-4 bottom-4 z-40 max-w-sm bg-red-50 border border-red-200 text-red-800 rounded-lg shadow p-3">
          <p className="font-semibold text-sm mb-1">
            Please fix the following:
          </p>
          <ul className="list-disc pl-5 text-sm space-y-1">
            {Object.entries(errors)
              .filter(([, msg]) => msg)
              .map(([key, msg]) => (
                <li key={key}>{msg}</li>
              ))}
          </ul>
        </div>
      )}

      {/* Client Form Modal */}
      <ClientForm
        isOpen={isClientFormOpen}
        onClose={() => setIsClientFormOpen(false)}
        onSuccess={(newClient) => {
          // Reload clients list and auto-select the newly created client
          loadClients();
          setSelectedClientId(newClient.id);
          setIsClientFormOpen(false);
          // Clear any client selection errors
          if (errors.clientId) {
            setErrors((prev) => ({ ...prev, clientId: "" }));
          }
        }}
        clientService={clientService}
      />

      {/* Measurement Form Modal */}
      {selectedClientId && selectedClient && (
        <MeasurementForm
          isOpen={isMeasurementFormOpen}
          onClose={() => {
            setIsMeasurementFormOpen(false);
            setMeasurementFormForItemIndex(null);
          }}
          onSuccess={async (updatedMeasurement) => {
            // Reload measurements list to get the latest data
            await loadMeasurements();
            setIsMeasurementFormOpen(false);
            setMeasurementFormForItemIndex(null);
          }}
          initialMeasurements={
            measurementFormForItemIndex !== null
              ? getMeasurementForGarmentType(
                  form.items[measurementFormForItemIndex]?.garmentType
                ).measurements
              : null
          }
          garmentType={
            measurementFormForItemIndex !== null
              ? form.items[measurementFormForItemIndex]?.garmentType || "shirt"
              : "shirt"
          }
          clientId={selectedClientId}
          clientName={selectedClient.name}
          measurementService={measurementService}
        />
      )}
    </form>
  );
}

export default OrderForm;
