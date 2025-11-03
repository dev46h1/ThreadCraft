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
        baseCharge: 0,
        customizations: [],
        materialCharges: 0,
        urgentCharges: form.priority === "urgent" ? 0 : 0,
        subtotal: 0,
        discount: { amount: 0, reason: "" },
        total: 0,
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
