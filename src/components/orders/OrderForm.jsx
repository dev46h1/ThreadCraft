import React, { useEffect, useMemo, useState } from "react";
import {
  clientService,
  measurementService,
  orderService,
} from "../../services/database";

function OrderForm({ isOpen = true, onClose, onSuccess, defaultClientId }) {
  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState(
    defaultClientId || ""
  );
  const [clientMeasurements, setClientMeasurements] = useState([]);
  const [selectedMeasurementId, setSelectedMeasurementId] = useState("");

  const [form, setForm] = useState({
    orderDate: new Date().toISOString().split("T")[0],
    deliveryDate: "",
    priority: "normal",
    garmentType: "churidar",
    quantity: 1,
    fabricDetails: {
      type: "",
      providedBy: "client",
      measurements: "",
      notes: "",
    },
    designDetails: { description: "", referenceNumber: "" },
    specialInstructions: "",
    pricing: {
      baseCharge: 0,
      customizations: [], // { description, amount }
      materialCharges: 0,
      urgentCharges: 0,
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
    clientService.getAll().then(setClients);
  }, []);

  useEffect(() => {
    if (!selectedClientId) {
      setClientMeasurements([]);
      setSelectedMeasurementId("");
      return;
    }
    measurementService.getByClientId(selectedClientId).then((list) => {
      // newest first
      const sorted = [...list].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
      setClientMeasurements(sorted);
      if (sorted.length > 0) setSelectedMeasurementId(sorted[0].id);
    });
  }, [selectedClientId]);

  const selectedClient = useMemo(
    () => clients.find((c) => c.id === selectedClientId),
    [clients, selectedClientId]
  );

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleNestedChange = (section, name, value) => {
    setForm((prev) => ({
      ...prev,
      [section]: { ...prev[section], [name]: value },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedClient) {
      alert("Please select a client");
      return;
    }
    if (!form.deliveryDate) {
      alert("Please choose a delivery date");
      return;
    }

    const measurement = selectedMeasurementId
      ? await measurementService.getById(selectedMeasurementId)
      : null;

    const totals = (() => {
      const base = Number(form.pricing.baseCharge) || 0;
      const custom = (form.pricing.customizations || []).reduce(
        (sum, c) => sum + (Number(c.amount) || 0),
        0
      );
      const material = Number(form.pricing.materialCharges) || 0;
      const urgent = Number(form.pricing.urgentCharges) || 0;
      const subtotal = base + custom + material + urgent;
      const discountAmt =
        form.pricing.discountType === "percent"
          ? Math.min(
              100,
              Math.max(0, Number(form.pricing.discountValue) || 0)
            ) *
            (subtotal / 100)
          : Number(form.pricing.discountValue) || 0;
      const total = Math.max(0, Math.round(subtotal - discountAmt));
      return { subtotal, discountAmt, total };
    })();

    const created = await orderService.create({
      clientId: selectedClient.id,
      clientName: selectedClient.name,
      clientPhone: selectedClient.phoneNumber,
      deliveryDate: new Date(form.deliveryDate).toISOString(),
      garmentType: form.garmentType,
      quantity: Number(form.quantity) || 1,
      priority: form.priority,
      fabricDetails: form.fabricDetails,
      designDetails: form.designDetails,
      measurementId: measurement?.id || null,
      measurementSnapshot: measurement?.measurements || {},
      specialInstructions: form.specialInstructions,
      pricing: {
        baseCharge: Number(form.pricing.baseCharge) || 0,
        customizations: (form.pricing.customizations || []).map((c) => ({
          description: c.description || "",
          amount: Number(c.amount) || 0,
        })),
        materialCharges: Number(form.pricing.materialCharges) || 0,
        urgentCharges: Number(form.pricing.urgentCharges) || 0,
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
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Client</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Select client
            </label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
            >
              <option value="">-- Choose client --</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.phoneNumber})
                </option>
              ))}
            </select>
          </div>
          {selectedClient && (
            <div className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">
              <div className="font-medium">{selectedClient.name}</div>
              <div className="text-gray-600">{selectedClient.phoneNumber}</div>
              <div className="text-gray-600">{selectedClient.id}</div>
            </div>
          )}
        </div>
      </div>

      {/* Step 2: Order details */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Order Details
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Order date
            </label>
            <input
              type="date"
              name="orderDate"
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              value={form.orderDate}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Delivery date
            </label>
            <input
              type="date"
              name="deliveryDate"
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              value={form.deliveryDate}
              onChange={handleChange}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Priority</label>
            <select
              name="priority"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 capitalize"
              value={form.priority}
              onChange={handleChange}
            >
              <option value="normal">Normal</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Garment type
            </label>
            <select
              name="garmentType"
              className="w-full border border-gray-300 rounded-lg px-3 py-2 capitalize"
              value={form.garmentType}
              onChange={handleChange}
            >
              {garmentOptions.map((g) => (
                <option key={g} value={g}>
                  {g.replace("_", " ")}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Quantity</label>
            <input
              type="number"
              name="quantity"
              min="1"
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              value={form.quantity}
              onChange={handleChange}
            />
          </div>
        </div>
      </div>

      {/* Step 3: Fabric & Design */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Fabric & Design
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Fabric type
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              value={form.fabricDetails.type}
              onChange={(e) =>
                handleNestedChange("fabricDetails", "type", e.target.value)
              }
              placeholder="Cotton, Silk, ..."
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Provided by
            </label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              value={form.fabricDetails.providedBy}
              onChange={(e) =>
                handleNestedChange(
                  "fabricDetails",
                  "providedBy",
                  e.target.value
                )
              }
            >
              <option value="client">Client</option>
              <option value="tailor">Tailor</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Fabric measurements
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              value={form.fabricDetails.measurements}
              onChange={(e) =>
                handleNestedChange(
                  "fabricDetails",
                  "measurements",
                  e.target.value
                )
              }
              placeholder="Length/Width if applicable"
            />
          </div>
          <div className="md:col-span-3">
            <label className="block text-sm text-gray-600 mb-1">
              Design description
            </label>
            <textarea
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              value={form.designDetails.description}
              onChange={(e) =>
                handleNestedChange(
                  "designDetails",
                  "description",
                  e.target.value
                )
              }
              rows={3}
              placeholder="Describe the design/reference"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Reference number
            </label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              value={form.designDetails.referenceNumber}
              onChange={(e) =>
                handleNestedChange(
                  "designDetails",
                  "referenceNumber",
                  e.target.value
                )
              }
              placeholder="#REF-123"
            />
          </div>
          <div className="md:col-span-3">
            <label className="block text-sm text-gray-600 mb-1">
              Special instructions
            </label>
            <textarea
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              value={form.specialInstructions}
              onChange={(e) =>
                setForm((p) => ({ ...p, specialInstructions: e.target.value }))
              }
              rows={2}
              placeholder="Any special notes..."
            />
          </div>
        </div>
      </div>

      {/* Step 4: Measurements */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          Measurements
        </h3>
        {selectedClientId ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">
                Use saved measurement
              </label>
              <select
                className="w-full border border-gray-300 rounded-lg px-3 py-2"
                value={selectedMeasurementId}
                onChange={(e) => setSelectedMeasurementId(e.target.value)}
              >
                {clientMeasurements.length === 0 && (
                  <option value="">No saved measurements</option>
                )}
                {clientMeasurements.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.garmentType} • v{m.version} •{" "}
                    {new Date(m.createdAt).toLocaleDateString("en-IN")}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                A snapshot will be saved with the order.
              </p>
            </div>
          </div>
        ) : (
          <p className="text-gray-600 text-sm">
            Select a client to load measurements.
          </p>
        )}
      </div>

      {/* Step 5: Pricing */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Pricing</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Base charge (₹)
            </label>
            <input
              type="number"
              min="0"
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              value={form.pricing.baseCharge}
              onChange={(e) =>
                handleNestedChange("pricing", "baseCharge", e.target.value)
              }
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Material charges (₹)
            </label>
            <input
              type="number"
              min="0"
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              value={form.pricing.materialCharges}
              onChange={(e) =>
                handleNestedChange("pricing", "materialCharges", e.target.value)
              }
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              Urgent charges (₹)
            </label>
            <input
              type="number"
              min="0"
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              value={form.pricing.urgentCharges}
              onChange={(e) =>
                handleNestedChange("pricing", "urgentCharges", e.target.value)
              }
            />
          </div>
        </div>

        {/* Customizations */}
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm text-gray-600">Additional charges</label>
            <button
              type="button"
              className="px-3 py-1 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
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
              <div key={idx} className="grid grid-cols-1 md:grid-cols-12 gap-2">
                <input
                  type="text"
                  placeholder="Description"
                  className="md:col-span-8 border border-gray-300 rounded-lg px-3 py-2"
                  value={item.description}
                  onChange={(e) => {
                    const arr = [...(form.pricing.customizations || [])];
                    arr[idx] = { ...arr[idx], description: e.target.value };
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
                  className="md:col-span-3 border border-gray-300 rounded-lg px-3 py-2"
                  value={item.amount}
                  onChange={(e) => {
                    const arr = [...(form.pricing.customizations || [])];
                    arr[idx] = { ...arr[idx], amount: e.target.value };
                    setForm((p) => ({
                      ...p,
                      pricing: { ...p.pricing, customizations: arr },
                    }));
                  }}
                />
                <button
                  type="button"
                  className="md:col-span-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  onClick={() => {
                    const arr = [...(form.pricing.customizations || [])];
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
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              value={form.pricing.discountType}
              onChange={(e) =>
                handleNestedChange("pricing", "discountType", e.target.value)
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
              className="w-full border border-gray-300 rounded-lg px-3 py-2"
              value={form.pricing.discountValue}
              onChange={(e) =>
                handleNestedChange("pricing", "discountValue", e.target.value)
              }
            />
          </div>
        </div>

        {(() => {
          const base = Number(form.pricing.baseCharge) || 0;
          const custom = (form.pricing.customizations || []).reduce(
            (sum, c) => sum + (Number(c.amount) || 0),
            0
          );
          const material = Number(form.pricing.materialCharges) || 0;
          const urgent = Number(form.pricing.urgentCharges) || 0;
          const subtotal = base + custom + material + urgent;
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
            <div className="mt-4 bg-gray-50 border border-gray-200 rounded-lg p-4 max-w-md ml-auto">
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
      </div>

      <div className="flex items-center justify-end gap-3">
        <button
          type="button"
          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
          onClick={onClose}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Create Order
        </button>
      </div>
    </form>
  );
}

export default OrderForm;
