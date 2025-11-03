import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Package, CheckCircle, Plus } from "lucide-react";
import { clientService, orderService } from "../services/database";
import OrderForm from "../components/orders/OrderForm";

function Orders() {
  const [searchParams] = useSearchParams();
  const preSelectedClientId = searchParams.get("clientId");

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    loadOrders();

    // Auto-open form if clientId is in URL
    if (preSelectedClientId) {
      setIsFormOpen(true);
    }
  }, [preSelectedClientId]);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const allOrders = await orderService.getAll();
      setOrders(allOrders);
    } catch (error) {
      console.error("Error loading orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSuccess = async (orderData) => {
    try {
      // Create the order
      const newOrder = await orderService.create(orderData);

      setSuccessMessage(`Order ${newOrder.id} created successfully!`);
      setTimeout(() => setSuccessMessage(""), 3000);

      // Reload orders
      loadOrders();
    } catch (error) {
      console.error("Error creating order:", error);
      alert("Failed to create order. Please try again.");
    }
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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading orders...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Success Message */}
      {successMessage && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-800">
          <CheckCircle className="h-5 w-5" />
          {successMessage}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Orders</h2>
          <p className="mt-2 text-gray-600">
            Track and manage all orders ({orders.length} total)
          </p>
        </div>
        <button
          onClick={() => setIsFormOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          New Order
        </button>
      </div>

      {/* Orders List */}
      {orders.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No orders yet
          </h3>
          <p className="text-gray-600 mb-4">
            Create your first order to get started
          </p>
          <button
            onClick={() => setIsFormOpen(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Create First Order
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Order ID
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">
                    Client
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
                    Priority
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
                  >
                    <td className="py-3 px-4 text-sm text-gray-900 font-medium">
                      {order.id}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-900">
                      <div>
                        <p className="font-medium">{order.clientName}</p>
                        <p className="text-xs text-gray-500">
                          {order.clientPhone}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600 capitalize">
                      <div>
                        <p>{order.garmentType}</p>
                        <p className="text-xs text-gray-500">
                          Qty: {order.quantity}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {formatDate(order.orderDate)}
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">
                      {formatDate(order.deliveryDate)}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                          order.priority === "urgent"
                            ? "bg-orange-100 text-orange-700"
                            : "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {order.priority}
                      </span>
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
                      ₹{order.pricing?.total?.toLocaleString("en-IN") || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Order Form Modal */}
      <OrderForm
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        onSuccess={handleFormSuccess}
        clientService={clientService}
        preSelectedClientId={preSelectedClientId}
      />
    </div>
  );
}

export default Orders;
