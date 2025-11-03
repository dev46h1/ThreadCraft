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
}) {
  const [garmentType, setGarmentType] = useState("shirt");
  const [unit, setUnit] = useState("inches");
  const [measurements, setMeasurements] = useState({});
  const [notes, setNotes] = useState("");
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      resetForm();
    }
  }, [isOpen, garmentType]);

  const resetForm = () => {
    const initialMeasurements = {};
    MEASUREMENT_FIELDS[garmentType].forEach((field) => {
      initialMeasurements[field.name] = "";
    });
    setMeasurements(initialMeasurements);
    setNotes("");
    setErrors({});
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
    const fields = MEASUREMENT_FIELDS[garmentType];

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

  const fields = MEASUREMENT_FIELDS[garmentType];

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
              <Ruler className="h-6 w-6 text-blue-600" />
              Add Measurements
            </h2>
            <p className="text-sm text-gray-600 mt-1">For {clientName}</p>
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
                Garment Type <span className="text-red-500">*</span>
              </label>
              <select
                value={garmentType}
                onChange={(e) => setGarmentType(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="shirt">Shirt</option>
                <option value="blouse">Blouse</option>
                <option value="churidar">Churidar</option>
              </select>
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
            <h3 className="text-lg font-semibold text-gray-900 mb-4 capitalize">
              {garmentType} Measurements
            </h3>
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
                      className={`w-full px-4 py-2 pr-16 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        errors[field.name]
                          ? "border-red-500"
                          : "border-gray-300"
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="E.g., Loose fitting preferred, extra length needed, etc."
            />
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">Measurement Tips:</p>
              <ul className="list-disc list-inside mt-1 space-y-1">
                <li>Use decimal values for half measurements (e.g., 14.5)</li>
                <li>Measurements are saved with version history</li>
                <li>
                  This will become the active measurement for this garment type
                </li>
              </ul>
            </div>
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
