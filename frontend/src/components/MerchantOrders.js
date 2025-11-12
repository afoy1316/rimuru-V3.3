import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { Package, Truck, Eye, CheckCircle, XCircle, Clock, Filter, Printer } from "lucide-react";
import { toast } from "sonner";
import { toPng } from 'html-to-image';
import ResiTemplate from "./ResiTemplate";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const MerchantOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [processingShipping, setProcessingShipping] = useState(false);
  const [showPrintResi, setShowPrintResi] = useState(false);
  const resiRef = useRef();

  useEffect(() => {
    fetchOrders();
  }, [statusFilter]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const params = statusFilter ? `?status=${statusFilter}` : "";
      const response = await axios.get(`${API}/merchant/orders${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(response.data.orders || []);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Gagal memuat pesanan");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetail = async (orderId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API}/merchant/orders/${orderId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSelectedOrder(response.data.order);
      setShowDetailModal(true);
    } catch (error) {
      toast.error("Gagal memuat detail pesanan");
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${API}/merchant/orders/${orderId}/status?new_status=${newStatus}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Status pesanan berhasil diupdate");
      fetchOrders();
      if (selectedOrder?.id === orderId) {
        handleViewDetail(orderId);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || "Gagal update status");
    }
  };

  const handleProcessShipping = async (orderId) => {
    if (!window.confirm("Proses pengiriman via BitShip? Pastikan pembayaran sudah dikonfirmasi.")) {
      return;
    }

    try {
      setProcessingShipping(true);
      const token = localStorage.getItem("token");
      const response = await axios.post(
        `${API}/merchant/orders/${orderId}/process-shipping`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      toast.success(`✅ Pengiriman berhasil diproses! Resi: ${response.data.waybill_id}`);
      fetchOrders();
      if (selectedOrder?.id === orderId) {
        handleViewDetail(orderId);
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || "Gagal memproses pengiriman");
    } finally {
      setProcessingShipping(false);
    }
  };

  const handlePrintResi = async () => {
    if (!selectedOrder) return;
    
    setShowPrintResi(true);
  };

  const downloadResi = async () => {
    if (!resiRef.current) return;

    try {
      const dataUrl = await toPng(resiRef.current, {
        backgroundColor: 'white',
        width: 800,
        height: 1000,
        style: {
          transform: 'scale(1.5)',
          transformOrigin: 'top left'
        }
      });
      
      const link = document.createElement('a');
      link.download = `resi-${selectedOrder.order_number}.png`;
      link.href = dataUrl;
      link.click();
      
      toast.success("Resi berhasil didownload!");
    } catch (error) {
      console.error('Error generating resi:', error);
      toast.error("Gagal generate resi");
    }
  };

  const printResi = () => {
    if (!resiRef.current) return;

    const printWindow = window.open('', '_blank');
    const resiHTML = resiRef.current.innerHTML;
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Resi - ${selectedOrder.order_number}</title>
          <style>
            body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
            @media print { body { margin: 0; } }
          </style>
        </head>
        <body>
          ${resiHTML}
        </body>
      </html>
    `);
    
    printWindow.document.close();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  const getStatusBadge = (status) => {
    const badges = {
      pending: { bg: "bg-yellow-100", text: "text-yellow-800", label: "Pending" },
      confirmed: { bg: "bg-blue-100", text: "text-blue-800", label: "Confirmed" },
      processing: { bg: "bg-purple-100", text: "text-purple-800", label: "Processing" },
      shipped: { bg: "bg-indigo-100", text: "text-indigo-800", label: "Shipped" },
      delivered: { bg: "bg-green-100", text: "text-green-800", label: "Delivered" },
      cancelled: { bg: "bg-red-100", text: "text-red-800", label: "Cancelled" }
    };
    const badge = badges[status] || badges.pending;
    return (
      <span className={`${badge.bg} ${badge.text} px-3 py-1 rounded-full text-xs font-semibold`}>
        {badge.label}
      </span>
    );
  };

  const getPaymentBadge = (status) => {
    return status === "paid" ? (
      <span className="bg-green-100 text-green-800 px-2 py-1 rounded text-xs font-semibold">
        Paid
      </span>
    ) : (
      <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded text-xs font-semibold">
        Pending
      </span>
    );
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">📦 Pesanan Saya</h1>
        <p className="text-gray-600">Kelola semua pesanan dari landing page Anda</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="flex items-center gap-4">
          <Filter className="w-5 h-5 text-gray-500" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
          >
            <option value="">Semua Status</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="processing">Processing</option>
            <option value="shipped">Shipped</option>
            <option value="delivered">Delivered</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <button
            onClick={fetchOrders}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Belum Ada Pesanan</h3>
          <p className="text-gray-600">Pesanan akan muncul di sini setelah customer melakukan checkout</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Order#</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Customer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produk</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tanggal</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {orders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono text-sm font-semibold text-teal-600">
                        {order.order_number}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{order.customer_name}</div>
                        <div className="text-sm text-gray-500">{order.customer_phone}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{order.product_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">{order.quantity || 0}x</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-semibold text-gray-900">
                        Rp {(order.total || 0).toLocaleString("id-ID")}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        {getPaymentBadge(order.payment_status)}
                        <div className="text-xs text-gray-500 mt-1">
                          {order.payment_method === "cod" ? "COD" : "Transfer"}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(order.order_status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {order.created_at ? new Date(order.created_at).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric"
                        }) : "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleViewDetail(order.id)}
                        className="text-teal-600 hover:text-teal-800 mr-2"
                        title="View Detail"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Detail Pesanan</h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-1">{selectedOrder.order_number}</p>
            </div>

            <div className="p-6 space-y-6">
              {/* Status & Actions */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Status Pesanan</p>
                    {getStatusBadge(selectedOrder.order_status)}
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Payment Status</p>
                    {getPaymentBadge(selectedOrder.payment_status)}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {selectedOrder.order_status === "pending" && (
                    <button
                      onClick={() => handleUpdateStatus(selectedOrder.id, "confirmed")}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                    >
                      ✅ Confirm Order
                    </button>
                  )}
                  {selectedOrder.order_status === "confirmed" && (
                    <button
                      onClick={() => handleUpdateStatus(selectedOrder.id, "processing")}
                      className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
                    >
                      📦 Start Processing
                    </button>
                  )}
                  {selectedOrder.order_status === "processing" && !selectedOrder.biteship_order_id && (
                    <button
                      onClick={() => handleProcessShipping(selectedOrder.id)}
                      disabled={processingShipping}
                      className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 text-sm disabled:opacity-50"
                    >
                      {processingShipping ? "Processing..." : "🚚 Process Shipping"}
                    </button>
                  )}
                  {(selectedOrder.order_status === "shipped" || selectedOrder.biteship_order_id) && (
                    <button
                      onClick={handlePrintResi}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
                    >
                      🖨️ Print Resi
                    </button>
                  )}
                  {selectedOrder.order_status !== "cancelled" && selectedOrder.order_status !== "delivered" && (
                    <button
                      onClick={() => handleUpdateStatus(selectedOrder.id, "cancelled")}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
                    >
                      ❌ Cancel
                    </button>
                  )}
                </div>
              </div>

              {/* Product Info */}
              <div>
                <h3 className="font-semibold mb-3">📦 Informasi Produk</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-medium text-lg">{selectedOrder.product_name}</p>
                  <div className="grid grid-cols-3 gap-4 mt-3">
                    <div>
                      <p className="text-sm text-gray-600">Jumlah</p>
                      <p className="font-semibold">{selectedOrder.quantity || 0}x</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Harga Satuan</p>
                      <p className="font-semibold">Rp {(selectedOrder.unit_price || 0).toLocaleString("id-ID")}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Subtotal</p>
                      <p className="font-semibold">Rp {(selectedOrder.subtotal || 0).toLocaleString("id-ID")}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Customer Info */}
              <div>
                <h3 className="font-semibold mb-3">👤 Informasi Customer</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div>
                    <p className="text-sm text-gray-600">Nama</p>
                    <p className="font-medium">{selectedOrder.customer_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Telepon</p>
                    <p className="font-medium">{selectedOrder.customer_phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Alamat</p>
                    <p className="font-medium">
                      {selectedOrder.customer_address}, {selectedOrder.customer_city} {selectedOrder.customer_postal_code}
                    </p>
                  </div>
                </div>
              </div>

              {/* Shipping Info */}
              <div>
                <h3 className="font-semibold mb-3">🚚 Informasi Pengiriman</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div>
                    <p className="text-sm text-gray-600">Kurir</p>
                    <p className="font-medium">
                      {selectedOrder.courier_company.toUpperCase()} - {selectedOrder.courier_service_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Estimasi</p>
                    <p className="font-medium">{selectedOrder.estimated_delivery}</p>
                  </div>
                  {selectedOrder.waybill_id && (
                    <div className="bg-teal-50 p-3 rounded mt-2">
                      <p className="text-sm text-gray-600">Nomor Resi</p>
                      <p className="font-bold text-lg text-teal-900">{selectedOrder.waybill_id}</p>
                      {selectedOrder.tracking_url && (
                        <a
                          href={selectedOrder.tracking_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-teal-600 hover:text-teal-700 text-sm underline mt-1 inline-block"
                        >
                          Lacak di website kurir →
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Summary */}
              <div>
                <h3 className="font-semibold mb-3">💰 Ringkasan Pembayaran</h3>
                <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal</span>
                    <span className="font-medium">Rp {(selectedOrder.subtotal || 0).toLocaleString("id-ID")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Ongkir</span>
                    <span className="font-medium">Rp {(selectedOrder.shipping_cost || 0).toLocaleString("id-ID")}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between text-lg">
                    <span className="font-bold">Total</span>
                    <span className="font-bold text-teal-600">
                      Rp {(selectedOrder.total || 0).toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className="bg-blue-50 p-3 rounded mt-2">
                    <p className="text-sm">
                      <span className="font-semibold">Metode Pembayaran:</span>{" "}
                      {selectedOrder.payment_method === "cod" ? "Cash on Delivery (COD)" : "Transfer Bank"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Print Resi Modal */}
      {showPrintResi && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b sticky top-0 bg-white">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">🖨️ Print Resi Pengiriman</h2>
                <button
                  onClick={() => setShowPrintResi(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-1">Order: {selectedOrder.order_number}</p>
            </div>

            <div className="p-6 space-y-6">
              {/* Resi Preview */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div ref={resiRef} className="bg-white">
                  <ResiTemplate 
                    orderData={{
                      waybill_id: selectedOrder.waybill_id || "TEST-" + selectedOrder.order_number,
                      courier_name: selectedOrder.courier_company?.toUpperCase(),
                      sender_name: "Rimuru Warehouse",
                      sender_full_address: "Jakarta Warehouse, Indonesia",
                      receiver_name: selectedOrder.customer_name,
                      receiver_phone: selectedOrder.customer_phone,
                      receiver_address: `${selectedOrder.customer_address}, ${selectedOrder.customer_city} ${selectedOrder.customer_postal_code}`,
                      weight: "1",
                      shipping_cost: selectedOrder.shipping_cost,
                      service_type: selectedOrder.courier_service_name,
                      reference_number: selectedOrder.order_number,
                      product_name: selectedOrder.product_name,
                      product_category: "Product"
                    }}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={downloadResi}
                  className="flex-1 px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-semibold"
                >
                  📥 Download Resi (PNG)
                </button>
                <button
                  onClick={printResi}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
                >
                  🖨️ Print Resi
                </button>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded p-3">
                <p className="text-sm text-blue-800">
                  💡 <strong>Tips:</strong> Resi akan menggunakan data waybill dari BitShip jika tersedia. 
                  Dalam test mode, waybill mungkin kosong - ini normal untuk testing.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MerchantOrders;
