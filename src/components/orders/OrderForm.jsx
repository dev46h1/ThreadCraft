import React, { useState, useEffect } from "react";
import {
  X,
  AlertCircle,
  Search,
  User,
  Calendar,
  Package,
  Scissors,
  Palette,
  Save,
} from "lucide-react";

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
    fabricDetails: {
      type: "",
      providedBy: "client",
      measurements: {
        length: "",
        width: "",
      },
      notes: "",
    },
    designDetails: {
      description: "",
      referenceNumber: "",
      specialInstructions: "",
    },
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);

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
      fabricDetails: {
        type: "",
        providedBy: "client",
        measurements: {
          length: "",
          width: "",
        },
        notes: "",
      },
      designDetails: {
        description: "",
        referenceNumber: "",
        specialInstructions: "",
      },
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

  const handleNestedChange = (section, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));

    // Clear error for this field
    if (errors[`${section}.${field}`]) {
      setErrors((prev) => ({ ...prev, [`${section}.${field}`]: "" }));
    }
  };

  const handleFabricMeasurementChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      fabricDetails: {
        ...prev.fabricDetails,
        measurements: {
          ...prev.fabricDetails.measurements,
          [field]: value,
        },
      },
    }));
  };

  const validateStep2 = () => {
    const newErrors = {};

    // Basic order details validation
    if (!formData.deliveryDate) {
      newErrors.deliveryDate = "Delivery date is required";
    } else {
      const deliveryDate = new Date(formData.deliveryDate);
      const orderDate = new Date(formData.orderDate);

      if (deliveryDate < orderDate) {
        newErrors.deliveryDate = "Delivery date cannot be before order date";
      }
    }

    if (!formData.garmentType) {
      newErrors.garmentType = "Garment type is required";
    }

    if (!formData.quantity || formData.quantity < 1) {
      newErrors.quantity = "Quantity must be at least 1";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep3 = () => {
    const newErrors = {};

    // Fabric details validation
    if (!formData.fabricDetails.type.trim()) {
      newErrors["fabricDetails.type"] = "Fabric type is required";
    }

    // Fabric measurements validation (only if provided by tailor)
    if (formData.fabricDetails.providedBy === "tailor") {
      if (!formData.fabricDetails.measurements.length) {
        newErrors["fabricDetails.measurements.length"] =
          "Fabric length is required";
      }
      if (!formData.fabricDetails.measurements.width) {
        newErrors["fabricDetails.measurements.width"] =
          "Fabric width is required";
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep4 = () => {
    const newErrors = {};

    // Design details validation
    if (!formData.designDetails.description.trim()) {
      newErrors["designDetails.description"] = "Design description is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 2 && validateStep2()) {
      setStep(3);
    } else if (step === 3 && validateStep3()) {
      setStep(4);
    } else if (step === 4 && validateStep4()) {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
      setErrors({});
    }
  };

  const handleSaveDraft = async () => {
    setIsSavingDraft(true);

    try {
      // Save to localStorage as draft
      const draftData = {
        selectedClient,
        formData,
        step,
        savedAt: new Date().toISOString(),
      };

      localStorage.setItem("orderDraft", JSON.stringify(draftData));

      alert("Draft saved successfully! You can continue later.");
    } catch (error) {
      console.error("Error saving draft:", error);
      alert("Failed to save draft. Please try again.");
    } finally {
      setIsSavingDraft(false);
    }
  };

  const loadDraft = () => {
    try {
      const draftData = localStorage.getItem("orderDraft");
      if (draftData) {
        const parsed = JSON.parse(draftData);
        setSelectedClient(parsed.selectedClient);
        setFormData(parsed.formData);
        setStep(parsed.step);
        return true;
      }
      return false;
    } catch (error) {
      console.error("Error loading draft:", error);
      return false;
    }
  };

  const clearDraft = () => {
    localStorage.removeItem("orderDraft");
  };

  const handleSubmit = async () => {
    if (!validateStep2() || !validateStep3() || !validateStep4()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const orderData = {
        clientId: selectedClient.id,
        clientName: selectedClient.name,
        clientPhone: selectedClient.phoneNumber,
        orderDate: formData.orderDate,
        deliveryDate: formData.deliveryDate,
        priority: formData.priority,
        garmentType: formData.garmentType,
        quantity: formData.quantity,
        fabricDetails: {
          type: formData.fabricDetails.type,
          providedBy: formData.fabricDetails.providedBy,
          measurements:
            formData.fabricDetails.providedBy === "tailor"
              ? {
                  length:
                    parseFloat(formData.fabricDetails.measurements.length) || 0,
                  width:
                    parseFloat(formData.fabricDetails.measurements.width) || 0,
                }
              : null,
          notes: formData.fabricDetails.notes,
        },
        designDetails: {
          description: formData.designDetails.description,
          referenceNumber: formData.designDetails.referenceNumber,
          specialInstructions: formData.designDetails.specialInstructions,
        },
      };

      onSuccess(orderData);
      clearDraft(); // Clear draft on successful submission
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
      if (confirm("You have unsaved changes. Do you want to save as draft?")) {
        handleSaveDraft();
      }
      onClose();
      resetForm();
    }
  };

  // Check for draft on mount
  useEffect(() => {
    if (isOpen && !preSelectedClientId) {
      const hasDraft = loadDraft();
      if (hasDraft) {
        const confirmLoad = confirm(
          "You have a saved draft. Would you like to continue?"
        );
        if (!confirmLoad) {
          clearDraft();
          resetForm();
        }
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const garmentTypes = [
    { value: "shirt", label: "Shirt" },
    { value: "blouse", label: "Blouse" },
    { value: "churidar", label: "Churidar" },
    { value: "kurta", label: "Kurta" },
    { value: "pant", label: "Pant" },
    { value: "saree_blouse", label: "Saree Blouse" },
  ];

  const fabricTypes = [
    "Cotton",
    "Silk",
    "Chiffon",
    "Georgette",
    "Linen",
    "Polyester",
    "Crepe",
    "Velvet",
    "Satin",
    "Brocade",
    "Other",
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
              Step {step} of 4:{" "}
              {step === 1
                ? "Select Client"
                : step === 2
                ? "Order Details"
                : step === 3
                ? "Fabric Details"
                : "Design Details"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {step > 1 && (
              <button
                onClick={handleSaveDraft}
                disabled={isSavingDraft}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                title="Save as draft"
              >
                <Save className="h-5 w-5 text-gray-600" />
              </button>
            )}
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
          </div>
        )}

        {/* Step 3: Fabric Details */}
        {step === 3 && (
          <div className="p-6 space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <Scissors className="h-6 w-6 text-purple-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Fabric Details
              </h3>
            </div>

            {/* Fabric Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fabric Type <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.fabricDetails.type}
                onChange={(e) =>
                  handleNestedChange("fabricDetails", "type", e.target.value)
                }
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors["fabricDetails.type"]
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
              >
                <option value="">Select fabric type...</option>
                {fabricTypes.map((fabric) => (
                  <option key={fabric} value={fabric}>
                    {fabric}
                  </option>
                ))}
              </select>
              {errors["fabricDetails.type"] && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors["fabricDetails.type"]}
                </p>
              )}
            </div>

            {/* Provided By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fabric Provided By <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-4">
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    value="client"
                    checked={formData.fabricDetails.providedBy === "client"}
                    onChange={(e) =>
                      handleNestedChange(
                        "fabricDetails",
                        "providedBy",
                        e.target.value
                      )
                    }
                    className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Client</span>
                </label>
                <label className="flex items-center cursor-pointer">
                  <input
                    type="radio"
                    value="tailor"
                    checked={formData.fabricDetails.providedBy === "tailor"}
                    onChange={(e) =>
                      handleNestedChange(
                        "fabricDetails",
                        "providedBy",
                        e.target.value
                      )
                    }
                    className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-700">Tailor/Shop</span>
                </label>
              </div>
            </div>

            {/* Fabric Measurements (only if provided by tailor) */}
            {formData.fabricDetails.providedBy === "tailor" && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 space-y-4">
                <p className="text-sm font-medium text-purple-900">
                  Fabric Measurements
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Length (meters) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.fabricDetails.measurements.length}
                      onChange={(e) =>
                        handleFabricMeasurementChange("length", e.target.value)
                      }
                      placeholder="0.0"
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors["fabricDetails.measurements.length"]
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                    />
                    {errors["fabricDetails.measurements.length"] && (
                      <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {errors["fabricDetails.measurements.length"]}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Width (meters) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.fabricDetails.measurements.width}
                      onChange={(e) =>
                        handleFabricMeasurementChange("width", e.target.value)
                      }
                      placeholder="0.0"
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors["fabricDetails.measurements.width"]
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                    />
                    {errors["fabricDetails.measurements.width"] && (
                      <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {errors["fabricDetails.measurements.width"]}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Fabric Notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Fabric Notes (Optional)
              </label>
              <textarea
                value={formData.fabricDetails.notes}
                onChange={(e) =>
                  handleNestedChange("fabricDetails", "notes", e.target.value)
                }
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="E.g., Color preferences, pattern details, fabric care instructions..."
              />
            </div>
          </div>
        )}

        {/* Step 4: Design Details */}
        {step === 4 && (
          <div className="p-6 space-y-6">
            <div className="flex items-center gap-2 mb-4">
              <Palette className="h-6 w-6 text-pink-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Design Details
              </h3>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Design Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={formData.designDetails.description}
                onChange={(e) =>
                  handleNestedChange(
                    "designDetails",
                    "description",
                    e.target.value
                  )
                }
                rows={4}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                  errors["designDetails.description"]
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
                placeholder="Describe the design, style, embellishments, etc..."
              />
              {errors["designDetails.description"] && (
                <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {errors["designDetails.description"]}
                </p>
              )}
            </div>

            {/* Reference Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Reference Number (Optional)
              </label>
              <input
                type="text"
                value={formData.designDetails.referenceNumber}
                onChange={(e) =>
                  handleNestedChange(
                    "designDetails",
                    "referenceNumber",
                    e.target.value
                  )
                }
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="E.g., Design catalog number, image reference, etc."
              />
            </div>

            {/* Special Instructions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Special Instructions (Optional)
              </label>
              <textarea
                value={formData.designDetails.specialInstructions}
                onChange={(e) =>
                  handleNestedChange(
                    "designDetails",
                    "specialInstructions",
                    e.target.value
                  )
                }
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Any specific requirements, fitting preferences, modifications needed..."
              />
            </div>

            {/* Summary */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-2">
              <p className="text-sm font-medium text-gray-900">Order Summary</p>
              <div className="text-sm text-gray-600 space-y-1">
                <p>
                  <span className="font-medium">Client:</span>{" "}
                  {selectedClient?.name}
                </p>
                <p>
                  <span className="font-medium">Garment:</span>{" "}
                  {formData.garmentType} (x{formData.quantity})
                </p>
                <p>
                  <span className="font-medium">Delivery:</span>{" "}
                  {new Date(formData.deliveryDate).toLocaleDateString("en-IN")}
                </p>
                <p>
                  <span className="font-medium">Fabric:</span>{" "}
                  {formData.fabricDetails.type} (Provided by{" "}
                  {formData.fabricDetails.providedBy})
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
                    {step === 4 ? "Creating..." : "Processing..."}
                  </span>
                ) : step === 4 ? (
                  "Create Order"
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
