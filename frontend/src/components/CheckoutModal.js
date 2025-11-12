import React, { useState } from "react";
import axios from "axios";
import { X, Package, MapPin, Truck, CreditCard } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || window.location.origin;
const API = `${BACKEND_URL}/api`;

const CheckoutModal = ({ isOpen, onClose, product, landingPageId }) => {
  const [loading, setLoading] = useState(false);
  const [calculatingShipping, setCalculatingShipping] = useState(false);
  const [shippingRates, setShippingRates] = useState([]);
  const [selectedCourier, setSelectedCourier] = useState(null);
  
  const [formData, setFormData] = useState({
    customer_name: "",
    customer_phone: "",
    customer_address: "",
    customer_city: "",
    customer_postal_code: "",
    quantity: 1,
    payment_method: "cod"
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const calculateShipping = async () => {
    if (!formData.customer_postal_code || formData.customer_postal_code.length < 5) {
      toast.error("Masukkan kode pos tujuan yang valid");
      return;
    }

    try {
      setCalculatingShipping(true);
      setShippingRates([]);
      setSelectedCourier(null);

      const params = new URLSearchParams({
        origin_postal_code: product.shipping_origin.postal_code,
        destination_postal_code: formData.customer_postal_code,
        weight: product.weight * formData.quantity,
        length: product.length,
        width: product.width,
        height: product.height,
        value: product.price * formData.quantity,
        couriers: product.available_couriers.join(",")
      });

      const response = await axios.post(`${API}/shipping/calculate-rates?${params}`);
      
      if (response.data.success && response.data.data.pricing) {
        setShippingRates(response.data.data.pricing);
        toast.success("Ongkir berhasil dihitung!");
      } else {
        toast.error("Gagal menghitung ongkir");
      }
    } catch (error) {
      console.error("Shipping calculation error:", error);
      toast.error(error.response?.data?.detail || "Gagal menghitung ongkir");
    } finally {
      setCalculatingShipping(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedCourier) {
      toast.error("Pilih metode pengiriman terlebih dahulu");
      return;
    }

    if (!formData.customer_name || !formData.customer_phone || !formData.customer_address) {
      toast.error("Lengkapi semua data");
      return;
    }

    try {
      setLoading(true);

      const orderData = {
        landing_page_id: landingPageId,
        customer_name: formData.customer_name,
        customer_phone: formData.customer_phone,
        customer_address: formData.customer_address,
        customer_city: formData.customer_city,
        customer_postal_code: parseInt(formData.customer_postal_code),
        quantity: formData.quantity,
        unit_price: product.price,
        courier_company: selectedCourier.courier_code,
        courier_type: selectedCourier.courier_service_code,
        courier_service_name: selectedCourier.courier_service_name,
        shipping_cost: selectedCourier.price,
        estimated_delivery: selectedCourier.duration,
        payment_method: formData.payment_method,
        notes: ""
      };

      const response = await axios.post(`${API}/orders/create`, orderData);

      if (response.data.success) {
        toast.success("✅ Pesanan berhasil dibuat!");
        
        // Show order number and redirect to tracking
        setTimeout(() => {
          window.location.href = `/track-order?order=${response.data.order_number}`;
        }, 2000);
      }
    } catch (error) {
      console.error("Order creation error:", error);
      toast.error(error.response?.data?.detail || "Gagal membuat pesanan");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const subtotal = product.price * formData.quantity;
  const shippingCost = selectedCourier ? selectedCourier.price : 0;
  const total = subtotal + shippingCost;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
          <h2 className="text-2xl font-bold">Checkout</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Product Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <Package className="w-5 h-5 text-teal-600 mt-1" />
              <div className="flex-1">
                <h3 className="font-semibold">{product.name}</h3>
                <p className="text-sm text-gray-600">
                  Harga: Rp {product.price.toLocaleString("id-ID")}
                </p>
                <div className="mt-2">
                  <label className="text-sm font-medium">Jumlah:</label>
                  <input
                    type="number"
                    min="1"
                    max={product.stock}
                    value={formData.quantity}
                    onChange={(e) => handleChange("quantity", parseInt(e.target.value))}
                    className="ml-2 w-20 px-2 py-1 border rounded"
                  />
                  <span className="ml-2 text-sm text-gray-500">
                    (Stok: {product.stock})
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="w-5 h-5 text-teal-600" />
              <h3 className="font-semibold">Informasi Pengiriman</h3>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  value={formData.customer_name}
                  onChange={(e) => handleChange("customer_name", e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">No. Telepon *</label>
                <input
                  type="tel"
                  value={formData.customer_phone}
                  onChange={(e) => handleChange("customer_phone", e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                  placeholder="081234567890"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Alamat Lengkap *</label>
              <textarea
                value={formData.customer_address}
                onChange={(e) => handleChange("customer_address", e.target.value)}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                rows="3"
                placeholder="Jl. Contoh No. 123, Kelurahan, Kecamatan"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Kota/Kabupaten *</label>
                <input
                  type="text"
                  value={formData.customer_city}
                  onChange={(e) => handleChange("customer_city", e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Kode Pos *</label>
                <input
                  type="number"
                  value={formData.customer_postal_code}
                  onChange={(e) => handleChange("customer_postal_code", e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                  placeholder="12345"
                  required
                />
              </div>
            </div>

            <button
              type="button"
              onClick={calculateShipping}
              disabled={calculatingShipping || !formData.customer_postal_code}
              className="w-full bg-teal-600 hover:bg-teal-700 text-white py-2 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {calculatingShipping ? "Menghitung..." : "🚚 Hitung Ongkir"}
            </button>
          </div>

          {/* Shipping Options */}
          {shippingRates.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-teal-600" />
                <h3 className="font-semibold">Pilih Pengiriman</h3>
              </div>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {shippingRates.map((rate, index) => (
                  <label
                    key={index}
                    className={`flex items-center justify-between p-3 border rounded-lg cursor-pointer transition-colors ${
                      selectedCourier?.courier_code === rate.courier_code &&
                      selectedCourier?.courier_service_code === rate.courier_service_code
                        ? "border-teal-600 bg-teal-50"
                        : "hover:border-gray-400"
                    }`}
                  >
                    <input
                      type="radio"
                      name="courier"
                      checked={
                        selectedCourier?.courier_code === rate.courier_code &&
                        selectedCourier?.courier_service_code === rate.courier_service_code
                      }
                      onChange={() => setSelectedCourier(rate)}
                      className="mr-3"
                    />
                    <div className="flex-1">
                      <div className="font-medium">
                        {rate.courier_name} - {rate.courier_service_name}
                      </div>
                      <div className="text-xs text-gray-600">
                        Estimasi: {rate.duration}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">
                        Rp {rate.price.toLocaleString("id-ID")}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Payment Method */}
          {product.payment_methods && product.payment_methods.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-teal-600" />
                <h3 className="font-semibold">Metode Pembayaran</h3>
              </div>
              <div className="space-y-2">
                {product.payment_methods.includes("cod") && (
                  <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:border-gray-400">
                    <input
                      type="radio"
                      name="payment"
                      value="cod"
                      checked={formData.payment_method === "cod"}
                      onChange={(e) => handleChange("payment_method", e.target.value)}
                      className="mr-3"
                    />
                    <div>
                      <div className="font-medium">Cash on Delivery (COD)</div>
                      <div className="text-xs text-gray-600">Bayar saat barang diterima</div>
                    </div>
                  </label>
                )}
                {product.payment_methods.includes("transfer") && (
                  <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:border-gray-400">
                    <input
                      type="radio"
                      name="payment"
                      value="transfer"
                      checked={formData.payment_method === "transfer"}
                      onChange={(e) => handleChange("payment_method", e.target.value)}
                      className="mr-3"
                    />
                    <div>
                      <div className="font-medium">Transfer Bank</div>
                      <div className="text-xs text-gray-600">Transfer ke rekening merchant</div>
                    </div>
                  </label>
                )}
              </div>
            </div>
          )}

          {/* Order Summary */}
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <h3 className="font-semibold mb-3">Ringkasan Pesanan</h3>
            <div className="flex justify-between text-sm">
              <span>Subtotal ({formData.quantity}x)</span>
              <span>Rp {subtotal.toLocaleString("id-ID")}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Ongkir</span>
              <span>Rp {shippingCost.toLocaleString("id-ID")}</span>
            </div>
            <div className="border-t pt-2 flex justify-between font-bold text-lg">
              <span>Total</span>
              <span className="text-teal-600">Rp {total.toLocaleString("id-ID")}</span>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !selectedCourier}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white py-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Memproses..." : "🛒 Buat Pesanan"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CheckoutModal;
