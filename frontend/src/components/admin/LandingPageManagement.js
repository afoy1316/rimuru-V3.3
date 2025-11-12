import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Button } from '../ui/button';

const LandingPageManagement = () => {
  const [landingPages, setLandingPages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, draft, published
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchLandingPages();
    
    // Silent auto-refresh every 10 seconds
    const interval = setInterval(() => {
      fetchLandingPages(true); // Pass true for silent refresh
    }, 10000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchLandingPages = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const token = localStorage.getItem('admin_token');
      const backendUrl = process.env.REACT_APP_BACKEND_URL;
      
      const response = await fetch(`${backendUrl}/api/admin/landing-pages`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setLandingPages(data.landing_pages || []);
      }
    } catch (error) {
      console.error('Error fetching landing pages:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const filteredPages = landingPages.filter(page => {
    const matchesFilter = filter === 'all' || page.status === filter;
    const matchesSearch = 
      page.product_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      page.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      page.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      page.slug?.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const getStatusBadge = (status) => {
    if (status === 'published') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
          <span className="w-2 h-2 mr-1.5 bg-green-600 rounded-full"></span>
          Published
        </span>
      );
    } else {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-200">
          <span className="w-2 h-2 mr-1.5 bg-yellow-600 rounded-full"></span>
          Draft
        </span>
      );
    }
  };

  const getTemplateName = (templateId) => {
    const templates = {
      modern_gradient: 'Modern Gradient',
      minimalist_clean: 'Minimalist Clean',
      bold: 'Bold',
      ecommerce: 'E-commerce'
    };
    return templates[templateId] || (templateId || 'Unknown');
  };

  const handleViewPage = (slug) => {
    // Use current domain (window.location.origin) instead of hardcoded backend URL
    // This ensures it works with custom domains in production
    const currentDomain = window.location.origin;
    window.open(`${currentDomain}/${slug}`, '_blank');
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="p-4 sm:p-6">
      <Card>
        <CardHeader className="border-b bg-gradient-to-r from-teal-50 to-blue-50 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg sm:text-2xl font-bold text-gray-800 break-words">Landing Page Management</CardTitle>
              <p className="text-xs sm:text-sm text-gray-600 mt-1 break-words">Kelola semua landing page dari client • Auto-refresh setiap 10 detik</p>
            </div>
            <div className="text-xs sm:text-sm text-gray-500 flex-shrink-0">
              Total: <span className="font-bold text-teal-600">{landingPages.length}</span> landing pages
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4 sm:p-6">
          {/* Filters */}
          <div className="mb-4 sm:mb-6 space-y-3 sm:space-y-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Cari berdasarkan nama produk, client, atau slug..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 sm:px-4 py-2 sm:py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-sm sm:text-base"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Button
                onClick={() => setFilter('all')}
                size="sm"
                className={`${filter === 'all' ? 'bg-teal-600 text-white hover:bg-teal-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} transition-all text-xs sm:text-sm px-2 sm:px-4`}
              >
                <span className="hidden sm:inline">All </span>({landingPages.length})
              </Button>
              <Button
                onClick={() => setFilter('draft')}
                size="sm"
                className={`${filter === 'draft' ? 'bg-yellow-600 text-white hover:bg-yellow-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} transition-all text-xs sm:text-sm px-2 sm:px-4`}
              >
                Draft ({landingPages.filter(p => p.status === 'draft').length})
              </Button>
              <Button
                onClick={() => setFilter('published')}
                size="sm"
                className={`${filter === 'published' ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} transition-all text-xs sm:text-sm px-2 sm:px-4`}
              >
                <span className="hidden sm:inline">Published </span>({landingPages.filter(p => p.status === 'published').length})
              </Button>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="text-center py-16">
              <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-teal-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 font-medium">Memuat data...</p>
            </div>
          ) : filteredPages.length === 0 ? (
            <div className="text-center py-16 bg-gray-50 rounded-lg">
              <div className="text-6xl mb-4">📭</div>
              <p className="text-gray-600 font-medium">Tidak ada landing page ditemukan</p>
              <p className="text-gray-500 text-sm mt-2">Coba ubah filter atau kata kunci pencarian</p>
            </div>
          ) : (
            <>
            {/* Mobile Card View */}
            <div className="md:hidden space-y-3">
              {filteredPages.map((page) => (
                <div key={page.id} className="bg-white rounded-lg shadow border border-gray-200 p-3">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-3 pb-3 border-b border-gray-200">
                    <div className="flex-1 min-w-0 mr-2">
                      <h3 className="font-semibold text-sm text-gray-900 break-words">{page.product_name}</h3>
                      {page.product_description && (
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2 break-words">
                          {page.product_description}
                        </p>
                      )}
                    </div>
                    {getStatusBadge(page.status)}
                  </div>

                  {/* Content */}
                  <div className="space-y-2 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                        {(page.client_name || page.username || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 break-words">{page.client_name || page.username}</div>
                        {page.client_email && (
                          <div className="text-xs text-gray-500 break-all">{page.client_email}</div>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <p className="text-gray-500">Template</p>
                        <p className="text-gray-900 font-medium break-words">{getTemplateName(page.template_id)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Dibuat</p>
                        <p className="text-gray-900 break-words">{formatDate(page.created_at)}</p>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs text-gray-500 mb-1">Slug</p>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded border border-gray-200 font-mono break-all block">
                        {page.slug}
                      </code>
                    </div>
                  </div>

                  {/* Action */}
                  {page.status === 'published' ? (
                    <Button
                      onClick={() => handleViewPage(page.slug)}
                      size="sm"
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm"
                    >
                      👁️ Lihat Landing Page
                    </Button>
                  ) : (
                    <div className="text-center py-2 text-xs text-gray-400 italic bg-gray-50 rounded">Draft mode</div>
                  )}
                </div>
              ))}
            </div>

            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full bg-white">
                <thead className="bg-gray-50 border-b-2 border-gray-200">
                  <tr>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700 text-sm">Produk</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700 text-sm">Client</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700 text-sm">Template</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700 text-sm">Slug</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700 text-sm">Status</th>
                    <th className="text-left py-4 px-4 font-semibold text-gray-700 text-sm">Dibuat</th>
                    <th className="text-center py-4 px-4 font-semibold text-gray-700 text-sm">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredPages.map((page) => (
                    <tr key={page.id} className="hover:bg-teal-50 transition-colors">
                      <td className="py-4 px-4">
                        <div className="font-semibold text-gray-900">{page.product_name}</div>
                        {page.product_description && (
                          <div className="text-xs text-gray-500 mt-1 line-clamp-2 max-w-xs">
                            {page.product_description}
                          </div>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
                            {(page.client_name || page.username || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">{page.client_name || page.username}</div>
                            {page.client_email && (
                              <div className="text-xs text-gray-500">{page.client_email}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-700">
                        {getTemplateName(page.template_id)}
                      </td>
                      <td className="py-4 px-4">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded border border-gray-200 font-mono">
                          {page.slug}
                        </code>
                      </td>
                      <td className="py-4 px-4">
                        {getStatusBadge(page.status)}
                      </td>
                      <td className="py-4 px-4 text-sm text-gray-600">
                        {formatDate(page.created_at)}
                      </td>
                      <td className="py-4 px-4 text-center">
                        {page.status === 'published' ? (
                          <Button
                            onClick={() => handleViewPage(page.slug)}
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4"
                          >
                            👁️ Lihat
                          </Button>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Draft mode</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            </>
          )}

          {/* Stats Footer */}
          {!loading && filteredPages.length > 0 && (
            <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="grid grid-cols-3 gap-2 sm:gap-4 text-center">
                <div>
                  <div className="text-lg sm:text-2xl font-bold text-gray-900">{filteredPages.length}</div>
                  <div className="text-xs text-gray-600">Ditampilkan</div>
                </div>
                <div>
                  <div className="text-lg sm:text-2xl font-bold text-green-600">
                    {filteredPages.filter(p => p.status === 'published').length}
                  </div>
                  <div className="text-xs text-gray-600">Published</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-yellow-600">
                    {filteredPages.filter(p => p.status === 'draft').length}
                  </div>
                  <div className="text-xs text-gray-600">Draft</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default LandingPageManagement;
