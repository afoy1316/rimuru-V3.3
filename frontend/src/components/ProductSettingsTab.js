import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";

const ProductSettingsTab = ({ productDetails, setProductDetails }) => {
  const handleChange = (field, value) => {
    setProductDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleShippingOriginChange = (field, value) => {
    setProductDetails(prev => ({
      ...prev,
      shipping_origin: {
        ...prev.shipping_origin,
        [field]: value
      }
    }));
  };

  const handleBankAccountChange = (index, field, value) => {
    const newBankAccounts = [...(productDetails.bank_accounts || [])];
    newBankAccounts[index] = {
      ...newBankAccounts[index],
      [field]: value
    };
    setProductDetails(prev => ({
      ...prev,
      bank_accounts: newBankAccounts
    }));
  };

  const addBankAccount = () => {
    setProductDetails(prev => ({
      ...prev,
      bank_accounts: [
        ...(prev.bank_accounts || []),
        { bank_name: "", account_number: "", account_name: "" }
      ]
    }));
  };

  const removeBankAccount = (index) => {
    setProductDetails(prev => ({
      ...prev,
      bank_accounts: prev.bank_accounts.filter((_, i) => i !== index)
    }));
  };

  const toggleCourier = (courier) => {
    const currentCouriers = productDetails.available_couriers || [];
    if (currentCouriers.includes(courier)) {
      setProductDetails(prev => ({
        ...prev,
        available_couriers: currentCouriers.filter(c => c !== courier)
      }));
    } else {
      setProductDetails(prev => ({
        ...prev,
        available_couriers: [...currentCouriers, courier]
      }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Enable Product Toggle */}
      <Card>
        <CardHeader>
          <CardTitle>Enable Product & Checkout</CardTitle>
        </CardHeader>
        <CardContent>
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={productDetails.is_enabled || false}
              onChange={(e) => handleChange("is_enabled", e.target.checked)}
              className="w-5 h-5 text-teal-600 rounded focus:ring-teal-500"
            />
            <span className="text-sm font-medium">Enable as Product (with Checkout)</span>
          </label>
          <p className="text-xs text-gray-500 mt-2">
            When enabled, this landing page will have checkout functionality for orders
          </p>
        </CardContent>
      </Card>

      {productDetails.is_enabled && (
        <>
          {/* Product Information */}
          <Card>
            <CardHeader>
              <CardTitle>Product Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">SKU (Stock Keeping Unit)</label>
                <input
                  type="text"
                  value={productDetails.sku || ""}
                  onChange={(e) => handleChange("sku", e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="e.g., PROD-001"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Stock Quantity</label>
                <input
                  type="number"
                  value={productDetails.stock_quantity || 0}
                  onChange={(e) => handleChange("stock_quantity", parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border rounded-lg"
                  placeholder="Available stock"
                  min="0"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Weight (grams)</label>
                  <input
                    type="number"
                    value={productDetails.weight || 0}
                    onChange={(e) => handleChange("weight", parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="500"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Length (cm)</label>
                  <input
                    type="number"
                    value={productDetails.length || 10}
                    onChange={(e) => handleChange("length", parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="10"
                    min="0"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Width (cm)</label>
                  <input
                    type="number"
                    value={productDetails.width || 10}
                    onChange={(e) => handleChange("width", parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="10"
                    min="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Height (cm)</label>
                  <input
                    type="number"
                    value={productDetails.height || 10}
                    onChange={(e) => handleChange("height", parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="10"
                    min="0"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Checkout Options */}
          <Card>
            <CardHeader>
              <CardTitle>Checkout Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={productDetails.enable_full_form || false}
                  onChange={(e) => handleChange("enable_full_form", e.target.checked)}
                  className="w-5 h-5 text-teal-600 rounded focus:ring-teal-500"
                />
                <span className="text-sm font-medium">Enable Full Form Checkout</span>
              </label>
              <p className="text-xs text-gray-500 ml-8">
                Customer fills form with shipping calculation and payment
              </p>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={productDetails.enable_whatsapp || false}
                  onChange={(e) => handleChange("enable_whatsapp", e.target.checked)}
                  className="w-5 h-5 text-teal-600 rounded focus:ring-teal-500"
                />
                <span className="text-sm font-medium">Enable WhatsApp Checkout (CTWA)</span>
              </label>
              <p className="text-xs text-gray-500 ml-8">
                Click to WhatsApp button with pre-filled message. Uses WhatsApp number from "WhatsApp CS Manager" section below.
              </p>
            </CardContent>
          </Card>

          {/* Shipping Settings */}
          <Card>
            <CardHeader>
              <CardTitle>Shipping Settings (Origin)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Contact Name</label>
                  <input
                    type="text"
                    value={productDetails.shipping_origin?.contact_name || ""}
                    onChange={(e) => handleShippingOriginChange("contact_name", e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Toko ABC"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={productDetails.shipping_origin?.contact_phone || ""}
                    onChange={(e) => handleShippingOriginChange("contact_phone", e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="081234567890"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Address</label>
                <textarea
                  value={productDetails.shipping_origin?.address || ""}
                  onChange={(e) => handleShippingOriginChange("address", e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg"
                  rows="3"
                  placeholder="Jl. Contoh No. 123, Jakarta"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">City</label>
                  <input
                    type="text"
                    value={productDetails.shipping_origin?.city || ""}
                    onChange={(e) => handleShippingOriginChange("city", e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="Jakarta"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Postal Code</label>
                  <input
                    type="number"
                    value={productDetails.shipping_origin?.postal_code || ""}
                    onChange={(e) => handleShippingOriginChange("postal_code", e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    placeholder="12440"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Available Couriers</label>
                <div className="grid grid-cols-3 gap-3">
                  {["jne", "jnt", "sicepat", "anteraja", "lion", "pos", "tiki"].map(courier => (
                    <label key={courier} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={(productDetails.available_couriers || []).includes(courier)}
                        onChange={() => toggleCourier(courier)}
                        className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500"
                      />
                      <span className="text-sm uppercase">{courier === "lion" ? "Lion Parcel" : courier}</span>
                    </label>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payment Methods */}
          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={(productDetails.payment_methods || []).includes("cod")}
                  onChange={(e) => {
                    const methods = productDetails.payment_methods || [];
                    if (e.target.checked) {
                      handleChange("payment_methods", [...methods, "cod"]);
                    } else {
                      handleChange("payment_methods", methods.filter(m => m !== "cod"));
                    }
                  }}
                  className="w-5 h-5 text-teal-600 rounded focus:ring-teal-500"
                />
                <span className="text-sm font-medium">Cash on Delivery (COD)</span>
              </label>

              <label className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={(productDetails.payment_methods || []).includes("transfer")}
                  onChange={(e) => {
                    const methods = productDetails.payment_methods || [];
                    if (e.target.checked) {
                      handleChange("payment_methods", [...methods, "transfer"]);
                    } else {
                      handleChange("payment_methods", methods.filter(m => m !== "transfer"));
                    }
                  }}
                  className="w-5 h-5 text-teal-600 rounded focus:ring-teal-500"
                />
                <span className="text-sm font-medium">Bank Transfer</span>
              </label>

              {(productDetails.payment_methods || []).includes("transfer") && (
                <div className="mt-4 space-y-4">
                  <h4 className="text-sm font-semibold">Bank Accounts</h4>
                  {(productDetails.bank_accounts || []).map((account, index) => (
                    <div key={index} className="border rounded-lg p-4 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Account #{index + 1}</span>
                        <Button
                          type="button"
                          onClick={() => removeBankAccount(index)}
                          size="sm"
                          variant="destructive"
                        >
                          Remove
                        </Button>
                      </div>
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="block text-xs mb-1">Bank Name</label>
                          <input
                            type="text"
                            value={account.bank_name || ""}
                            onChange={(e) => handleBankAccountChange(index, "bank_name", e.target.value)}
                            className="w-full px-2 py-1 text-sm border rounded"
                            placeholder="BCA"
                          />
                        </div>
                        <div>
                          <label className="block text-xs mb-1">Account Number</label>
                          <input
                            type="text"
                            value={account.account_number || ""}
                            onChange={(e) => handleBankAccountChange(index, "account_number", e.target.value)}
                            className="w-full px-2 py-1 text-sm border rounded"
                            placeholder="1234567890"
                          />
                        </div>
                        <div>
                          <label className="block text-xs mb-1">Account Name</label>
                          <input
                            type="text"
                            value={account.account_name || ""}
                            onChange={(e) => handleBankAccountChange(index, "account_name", e.target.value)}
                            className="w-full px-2 py-1 text-sm border rounded"
                            placeholder="Toko ABC"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button
                    type="button"
                    onClick={addBankAccount}
                    variant="outline"
                    size="sm"
                  >
                    + Add Bank Account
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default ProductSettingsTab;
