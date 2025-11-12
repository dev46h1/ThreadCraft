import React, { useEffect, useState } from "react";
import { DollarSign, Pencil, X, Check } from "lucide-react";
import { ratesService } from "../services/database";

// Garment types from OrderForm
const GARMENT_TYPES = [
  "shirt",
  "blouse",
  "churidar",
  "salwar",
  "pants",
  "skirt",
  "lehenga",
  "saree_blouse",
  "kids_wear",
];

function Rates() {
  const [rates, setRates] = useState({});
  const [editingRates, setEditingRates] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState({ type: "", message: "" });

  useEffect(() => {
    loadRates();
  }, []);

  const loadRates = async () => {
    const allRates = await ratesService.getAll();
    // Initialize all garment types with their rates or 0
    const initialRates = {};
    GARMENT_TYPES.forEach((type) => {
      initialRates[type] = allRates[type] || 0;
    });
    setRates(initialRates);
    setEditingRates(initialRates);
  };

  const handleEdit = () => {
    setEditingRates({ ...rates });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditingRates({ ...rates });
    setIsEditing(false);
  };

  const handleChange = (garmentType, value) => {
    setEditingRates((prev) => ({
      ...prev,
      [garmentType]: Number(value) || 0,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save all rates
      for (const [garmentType, rate] of Object.entries(editingRates)) {
        await ratesService.setRate(garmentType, rate);
      }
      setRates({ ...editingRates });
      setIsEditing(false);
      setBanner({ type: "success", message: "Rates saved successfully" });
      setTimeout(() => setBanner({ type: "", message: "" }), 3000);
    } catch (error) {
      console.error("Error saving rates:", error);
      setBanner({ type: "error", message: "Failed to save rates" });
      setTimeout(() => setBanner({ type: "", message: "" }), 3000);
    } finally {
      setSaving(false);
    }
  };

  const formatGarmentType = (type) => {
    return type
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  return (
    <div>
      {/* Colorful Page Header */}
      <div className="relative overflow-hidden rounded-2xl mb-6 border-2 border-purple-100 bg-gradient-to-r from-purple-50 via-indigo-50 to-pink-50 shadow-lg group">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="relative z-10 p-5 flex items-center gap-3">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-lg">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-primary">
              Rates
            </h2>
            <p className="mt-1 text-base text-muted">
              Set default rates for each garment type
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-lg border-2 border-purple-100 group relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-heading font-semibold text-primary">
              Garment Rates
            </h3>
            {!isEditing ? (
              <button
                onClick={handleEdit}
                className="px-4 py-2 border-2 border-purple-200 rounded-lg hover:bg-purple-50 text-purple-700 font-medium transition-all duration-200 flex items-center gap-2"
              >
                <Pencil className="h-4 w-4" />
                Edit
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 border-2 border-gray-300 rounded-lg hover:bg-gray-50 text-gray-700 font-medium transition-all duration-200 flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 bg-gradient-to-r from-accent to-yellow-600 text-primary rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 font-semibold hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2"
                >
                  <Check className="h-4 w-4" />
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            )}
          </div>

          {banner.message && (
            <div
              className={`mb-6 p-3 rounded-lg border text-sm ${
                banner.type === "success"
                  ? "bg-green-50 border-green-200 text-green-800"
                  : "bg-red-50 border-red-200 text-red-800"
              }`}
            >
              {banner.message}
            </div>
          )}

          <div className="space-y-4">
            {GARMENT_TYPES.map((garmentType) => (
              <div
                key={garmentType}
                className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center p-4 border-2 border-purple-200 rounded-lg hover:bg-purple-50 transition-all duration-200"
              >
                <div className="md:col-span-1">
                  <label className="text-sm font-medium text-gray-700 capitalize">
                    {formatGarmentType(garmentType)}
                  </label>
                </div>
                <div className="md:col-span-2">
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">₹</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="flex-1 border-2 border-purple-200 rounded-lg px-3 py-2 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200"
                        value={editingRates[garmentType] || 0}
                        onChange={(e) =>
                          handleChange(garmentType, e.target.value)
                        }
                        placeholder="0.00"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-gray-600">₹</span>
                      <span className="text-lg font-semibold text-gray-900">
                        {(rates[garmentType] || 0).toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Rates;
