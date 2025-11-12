import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { toast } from 'sonner';
import { Sparkles, Copy, CheckCircle2, Loader2, RefreshCw, Save, Trash2, Edit, Eye, Search, X } from 'lucide-react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const AdCopyGenerator = () => {
  const [activeTab, setActiveTab] = useState('generate'); // 'generate', 'saved'
  const [formData, setFormData] = useState({
    product_name: '',
    description: '',
    goal: 'Purchase'
  });
  const [loading, setLoading] = useState(false);
  const [generatedCopy, setGeneratedCopy] = useState(null);
  const [copiedItems, setCopiedItems] = useState({});
  
  // Saved ad copies state
  const [savedCopies, setSavedCopies] = useState([]);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterGoal, setFilterGoal] = useState('all');
  const [selectedCopy, setSelectedCopy] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [saveLabel, setSaveLabel] = useState('');
  const [editLabel, setEditLabel] = useState('');

  // Fetch initial count on mount
  useEffect(() => {
    fetchSavedCopies();
  }, []);

  // Refresh when tab changes or filters change
  useEffect(() => {
    if (activeTab === 'saved') {
      fetchSavedCopies();
    }
  }, [activeTab, searchTerm, filterGoal]);

  const fetchSavedCopies = async () => {
    setLoadingSaved(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (filterGoal !== 'all') params.append('goal', filterGoal);
      
      const response = await axios.get(`${API}/ad-copies?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setSavedCopies(response.data.ad_copies);
      }
    } catch (error) {
      console.error('Error fetching saved copies:', error);
      toast.error('Gagal memuat saved ad copies');
    } finally {
      setLoadingSaved(false);
    }
  };

  const handleSaveAdCopy = async () => {
    if (!saveLabel.trim()) {
      toast.error('Nama/label wajib diisi');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        `${API}/ad-copies`,
        {
          label: saveLabel,
          product_name: formData.product_name,
          description: formData.description,
          goal: formData.goal,
          generated_content: generatedCopy
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      toast.success('Ad copy berhasil disimpan! 🎉');
      setShowSaveModal(false);
      setSaveLabel('');
      setActiveTab('saved');
    } catch (error) {
      console.error('Error saving ad copy:', error);
      toast.error(error.response?.data?.detail || 'Gagal menyimpan ad copy');
    }
  };

  const handleDeleteAdCopy = async (adCopyId) => {
    if (!window.confirm('Yakin ingin menghapus ad copy ini?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/ad-copies/${adCopyId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Ad copy berhasil dihapus');
      fetchSavedCopies();
      if (showViewModal && selectedCopy?.ad_copy_id === adCopyId) {
        setShowViewModal(false);
      }
    } catch (error) {
      console.error('Error deleting ad copy:', error);
      toast.error('Gagal menghapus ad copy');
    }
  };

  const handleUpdateLabel = async () => {
    if (!editLabel.trim()) {
      toast.error('Label tidak boleh kosong');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `${API}/ad-copies/${selectedCopy.ad_copy_id}`,
        { label: editLabel },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      toast.success('Label berhasil diupdate');
      setShowEditModal(false);
      fetchSavedCopies();
      
      if (showViewModal) {
        setSelectedCopy({ ...selectedCopy, label: editLabel });
      }
    } catch (error) {
      console.error('Error updating label:', error);
      toast.error('Gagal update label');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleGenerate = async () => {
    if (!formData.product_name.trim()) {
      toast.error('Nama produk wajib diisi');
      return;
    }
    if (!formData.description.trim()) {
      toast.error('Deskripsi produk wajib diisi');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${API}/generate-ad-copy`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setGeneratedCopy(response.data.data);
        toast.success('Ad copy berhasil di-generate! 🎉');
      }
    } catch (error) {
      console.error('Error generating ad copy:', error);
      toast.error(error.response?.data?.detail || 'Terjadi kesalahan saat generate ad copy');
    } finally {
      setLoading(false);
    }
  };

  const handleRegenerate = () => {
    setGeneratedCopy(null);
    setCopiedItems({});
  };

  // Product image upload function removed

  // Video functions removed

  const copyToClipboard = async (text, key) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedItems(prev => ({ ...prev, [key]: true }));
      toast.success('Berhasil disalin ke clipboard');
      
      setTimeout(() => {
        setCopiedItems(prev => ({ ...prev, [key]: false }));
      }, 2000);
    } catch (error) {
      toast.error('Gagal menyalin ke clipboard');
    }
  };

  const CopyButton = ({ text, itemKey }) => (
    <Button
      size="sm"
      variant="ghost"
      onClick={() => copyToClipboard(text, itemKey)}
      className="ml-2 h-7 px-2"
    >
      {copiedItems[itemKey] ? (
        <CheckCircle2 className="w-4 h-4 text-green-600" />
      ) : (
        <Copy className="w-4 h-4" />
      )}
    </Button>
  );

  const AdCopyContentDisplay = ({ content }) => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-teal-600">Primary Text - Short</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {content.primary_text_short.map((text, idx) => (
            <div key={idx} className="p-4 bg-gray-50 rounded-lg border">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="text-gray-700">{text}</p>
                  <p className="text-xs text-gray-500 mt-2">{text.length} karakter</p>
                </div>
                <CopyButton text={text} itemKey={`short-${idx}`} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-teal-600">Primary Text - Standard</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {content.primary_text_standard.map((text, idx) => (
            <div key={idx} className="p-4 bg-gray-50 rounded-lg border">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="text-gray-700">{text}</p>
                  <p className="text-xs text-gray-500 mt-2">{text.length} karakter</p>
                </div>
                <CopyButton text={text} itemKey={`standard-${idx}`} />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-teal-600">Headlines</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {content.headlines.map((headline, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
              <p className="text-gray-700 font-medium">{headline}</p>
              <CopyButton text={headline} itemKey={`headline-${idx}`} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-teal-600">Descriptions</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {content.descriptions.map((desc, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
              <p className="text-gray-700">{desc}</p>
              <CopyButton text={desc} itemKey={`desc-${idx}`} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-teal-600">Hooks</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {content.hooks.map((hook, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
              <p className="text-gray-700 font-medium">{hook}</p>
              <CopyButton text={hook} itemKey={`hook-${idx}`} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-teal-600">CTAs</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {content.ctas.map((cta, idx) => (
            <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border">
              <p className="text-gray-700 font-semibold">{cta}</p>
              <CopyButton text={cta} itemKey={`cta-${idx}`} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-teal-600">UGC Scripts</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {content.ugc_scripts.map((script, idx) => (
            <div key={idx} className="p-4 bg-gray-50 rounded-lg border">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-semibold text-gray-900">{script.scenario}</h4>
                <CopyButton text={script.script} itemKey={`ugc-${idx}`} />
              </div>
              <p className="text-gray-700 whitespace-pre-wrap mb-3">{script.script}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-4 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
          <Sparkles className="w-8 h-8 text-teal-600" />
          AI Ad Copy Generator
        </h1>
        <p className="text-gray-600 mt-1">
          Generate konten iklan Meta (Facebook & Instagram) dalam Bahasa Indonesia
        </p>
        
        <div className="flex gap-4 mt-6 border-b">
          <button
            onClick={() => setActiveTab('generate')}
            className={`pb-3 px-4 font-medium transition-colors ${
              activeTab === 'generate'
                ? 'text-teal-600 border-b-2 border-teal-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Generate
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`pb-3 px-4 font-medium transition-colors ${
              activeTab === 'saved'
                ? 'text-teal-600 border-b-2 border-teal-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Saved Ad Copies ({savedCopies.length}/100)
          </button>
        </div>
      </div>

      {activeTab === 'generate' && (
        <>
          {!generatedCopy ? (
            <Card>
              <CardHeader>
                <CardTitle>Input Informasi Produk</CardTitle>
                <CardDescription>
                  Cukup isi 3 field di bawah ini, AI akan generate copy iklan yang optimal
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nama Produk <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="product_name"
                    value={formData.product_name}
                    onChange={handleInputChange}
                    placeholder="Contoh: Serum Wajah Glowing"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Deskripsi Produk <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Jelaskan produk Anda: manfaat, fitur unggulan, harga, keunggulan dibanding kompetitor, dll."
                    rows={5}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tujuan Iklan <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="goal"
                    value={formData.goal}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
                  >
                    <option value="Purchase">Purchase (Pembelian)</option>
                    <option value="Leads">Leads (Prospek)</option>
                    <option value="Awareness">Awareness (Kesadaran Brand)</option>
                  </select>
                </div>

                {/* Product image upload section removed */}

                <div className="pt-4">
                  <Button
                    onClick={handleGenerate}
                    disabled={loading}
                    className="w-full bg-teal-600 hover:bg-teal-700 text-white py-6 text-lg"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5 mr-2" />
                        Generate Ad Copy
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Header dengan buttons */}
              <div className="bg-gradient-to-r from-teal-50 to-blue-50 p-4 rounded-lg border-2 border-teal-200">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-semibold text-teal-900">✨ Ad Copy Berhasil Di-Generate!</h3>
                    <p className="text-sm text-gray-600">Scroll ke bawah untuk lihat semua hasil</p>
                  </div>
                  <div className="flex gap-3">
                    <Button 
                      onClick={() => {
                        setGeneratedCopy(null);
                        setFormData({product_name: '', description: '', goal: 'Purchase'});
                        window.scrollTo({top: 0, behavior: 'smooth'});
                      }} 
                      className="gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                    >
                      <Sparkles className="w-4 h-4" />
                      Generate Baru
                    </Button>
                    <Button onClick={() => setShowSaveModal(true)} className="gap-2 bg-teal-600">
                      <Save className="w-4 h-4" />
                      Save
                    </Button>
                    <Button onClick={handleRegenerate} variant="outline" className="gap-2">
                      <RefreshCw className="w-4 h-4" />
                      Re-generate
                    </Button>
                  </div>
                </div>
              </div>
              <AdCopyContentDisplay content={generatedCopy} />
            </div>
          )}
        </>
      )}

      {activeTab === 'saved' && (
        <div className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Cari berdasarkan nama produk atau label..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <select
              value={filterGoal}
              onChange={(e) => setFilterGoal(e.target.value)}
              className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
            >
              <option value="all">Semua Goal</option>
              <option value="Purchase">Purchase</option>
              <option value="Leads">Leads</option>
              <option value="Awareness">Awareness</option>
            </select>
          </div>

          {loadingSaved ? (
            <div className="text-center py-12">
              <Loader2 className="w-8 h-8 animate-spin mx-auto text-teal-600" />
            </div>
          ) : savedCopies.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-gray-500">Belum ada saved ad copies</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {savedCopies.map((copy) => (
                <Card key={copy.ad_copy_id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-lg">{copy.label}</CardTitle>
                    <CardDescription>
                      {copy.product_name} • {copy.goal}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{copy.description}</p>
                    <p className="text-xs text-gray-400 mb-4">
                      {new Date(copy.created_at).toLocaleDateString('id-ID')}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedCopy(copy);
                          setShowViewModal(true);
                        }}
                        className="flex-1"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Lihat
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedCopy(copy);
                          setEditLabel(copy.label);
                          setShowEditModal(true);
                        }}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDeleteAdCopy(copy.ad_copy_id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {showSaveModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Save Ad Copy</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Nama/Label <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={saveLabel}
                  onChange={(e) => setSaveLabel(e.target.value)}
                  placeholder="Contoh: Serum Glowing - Campaign Ramadan"
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleSaveAdCopy} className="flex-1">
                  Save
                </Button>
                <Button onClick={() => setShowSaveModal(false)} variant="outline">
                  Batal
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Edit Label</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <input
                type="text"
                value={editLabel}
                onChange={(e) => setEditLabel(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-teal-500"
              />
              <div className="flex gap-2">
                <Button onClick={handleUpdateLabel} className="flex-1">
                  Update
                </Button>
                <Button onClick={() => setShowEditModal(false)} variant="outline">
                  Batal
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {showViewModal && selectedCopy && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-4 flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-bold">{selectedCopy.label}</h2>
                <p className="text-gray-600">{selectedCopy.product_name} • {selectedCopy.goal}</p>
              </div>
              <Button variant="ghost" onClick={() => setShowViewModal(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="p-6">
              <AdCopyContentDisplay content={selectedCopy.generated_content} />
            </div>
          </div>
        </div>
      )}

      {/* Video Modal removed */}
    </div>
  );
};

export default AdCopyGenerator;
