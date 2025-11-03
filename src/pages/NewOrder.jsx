import React from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, Package } from "lucide-react";
import OrderForm from "../components/orders/OrderForm";

function NewOrder() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const clientId = searchParams.get("clientId") || "";

  return (
    <div>
      {/* Colorful Page Header */}
      <div className="relative overflow-hidden rounded-xl mb-6 border border-green-200 bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50">
        <div className="flex items-center gap-3 p-6">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-white/50 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-6 w-6 text-gray-600" />
          </button>
          <div className="flex-1">
            <h2 className="text-3xl font-bold text-gray-900">New Order</h2>
            <p className="mt-1 text-gray-600">Create a new order</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <OrderForm
          isOpen={true}
          defaultClientId={clientId}
          onClose={() => navigate("/orders")}
          onSuccess={(order) => {
            navigate(`/orders/details?id=${order.id}`);
          }}
        />
      </div>
    </div>
  );
}

export default NewOrder;


