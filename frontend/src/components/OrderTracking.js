import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import axios from "axios";
import { Package, MapPin, Truck, Clock, CheckCircle, XCircle } from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || window.location.origin;
const API = `${BACKEND_URL}/api`;

const OrderTracking = () => {
  const [searchParams] = useSearchParams();
  const orderParam = searchParams.get("order");
  
  const [orderNumber, setOrderNumber] = useState(orderParam || "");
  const [order, setOrder] = useState(null);
  const [tracking, setTracking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (orderParam) {
      trackOrder(orderParam);
    }
  }, [orderParam]);

  const trackOrder = async (orderNum) => {
    if (!orderNum) {
      setError("Masukkan nomor pesanan");
      return;
    }

    try {
      setLoading(true);
      setError("");
      const response = await axios.get(`${API}/orders/track/${orderNum}`);
      
      if (response.data.success) {
        setOrder(response.data.order);
        setTracking(response.data.tracking);
      }
    } catch (err) {
      console.error("Tracking error:", err);
      setError(err.response?.data?.detail || "Pesanan tidak ditemukan");
      setOrder(null);
      setTracking(null);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
      confirmed: "bg-blue-100 text-blue-800 border-blue-300",
      processing: "bg-purple-100 text-purple-800 border-purple-300",
      shipped: "bg-indigo-100 text-indigo-800 border-indigo-300",
      delivered: "bg-green-100 text-green-800 border-green-300",
      cancelled: "bg-red-100 text-red-800 border-red-300"
    };
    return colors[status] || "bg-gray-100 text-gray-800 border-gray-300";
  };

  const getStatusIcon = (status) => {
    const icons = {
      pending: <Clock className="w-5 h-5" />,
      confirmed: <CheckCircle className="w-5 h-5" />,
      processing: <Package className="w-5 h-5" />,
      shipped: <Truck className="w-5 h-5" />,
      delivered: <CheckCircle className="w-5 h-5" />,
      cancelled: <XCircle className="w-5 h-5" />
    };
    return icons[status] || <Package className="w-5 h-5" />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 to-blue-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            🔍 Lacak Pesanan
          </h1>
          <p className="text-gray-600">
            Masukkan nomor pesanan untuk melacak status pengiriman
          </p>
        </div>

        {/* Search Box */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <div className="flex gap-3">
            <input
              type="text"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value.toUpperCase())}
              onKeyPress={(e) => e.key === "Enter" && trackOrder(orderNumber)}
              placeholder="Masukkan Nomor Pesanan (contoh: ORD-12345678)"
              className="flex-1 px-4 py-3 border-2 border-gray-300 rounded-lg focus:border-teal-500 focus:outline-none"
            />
            <button
              onClick={() => trackOrder(orderNumber)}
              disabled={loading}
              className="px-8 py-3 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Mencari..." : "Lacak"}
            </button>
          </div>
          {error && (
            <p className="text-red-600 text-sm mt-3">⚠️ {error}</p>
          )}
        </div>

        {/* Order Details */}
        {order && (
          <div className="space-y-6">
            {/* Status Card */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold">Status Pesanan</h2>
                <span className={`px-4 py-2 rounded-full border-2 font-semibold flex items-center gap-2 ${getStatusColor(order.order_status)}`}>
                  {getStatusIcon(order.order_status)}
                  {order.order_status.toUpperCase()}
                </span>
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Nomor Pesanan</p>
                  <p className="font-bold text-lg">{order.order_number}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Tanggal Pesanan</p>
                  <p className="font-semibold">
                    {new Date(order.created_at).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </p>
                </div>
              </div>
            </div>

            {/* Product Info */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <Package className="w-6 h-6 text-teal-600" />
                <h3 className="text-xl font-bold">Informasi Produk</h3>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-semibold text-lg">{order.product_name}</p>
                <div className="grid md:grid-cols-3 gap-4 mt-3">
                  <div>
                    <p className="text-sm text-gray-600">Jumlah</p>
                    <p className="font-semibold">{order.quantity}x</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Harga Satuan</p>
                    <p className="font-semibold">Rp {order.unit_price.toLocaleString("id-ID")}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Subtotal</p>
                    <p className="font-semibold">Rp {order.subtotal.toLocaleString("id-ID")}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Shipping Info */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <Truck className="w-6 h-6 text-teal-600" />
                <h3 className="text-xl font-bold">Informasi Pengiriman</h3>
              </div>
              <div className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Kurir</p>
                    <p className="font-semibold">
                      {order.courier_company.toUpperCase()} - {order.courier_service_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Estimasi</p>
                    <p className="font-semibold">{order.estimated_delivery}</p>
                  </div>
                </div>

                {order.waybill_id && (
                  <div className="bg-teal-50 border-2 border-teal-200 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Nomor Resi</p>
                    <p className="font-bold text-xl text-teal-900">{order.waybill_id}</p>
                    {order.tracking_url && (
                      <a
                        href={order.tracking_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-teal-600 hover:text-teal-700 text-sm underline mt-2 inline-block"
                      >
                        Lacak di website kurir →
                      </a>
                    )}
                  </div>
                )}

                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Alamat Tujuan</p>
                  <p className="font-semibold">{order.customer_name}</p>
                  <p className="text-gray-700">{order.customer_phone}</p>
                  <p className="text-gray-700 mt-2">
                    {order.customer_address}, {order.customer_city} {order.customer_postal_code}
                  </p>
                </div>
              </div>
            </div>

            {/* Payment Info */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-xl font-bold mb-4">Ringkasan Pembayaran</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold">Rp {order.subtotal.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Ongkir</span>
                  <span className="font-semibold">Rp {order.shipping_cost.toLocaleString("id-ID")}</span>
                </div>
                <div className="border-t-2 pt-2 flex justify-between text-lg">
                  <span className="font-bold">Total</span>
                  <span className="font-bold text-teal-600">
                    Rp {order.total.toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg mt-4">
                  <p className="text-sm">
                    <span className="font-semibold">Metode Pembayaran:</span>{" "}
                    {order.payment_method === "cod" ? "Cash on Delivery (COD)" : "Transfer Bank"}
                  </p>
                  <p className="text-sm mt-1">
                    <span className="font-semibold">Status Pembayaran:</span>{" "}
                    <span className={`${order.payment_status === "paid" ? "text-green-600" : "text-yellow-600"}`}>
                      {order.payment_status.toUpperCase()}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Tracking Timeline (if available) */}
            {tracking && tracking.history && tracking.history.length > 0 && (
              <div className="bg-white rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-bold mb-4">Riwayat Pengiriman</h3>
                <div className="space-y-4">
                  {tracking.history.map((item, index) => (
                    <div key={index} className="flex gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-4 h-4 rounded-full ${index === 0 ? "bg-teal-600" : "bg-gray-300"}`} />
                        {index !== tracking.history.length - 1 && (
                          <div className="w-0.5 h-full bg-gray-300 my-1" />
                        )}
                      </div>
                      <div className="flex-1 pb-4">
                        <p className="font-semibold">{item.note || item.status}</p>
                        <p className="text-sm text-gray-600">
                          {new Date(item.updated_at || item.date).toLocaleString("id-ID")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderTracking;
