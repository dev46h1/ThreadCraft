import React, { useEffect, useState } from "react";
import { dbUtils, settingsService } from "../services/database";
import { Download, Upload } from "lucide-react";

function Settings() {
  const [form, setForm] = useState({
    businessName: "",
    businessPhone: "",
    businessAddress: "",
    businessEmail: "",
    defaultUnit: "inches",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const all = await settingsService.getAll();
    setForm((p) => ({
      ...p,
      businessName: all.businessName || "",
      businessPhone: all.businessPhone || "",
      businessAddress: all.businessAddress || "",
      businessEmail: all.businessEmail || "",
      defaultUnit: all.defaultUnit || "inches",
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    await settingsService.set("businessName", form.businessName.trim());
    await settingsService.set("businessPhone", form.businessPhone.trim());
    await settingsService.set("businessAddress", form.businessAddress.trim());
    await settingsService.set("businessEmail", form.businessEmail.trim());
    await settingsService.set("defaultUnit", form.defaultUnit);
    setSaving(false);
    alert("Settings saved");
  };

  const handleExport = async () => {
    const data = await dbUtils.exportData();
    const stamp = new Date().toISOString().replace(/[:T]/g, "-").split(".")[0];
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `threadcraft-backup-${stamp}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (file) => {
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      if (!parsed || typeof parsed !== "object") throw new Error("Invalid file");
      await dbUtils.importData(parsed);
      await loadSettings();
      alert("Import completed successfully");
    } catch (e) {
      console.error(e);
      alert("Import failed. Please ensure you selected a valid backup JSON file.");
    }
  };

  const onChange = (name, value) => setForm((p) => ({ ...p, [name]: value }));

  return (
    <div>
      {/* Colorful Page Header */}
      <div className="relative overflow-hidden rounded-xl mb-6 border border-teal-200 bg-gradient-to-r from-teal-50 via-green-50 to-lime-50">
        <div className="p-6">
          <h2 className="text-3xl font-bold text-gray-900">Settings</h2>
          <p className="mt-2 text-gray-600">Configure your business preferences</p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Business Information
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Business Name
                </label>
                <input
                  type="text"
                  placeholder="Enter business name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={form.businessName}
                  onChange={(e) => onChange("businessName", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="tel"
                  placeholder="Enter phone number"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={form.businessPhone}
                  onChange={(e) => onChange("businessPhone", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Address
                </label>
                <textarea
                  placeholder="Enter business address"
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={form.businessAddress}
                  onChange={(e) => onChange("businessAddress", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email (optional)
                </label>
                <input
                  type="email"
                  placeholder="Enter email"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={form.businessEmail}
                  onChange={(e) => onChange("businessEmail", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Measurement Unit
                </label>
                <select
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={form.defaultUnit}
                  onChange={(e) => onChange("defaultUnit", e.target.value)}
                >
                  <option value="inches">Inches</option>
                  <option value="cm">Centimeters</option>
                </select>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-200">
            <div className="flex flex-col md:flex-row gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Settings"}
              </button>
              <button
                onClick={handleExport}
                className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center gap-2"
              >
                <Download className="h-4 w-4" /> Export Data (JSON)
              </button>
              <label className="inline-flex items-center gap-2 px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium cursor-pointer">
                <Upload className="h-4 w-4" /> Import Data
                <input
                  type="file"
                  accept="application/json,.json"
                  className="hidden"
                  onChange={(e) => handleImport(e.target.files?.[0])}
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
