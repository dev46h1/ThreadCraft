import React, { useState, useEffect } from "react";
import { X, AlertCircle, CheckCircle } from "lucide-react";

function ClientForm({
  isOpen,
  onClose,
  onSuccess,
  editClient = null,
  clientService,
}) {
  const [formData, setFormData] = useState({
    name: "",
    phoneNumber: "",
    secondaryPhone: "",
    address: "",
    email: "",
    notes: "",
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState(false);

  // Populate form if editing
  useEffect(() => {
    if (editClient) {
      setFormData({
        name: editClient.name || "",
        phoneNumber: editClient.phoneNumber || "",
        secondaryPhone: editClient.secondaryPhone || "",
        address: editClient.address || "",
        email: editClient.email || "",
        notes: editClient.notes || "",
      });
    } else {
      resetForm();
    }
  }, [editClient, isOpen]);

  const resetForm = () => {
    setFormData({
      name: "",
      phoneNumber: "",
      secondaryPhone: "",
      address: "",
      email: "",
      notes: "",
    });
    setErrors({});
    setDuplicateWarning(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error for this field
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }

    // Check for duplicate phone number
    if (name === "phoneNumber" && value.length === 10) {
      checkDuplicatePhone(value);
    } else if (name === "phoneNumber") {
      setDuplicateWarning(false);
    }
  };

  const checkDuplicatePhone = async (phoneNumber) => {
    if (editClient && phoneNumber === editClient.phoneNumber) {
      setDuplicateWarning(false);
      return;
    }

    try {
      const exists = await clientService.phoneExists(phoneNumber);
      setDuplicateWarning(exists);
    } catch (error) {
      console.error("Error checking phone:", error);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    // Name validation
    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    // Phone number validation
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = "Phone number is required";
    } else if (!/^\d{10}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = "Phone number must be 10 digits";
    }

    // Secondary phone validation (optional but must be valid if provided)
    if (formData.secondaryPhone && !/^\d{10}$/.test(formData.secondaryPhone)) {
      newErrors.secondaryPhone = "Phone number must be 10 digits";
    }

    // Email validation (optional but must be valid if provided)
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    if (duplicateWarning && !editClient) {
      const confirmSubmit = window.confirm(
        "This phone number already exists. Do you want to add this client anyway?"
      );
      if (!confirmSubmit) return;
    }

    setIsSubmitting(true);

    try {
      let result;
      if (editClient) {
        result = await clientService.update(editClient.id, formData);
      } else {
        result = await clientService.create(formData);
      }

      onSuccess(result, editClient ? "updated" : "created");
      onClose();
      resetForm();
    } catch (error) {
      console.error("Error saving client:", error);
      alert("Failed to save client. Please try again.");
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

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">
            {editClient ? "Edit Client" : "Add New Client"}
          </h2>
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

        {/* Form */}
        <div className="p-6 space-y-5">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.name ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter client's full name"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.name}
              </p>
            )}
          </div>

          {/* Phone Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleChange}
              maxLength={10}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.phoneNumber || duplicateWarning
                  ? "border-red-500"
                  : "border-gray-300"
              }`}
              placeholder="10-digit mobile number"
            />
            {errors.phoneNumber && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.phoneNumber}
              </p>
            )}
            {duplicateWarning && !errors.phoneNumber && (
              <p className="mt-1 text-sm text-orange-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                This phone number already exists in the system
              </p>
            )}
          </div>

          {/* Secondary Phone */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Secondary Phone (Optional)
            </label>
            <input
              type="tel"
              name="secondaryPhone"
              value={formData.secondaryPhone}
              onChange={handleChange}
              maxLength={10}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.secondaryPhone ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Alternate contact number"
            />
            {errors.secondaryPhone && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.secondaryPhone}
              </p>
            )}
          </div>

          {/* Address */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address (Recommended)
            </label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter full address"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email (Optional)
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                errors.email ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="client@example.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="h-4 w-4" />
                {errors.email}
              </p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes / Preferences (Optional)
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="E.g., Prefers cotton fabrics, size adjustments needed"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => {
                onClose();
                resetForm();
              }}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <CheckCircle className="h-5 w-5" />
                  {editClient ? "Update Client" : "Add Client"}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ClientForm;
