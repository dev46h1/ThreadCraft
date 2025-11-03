import React from "react";
import { Ruler, Calendar, Edit2, FileText, ChevronRight } from "lucide-react";

function MeasurementDisplay({
  measurements,
  onEdit,
  onAddNew,
  showEmptyState = true,
}) {
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const groupMeasurementsByType = () => {
    const grouped = {};
    measurements.forEach((m) => {
      if (!grouped[m.garmentType]) {
        grouped[m.garmentType] = [];
      }
      grouped[m.garmentType].push(m);
    });
    return grouped;
  };

  const renderMeasurementValue = (key, value, unit) => {
    // Convert camelCase to readable format
    const label = key
      .replace(/([A-Z])/g, " $1")
      .replace(/^./, (str) => str.toUpperCase())
      .trim();

    return (
      <div
        key={key}
        className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0"
      >
        <span className="text-sm text-gray-600">{label}</span>
        <span className="text-sm font-medium text-gray-900">
          {value} {unit}
        </span>
      </div>
    );
  };

  if (measurements.length === 0 && showEmptyState) {
    return (
      <div className="text-center py-8">
        <Ruler className="h-12 w-12 text-gray-400 mx-auto mb-3" />
        <p className="text-gray-500 mb-3">No measurements saved yet</p>
        <button
          onClick={onAddNew}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Add First Measurement
        </button>
      </div>
    );
  }

  const groupedMeasurements = groupMeasurementsByType();

  return (
    <div className="space-y-4">
      {Object.entries(groupedMeasurements).map(
        ([garmentType, measurementList]) => {
          // Get active measurement
          const activeMeasurement = measurementList.find((m) => m.isActive);
          const hasHistory = measurementList.length > 1;

          if (!activeMeasurement) return null;

          return (
            <div
              key={garmentType}
              className="border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm"
            >
              {/* Header */}
              <div className="px-4 py-3 border-b border-gray-200 bg-gradient-to-r from-indigo-50 to-purple-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Ruler className="h-5 w-5 text-purple-600" />
                    <h4 className="font-semibold text-gray-900 capitalize">
                      {garmentType}
                    </h4>
                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                      Active
                    </span>
                  </div>
                  <button
                    onClick={() => onEdit && onEdit(activeMeasurement)}
                    className="p-1.5 hover:bg-white/60 rounded-lg transition-colors"
                    title="Edit measurement"
                  >
                    <Edit2 className="h-4 w-4 text-purple-600" />
                  </button>
                </div>
              </div>

              {/* Measurement Details */}
              <div className="p-4">
                {/* Meta Info */}
                <div className="flex items-center gap-4 mb-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>{formatDate(activeMeasurement.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FileText className="h-4 w-4" />
                    <span>Version {activeMeasurement.version}</span>
                  </div>
                  {hasHistory && (
                    <span className="text-blue-600 text-xs font-medium">
                      {measurementList.length - 1} older version
                      {measurementList.length > 2 ? "s" : ""}
                    </span>
                  )}
                </div>

                {/* Measurements Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
                  {Object.entries(activeMeasurement.measurements).map(
                    ([key, value]) =>
                      renderMeasurementValue(key, value, activeMeasurement.unit)
                  )}
                </div>

                {/* Notes */}
                {activeMeasurement.notes && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <p className="text-sm text-gray-600">
                      <span className="font-medium text-gray-900">Notes: </span>
                      {activeMeasurement.notes}
                    </p>
                  </div>
                )}

                {/* View History Link */}
                {hasHistory && (
                  <button
                    className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700"
                    onClick={() => {
                      // This will be handled in parent component
                      console.log("View history for", garmentType);
                    }}
                  >
                    View Measurement History
                    <ChevronRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          );
        }
      )}

      {/* Add New Measurement Button */}
      <button
        onClick={onAddNew}
        className="w-full flex items-center justify-center gap-2 px-4 py-3 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-gray-600 hover:text-blue-600 font-medium"
      >
        <Ruler className="h-5 w-5" />
        Add Another Measurement
      </button>
    </div>
  );
}

export default MeasurementDisplay;
