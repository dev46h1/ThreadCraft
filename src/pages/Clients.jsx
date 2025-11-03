import React, { useState, useEffect } from "react";
import {
  Users,
  Search,
  Plus,
  Phone,
  Calendar,
  Package,
  CheckCircle,
  Edit2,
} from "lucide-react";
import { clientService, orderService } from "../services/database";
import ClientForm from "../components/clients/ClientForm";

function Clients() {
  const [clients, setClients] = useState([]);
  const [filteredClients, setFilteredClients] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [successMessage, setSuccessMessage] = useState("");
  const clientsPerPage = 20;

  useEffect(() => {
    loadClients();
  }, []);

  useEffect(() => {
    handleSearch();
  }, [searchQuery, clients]);

  const loadClients = async () => {
    try {
      setLoading(true);
      const allClients = await clientService.getAll();

      // Enhance clients with order counts
      const clientsWithOrders = await Promise.all(
        allClients.map(async (client) => {
          const orders = await orderService.getByClientId(client.id);
          const activeOrders = orders.filter(
            (order) =>
              order.status !== "delivered" && order.status !== "cancelled"
          ).length;
          return { ...client, activeOrders };
        })
      );

      setClients(clientsWithOrders);
      setFilteredClients(clientsWithOrders);
    } catch (error) {
      console.error("Error loading clients:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (!searchQuery.trim()) {
      setFilteredClients(clients);
      setCurrentPage(1);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = clients.filter(
      (client) =>
        client.name.toLowerCase().includes(query) ||
        client.phoneNumber.includes(query) ||
        client.id.toLowerCase().includes(query)
    );

    setFilteredClients(filtered);
    setCurrentPage(1);
  };

  const handleSort = (field) => {
    const sorted = [...filteredClients].sort((a, b) => {
      if (field === "name") {
        return a.name.localeCompare(b.name);
      } else if (field === "lastOrder") {
        const dateA = a.lastOrderDate ? new Date(a.lastOrderDate) : new Date(0);
        const dateB = b.lastOrderDate ? new Date(b.lastOrderDate) : new Date(0);
        return dateB - dateA;
      } else if (field === "registration") {
        return new Date(b.registrationDate) - new Date(a.registrationDate);
      }
      return 0;
    });
    setFilteredClients(sorted);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "No orders yet";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  // Pagination
  const indexOfLastClient = currentPage * clientsPerPage;
  const indexOfFirstClient = indexOfLastClient - clientsPerPage;
  const currentClients = filteredClients.slice(
    indexOfFirstClient,
    indexOfLastClient
  );
  const totalPages = Math.ceil(filteredClients.length / clientsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleFormSuccess = (client, action) => {
    setSuccessMessage(`Client ${action} successfully!`);
    setTimeout(() => setSuccessMessage(""), 3000);
    loadClients();
  };

  const openAddForm = () => {
    setEditingClient(null);
    setIsFormOpen(true);
  };

  const openEditForm = (client) => {
    setEditingClient(client);
    setIsFormOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading clients...</p>
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
          <h2 className="text-3xl font-bold text-gray-900">Clients</h2>
          <p className="mt-2 text-gray-600">
            Manage your client database ({filteredClients.length}{" "}
            {filteredClients.length === 1 ? "client" : "clients"})
          </p>
        </div>
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center gap-2"
          onClick={openAddForm}
        >
          <Plus className="h-5 w-5" />
          Add Client
        </button>
      </div>

      {/* Search & Sort */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search Bar */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, phone, or ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Sort Dropdown */}
          <select
            onChange={(e) => handleSort(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value="">Sort by...</option>
            <option value="name">Name (A-Z)</option>
            <option value="lastOrder">Last Order Date</option>
            <option value="registration">Registration Date</option>
          </select>
        </div>
      </div>

      {/* Client List */}
      {filteredClients.length === 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {searchQuery ? "No clients found" : "No clients yet"}
          </h3>
          <p className="text-gray-600 mb-4">
            {searchQuery
              ? "Try adjusting your search terms"
              : "Get started by adding your first client"}
          </p>
          {!searchQuery && (
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              onClick={openAddForm}
            >
              Add Your First Client
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Client Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            {currentClients.map((client) => (
              <div
                key={client.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => navigate(`/clients/details?id=${client.id}`)}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-1">
                      {client.name}
                    </h3>
                    <p className="text-xs text-gray-500">{client.id}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {client.activeOrders > 0 && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                        {client.activeOrders} active
                      </span>
                    )}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openEditForm(client);
                      }}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                      title="Edit client"
                    >
                      <Edit2 className="h-4 w-4 text-gray-600" />
                    </button>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-2 mb-3">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span>{client.phoneNumber}</span>
                  </div>
                  {client.address && (
                    <div className="flex items-start gap-2 text-sm text-gray-600">
                      <Users className="h-4 w-4 text-gray-400 mt-0.5" />
                      <span className="line-clamp-1">{client.address}</span>
                    </div>
                  )}
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="text-xs">
                      {formatDate(client.lastOrderDate)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-sm text-gray-600">
                    <Package className="h-4 w-4 text-gray-400" />
                    <span className="text-xs">
                      {client.totalOrders || 0} orders
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>

              <div className="flex gap-1">
                {[...Array(totalPages)].map((_, index) => {
                  const pageNumber = index + 1;
                  // Show first page, last page, current page, and pages around current
                  if (
                    pageNumber === 1 ||
                    pageNumber === totalPages ||
                    (pageNumber >= currentPage - 1 &&
                      pageNumber <= currentPage + 1)
                  ) {
                    return (
                      <button
                        key={pageNumber}
                        onClick={() => handlePageChange(pageNumber)}
                        className={`px-4 py-2 rounded-lg ${
                          currentPage === pageNumber
                            ? "bg-blue-600 text-white"
                            : "border border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  } else if (
                    pageNumber === currentPage - 2 ||
                    pageNumber === currentPage + 2
                  ) {
                    return (
                      <span key={pageNumber} className="px-2 py-2">
                        ...
                      </span>
                    );
                  }
                  return null;
                })}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Client Form Modal */}
      <ClientForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingClient(null);
        }}
        onSuccess={handleFormSuccess}
        editClient={editingClient}
        clientService={clientService}
      />
    </div>
  );
}

export default Clients;
