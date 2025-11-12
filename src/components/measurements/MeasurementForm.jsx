import React, { useState, useEffect } from "react";
import { X, AlertCircle, CheckCircle, Ruler, Info } from "lucide-react";

// Measurement field definitions
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

function MeasurementForm({
  isOpen,
  onClose,
  onSuccess,
  clientId,
  clientName,
  measurementService,
  initialMeasurements = null,
  garmentType: propGarmentType = null,
}) {
  const [garmentType, setGarmentType] = useState(propGarmentType || "shirt");
  const [unit, setUnit] = useState("inches");
  const [measurements, setMeasurements] = useState({});
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customFields, setCustomFields] = useState([]);
  const [newFieldName, setNewFieldName] = useState("");

  useEffect(() => {
    if (propGarmentType) {
      setGarmentType(propGarmentType);
    }
  }, [propGarmentType]);

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen, garmentType]);

  const resetForm = () => {
    let initialMeas = {};
    
    // If initialMeasurements provided, use them (autofill)
    if (initialMeasurements && Object.keys(initialMeasurements).length > 0) {
      initialMeas = { ...initialMeasurements };
    }
    
    // Initialize with fields from selected garment type
    if (MEASUREMENT_FIELDS[garmentType]) {
      MEASUREMENT_FIELDS[garmentType].forEach((field) => {
        if (initialMeas[field.name] === undefined) {
          initialMeas[field.name] = "";
        }
      });
    }
    
    // Extract custom fields from existing measurements
    const fields = MEASUREMENT_FIELDS[garmentType] || [];
    const existingCustomFields = Object.keys(initialMeas).filter(
      key => !fields.find(f => f.name === key)
    );
    setCustomFields(existingCustomFields);
    
    setMeasurements(initialMeas);
    setNotes("");
    setErrors({});
    setNewFieldName("");
  };

  const handleMeasurementChange = (fieldName, value) => {
    // Allow only numbers and single decimal point
    const regex = /^\d*\.?\d*$/;
    if (value === "" || regex.test(value)) {
      setMeasurements((prev) => ({ ...prev, [fieldName]: value }));

      // Clear error for this field
      if (errors[fieldName]) {
        setErrors((prev) => ({ ...prev, [fieldName]: "" }));
      }
    }
  };

  const validateForm = () => {
    const newErrors = {};
    const fields = MEASUREMENT_FIELDS[garmentType] || [];

    // Only validate required fields for the selected garment type template
    fields.forEach((field) => {
      if (field.required && !measurements[field.name]) {
        newErrors[field.name] = `${field.label} is required`;
      } else if (
        measurements[field.name] &&
        parseFloat(measurements[field.name]) <= 0
      ) {
        newErrors[field.name] = `${field.label} must be greater than 0`;
      }
    });

    // Validate custom fields
    customFields.forEach((fieldKey) => {
      if (
        measurements[fieldKey] &&
        parseFloat(measurements[fieldKey]) <= 0
      ) {
        newErrors[fieldKey] = `${fieldKey.replace(/_/g, " ")} must be greater than 0`;
      }
    });

    // Ensure at least one measurement is provided
    const hasAnyMeasurement = Object.values(measurements).some(
      (v) => v !== "" && v !== null && v !== undefined
    );
    if (!hasAnyMeasurement) {
      newErrors.general = "Please enter at least one measurement";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Convert measurements to numbers
      const numericMeasurements = {};
      Object.entries(measurements).forEach(([key, value]) => {
        if (value !== "") {
          numericMeasurements[key] = parseFloat(value);
        }
      });

      const measurementData = {
        clientId,
        garmentType,
        measurements: numericMeasurements,
        unit,
        notes,
      };

      const result = await measurementService.create(measurementData);
      onSuccess(result);
      onClose();
      resetForm();
    } catch (error) {
      console.error("Error saving measurement:", error);
      alert("Failed to save measurement. Please try again.");
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

  const fields = MEASUREMENT_FIELDS[garmentType] || [];

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border-2 border-purple-100">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b-2 border-purple-200 sticky top-0 bg-gradient-to-r from-purple-50 to-indigo-50 z-10">
          <div className="flex items-center gap-3">
            <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-lg">
              <Ruler className="w-5 h-5" />
            </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Add Measurements
            </h2>
            <p className="text-sm text-gray-600 mt-1">For {clientName}</p>
          </div>
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

        {/* Form */}
        <div className="p-6 space-y-6">
          {/* Garment Type & Unit Selection */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Template (for field suggestions) <span className="text-red-500">*</span>
              </label>
              <select
                value={garmentType}
                onChange={(e) => setGarmentType(e.target.value)}
                className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
              >
                <option value="shirt">Shirt</option>
                <option value="blouse">Blouse</option>
                <option value="churidar">Churidar</option>
                <option value="pants">Pants</option>
                <option value="salwar">Salwar</option>
                <option value="skirt">Skirt</option>
                <option value="lehenga">Lehenga</option>
                <option value="saree_blouse">Saree Blouse</option>
                <option value="kids_wear">Kids Wear</option>
                <option value="custom">Custom</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Select a template to get suggested fields. Measurements can be reused across different garment types.
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Unit <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="inches"
                    checked={unit === "inches"}
                    onChange={(e) => setUnit(e.target.value)}
                    className="mr-2"
                  />
                  <span className="text-sm">Inches</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="cm"
                    checked={unit === "cm"}
                    onChange={(e) => setUnit(e.target.value)}
                    className="mr-2"
                  />
                  <span className="text-sm">Centimeters</span>
                </label>
              </div>
            </div>
          </div>

          {/* Measurement Fields */}
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2 capitalize">
              {garmentType} Measurements (Template)
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              These measurements can be reused for any garment type. Only fill in the fields that apply.
            </p>
            {errors.general && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  {errors.general}
                </p>
              </div>
            )}
            {fields.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {fields.map((field) => (
                  <div key={field.name}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {field.label}{" "}
                      {field.required && <span className="text-red-500">*</span>}
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        inputMode="decimal"
                        value={measurements[field.name] || ""}
                        onChange={(e) =>
                          handleMeasurementChange(field.name, e.target.value)
                        }
                        className={`w-full px-4 py-2 pr-16 border-2 rounded-lg focus:ring-2 focus:ring-purple-500 transition-all duration-200 ${
                          errors[field.name]
                            ? "border-red-500 focus:border-red-500"
                            : "border-purple-200 focus:border-purple-500"
                        }`}
                        placeholder="0.0"
                      />
                      <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                        {unit}
                      </span>
                    </div>
                    {errors[field.name] && (
                      <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {errors[field.name]}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800 mb-3">
                    No predefined fields for this garment type. You can add custom measurement fields below.
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newFieldName}
                      onChange={(e) => setNewFieldName(e.target.value)}
                      placeholder="Field name (e.g., waist, length)"
                      className="flex-1 px-3 py-2 border-2 border-purple-300 rounded-lg text-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200"
                      onKeyPress={(e) => {
                        if (e.key === "Enter" && newFieldName.trim()) {
                          const fieldKey = newFieldName.trim().toLowerCase().replace(/\s+/g, "_");
                          if (!customFields.includes(fieldKey) && !measurements[fieldKey]) {
                            setCustomFields([...customFields, fieldKey]);
                            setMeasurements({ ...measurements, [fieldKey]: "" });
                            setNewFieldName("");
                          }
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (newFieldName.trim()) {
                          const fieldKey = newFieldName.trim().toLowerCase().replace(/\s+/g, "_");
                          if (!customFields.includes(fieldKey) && !measurements[fieldKey]) {
                            setCustomFields([...customFields, fieldKey]);
                            setMeasurements({ ...measurements, [fieldKey]: "" });
                            setNewFieldName("");
                          }
                        }
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-lg hover:from-purple-600 hover:to-indigo-700 text-sm font-medium shadow-md hover:shadow-lg transition-all duration-200"
                    >
                      Add Field
                    </button>
                  </div>
                </div>
                {customFields.length > 0 && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {customFields.map((fieldKey) => (
                      <div key={fieldKey}>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-sm font-medium text-gray-700 capitalize">
                            {fieldKey.replace(/_/g, " ")}
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              const newFields = customFields.filter(f => f !== fieldKey);
                              setCustomFields(newFields);
                              const newMeasurements = { ...measurements };
                              delete newMeasurements[fieldKey];
                              setMeasurements(newMeasurements);
                            }}
                            className="text-red-600 hover:text-red-700 text-xs"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                        <div className="relative">
                          <input
                            type="text"
                            inputMode="decimal"
                            value={measurements[fieldKey] || ""}
                            onChange={(e) =>
                              handleMeasurementChange(fieldKey, e.target.value)
                            }
                            className="w-full px-4 py-2 pr-16 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="0.0"
                          />
                          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                            {unit}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
            
            {/* Show existing measurements that aren't in fields or customFields */}
            {Object.keys(measurements).filter(
              key => !fields.find(f => f.name === key) && !customFields.includes(key) && measurements[key] !== ""
            ).length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm font-medium text-gray-700 mb-3">Other Measurements</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Object.keys(measurements)
                    .filter(key => !fields.find(f => f.name === key) && !customFields.includes(key) && measurements[key] !== "")
                    .map((key) => (
                      <div key={key}>
                        <label className="block text-sm font-medium text-gray-700 mb-2 capitalize">
                          {key.replace(/_/g, " ")}
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            inputMode="decimal"
                            value={measurements[key] || ""}
                            onChange={(e) =>
                              handleMeasurementChange(key, e.target.value)
                            }
                            className="w-full px-4 py-2 pr-16 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            placeholder="0.0"
                          />
                          <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">
                            {unit}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional Notes (Optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 border-2 border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 transition-all duration-200"
              placeholder="E.g., Loose fitting preferred, extra length needed, etc."
            />
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
            <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">Measurement Tips:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Use decimal values for half measurements (e.g., 14.5)</li>
                <li>Measurements are saved with version history</li>
                <li>
                  Measurements can be reused across different garment types - they will be filtered based on compatibility when selecting for orders
                </li>
              </ul>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4 border-t-2 border-purple-200">
            <button
              type="button"
              onClick={() => {
                onClose();
                resetForm();
              }}
              className="flex-1 px-4 py-2 border-2 border-purple-200 text-gray-700 rounded-lg hover:bg-purple-50 transition-all duration-200 font-medium"
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
                  Save Measurements
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MeasurementForm;
