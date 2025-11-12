import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Package, Edit, Eye, TrendingUp } from "lucide-react";
import { toast } from "sonner";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const LANDING_PAGE_BASE_URL = typeof window !== 'undefined' ? window.location.origin : '';
const API = `${BACKEND_URL}/api`;

const MerchantProducts = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showStockModal, setShowStockModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [newStock, setNewStock] = useState(0);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API}/merchant/products`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(response.data.products || []);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast.error("Gagal memuat produk");
    } finally {
      setLoading(false);
    }
  };

  const handleEditProduct = (productId) => {
    // Navigate to landing page builder with this product
    navigate("/dashboard/landing-pages");
    toast.info("Cari dan edit landing page produk Anda");
  };

  const handleViewLandingPage = (slug) => {
    window.open(`${LANDING_PAGE_BASE_URL}/${slug}`, "_blank");
  };

  const handleManageStock = (product) => {
    setSelectedProduct(product);
    setNewStock(product.product_details?.stock_quantity || 0);
    setShowStockModal(true);
  };

  const handleUpdateStock = async () => {
    try {
      const token = localStorage.getItem("token");
      await axios.put(
        `${API}/landing-pages/${selectedProduct.id}/stock`,
        { stock_quantity: newStock },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Stok berhasil diupdate");
      setShowStockModal(false);
      fetchProducts();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Gagal update stok");
    }
  };

  const getStockStatus = (stock) => {
    if (stock === 0) {
      return <span className="text-red-600 font-semibold">Habis</span>;
    } else if (stock <= 10) {
      return <span className="text-yellow-600 font-semibold">Rendah ({stock})</span>;
    } else {
      return <span className="text-green-600 font-semibold">{stock} unit</span>;
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">🏪 Produk Saya</h1>
        <p className="text-gray-600">Kelola produk dan stok dari landing page Anda</p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-blue-800">
          💡 <strong>Tips:</strong> Produk di sini adalah landing page yang sudah diaktifkan sebagai produk dengan checkout. 
          Untuk menambah produk baru, buat landing page baru dan aktifkan fitur "Product & Checkout Settings".
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
        </div>
      ) : products.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Belum Ada Produk</h3>
          <p className="text-gray-600 mb-6">
            Buat landing page dan aktifkan sebagai produk untuk mulai berjualan
          </p>
          <button
            onClick={() => navigate("/dashboard/landing-pages")}
            className="px-6 py-3 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-semibold"
          >
            Buat Landing Page
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div key={product.id} className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow">
              {/* Product Image */}
              {product.hero_image && (
                <div className="h-48 overflow-hidden rounded-t-lg bg-gray-100">
                  <img
                    src={product.hero_image}
                    alt={product.product_name}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="p-4 space-y-3">
                {/* Product Name & Price */}
                <div>
                  <h3 className="font-bold text-lg text-gray-900 truncate">
                    {product.product_name}
                  </h3>
                  {product.product_price && (
                    <p className="text-teal-600 font-bold text-xl">
                      Rp {product.product_price.toLocaleString("id-ID")}
                    </p>
                  )}
                </div>

                {/* Stock Status */}
                <div className="bg-gray-50 p-3 rounded">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-gray-600">Stok:</span>
                    {getStockStatus(product.product_details?.stock_quantity || 0)}
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">SKU:</span>
                    <span className="text-sm font-mono">
                      {product.product_details?.sku || "-"}
                    </span>
                  </div>
                </div>

                {/* Order Stats */}
                <div className="bg-teal-50 p-3 rounded flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-teal-600" />
                    <span className="text-sm text-gray-600">Total Order:</span>
                  </div>
                  <span className="font-bold text-teal-600">
                    {product.order_count || 0}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => handleViewLandingPage(product.slug)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium"
                    title="View Landing Page"
                  >
                    <Eye className="w-4 h-4" />
                    View
                  </button>
                  <button
                    onClick={() => handleManageStock(product)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-sm font-medium"
                    title="Manage Stock"
                  >
                    <Package className="w-4 h-4" />
                    Stok
                  </button>
                  <button
                    onClick={() => handleEditProduct(product.id)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium"
                    title="Edit Product"
                  >
                    <Edit className="w-4 h-4" />
                    Edit
                  </button>
                </div>

                {/* Slug */}
                <div className="text-xs text-gray-500 truncate">
                  URL: /{product.slug}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stock Management Modal */}
      {showStockModal && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6 border-b">
              <h2 className="text-xl font-bold">Kelola Stok</h2>
              <p className="text-sm text-gray-600 mt-1">{selectedProduct.product_name}</p>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Stok Saat Ini</label>
                <div className="text-2xl font-bold text-teal-600">
                  {selectedProduct.product_details?.stock_quantity || 0} unit
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Stok Baru</label>
                <input
                  type="number"
                  value={newStock}
                  onChange={(e) => setNewStock(parseInt(e.target.value) || 0)}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                  min="0"
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
                <p className="text-sm text-yellow-800">
                  ⚠️ Perubahan stok akan langsung mempengaruhi ketersediaan produk di landing page
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => setShowStockModal(false)}
                  className="flex-1 px-4 py-2 border rounded-lg hover:bg-gray-50"
                >
                  Batal
                </button>
                <button
                  onClick={handleUpdateStock}
                  className="flex-1 px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 font-semibold"
                >
                  Update Stok
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MerchantProducts;
