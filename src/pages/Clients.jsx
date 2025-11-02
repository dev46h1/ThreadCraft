import React from "react";
import { Users } from "lucide-react";

function Clients() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Clients</h2>
          <p className="mt-2 text-gray-600">Manage your client database</p>
        </div>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
          + Add Client
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
        <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No clients yet
        </h3>
        <p className="text-gray-600 mb-4">
          Get started by adding your first client
        </p>
        <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium">
          Add Your First Client
        </button>
      </div>
    </div>
  );
}

export default Clients;
