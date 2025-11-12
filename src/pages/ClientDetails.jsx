import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Edit2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Package,
  Ruler,
  FileText,
} from "lucide-react";
import {
  clientService,
  measurementService,
  orderService,
} from "../services/database";
import ClientForm from "../components/clients/ClientForm";
import MeasurementForm from "../components/measurements/MeasurementForm";
import MeasurementDisplay from "../components/measurements/MeasurementDisplay";

function ClientDetails() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const clientId = searchParams.get("id");

  const [client, setClient] = useState(null);
  const [measurements, setMeasurements] = useState([]);
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [isMeasurementFormOpen, setIsMeasurementFormOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (clientId) {
      loadClientData();
    }
  }, [clientId]);

  const loadClientData = async () => {
    try {
      setLoading(true);
      const clientData = await clientService.getById(clientId);

      if (!clientData) {
        navigate("/clients");
        return;
      }

      const measurementsData = await measurementService.getByClientId(clientId);
      const ordersData = await orderService.getByClientId(clientId);

      setClient(clientData);
      setMeasurements(measurementsData);
      setOrders(ordersData);
    } catch (error) {
      console.error("Error loading client data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSuccess = () => {
    loadClientData();
    setIsEditFormOpen(false);
    showSuccessMessage("Client updated successfully!");
  };

  const handleMeasurementSuccess = () => {
    loadClientData();
    setIsMeasurementFormOpen(false);
    showSuccessMessage("Measurement saved successfully!");
  };

  const showSuccessMessage = (message) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const getStatusColor = (status) => {
    const colors = {
      placed: "bg-blue-100 text-blue-700",
      fabric_received: "bg-teal-100 text-teal-700",
      cutting: "bg-yellow-100 text-yellow-700",
      stitching: "bg-orange-100 text-orange-700",
      trial: "bg-indigo-100 text-indigo-700",
      alterations: "bg-pink-100 text-pink-700",
      completed: "bg-green-100 text-green-700",
      ready: "bg-emerald-100 text-emerald-700",
      delivered: "bg-gray-100 text-gray-700",
      cancelled: "bg-red-100 text-red-700",
    };
    return colors[status] || "bg-gray-100 text-gray-700";
  };

  const formatStatus = (status) =>
    (status || "")
      .split("_")
      .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ""))
      .join(" ");

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading client details...</p>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Client not found</p>
        <button
          onClick={() => navigate("/clients")}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Back to Clients
        </button>
      </div>
    );
  }

  const activeOrders = orders.filter(
    (o) => o.status !== "delivered" && o.status !== "cancelled"
  );

  return (
    <div>
      {/* Success Message */}
      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-800">
          <Package className="h-5 w-5" />
          {successMessage}
        </div>
      )}

      {/* Colorful Page Header */}
      <div className="relative overflow-hidden rounded-2xl mb-6 border-2 border-blue-100 bg-gradient-to-r from-cyan-50 via-sky-50 to-blue-50 shadow-lg group">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="relative z-10 flex items-center gap-4 p-5">
          <button
            onClick={() => navigate("/clients")}
            className="p-2 hover:bg-white/50 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-6 w-6 text-primary" />
          </button>
          <div className="flex-1">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-primary">
              {client.name}
            </h2>
            <p className="text-base text-muted mt-1">{client.id}</p>
          </div>
          <button
            onClick={() => setIsEditFormOpen(true)}
            className="px-4 py-2 border-2 border-blue-200 text-primary rounded-lg hover:bg-blue-50 transition-all duration-200 font-medium flex items-center gap-2 bg-white/40"
          >
            <Edit2 className="h-4 w-4" />
            Edit Client
          </button>
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2 border-2 border-red-200 text-red-700 rounded-lg hover:bg-red-50 transition-all duration-200 font-medium flex items-center gap-2 bg-white/40"
          >
            Delete
          </button>
          <button
            onClick={() => navigate(`/orders/new?clientId=${client.id}`)}
            className="px-6 py-3 bg-gradient-to-r from-accent to-yellow-600 text-primary rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 font-semibold hover:scale-105"
          >
            + New Order
          </button>
        </div>
      </div>

      {/* Client Info Card */}
      <div className="bg-white p-8 rounded-2xl shadow-lg border-2 border-blue-100 mb-6 group relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-start gap-3">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
                <Phone className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted">Primary Phone</p>
                <p className="text-primary font-medium">{client.phoneNumber}</p>
              </div>
            </div>

            {client.secondaryPhone && (
              <div className="flex items-start gap-3">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted">Secondary Phone</p>
                  <p className="text-primary font-medium">
                    {client.secondaryPhone}
                  </p>
                </div>
              </div>
            )}

            {client.email && (
              <div className="flex items-start gap-3">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-lg">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted">Email</p>
                  <p className="text-primary font-medium">{client.email}</p>
                </div>
              </div>
            )}

            <div className="flex items-start gap-3">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-white shadow-lg">
                <Calendar className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm text-muted">Registered</p>
                <p className="text-primary font-medium">
                  {formatDate(client.registrationDate)}
                </p>
              </div>
            </div>

            {client.address && (
              <div className="flex items-start gap-3 md:col-span-2">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-lg">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted">Address</p>
                  <p className="text-primary font-medium">{client.address}</p>
                </div>
              </div>
            )}

            {client.notes && (
              <div className="flex items-start gap-3 md:col-span-2">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-600 text-white shadow-lg">
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm text-muted">Notes</p>
                  <p className="text-primary font-medium">{client.notes}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-2 border-blue-200 hover:border-blue-300 group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted mb-2">Total Orders</p>
                <p className="text-3xl font-heading font-bold text-primary">
                  {orders.length}
                </p>
              </div>
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <Package className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-2 border-blue-200 hover:border-blue-300 group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted mb-2">Active Orders</p>
                <p className="text-3xl font-heading font-bold text-primary">
                  {activeOrders.length}
                </p>
              </div>
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <Package className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-2 border-blue-200 hover:border-blue-300 group relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="relative z-10">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted mb-2">Measurements Saved</p>
                <p className="text-3xl font-heading font-bold text-primary">
                  {Object.keys(groupMeasurementsByType()).length}
                </p>
              </div>
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <Ruler className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-lg border-2 border-blue-100 group relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-indigo-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <div className="relative z-10">
        <div className="border-b-2 border-blue-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === "overview"
                  ? "text-blue-700 border-b-2 border-blue-500 font-semibold"
                  : "text-muted hover:text-blue-600"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("measurements")}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === "measurements"
                  ? "text-blue-700 border-b-2 border-blue-500 font-semibold"
                  : "text-muted hover:text-blue-600"
              }`}
            >
              Measurements
            </button>
            <button
              onClick={() => setActiveTab("orders")}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === "orders"
                  ? "text-blue-700 border-b-2 border-blue-500 font-semibold"
                  : "text-muted hover:text-blue-600"
              }`}
            >
              Orders
            </button>
          </div>
        </div>

        <div className="p-8">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-heading font-bold text-primary mb-6">
                  Recent Activity
                </h3>
                {orders.length === 0 ? (
                  <p className="text-muted">No orders yet</p>
                ) : (
                  <div className="space-y-3">
                    {orders.slice(0, 5).map((order) => (
                      <div
                        key={order.id}
                        className="flex items-center justify-between p-4 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl hover:from-blue-100 hover:to-indigo-100 transition-all duration-200 cursor-pointer border-2 border-blue-200 hover:border-blue-300"
                        onClick={() =>
                          navigate(`/orders/details?id=${order.id}`)
                        }
                      >
                        <div>
                          <p className="font-medium text-primary">{order.id}</p>
                          <p className="text-sm text-muted capitalize">
                            {order.garmentType}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(
                              order.status
                            )}`}
                          >
                            {formatStatus(order.status)}
                          </span>
                          <p className="text-sm text-muted">
                            {formatDate(order.orderDate)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Measurements Tab */}
          {activeTab === "measurements" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-heading font-bold text-primary">
                  Saved Measurements
                </h3>
              </div>

              <MeasurementDisplay
                measurements={measurements}
                onAddNew={() => setIsMeasurementFormOpen(true)}
                onEdit={(measurement) => {
                  // Could open edit form with pre-filled data
                  console.log("Edit measurement:", measurement);
                  setIsMeasurementFormOpen(true);
                }}
              />
            </div>
          )}

          {/* Orders Tab */}
          {activeTab === "orders" && (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-heading font-bold text-primary">
                  All Orders ({orders.length})
                </h3>
                <button
                  onClick={() => navigate(`/orders/new?clientId=${client.id}`)}
                  className="px-6 py-3 bg-gradient-to-r from-accent to-yellow-600 text-primary rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 font-semibold hover:scale-105"
                >
                  + New Order
                </button>
              </div>

              {orders.length === 0 ? (
                <div className="text-center py-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg mb-6">
                    <Package className="h-8 w-8" />
                  </div>
                  <p className="text-muted mb-6">No orders yet</p>
                  <button
                    onClick={() =>
                      navigate(`/orders/new?clientId=${client.id}`)
                    }
                    className="px-6 py-3 bg-gradient-to-r from-accent to-yellow-600 text-primary rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 font-semibold hover:scale-105"
                  >
                    Create First Order
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b-2 border-blue-200 bg-blue-50">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-primary">
                          Order ID
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-primary">
                          Garment
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-primary">
                          Order Date
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-primary">
                          Delivery Date
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-primary">
                          Status
                        </th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-primary">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr
                          key={order.id}
                          className="border-b border-blue-100 hover:bg-blue-50 cursor-pointer transition-all duration-200"
                          onClick={() =>
                            navigate(`/orders/details?id=${order.id}`)
                          }
                        >
                          <td className="py-3 px-4 text-sm text-primary">
                            {order.id}
                          </td>
                          <td className="py-3 px-4 text-sm text-muted capitalize">
                            {order.garmentType}
                          </td>
                          <td className="py-3 px-4 text-sm text-muted">
                            {formatDate(order.orderDate)}
                          </td>
                          <td className="py-3 px-4 text-sm text-muted">
                            {formatDate(order.deliveryDate)}
                          </td>
                          <td className="py-3 px-4">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(
                                order.status
                              )}`}
                            >
                              {order.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-primary text-right font-medium">
                            ₹
                            {order.pricing?.total?.toLocaleString("en-IN") || 0}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
        </div>
      </div>

      {/* Edit Form Modal */}
      <ClientForm
        isOpen={isEditFormOpen}
        onClose={() => setIsEditFormOpen(false)}
        onSuccess={handleFormSuccess}
        editClient={client}
        clientService={clientService}
      />

      {/* Measurement Form Modal */}
      <MeasurementForm
        isOpen={isMeasurementFormOpen}
        onClose={() => setIsMeasurementFormOpen(false)}
        onSuccess={handleMeasurementSuccess}
        clientId={clientId}
        clientName={client.name}
        measurementService={measurementService}
      />

      {/* Delete confirmation banner */}
      {showDeleteConfirm && (
        <div className="fixed left-1/2 -translate-x-1/2 bottom-4 z-50 max-w-xl w-[92%] sm:w-auto bg-red-50 border border-red-200 text-red-900 rounded-lg shadow p-4">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <p className="font-semibold text-sm">Delete Client</p>
              <p className="text-sm mt-1">
                Are you sure you want to delete {client.name} ({client.id})?
                This action cannot be undone.
              </p>
            </div>
            <div className="flex items-center gap-2 mt-2 sm:mt-0">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-3 py-1.5 border border-red-300 rounded-lg text-red-900 hover:bg-red-100 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await clientService.delete(client.id);
                  navigate("/clients");
                }}
                className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ClientDetails;
