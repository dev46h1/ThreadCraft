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
        alert("Client not found");
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
      measuring: "bg-purple-100 text-purple-700",
      cutting: "bg-yellow-100 text-yellow-700",
      stitching: "bg-orange-100 text-orange-700",
      fitting: "bg-indigo-100 text-indigo-700",
      finishing: "bg-pink-100 text-pink-700",
      completed: "bg-green-100 text-green-700",
      delivered: "bg-gray-100 text-gray-700",
      cancelled: "bg-red-100 text-red-700",
    };
    return colors[status] || "bg-gray-100 text-gray-700";
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

      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate("/clients")}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-6 w-6 text-gray-600" />
        </button>
        <div className="flex-1">
          <h2 className="text-3xl font-bold text-gray-900">{client.name}</h2>
          <p className="text-sm text-gray-500 mt-1">{client.id}</p>
        </div>
        <button
          onClick={() => setIsEditFormOpen(true)}
          className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium flex items-center gap-2"
        >
          <Edit2 className="h-4 w-4" />
          Edit Client
        </button>
        <button
          onClick={() => navigate(`/orders/new?clientId=${client.id}`)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          + New Order
        </button>
      </div>

      {/* Client Info Card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-start gap-3">
            <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm text-gray-500">Primary Phone</p>
              <p className="text-gray-900 font-medium">{client.phoneNumber}</p>
            </div>
          </div>

          {client.secondaryPhone && (
            <div className="flex items-start gap-3">
              <Phone className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Secondary Phone</p>
                <p className="text-gray-900 font-medium">
                  {client.secondaryPhone}
                </p>
              </div>
            </div>
          )}

          {client.email && (
            <div className="flex items-start gap-3">
              <Mail className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="text-gray-900 font-medium">{client.email}</p>
              </div>
            </div>
          )}

          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
            <div>
              <p className="text-sm text-gray-500">Registered</p>
              <p className="text-gray-900 font-medium">
                {formatDate(client.registrationDate)}
              </p>
            </div>
          </div>

          {client.address && (
            <div className="flex items-start gap-3 md:col-span-2">
              <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Address</p>
                <p className="text-gray-900 font-medium">{client.address}</p>
              </div>
            </div>
          )}

          {client.notes && (
            <div className="flex items-start gap-3 md:col-span-2">
              <FileText className="h-5 w-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-sm text-gray-500">Notes</p>
                <p className="text-gray-900 font-medium">{client.notes}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Orders</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {orders.length}
              </p>
            </div>
            <Package className="h-8 w-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active Orders</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {activeOrders.length}
              </p>
            </div>
            <Package className="h-8 w-8 text-orange-600" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Measurements Saved</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {Object.keys(groupMeasurementsByType()).length}
              </p>
            </div>
            <Ruler className="h-8 w-8 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <div className="flex">
            <button
              onClick={() => setActiveTab("overview")}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === "overview"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("measurements")}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === "measurements"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Measurements
            </button>
            <button
              onClick={() => setActiveTab("orders")}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === "orders"
                  ? "text-blue-600 border-b-2 border-blue-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Orders
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Recent Activity
                </h3>
                {orders.length === 0 ? (
                  <p className="text-gray-500">No orders yet</p>
                ) : (
                  <div className="space-y-3">
                    {orders.slice(0, 5).map((order) => (
                      <div
                        key={order.id}
                        className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                        onClick={() => navigate(`/orders?id=${order.id}`)}
                      >
                        <div>
                          <p className="font-medium text-gray-900">
                            {order.id}
                          </p>
                          <p className="text-sm text-gray-500 capitalize">
                            {order.garmentType}
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span
                            className={`px-2.5 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(
                              order.status
                            )}`}
                          >
                            {order.status}
                          </span>
                          <p className="text-sm text-gray-500">
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
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
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
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  All Orders ({orders.length})
                </h3>
                <button
                  onClick={() => navigate(`/orders/new?clientId=${client.id}`)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  + New Order
                </button>
              </div>

              {orders.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No orders yet</p>
                  <button
                    onClick={() =>
                      navigate(`/orders/new?clientId=${client.id}`)
                    }
                    className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Create First Order
                  </button>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                          Order ID
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                          Garment
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                          Order Date
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                          Delivery Date
                        </th>
                        <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                          Status
                        </th>
                        <th className="text-right py-3 px-4 text-sm font-semibold text-gray-700">
                          Amount
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order) => (
                        <tr
                          key={order.id}
                          className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                          onClick={() => navigate(`/orders?id=${order.id}`)}
                        >
                          <td className="py-3 px-4 text-sm text-gray-900">
                            {order.id}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600 capitalize">
                            {order.garmentType}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {formatDate(order.orderDate)}
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
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
                          <td className="py-3 px-4 text-sm text-gray-900 text-right font-medium">
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
    </div>
  );
}

export default ClientDetails;
