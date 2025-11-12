import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { toast } from "sonner";
import WhatsAppCSManager from "./WhatsAppCSManager";
import TemplateSelector from "./TemplateSelector";
import ProductSettingsTab from "./ProductSettingsTab";

// Always use current domain for landing page URLs
const LANDING_PAGE_BASE_URL = typeof window !== 'undefined' ? window.location.origin : '';
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || LANDING_PAGE_BASE_URL;
const API = `${BACKEND_URL}/api`;

const LandingPageBuilder = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [landingPages, setLandingPages] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editingPage, setEditingPage] = useState(null);
  const [uploadingHero, setUploadingHero] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [formData, setFormData] = useState({
    template_id: "modern_gradient",
    product_name: "",
    product_description: "",
    pricing_mode: "single",
    product_price: "",
    product_original_price: "",
    currency: "IDR",
    pricing_packages: [],
    benefits: [""],
    hero_image: "",
    gallery_images: [],
    testimonials: [{ name: "", quote: "" }],
    primary_color: "#0EA5E9",
    accent_color: "#F59E0B",
    font_heading: "Inter",
    font_body: "Inter",
    facebook_pixel_id: "",
    tiktok_pixel_id: "",
    ga_measurement_id: "",
    whatsapp_numbers: [],
    whatsapp_number: "",
    cta_event_name: "Contact",
    seo_title: "",
    seo_description: "",
    seo_keywords: [""],
    slug: ""
  });
  const [productDetails, setProductDetails] = useState({
    is_enabled: false,
    sku: "",
    stock_quantity: 0,
    weight: 500,
    length: 10,
    width: 10,
    height: 10,
    enable_full_form: true,
    enable_whatsapp: true,
    whatsapp_number: "",
    shipping_origin: {
      contact_name: "",
      contact_phone: "",
      address: "",
      city: "",
      postal_code: ""
    },
    available_couriers: ["jne", "jnt", "sicepat", "lion"],
    payment_methods: ["cod", "transfer"],
    bank_accounts: []
  });
  const [aiLoading, setAiLoading] = useState(false);

  useEffect(() => {
    fetchLandingPages();
  }, []);

  const fetchLandingPages = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      const response = await axios.get(`${API}/landing-pages`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setLandingPages(response.data.landing_pages || []);
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to fetch landing pages");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayFieldChange = (field, index, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].map((item, i) => (i === index ? value : item))
    }));
  };

  const addArrayField = (field) => {
    setFormData(prev => ({
      ...prev,
      [field]: [...prev[field], field === "testimonials" ? { name: "", quote: "" } : ""]
    }));
  };

  const removeArrayField = (field, index) => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].filter((_, i) => i !== index)
    }));
  };

  const handleTestimonialChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      testimonials: prev.testimonials.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const handlePricingPackageChange = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      pricing_packages: prev.pricing_packages.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const addPricingPackage = () => {
    setFormData(prev => ({
      ...prev,
      pricing_packages: [...prev.pricing_packages, {
        name: "",
        price: 0,
        original_price: 0,
        description: "",
        features: [""],
        badge: "",
        is_highlighted: false,
        cta_text: "Beli Sekarang"
      }]
    }));
  };

  const removePricingPackage = (index) => {
    setFormData(prev => ({
      ...prev,
      pricing_packages: prev.pricing_packages.filter((_, i) => i !== index)
    }));
  };

  const handlePackageFeatureChange = (packageIndex, featureIndex, value) => {
    setFormData(prev => ({
      ...prev,
      pricing_packages: prev.pricing_packages.map((pkg, i) =>
        i === packageIndex ? {
          ...pkg,
          features: pkg.features.map((f, j) => j === featureIndex ? value : f)
        } : pkg
      )
    }));
  };

  const addPackageFeature = (packageIndex) => {
    setFormData(prev => ({
      ...prev,
      pricing_packages: prev.pricing_packages.map((pkg, i) =>
        i === packageIndex ? { ...pkg, features: [...pkg.features, ""] } : pkg
      )
    }));
  };

  const removePackageFeature = (packageIndex, featureIndex) => {
    setFormData(prev => ({
      ...prev,
      pricing_packages: prev.pricing_packages.map((pkg, i) =>
        i === packageIndex ? {
          ...pkg,
          features: pkg.features.filter((_, j) => j !== featureIndex)
        } : pkg
      )
    }));
  };

  const handleHeroImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File terlalu besar! Maksimal 5MB");
      return;
    }

    try {
      setUploadingHero(true);
      const token = localStorage.getItem("token");
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);

      toast.info("📤 Uploading hero image...");
      
      const response = await axios.post(`${API}/landing-pages/upload-image`, uploadFormData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        }
      });

      setFormData(prev => ({
        ...prev,
        hero_image: response.data.url
      }));
      
      toast.success("✅ Hero image uploaded!");
    } catch (error) {
      toast.error(error.response?.data?.detail || "❌ Failed to upload image");
    } finally {
      setUploadingHero(false);
      // Reset input
      e.target.value = "";
    }
  };

  const handleGalleryImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File terlalu besar! Maksimal 5MB");
      return;
    }

    try {
      setUploadingGallery(true);
      const token = localStorage.getItem("token");
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);

      toast.info("📤 Uploading gallery image...");
      
      const response = await axios.post(`${API}/landing-pages/upload-image`, uploadFormData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data"
        }
      });

      setFormData(prev => ({
        ...prev,
        gallery_images: [...prev.gallery_images, response.data.url]
      }));
      
      toast.success("✅ Gallery image uploaded!");
    } catch (error) {
      toast.error(error.response?.data?.detail || "❌ Failed to upload image");
    } finally {
      setUploadingGallery(false);
      // Reset input
      e.target.value = "";
    }
  };

  const removeGalleryImage = (index) => {
    setFormData(prev => ({
      ...prev,
      gallery_images: prev.gallery_images.filter((_, i) => i !== index)
    }));
  };

  const handleAskAI = async (type) => {
    if (!formData.product_name || !formData.product_description) {
      toast.error("Please fill product name and description first!");
      return;
    }

    if (type === "pricing_packages" && !formData.product_price) {
      toast.error("Please fill product price first!");
      return;
    }

    try {
      setAiLoading(true);
      const token = localStorage.getItem("token");
      
      toast.info(`🤖 AI sedang menganalisis ${type}...`);
      
      const requestData = {
        type: type,
        product_name: formData.product_name,
        product_description: formData.product_description
      };

      // Add price for pricing packages generation
      if (type === "pricing_packages") {
        requestData.base_price = parseFloat(formData.product_price);
        requestData.currency = formData.currency;
      }
      
      const response = await axios.post(`${API}/landing-pages/ai-helper`, requestData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (type === "benefits") {
        setFormData(prev => ({ ...prev, benefits: response.data.data }));
        toast.success("✅ Benefits generated by AI!");
      } else if (type === "testimonials") {
        setFormData(prev => ({ ...prev, testimonials: response.data.data }));
        toast.success("✅ Testimonials generated by AI!");
      } else if (type === "seo") {
        setFormData(prev => ({
          ...prev,
          seo_title: response.data.data.title,
          seo_description: response.data.data.description,
          seo_keywords: response.data.data.keywords
        }));
        toast.success("✅ SEO content generated by AI!");
      } else if (type === "pricing_packages") {
        setFormData(prev => ({ ...prev, pricing_packages: response.data.data }));
        toast.success("✅ Pricing packages generated by AI!");
      }
    } catch (error) {
      toast.error(error.response?.data?.detail || "AI generation failed");
    } finally {
      setAiLoading(false);
    }
  };

  const generateSlug = () => {
    const slug = formData.product_name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
    setFormData(prev => ({ ...prev, slug }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.product_name || !formData.product_description || !formData.slug) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);
      const token = localStorage.getItem("token");
      
      // Clean up data
      const submitData = {
        ...formData,
        product_price: formData.product_price ? parseFloat(formData.product_price) : null,
        product_original_price: formData.product_original_price ? parseFloat(formData.product_original_price) : null,
        benefits: formData.benefits.filter(b => b.trim()),
        seo_keywords: formData.seo_keywords.filter(k => k.trim()),
        testimonials: formData.testimonials.filter(t => t.name && t.quote),
        pricing_packages: formData.pricing_packages.map(pkg => ({
          ...pkg,
          price: parseFloat(pkg.price) || 0,
          original_price: parseFloat(pkg.original_price) || 0,
          features: pkg.features.filter(f => f.trim())
        })),
        // Add product details for order management
        product_details: productDetails
      };

      toast.info("Generating AI content... This may take a moment.");

      if (editingPage) {
        await axios.put(`${API}/landing-pages/${editingPage.id}`, submitData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success("Landing page updated successfully!");
      } else {
        await axios.post(`${API}/landing-pages`, submitData, {
          headers: { Authorization: `Bearer ${token}` }
        });
        toast.success("Landing page created successfully with AI-generated content!");
      }

      setShowForm(false);
      setEditingPage(null);
      fetchLandingPages();
      resetForm();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to save landing page");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      template_id: "modern_gradient",
      product_name: "",
      product_description: "",
      pricing_mode: "single",
      product_price: "",
      product_original_price: "",
      currency: "IDR",
      pricing_packages: [],
      benefits: [""],
      hero_image: "",
      gallery_images: [],
      testimonials: [{ name: "", quote: "" }],
      primary_color: "#0EA5E9",
      accent_color: "#F59E0B",
      font_heading: "Inter",
      font_body: "Inter",
      facebook_pixel_id: "",
      tiktok_pixel_id: "",
      ga_measurement_id: "",
      whatsapp_numbers: [],
      whatsapp_number: "",
      cta_event_name: "Contact",
      seo_title: "",
      seo_description: "",
      seo_keywords: [""],
      slug: ""
    });
    setProductDetails({
      is_enabled: false,
      sku: "",
      stock_quantity: 0,
      weight: 500,
      length: 10,
      width: 10,
      height: 10,
      enable_full_form: true,
      enable_whatsapp: true,
      whatsapp_number: "",
      shipping_origin: {
        contact_name: "",
        contact_phone: "",
        address: "",
        city: "",
        postal_code: ""
      },
      available_couriers: ["jne", "jnt", "sicepat", "lion"],
      payment_methods: ["cod", "transfer"],
      bank_accounts: []
    });
  };

  const handleEdit = (page) => {
    setEditingPage(page);
    setFormData({
      template_id: page.template_id || "modern_gradient",
      product_name: page.product_name,
      product_description: page.product_description,
      pricing_mode: page.pricing_mode || "single",
      product_price: page.product_price || "",
      product_original_price: page.product_original_price || "",
      currency: page.currency,
      pricing_packages: page.pricing_packages || [],
      benefits: page.benefits.length > 0 ? page.benefits : [""],
      hero_image: page.hero_image || "",
      gallery_images: page.gallery_images || [],
      testimonials: page.testimonials.length > 0 ? page.testimonials : [{ name: "", quote: "" }],
      primary_color: page.primary_color,
      accent_color: page.accent_color,
      font_heading: page.font_heading,
      font_body: page.font_body,
      facebook_pixel_id: page.facebook_pixel_id || "",
      tiktok_pixel_id: page.tiktok_pixel_id || "",
      ga_measurement_id: page.ga_measurement_id || "",
      whatsapp_numbers: page.whatsapp_numbers || [],
      whatsapp_number: page.whatsapp_number || "",
      cta_event_name: page.cta_event_name || "Contact",
      seo_title: page.seo_title || "",
      seo_description: page.seo_description || "",
      seo_keywords: page.seo_keywords.length > 0 ? page.seo_keywords : [""],
      slug: page.slug
    });
    // Load product details if exists
    if (page.product_details) {
      setProductDetails({
        is_enabled: page.product_details.is_enabled || false,
        sku: page.product_details.sku || "",
        stock_quantity: page.product_details.stock_quantity || 0,
        weight: page.product_details.weight || 500,
        length: page.product_details.length || 10,
        width: page.product_details.width || 10,
        height: page.product_details.height || 10,
        enable_full_form: page.product_details.enable_full_form !== undefined ? page.product_details.enable_full_form : true,
        enable_whatsapp: page.product_details.enable_whatsapp !== undefined ? page.product_details.enable_whatsapp : true,
        whatsapp_number: page.product_details.whatsapp_number || "",
        shipping_origin: page.product_details.shipping_origin || {
          contact_name: "",
          contact_phone: "",
          address: "",
          city: "",
          postal_code: ""
        },
        available_couriers: page.product_details.available_couriers || ["jne", "jnt", "sicepat", "lion"],
        payment_methods: page.product_details.payment_methods || ["cod", "transfer"],
        bank_accounts: page.product_details.bank_accounts || []
      });
    }
    setShowForm(true);
  };

  const handleDelete = async (pageId) => {
    if (!window.confirm("Are you sure you want to delete this landing page?")) return;

    try {
      const token = localStorage.getItem("token");
      await axios.delete(`${API}/landing-pages/${pageId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Landing page deleted successfully");
      fetchLandingPages();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to delete landing page");
    }
  };

  const handlePublish = async (pageId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(`${API}/landing-pages/${pageId}/publish`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success(`Landing page published! URL: ${LANDING_PAGE_BASE_URL}/${response.data.slug || formData.slug}`);
      fetchLandingPages();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to publish landing page");
    }
  };

  const handleRegenerateContent = async (pageId) => {
    if (!window.confirm("This will regenerate the AI content. Continue?")) return;

    try {
      const token = localStorage.getItem("token");
      toast.info("Regenerating content...");
      await axios.post(`${API}/landing-pages/${pageId}/regenerate-content`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success("Content regenerated successfully!");
      fetchLandingPages();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to regenerate content");
    }
  };

  if (showForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">
            {editingPage ? "Edit Landing Page" : "Create Landing Page"}
          </h2>
          <Button
            variant="outline"
            onClick={() => {
              setShowForm(false);
              setEditingPage(null);
              resetForm();
            }}
          >
            ← Back to List
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Template Selection */}
          <Card>
            <CardHeader>
              <CardTitle>1. Pilih Template Design</CardTitle>
            </CardHeader>
            <CardContent>
              <TemplateSelector
                selectedTemplate={formData.template_id}
                onChange={(templateId) => handleInputChange("template_id", templateId)}
              />
            </CardContent>
          </Card>

          {/* Product Information */}
          <Card>
            <CardHeader>
              <CardTitle>2. Product Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  value={formData.product_name}
                  onChange={(e) => handleInputChange("product_name", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description *
                </label>
                <textarea
                  value={formData.product_description}
                  onChange={(e) => handleInputChange("product_description", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows="4"
                  maxLength="240"
                  required
                />
                <span className="text-xs text-gray-500">
                  {formData.product_description.length}/240
                </span>
              </div>

              {/* Pricing Mode Toggle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pricing Mode
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      value="single"
                      checked={formData.pricing_mode === "single"}
                      onChange={(e) => handleInputChange("pricing_mode", e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-sm">Single Price</span>
                  </label>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="radio"
                      value="multiple"
                      checked={formData.pricing_mode === "multiple"}
                      onChange={(e) => handleInputChange("pricing_mode", e.target.value)}
                      className="mr-2"
                    />
                    <span className="text-sm">Multiple Packages</span>
                  </label>
                </div>
              </div>

              {/* Single Price Mode */}
              {formData.pricing_mode === "single" && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Price
                      </label>
                      <input
                        type="number"
                        value={formData.product_price}
                        onChange={(e) => handleInputChange("product_price", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Currency
                      </label>
                      <select
                        value={formData.currency}
                        onChange={(e) => handleInputChange("currency", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="IDR">IDR</option>
                        <option value="USD">USD</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Original Price (Optional - untuk menampilkan diskon)
                    </label>
                    <input
                      type="number"
                      value={formData.product_original_price}
                      onChange={(e) => handleInputChange("product_original_price", e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Masukkan harga asli untuk menampilkan harga coret"
                    />
                    {formData.product_original_price && formData.product_price && parseFloat(formData.product_original_price) > parseFloat(formData.product_price) && (
                      <p className="text-xs text-green-600 mt-1">
                        ✓ Hemat {Math.round(((parseFloat(formData.product_original_price) - parseFloat(formData.product_price)) / parseFloat(formData.product_original_price)) * 100)}% akan ditampilkan
                      </p>
                    )}
                  </div>
                </>
              )}

              {/* Multiple Packages Mode */}
              {formData.pricing_mode === "multiple" && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700">
                      Pricing Packages (Base Price: {formData.product_price || 0} {formData.currency})
                    </label>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleAskAI("pricing_packages")}
                      disabled={aiLoading || !formData.product_price}
                      className="bg-purple-600 hover:bg-purple-700 text-white"
                    >
                      {aiLoading ? "⏳ Loading..." : "🤖 Tanya AI"}
                    </Button>
                  </div>
                  
                  <div className="mb-3 grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Base Price *
                      </label>
                      <input
                        type="number"
                        value={formData.product_price}
                        onChange={(e) => handleInputChange("product_price", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Currency
                      </label>
                      <select
                        value={formData.currency}
                        onChange={(e) => handleInputChange("currency", e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="IDR">IDR</option>
                        <option value="USD">USD</option>
                      </select>
                    </div>
                  </div>

                  {formData.pricing_packages.map((pkg, pkgIndex) => (
                    <div key={pkgIndex} className="p-4 border border-gray-300 rounded-lg mb-3 bg-gray-50">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-sm">Package {pkgIndex + 1}</h4>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removePricingPackage(pkgIndex)}
                        >
                          ✕
                        </Button>
                      </div>
                      
                      <div className="space-y-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Package Name *</label>
                          <input
                            type="text"
                            value={pkg.name}
                            onChange={(e) => handlePricingPackageChange(pkgIndex, "name", e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                            placeholder="e.g., Beli 1 Pcs"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Price *</label>
                            <input
                              type="number"
                              value={pkg.price}
                              onChange={(e) => handlePricingPackageChange(pkgIndex, "price", e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Original Price</label>
                            <input
                              type="number"
                              value={pkg.original_price}
                              onChange={(e) => handlePricingPackageChange(pkgIndex, "original_price", e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
                          <input
                            type="text"
                            value={pkg.description}
                            onChange={(e) => handlePricingPackageChange(pkgIndex, "description", e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                            placeholder="Short description"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-medium text-gray-600 mb-1">Features</label>
                          {pkg.features.map((feature, featIndex) => (
                            <div key={featIndex} className="flex gap-2 mb-1">
                              <input
                                type="text"
                                value={feature}
                                onChange={(e) => handlePackageFeatureChange(pkgIndex, featIndex, e.target.value)}
                                className="flex-1 px-2 py-1 text-sm border border-gray-300 rounded-md"
                                placeholder="Feature..."
                              />
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => removePackageFeature(pkgIndex, featIndex)}
                              >
                                ✕
                              </Button>
                            </div>
                          ))}
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addPackageFeature(pkgIndex)}
                            className="mt-1"
                          >
                            + Add Feature
                          </Button>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Badge (Optional)</label>
                            <input
                              type="text"
                              value={pkg.badge}
                              onChange={(e) => handlePricingPackageChange(pkgIndex, "badge", e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                              placeholder="e.g., HEMAT 20%"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">CTA Text</label>
                            <input
                              type="text"
                              value={pkg.cta_text}
                              onChange={(e) => handlePricingPackageChange(pkgIndex, "cta_text", e.target.value)}
                              className="w-full px-2 py-1 text-sm border border-gray-300 rounded-md"
                              placeholder="e.g., Beli Sekarang"
                            />
                          </div>
                        </div>

                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            checked={pkg.is_highlighted}
                            onChange={(e) => handlePricingPackageChange(pkgIndex, "is_highlighted", e.target.checked)}
                            className="mr-2"
                          />
                          <label className="text-xs font-medium text-gray-600">Highlight this package (recommended)</label>
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <Button
                    type="button"
                    variant="outline"
                    onClick={addPricingPackage}
                    className="mt-2"
                  >
                    + Add Package
                  </Button>
                </div>
              )}

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Benefits (Max 7)
                  </label>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleAskAI("benefits")}
                    disabled={aiLoading}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    {aiLoading ? "⏳ Loading..." : "🤖 Tanya AI"}
                  </Button>
                </div>
                {formData.benefits.map((benefit, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={benefit}
                      onChange={(e) => handleArrayFieldChange("benefits", index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Benefit..."
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => removeArrayField("benefits", index)}
                    >
                      ✕
                    </Button>
                  </div>
                ))}
                {formData.benefits.length < 7 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => addArrayField("benefits")}
                    className="mt-2"
                  >
                    + Add Benefit
                  </Button>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Hero Image (1 gambar untuk section hero)
                </label>
                {uploadingHero ? (
                  <div className="flex items-center justify-center p-8 bg-blue-50 rounded-lg border-2 border-blue-200">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-3"></div>
                      <p className="text-sm text-blue-600 font-semibold">Uploading hero image...</p>
                      <p className="text-xs text-gray-500 mt-1">Mohon tunggu sebentar</p>
                    </div>
                  </div>
                ) : formData.hero_image ? (
                  <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200 mb-2">
                    <div className="relative">
                      <img 
                        src={formData.hero_image} 
                        alt="Hero Preview"
                        className="w-24 h-24 object-cover rounded border-2 border-green-300"
                        onError={(e) => {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }}
                      />
                      <div className="w-24 h-24 bg-gray-200 rounded border-2 border-gray-300 flex items-center justify-center" style={{display: 'none'}}>
                        <span className="text-xs text-gray-500">No Preview</span>
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-green-700 font-semibold mb-1">✅ Hero Image Uploaded</div>
                      <div className="text-xs text-gray-500 truncate" title={formData.hero_image}>
                        {formData.hero_image.split('/').pop().split('?')[0]}
                      </div>
                      <a 
                        href={formData.hero_image} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline"
                      >
                        Lihat gambar →
                      </a>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setFormData(prev => ({ ...prev, hero_image: "" }))}
                      className="flex-shrink-0 bg-red-50 hover:bg-red-100 text-red-600"
                    >
                      ✕ Hapus
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleHeroImageUpload}
                      disabled={uploadingHero}
                      className="block w-full text-sm text-gray-500
                        file:mr-4 file:py-2 file:px-4
                        file:rounded-md file:border-0
                        file:text-sm file:font-semibold
                        file:bg-blue-50 file:text-blue-700
                        hover:file:bg-blue-100 cursor-pointer
                        disabled:opacity-50 disabled:cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500">📸 Max 5MB • Format: JPG, PNG, WEBP</p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gallery Product Images (Max 8, akan ditampilkan di carousel)
                </label>
                <div className="space-y-2">
                  {uploadingGallery && (
                    <div className="flex items-center gap-3 p-4 bg-teal-50 rounded-lg border-2 border-teal-200">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
                      <div>
                        <p className="text-sm text-teal-600 font-semibold">Uploading gallery image...</p>
                        <p className="text-xs text-gray-500">Mohon tunggu sebentar</p>
                      </div>
                    </div>
                  )}
                  
                  {formData.gallery_images.map((img, index) => (
                    <div key={index} className="flex items-center gap-3 p-2 bg-teal-50 rounded-lg border border-teal-200">
                      <div className="relative">
                        <img 
                          src={img} 
                          alt={`Gallery ${index + 1}`}
                          className="w-20 h-20 object-cover rounded border-2 border-teal-300"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                        <div className="w-20 h-20 bg-gray-200 rounded border-2 border-gray-300 flex items-center justify-center" style={{display: 'none'}}>
                          <span className="text-xs text-gray-500">No Preview</span>
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-teal-700 font-semibold mb-1">✅ Gallery {index + 1}</div>
                        <div className="text-xs text-gray-500 truncate" title={img}>
                          {img.split('/').pop().split('?')[0]}
                        </div>
                        <a 
                          href={img} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Lihat gambar →
                        </a>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => removeGalleryImage(index)}
                        className="flex-shrink-0 bg-red-50 hover:bg-red-100 text-red-600"
                      >
                        ✕
                      </Button>
                    </div>
                  ))}
                  
                  {formData.gallery_images.length < 8 && (
                    <div className="mt-2 space-y-2">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleGalleryImageUpload}
                        disabled={uploadingGallery}
                        className="block w-full text-sm text-gray-500
                          file:mr-4 file:py-2 file:px-4
                          file:rounded-md file:border-0
                          file:text-sm file:font-semibold
                          file:bg-teal-50 file:text-teal-700
                          hover:file:bg-teal-100 cursor-pointer
                          disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                      <p className="text-xs text-gray-500">📸 Max 5MB • Format: JPG, PNG, WEBP • {formData.gallery_images.length}/8 gambar</p>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">
                    Testimonials (Max 6)
                  </label>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => handleAskAI("testimonials")}
                    disabled={aiLoading}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    {aiLoading ? "⏳ Loading..." : "🤖 Tanya AI"}
                  </Button>
                </div>
                {formData.testimonials.map((testimonial, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={testimonial.name}
                      onChange={(e) => handleTestimonialChange(index, "name", e.target.value)}
                      className="w-1/3 px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Name"
                    />
                    <input
                      type="text"
                      value={testimonial.quote}
                      onChange={(e) => handleTestimonialChange(index, "quote", e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Quote"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => removeArrayField("testimonials", index)}
                    >
                      ✕
                    </Button>
                  </div>
                ))}
                {formData.testimonials.length < 6 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => addArrayField("testimonials")}
                    className="mt-2"
                  >
                    + Add Testimonial
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Branding */}
          <Card>
            <CardHeader>
              <CardTitle>Branding</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Primary Color
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={formData.primary_color}
                      onChange={(e) => handleInputChange("primary_color", e.target.value)}
                      className="w-16 h-10"
                    />
                    <input
                      type="text"
                      value={formData.primary_color}
                      onChange={(e) => handleInputChange("primary_color", e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Accent Color
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={formData.accent_color}
                      onChange={(e) => handleInputChange("accent_color", e.target.value)}
                      className="w-16 h-10"
                    />
                    <input
                      type="text"
                      value={formData.accent_color}
                      onChange={(e) => handleInputChange("accent_color", e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Font Heading
                  </label>
                  <input
                    type="text"
                    value={formData.font_heading}
                    onChange={(e) => handleInputChange("font_heading", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Font Body
                  </label>
                  <input
                    type="text"
                    value={formData.font_body}
                    onChange={(e) => handleInputChange("font_body", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Integrations */}
          <Card>
            <CardHeader>
              <CardTitle>Integrations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Facebook Pixel ID
                  </label>
                  <input
                    type="text"
                    value={formData.facebook_pixel_id}
                    onChange={(e) => handleInputChange("facebook_pixel_id", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    TikTok Pixel ID
                  </label>
                  <input
                    type="text"
                    value={formData.tiktok_pixel_id}
                    onChange={(e) => handleInputChange("tiktok_pixel_id", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Google Analytics ID
                  </label>
                  <input
                    type="text"
                    value={formData.ga_measurement_id}
                    onChange={(e) => handleInputChange("ga_measurement_id", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
              </div>

              {/* WhatsApp CS Manager with Auto-Rotation */}
              <div className="mt-6">
                <WhatsAppCSManager
                  whatsappNumbers={formData.whatsapp_numbers}
                  onChange={(numbers) => handleInputChange("whatsapp_numbers", numbers)}
                />
              </div>

              <div className="grid grid-cols-1 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CTA Event Name (untuk pixel tracking)
                  </label>
                  <select
                    value={formData.cta_event_name}
                    onChange={(e) => handleInputChange("cta_event_name", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-white"
                  >
                    <option value="Contact">Contact - Kontak via WhatsApp</option>
                    <option value="Lead">Lead - Generate lead baru</option>
                    <option value="Purchase">Purchase - Pembelian produk</option>
                    <option value="AddToCart">AddToCart - Tambah ke keranjang</option>
                    <option value="InitiateCheckout">InitiateCheckout - Mulai checkout</option>
                    <option value="ViewContent">ViewContent - Lihat konten produk</option>
                    <option value="Schedule">Schedule - Jadwalkan appointment</option>
                    <option value="SubmitApplication">SubmitApplication - Submit aplikasi</option>
                    <option value="Subscribe">Subscribe - Subscribe/Langganan</option>
                    <option value="CompleteRegistration">CompleteRegistration - Registrasi lengkap</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Event yang akan di-track saat user klik tombol CTA WhatsApp. Event ini akan dikirim ke Facebook Pixel, TikTok Pixel, dan Google Analytics.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SEO */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>SEO</CardTitle>
              <Button
                type="button"
                size="sm"
                onClick={() => handleAskAI("seo")}
                disabled={aiLoading}
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                {aiLoading ? "⏳ Loading..." : "🤖 Tanya AI"}
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SEO Title
                </label>
                <input
                  type="text"
                  value={formData.seo_title}
                  onChange={(e) => handleInputChange("seo_title", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SEO Description
                </label>
                <textarea
                  value={formData.seo_description}
                  onChange={(e) => handleInputChange("seo_description", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  rows="3"
                  maxLength="160"
                />
                <span className="text-xs text-gray-500">
                  {formData.seo_description.length}/160
                </span>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  SEO Keywords (Max 12)
                </label>
                {formData.seo_keywords.map((keyword, index) => (
                  <div key={index} className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={keyword}
                      onChange={(e) => handleArrayFieldChange("seo_keywords", index, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                      placeholder="Keyword..."
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => removeArrayField("seo_keywords", index)}
                    >
                      ✕
                    </Button>
                  </div>
                ))}
                {formData.seo_keywords.length < 12 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => addArrayField("seo_keywords")}
                    className="mt-2"
                  >
                    + Add Keyword
                  </Button>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  URL Slug *
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) => handleInputChange("slug", e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={generateSlug}
                  >
                    Generate
                  </Button>
                </div>
                <span className="text-xs text-gray-500">
                  Your landing page will be available at: {LANDING_PAGE_BASE_URL}/{formData.slug}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Product & Order Management Settings - HIDDEN FOR NOW */}
          {/* Uncomment this section to enable Product & Checkout features
          <Card>
            <CardHeader>
              <CardTitle>🛒 Product & Checkout Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <ProductSettingsTab 
                productDetails={productDetails} 
                setProductDetails={setProductDetails}
              />
            </CardContent>
          </Card>
          */}

          <div className="flex justify-end gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowForm(false);
                setEditingPage(null);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-teal-600 hover:bg-teal-700"
            >
              {loading ? "Saving..." : (editingPage ? "Update" : "Create")} Landing Page
            </Button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-bold text-gray-900">Landing Page Builder</h2>
            <span className="px-3 py-1 text-sm font-bold bg-gradient-to-r from-orange-400 to-yellow-400 text-white rounded-full shadow-lg animate-pulse">
              BETA
            </span>
          </div>
          <p className="text-gray-600 mt-1">
            Create AI-powered landing pages without coding
          </p>
          <p className="text-xs text-orange-600 mt-1 flex items-center gap-1">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            Fitur masih dalam tahap pengembangan. Laporan bug atau feedback sangat dihargai!
          </p>
        </div>
        <Button
          onClick={() => setShowForm(true)}
          className="bg-teal-600 hover:bg-teal-700"
        >
          + Create Landing Page
        </Button>
      </div>

      {loading && landingPages.length === 0 ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
        </div>
      ) : landingPages.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Landing Pages Yet
            </h3>
            <p className="text-gray-600 mb-4">
              Create your first AI-powered landing page to get started
            </p>
            <Button
              onClick={() => setShowForm(true)}
              className="bg-teal-600 hover:bg-teal-700"
            >
              Create Your First Landing Page
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {landingPages.map((page) => (
            <Card key={page.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="truncate">{page.product_name}</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    page.status === "published"
                      ? "bg-green-100 text-green-800"
                      : "bg-gray-100 text-gray-800"
                  }`}>
                    {page.status}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-gray-600 line-clamp-2">
                  {page.product_description}
                </p>
                
                <div className="text-sm text-gray-500">
                  <div>Slug: <span className="font-mono">/{page.slug}</span></div>
                  <div>Created: {new Date(page.created_at).toLocaleDateString()}</div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(page)}
                  >
                    ✏️ Edit
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(`${LANDING_PAGE_BASE_URL}/${page.slug}`, "_blank")}
                    disabled={page.status !== "published"}
                  >
                    👁️ View
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePublish(page.id)}
                    disabled={page.status === "published"}
                    className="bg-green-50 hover:bg-green-100"
                  >
                    🚀 Publish
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRegenerateContent(page.id)}
                  >
                    🔄 Regenerate
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(page.id)}
                    className="bg-red-50 hover:bg-red-100 text-red-600"
                  >
                    🗑️ Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default LandingPageBuilder;
