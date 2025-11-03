import React, { useState, useEffect } from "react";
import { X, AlertCircle, Search, User, Calendar, Package } from "lucide-react";

function OrderForm({
  isOpen,
  onClose,
  onSuccess,
  clientService,
  preSelectedClientId = null,
}) {
  const [step, setStep] = useState(1);
  const [clients, setClients] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredClients, setFilteredClients] = useState([]);

  // Form data
  const [selectedClient, setSelectedClient] = useState(null);
  const [formData, setFormData] = useState({
    orderDate: new Date().toISOString().split("T")[0],
    deliveryDate: "",
    priority: "normal",
    garmentType: "",
    quantity: 1,
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load clients on mount
  useEffect(() => {
    if (isOpen) {
      loadClients();
      resetForm();

      // If pre-selected client ID is provided, load and select that client
      if (preSelectedClientId) {
        loadPreSelectedClient(preSelectedClientId);
      }
    }
  }, [isOpen, preSelectedClientId]);

  // Filter clients based on search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredClients(clients);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = clients.filter(
      (client) =>
        client.name.toLowerCase().includes(query) ||
        client.phoneNumber.includes(query) ||
        client.id.toLowerCase().includes(query)
    );
    setFilteredClients(filtered);
  }, [searchQuery, clients]);

  const loadClients = async () => {
    try {
      const allClients = await clientService.getAll();
      setClients(allClients);
      setFilteredClients(allClients);
    } catch (error) {
      console.error("Error loading clients:", error);
    }
  };

  const loadPreSelectedClient = async (clientId) => {
    try {
      const client = await clientService.getById(clientId);
      if (client) {
        setSelectedClient(client);
        setStep(2); // Move to order details step
      }
    } catch (error) {
      console.error("Error loading pre-selected client:", error);
    }
  };

  const resetForm = () => {
    setStep(1);
    setSelectedClient(null);
    setSearchQuery("");
    setFormData({
      orderDate: new Date().toISOString().split("T")[0],
      deliveryDate: "",
      priority: "normal",
      garmentType: "",
      quantity: 1,
    });
    setErrors({});
  };

  const handleClientSelect = (client) => {
    setSelectedClient(client);
    setStep(2);
    setSearchQuery("");
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateStep2 = () => {
    const newErrors = {};

    // Delivery date validation
    if (!formData.deliveryDate) {
      newErrors.deliveryDate = "Delivery date is required";
    } else {
      const deliveryDate = new Date(formData.deliveryDate);
      const orderDate = new Date(formData.orderDate);

      if (deliveryDate < orderDate) {
        newErrors.deliveryDate = "Delivery date cannot be before order date";
      }
    }

    // Garment type validation
    if (!formData.garmentType) {
      newErrors.garmentType = "Garment type is required";
    }

    // Quantity validation
    if (!formData.quantity || formData.quantity < 1) {
      newErrors.quantity = "Quantity must be at least 1";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 2 && validateStep2()) {
      // For now, just show success since we're only implementing basic info
      handleSubmit();
    }
  };

  const handleSubmit = async () => {
    if (!validateStep2()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // This will be expanded in later tasks to include more order details
      const orderData = {
        clientId: selectedClient.id,
        clientName: selectedClient.name,
        clientPhone: selectedClient.phoneNumber,
        orderDate: formData.orderDate,
        deliveryDate: formData.deliveryDate,
        priority: formData.priority,
        garmentType: formData.garmentType,
        quantity: formData.quantity,
      };

      onSuccess(orderData);
      onClose();
      resetForm();
    } catch (error) {
      console.error("Error creating order:", error);
      alert("Failed to create order. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
      resetForm();
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
      setErrors({});
    }
  };

  if (!isOpen) return null;

  const garmentTypes = [
    { value: "shirt", label: "Shirt" },
    { value: "blouse", label: "Blouse" },
    { value: "churidar", label: "Churidar" },
    { value: "kurta", label: "Kurta" },
    { value: "pant", label: "Pant" },
    { value: "saree_blouse", label: "Saree Blouse" },
  ];

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Package className="h-6 w-6 text-blue-600" />
              Create New Order
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Step {step} of 2: {step === 1 ? "Select Client" : "Order Details"}
            </p>
          </div>
          <button
            onClick={() => {
              onClose();
              resetForm();
            }}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>

        {/* Step 1: Client Selection */}
        {step === 1 && (
          <div className="p-6 space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Client <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, phone, or ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Client List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredClients.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <User className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p>
                    {searchQuery
                      ? "No clients found matching your search"
                      : "No clients available"}
                  </p>
                </div>
              ) : (
                filteredClients.map((client) => (
                  <div
                    key={client.id}
                    onClick={() => handleClientSelect(client)}
                    className="p-4 border border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900">
                          {client.name}
                        </h4>
                        <p className="text-sm text-gray-600 mt-1">
                          {client.phoneNumber}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {client.id}
                        </p>
                      </div>
                      <div className="text-right">
                        {client.address && (
                          <p className="text-sm text-gray-600 line-clamp-2 max-w-xs">
                            {client.address}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Step 2: Order Details */}
        {step === 2 && selectedClient && (
          <div className="p-6 space-y-6">
            {/* Selected Client Info */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600 font-medium">
                    Client Selected
                  </p>
                  <h4 className="text-lg font-semibold text-gray-900 mt-1">
                    {selectedClient.name}
                  </h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {selectedClient.phoneNumber}
                  </p>
                </div>
                <button
                  onClick={handleBack}
                  className="px-3 py-1.5 text-sm border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  Change Client
                </button>
              </div>
            </div>

            {/* Order Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Order Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="date"
                  name="orderDate"
                  value={formData.orderDate}
                  onChange={handleChange}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">
                Auto-filled with today's date
              </p>
            </div>

            {/* Delivery Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Delivery Date <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="date"
                  name="deliveryDate"
                  value={formData.deliveryDate}
                  onChange={handleChange}
                  min={formData.orderDate}
                  className={`w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                    errors.deliveryDate ? "border-red-500" : "border-gray-300"
                  }`}
                />
              </div>
              {errors.deliveryDate && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.deliveryDate}
                </p>
              )}
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Priority <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="priority"
                    value="normal"
                    checked={formData.priority === "normal"}
                    onChange={handleChange}
                    className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Normal</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    name="priority"
                    value="urgent"
                    checked={formData.priority === "urgent"}
                    onChange={handleChange}
                    className="mr-2 h-4 w-4 text-orange-600 focus:ring-orange-500"
                  />
                  <span className="text-sm text-gray-700 flex items-center gap-1">
                    Urgent
                    <span className="text-xs text-orange-600">(+charges)</span>
                  </span>
                </label>
              </div>
            </div>

            {/* Garment Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Garment Type <span className="text-red-500">*</span>
              </label>
              <select
                name="garmentType"
                value={formData.garmentType}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.garmentType ? "border-red-500" : "border-gray-300"
                }`}
              >
                <option value="">Select garment type...</option>
                {garmentTypes.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
              {errors.garmentType && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.garmentType}
                </p>
              )}
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="quantity"
                value={formData.quantity}
                onChange={handleChange}
                min="1"
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors.quantity ? "border-red-500" : "border-gray-300"
                }`}
              />
              {errors.quantity && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors.quantity}
                </p>
              )}
            </div>

            {/* Info Box */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-gray-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-gray-700">
                <p className="font-medium">Order ID will be auto-generated</p>
                <p className="mt-1 text-gray-600">
                  Format: ORD-YYYYMMDD-XXXX (e.g., ORD-20251103-0001)
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer Buttons */}
        <div className="flex gap-3 p-6 border-t border-gray-200 bg-gray-50">
          {step === 1 ? (
            <>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  resetForm();
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                Cancel
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={handleBack}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors font-medium"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleNext}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Creating...
                  </span>
                ) : (
                  "Continue"
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default OrderForm;
