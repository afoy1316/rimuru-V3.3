import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'sonner';
import { 
  FileText, 
  Search, 
  Filter, 
  Eye, 
  Calendar,
  User,
  Target,
  MessageSquare,
  X
} from 'lucide-react';

const API = process.env.REACT_APP_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL;

const AdCopyManagement = () => {
  const [adCopies, setAdCopies] = useState([]);
  const [filteredAdCopies, setFilteredAdCopies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [goalFilter, setGoalFilter] = useState('all');
  const [selectedAdCopy, setSelectedAdCopy] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  useEffect(() => {
    fetchAdCopies();
  }, []);

  useEffect(() => {
    filterAdCopies();
  }, [adCopies, searchTerm, goalFilter]);

  const fetchAdCopies = async () => {
    try {
      const token = localStorage.getItem('admin_token');
      const response = await axios.get(`${API}/api/admin/ad-copies`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setAdCopies(response.data.ad_copies || []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching ad copies:', error);
      toast.error('Gagal memuat data ad copies');
      setLoading(false);
    }
  };

  const filterAdCopies = () => {
    let filtered = [...adCopies];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(copy => 
        copy.label?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        copy.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        copy.user_info?.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        copy.user_info?.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Goal filter
    if (goalFilter !== 'all') {
      filtered = filtered.filter(copy => copy.goal === goalFilter);
    }

    setFilteredAdCopies(filtered);
  };

  const handleViewDetail = (adCopy) => {
    console.log('Ad Copy Data:', adCopy);
    console.log('Generated Content:', adCopy.generated_content);
    setSelectedAdCopy(adCopy);
    setShowDetailModal(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getGoalBadge = (goal) => {
    const goalConfig = {
      'awareness': { text: 'Awareness', class: 'bg-blue-100 text-blue-700' },
      'consideration': { text: 'Consideration', class: 'bg-purple-100 text-purple-700' },
      'conversion': { text: 'Conversion', class: 'bg-green-100 text-green-700' }
    };

    const config = goalConfig[goal] || { text: goal, class: 'bg-gray-100 text-gray-700' };
    
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.class}`}>
        {config.text}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-lg sm:text-2xl font-bold text-gray-900 flex items-center">
              <FileText className="h-5 h-5 sm:h-6 sm:w-6 mr-2 text-blue-600 flex-shrink-0" />
              <span className="break-words">Ad Copy Management</span>
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 mt-1 break-words">
              Kelola dan monitor ad copy yang dibuat oleh client
            </p>
          </div>
          <div className="text-left sm:text-right flex-shrink-0">
            <div className="text-xs sm:text-sm text-gray-600">Total Ad Copies</div>
            <div className="text-xl sm:text-2xl font-bold text-blue-600">{adCopies.length}</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-3 sm:p-4 mb-4 sm:mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 h-4 sm:h-5 sm:w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Cari label, produk, username..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
            />
          </div>

          {/* Goal Filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 h-4 sm:h-5 sm:w-5 text-gray-400" />
            <select
              value={goalFilter}
              onChange={(e) => setGoalFilter(e.target.value)}
              className="w-full pl-9 sm:pl-10 pr-3 sm:pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent appearance-none text-sm sm:text-base"
            >
              <option value="all">Semua Goal</option>
              <option value="awareness">Awareness</option>
              <option value="consideration">Consideration</option>
              <option value="conversion">Conversion</option>
            </select>
          </div>
        </div>

        {/* Results count */}
        <div className="mt-2 sm:mt-3 text-xs sm:text-sm text-gray-600 break-words">
          Menampilkan {filteredAdCopies.length} dari {adCopies.length} ad copies
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {filteredAdCopies.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-base font-medium text-gray-500">Tidak ada ad copy ditemukan</p>
            <p className="text-sm mt-1 text-gray-400">
              {searchTerm || goalFilter !== 'all' 
                ? 'Coba ubah filter pencarian Anda' 
                : 'Belum ada client yang membuat ad copy'}
            </p>
          </div>
        ) : (
          filteredAdCopies.map((adCopy) => (
            <div key={adCopy.ad_copy_id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
              {/* Header */}
              <div className="flex items-start justify-between mb-3 pb-3 border-b border-gray-200">
                <div className="flex items-start gap-2 flex-1 min-w-0">
                  <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900 break-words">
                      {adCopy.user_info?.name || adCopy.user_info?.username}
                    </div>
                    <div className="text-xs text-gray-500 break-all">
                      {adCopy.user_info?.email}
                    </div>
                  </div>
                </div>
                {getGoalBadge(adCopy.goal)}
              </div>

              {/* Content */}
              <div className="space-y-2 mb-3">
                <div>
                  <p className="text-xs text-gray-500">Label / Produk</p>
                  <p className="text-sm font-medium text-gray-900 break-words">{adCopy.label}</p>
                  <p className="text-xs text-gray-500 break-words">{adCopy.product_name}</p>
                </div>
                <div className="flex items-center text-xs text-gray-500">
                  <Calendar className="h-3 w-3 mr-1 flex-shrink-0" />
                  <span className="break-words">{formatDate(adCopy.created_at)}</span>
                </div>
              </div>

              {/* Action */}
              <button
                onClick={() => handleViewDetail(adCopy)}
                className="w-full inline-flex items-center justify-center px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm"
              >
                <Eye className="h-4 w-4 mr-1" />
                Detail
              </button>
            </div>
          ))
        )}
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Label / Produk
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Goal
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Dibuat
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredAdCopies.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p className="text-lg font-medium">Tidak ada ad copy ditemukan</p>
                    <p className="text-sm mt-1">
                      {searchTerm || goalFilter !== 'all' 
                        ? 'Coba ubah filter pencarian Anda' 
                        : 'Belum ada client yang membuat ad copy'}
                    </p>
                  </td>
                </tr>
              ) : (
                filteredAdCopies.map((adCopy) => (
                  <tr key={adCopy.ad_copy_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {adCopy.user_info?.name || adCopy.user_info?.username}
                          </div>
                          <div className="text-sm text-gray-500">
                            {adCopy.user_info?.email}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{adCopy.label}</div>
                      <div className="text-sm text-gray-500">{adCopy.product_name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getGoalBadge(adCopy.goal)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-sm text-gray-500">
                        <Calendar className="h-4 w-4 mr-1" />
                        {formatDate(adCopy.created_at)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => handleViewDetail(adCopy)}
                        className="inline-flex items-center px-3 py-1 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Detail
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedAdCopy && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Detail Ad Copy</h2>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="px-6 py-4 space-y-6">
              {/* Client Info */}
              <div className="bg-blue-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                  <User className="h-4 w-4 mr-2 text-blue-600" />
                  Informasi Client
                </h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span className="text-gray-600">Nama:</span>
                    <span className="ml-2 font-medium">{selectedAdCopy.user_info?.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-600">Username:</span>
                    <span className="ml-2 font-medium">{selectedAdCopy.user_info?.username}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-600">Email:</span>
                    <span className="ml-2 font-medium">{selectedAdCopy.user_info?.email}</span>
                  </div>
                </div>
              </div>

              {/* Ad Copy Info */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                  <Target className="h-4 w-4 mr-2 text-green-600" />
                  Informasi Campaign
                </h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Label:</span>
                    <p className="font-medium mt-1">{selectedAdCopy.label}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Produk:</span>
                    <p className="font-medium mt-1">{selectedAdCopy.product_name}</p>
                  </div>
                  <div>
                    <span className="text-gray-600">Goal:</span>
                    <div className="mt-1">{getGoalBadge(selectedAdCopy.goal)}</div>
                  </div>
                  <div className="col-span-2">
                    <span className="text-gray-600">Deskripsi Produk:</span>
                    <p className="font-medium mt-1 text-gray-700">{selectedAdCopy.description}</p>
                  </div>
                </div>
              </div>

              {/* Generated Content */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center">
                  <MessageSquare className="h-4 w-4 mr-2 text-purple-600" />
                  Generated Ad Copy
                </h3>
                
                {selectedAdCopy.generated_content && (
                  <div className="space-y-4">
                    {/* Headlines */}
                    {selectedAdCopy.generated_content.headlines && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2">Headlines</h4>
                        <ul className="space-y-2">
                          {selectedAdCopy.generated_content.headlines.map((headline, idx) => (
                            <li key={idx} className="text-sm text-gray-700 flex items-start">
                              <span className="text-blue-600 font-bold mr-2">{idx + 1}.</span>
                              <span>{headline}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Primary Text Short */}
                    {selectedAdCopy.generated_content.primary_text_short && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2">Primary Text (Short)</h4>
                        <ul className="space-y-3">
                          {selectedAdCopy.generated_content.primary_text_short.map((text, idx) => (
                            <li key={idx} className="text-sm text-gray-700 border-l-2 border-blue-500 pl-3">
                              <span className="font-bold text-blue-600">Variasi {idx + 1}</span>
                              <p className="mt-1 whitespace-pre-wrap">{text}</p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Primary Text Standard */}
                    {selectedAdCopy.generated_content.primary_text_standard && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2">Primary Text (Standard)</h4>
                        <ul className="space-y-3">
                          {selectedAdCopy.generated_content.primary_text_standard.map((text, idx) => (
                            <li key={idx} className="text-sm text-gray-700 border-l-2 border-green-500 pl-3">
                              <span className="font-bold text-green-600">Variasi {idx + 1}</span>
                              <p className="mt-1 whitespace-pre-wrap">{text}</p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Hooks */}
                    {selectedAdCopy.generated_content.hooks && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2">Hooks</h4>
                        <ul className="space-y-2">
                          {selectedAdCopy.generated_content.hooks.map((hook, idx) => (
                            <li key={idx} className="text-sm text-gray-700 flex items-start">
                              <span className="text-orange-600 font-bold mr-2">{idx + 1}.</span>
                              <span>{hook}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Descriptions */}
                    {selectedAdCopy.generated_content.descriptions && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2">Descriptions</h4>
                        <ul className="space-y-2">
                          {selectedAdCopy.generated_content.descriptions.map((desc, idx) => (
                            <li key={idx} className="text-sm text-gray-700 flex items-start">
                              <span className="text-purple-600 font-bold mr-2">{idx + 1}.</span>
                              <span>{desc}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* CTAs */}
                    {selectedAdCopy.generated_content.ctas && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2">Call to Actions</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedAdCopy.generated_content.ctas.map((cta, idx) => (
                            <span key={idx} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                              {cta}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Hashtags */}
                    {selectedAdCopy.generated_content.hashtags && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2">Hashtags</h4>
                        <div className="flex flex-wrap gap-2">
                          {selectedAdCopy.generated_content.hashtags.map((tag, idx) => (
                            <span key={idx} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* UGC Scripts */}
                    {selectedAdCopy.generated_content.ugc_scripts && (
                      <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2">UGC Scripts</h4>
                        <ul className="space-y-4">
                          {selectedAdCopy.generated_content.ugc_scripts.map((script, idx) => (
                            <li key={idx} className="text-sm text-gray-700 border-l-2 border-pink-500 pl-3">
                              <span className="font-bold text-pink-600">Script {idx + 1}</span>
                              {typeof script === 'string' ? (
                                <p className="mt-1 whitespace-pre-wrap">{script}</p>
                              ) : (
                                <div className="mt-1">
                                  {script.scenario && (
                                    <p className="font-medium text-gray-800 mb-1">Scenario: {script.scenario}</p>
                                  )}
                                  {script.script && (
                                    <p className="whitespace-pre-wrap text-gray-700">{script.script}</p>
                                  )}
                                </div>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Timestamps */}
              <div className="text-xs text-gray-500 flex items-center justify-between pt-4 border-t">
                <span>Dibuat: {formatDate(selectedAdCopy.created_at)}</span>
                {selectedAdCopy.updated_at && (
                  <span>Diupdate: {formatDate(selectedAdCopy.updated_at)}</span>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200">
              <button
                onClick={() => setShowDetailModal(false)}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdCopyManagement;
