import React, { useEffect, useState } from "react";
import { dbUtils, settingsService } from "../services/database";
import { Download, Upload, Settings as SettingsIcon } from "lucide-react";

function Settings() {
  const [form, setForm] = useState({
    businessName: "",
    businessPhone: "",
    businessAddress: "",
    businessEmail: "",
    defaultUnit: "inches",
  });
  const [saving, setSaving] = useState(false);
  const [banner, setBanner] = useState({ type: "", message: "" });

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
    setBanner({ type: "success", message: "Settings saved successfully" });
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
      setBanner({ type: "success", message: "Import completed successfully" });
    } catch (e) {
      console.error(e);
      setBanner({ type: "error", message: "Import failed. Please select a valid backup JSON file." });
    }
  };

  const onChange = (name, value) => setForm((p) => ({ ...p, [name]: value }));

  return (
    <div>
      {/* Colorful Page Header */}
      <div className="relative overflow-hidden rounded-2xl mb-6 border-2 border-teal-100 bg-gradient-to-r from-teal-50 via-cyan-50 to-blue-50 shadow-lg group">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-cyan-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="relative z-10 p-5 flex items-center gap-3">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-lg">
            <SettingsIcon className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-primary">Settings</h2>
            <p className="mt-1 text-base text-muted">Configure your business preferences</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-lg border-2 border-teal-100 group relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-teal-500/5 to-cyan-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="relative z-10">
        {banner.message && (
          <div className={`mb-4 p-3 rounded border text-sm ${
            banner.type === "success"
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}>
            {banner.message}
          </div>
        )}
        <div className="space-y-6">
          <div>
            <h3 className="text-2xl font-heading font-bold text-primary mb-6">
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
                  className="w-full px-4 py-2 border-2 border-teal-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200"
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
                  className="w-full px-4 py-2 border-2 border-teal-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200"
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
                  className="w-full px-4 py-2 border-2 border-teal-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200"
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
                  className="w-full px-4 py-2 border-2 border-teal-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200"
                  value={form.businessEmail}
                  onChange={(e) => onChange("businessEmail", e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Measurement Unit
                </label>
                <select
                  className="w-full px-4 py-2 border-2 border-teal-200 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all duration-200"
                  value={form.defaultUnit}
                  onChange={(e) => onChange("defaultUnit", e.target.value)}
                >
                  <option value="inches">Inches</option>
                  <option value="cm">Centimeters</option>
                </select>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t-2 border-teal-200">
            <div className="flex flex-col md:flex-row gap-3">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-3 bg-gradient-to-r from-accent to-yellow-600 text-primary rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 font-semibold disabled:opacity-50 hover:scale-105"
              >
                {saving ? "Saving..." : "Save Settings"}
              </button>
              <button
                onClick={handleExport}
                className="px-6 py-3 border-2 border-teal-200 rounded-lg hover:bg-teal-50 transition-all duration-200 font-medium flex items-center gap-2"
              >
                <Download className="h-4 w-4" /> Export Data (JSON)
              </button>
              <label className="inline-flex items-center gap-2 px-6 py-3 border-2 border-teal-200 rounded-lg hover:bg-teal-50 transition-all duration-200 font-medium cursor-pointer">
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
    </div>
  );
}

export default Settings;
