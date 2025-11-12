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
      <div className="relative overflow-hidden rounded-2xl mb-6 border border-gray-100 bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 shadow-lg">
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
              New Order
            </h2>
            <p className="mt-1 text-base text-muted">Create a new order</p>
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-100">
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
