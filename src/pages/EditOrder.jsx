import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import OrderForm from "../components/orders/OrderForm";
import { orderService } from "../services/database";

function EditOrder() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("id");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      if (!orderId) return;
      setLoading(true);
      const data = await orderService.getById(orderId);
      setOrder(data || null);
      setLoading(false);
    })();
  }, [orderId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading order...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Order not found</p>
        <button
          onClick={() => navigate("/orders")}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Back to Orders
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="relative overflow-hidden rounded-2xl mb-6 border border-gray-100 bg-gradient-to-r from-purple-50 via-violet-50 to-fuchsia-50 shadow-lg">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-yellow-600/5" />
        <div className="relative z-10 flex items-center gap-3 p-5">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-white/50 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-6 w-6 text-primary" />
          </button>
          <div className="flex-1">
            <h2 className="text-3xl md:text-4xl font-heading font-bold text-primary">
              Edit Order
            </h2>
            <p className="mt-1 text-base text-muted">{order.id}</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
        <OrderForm
          isOpen={true}
          defaultClientId={order.clientId}
          onClose={() => navigate(`/orders/details?id=${order.id}`)}
          onSuccess={async (updated) => {
            // When OrderForm is submitted in edit mode, we receive a payload for create; translate to update
            const updates = { ...updated };
            delete updates.id; // ensure we don't override id
            await orderService.update(order.id, updates);
            navigate(`/orders/details?id=${order.id}`);
          }}
        />
      </div>
    </div>
  );
}

export default EditOrder;
