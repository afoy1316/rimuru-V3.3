import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { toast } from "sonner";
import { useLanguage } from "../contexts/LanguageContext";
import {
  Upload,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
  FileText,
  Eye,
  Trash2,
  Building2,
  Wallet,
  DollarSign
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const WalletUploadProof = () => {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [paymentProof, setPaymentProof] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  useEffect(() => {
    fetchRequestDetails();
  }, [requestId]);

  const fetchRequestDetails = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/wallet/topup/${requestId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setRequest(response.data);
    } catch (error) {
      console.error('Error fetching request:', error);
      toast.error('Gagal memuat detail permintaan');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB
        toast.error('Ukuran file maksimal 10MB');
        return;
      }
      
      setPaymentProof(file);
      
      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveFile = () => {
    setPaymentProof(null);
    setPreviewUrl(null);
  };

  const handleUpload = async () => {
    if (!paymentProof) {
      toast.error('Harap pilih file bukti pembayaran');
      return;
    }

    try {
      setUploading(true);
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('payment_proof', paymentProof);

      await axios.post(`${API}/wallet/topup/${requestId}/upload-proof`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      // Show success state instead of redirecting
      setUploadSuccess(true);
      
      // Refresh request details
      await fetchRequestDetails();
      
    } catch (error) {
      console.error('Error uploading proof:', error);
      toast.error(error.response?.data?.detail || 'Gagal upload bukti pembayaran');
    } finally {
      setUploading(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { label: 'Menunggu Pembayaran', className: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
      proof_uploaded: { label: 'Bukti Diupload', className: 'bg-blue-100 text-blue-800 border-blue-200' },
      verified: { label: 'Terverifikasi', className: 'bg-green-100 text-green-800 border-green-200' },
      approved: { label: 'Disetujui', className: 'bg-green-100 text-green-800 border-green-200' },
      rejected: { label: 'Ditolak', className: 'bg-red-100 text-red-800 border-red-200' }
    };

    const config = statusConfig[status] || statusConfig.pending;
    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${config.className}`}>
        {config.label}
      </span>
    );
  };

  const formatCurrency = (amount, currency = 'IDR') => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Memuat detail permintaan...</p>
        </div>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Permintaan Tidak Ditemukan</h3>
            <p className="text-gray-600 mb-4">ID permintaan tidak valid atau sudah tidak tersedia.</p>
            <Button onClick={() => navigate('/dashboard')} className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali ke Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const alreadyUploaded = request.status === 'proof_uploaded' || request.status === 'verified' || request.status === 'approved';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Success Screen */}
        {uploadSuccess ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <Card className="max-w-md w-full border-2 border-green-200 bg-green-50">
              <CardContent className="pt-8 pb-6 text-center">
                {/* Success Icon with Animation */}
                <div className="mb-6 relative">
                  <div className="w-20 h-20 bg-green-500 rounded-full mx-auto flex items-center justify-center animate-bounce">
                    <CheckCircle className="w-12 h-12 text-white" />
                  </div>
                  {/* Confetti Effect */}
                  <div className="absolute inset-0 pointer-events-none">
                    {[...Array(20)].map((_, i) => (
                      <div
                        key={i}
                        className="absolute w-2 h-2 bg-gradient-to-r from-green-400 to-blue-500 rounded-full animate-ping"
                        style={{
                          left: `${Math.random() * 100}%`,
                          top: `${Math.random() * 100}%`,
                          animationDelay: `${Math.random() * 0.5}s`,
                          animationDuration: `${1 + Math.random()}s`
                        }}
                      />
                    ))}
                  </div>
                </div>
                
                {/* Success Message */}
                <h2 className="text-2xl font-bold text-green-800 mb-2">
                  Upload Berhasil! 🎉
                </h2>
                <p className="text-green-700 mb-6">
                  Bukti pembayaran Anda sudah kami terima dan akan segera diproses oleh admin.
                </p>
                
                {/* Action Buttons */}
                <div className="space-y-3">
                  <Button
                    onClick={() => navigate('/dashboard/topup/history')}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Lihat Riwayat Top Up
                  </Button>
                  <Button
                    onClick={() => navigate('/dashboard')}
                    variant="outline"
                    className="w-full border-green-600 text-green-700 hover:bg-green-50"
                  >
                    Kembali ke Dashboard
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="mb-6">
              <Button
                variant="ghost"
                onClick={() => navigate('/dashboard/topup/history')}
                className="mb-4 text-sm sm:text-base"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                <span className="hidden sm:inline">Kembali ke Riwayat Top Up</span>
                <span className="sm:hidden">Kembali</span>
              </Button>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Upload Bukti Transfer</h1>
              <p className="text-sm sm:text-base text-gray-600 mt-2">Upload bukti transfer untuk permintaan top-up wallet Anda</p>
            </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {/* Request Details Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
                <span>Detail Permintaan</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 sm:space-y-4">
              <div>
                <p className="text-xs sm:text-sm text-gray-500">Request ID</p>
                <code className="block mt-1 px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-100 rounded text-xs sm:text-sm font-mono break-all">
                  {request.id}
                </code>
              </div>

              <div>
                <p className="text-xs sm:text-sm text-gray-500">Status</p>
                <div className="mt-1">
                  {getStatusBadge(request.status)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs sm:text-sm text-gray-500">Tipe Wallet</p>
                  <p className="text-sm sm:text-base font-medium">{request.wallet_type === 'main' ? 'Main Wallet' : 'Withdrawal Wallet'}</p>
                </div>

                <div>
                  <p className="text-xs sm:text-sm text-gray-500">Currency</p>
                  <p className="text-sm sm:text-base font-medium">{request.currency}</p>
                </div>
              </div>

              <div>
                <p className="text-xs sm:text-sm text-gray-500">Nominal</p>
                <p className="text-xl sm:text-2xl font-bold text-blue-600">
                  {formatCurrency(request.amount, request.currency)}
                </p>
              </div>

              {request.unique_code > 0 && (
                <div>
                  <p className="text-xs sm:text-sm text-gray-500">Kode Unik</p>
                  <p className="text-base sm:text-lg font-semibold text-orange-600">+{request.unique_code}</p>
                </div>
              )}

              <div>
                <p className="text-xs sm:text-sm text-gray-500">Total Transfer</p>
                <p className="text-xl sm:text-2xl font-bold text-green-600">
                  {formatCurrency(request.total_with_unique_code || request.amount, request.currency)}
                </p>
              </div>

              <div>
                <p className="text-xs sm:text-sm text-gray-500">Metode Pembayaran</p>
                <p className="text-sm sm:text-base font-medium capitalize">{request.payment_method?.replace(/_/g, ' ')}</p>
              </div>

              {/* Bank Details */}
              {request.bank_name && (
                <div className="pt-3 sm:pt-4 border-t">
                  <div className="flex items-center gap-2 mb-2 sm:mb-3">
                    <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 flex-shrink-0" />
                    <p className="text-sm sm:text-base font-semibold text-gray-900">Transfer ke:</p>
                  </div>
                  <div className="space-y-2 bg-blue-50 p-3 sm:p-4 rounded-lg">
                    <div>
                      <p className="text-xs text-gray-600">Bank</p>
                      <p className="text-sm sm:text-base font-semibold text-blue-900 break-words">{request.bank_name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">No. Rekening</p>
                      <p className="text-sm sm:text-base font-mono font-semibold text-blue-900 break-all">{request.bank_account}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Atas Nama</p>
                      <p className="text-sm sm:text-base font-semibold text-blue-900 break-words">{request.bank_holder}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Crypto Details */}
              {request.wallet_address && (
                <div className="pt-3 sm:pt-4 border-t">
                  <div className="flex items-center gap-2 mb-2 sm:mb-3">
                    <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 flex-shrink-0" />
                    <p className="text-sm sm:text-base font-semibold text-gray-900">Transfer ke:</p>
                  </div>
                  <div className="space-y-2 bg-green-50 p-3 sm:p-4 rounded-lg">
                    <div>
                      <p className="text-xs text-gray-600">Wallet</p>
                      <p className="text-sm sm:text-base font-semibold text-green-900 break-words">{request.wallet_name}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Network</p>
                      <p className="text-sm sm:text-base font-semibold text-green-900 break-words">{request.network}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600">Address</p>
                      <p className="text-xs sm:text-sm font-mono font-semibold text-green-900 break-all">{request.wallet_address}</p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Upload Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                <Upload className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0" />
                <span>{alreadyUploaded ? 'Bukti Pembayaran' : 'Upload Bukti Pembayaran'}</span>
              </CardTitle>
              <CardDescription className="text-xs sm:text-sm">
                {alreadyUploaded 
                  ? 'Bukti pembayaran sudah diupload dan sedang diproses'
                  : 'Upload screenshot atau foto bukti transfer Anda'
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Show upload status if proof already uploaded */}
              {request.payment_proof_id && !paymentProof && (
                <div className={`mb-4 sm:mb-6 border-2 rounded-lg p-3 sm:p-4 ${
                  request.status === 'rejected' 
                    ? 'border-red-200 bg-red-50' 
                    : 'border-green-200 bg-green-50'
                }`}>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-start gap-2 sm:gap-3">
                      {request.status === 'rejected' ? (
                        <AlertCircle className="w-6 h-6 sm:w-8 sm:h-8 text-red-600 flex-shrink-0 mt-0.5 sm:mt-0" />
                      ) : (
                        <CheckCircle className="w-6 h-6 sm:w-8 sm:h-8 text-green-600 flex-shrink-0 mt-0.5 sm:mt-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm sm:text-base font-semibold break-words ${
                          request.status === 'rejected' ? 'text-red-800' : 'text-green-800'
                        }`}>
                          {request.status === 'rejected' 
                            ? 'Bukti Pembayaran Ditolak' 
                            : 'Bukti Pembayaran Sudah Diupload'
                          }
                        </div>
                        {request.proof_uploaded_at && (
                          <div className={`text-xs sm:text-sm ${
                            request.status === 'rejected' ? 'text-red-700' : 'text-green-700'
                          }`}>
                            Upload: {new Date(request.proof_uploaded_at).toLocaleString('id-ID')}
                          </div>
                        )}
                        {request.status === 'rejected' && request.admin_notes && (
                          <div className="text-xs sm:text-sm text-red-700 mt-1 break-words">
                            <strong>Alasan:</strong> {request.admin_notes}
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Only show Edit button if status is NOT approved/verified */}
                    {request.status !== 'verified' && request.status !== 'approved' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('payment-proof-edit').click()}
                        className={`w-full sm:w-auto flex-shrink-0 text-xs sm:text-sm ${request.status === 'rejected' 
                          ? 'border-red-600 text-red-700 hover:bg-red-100' 
                          : 'border-green-600 text-green-700 hover:bg-green-100'
                        }`}
                      >
                        <Upload className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                        {request.status === 'rejected' ? 'Upload Bukti Baru' : 'Edit Bukti'}
                      </Button>
                    )}
                  </div>
                </div>
              )}
              
              {/* Hidden file input for edit */}
              <input
                type="file"
                id="payment-proof-edit"
                accept="image/*,.pdf"
                onChange={handleFileChange}
                className="hidden"
              />

              {/* Show upload preview when file is selected for INITIAL upload (no proof_id yet) */}
              {paymentProof && !request.payment_proof_id && (
                <div className="space-y-4">
                  {/* File Input for changing selection */}
                  <div>
                    <input
                      type="file"
                      id="payment-proof"
                      accept="image/*,.pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="payment-proof"
                      className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
                    >
                      {previewUrl ? (
                        <div className="relative w-full h-full p-4">
                          {paymentProof.type.startsWith('image/') ? (
                            <img
                              src={previewUrl}
                              alt="Preview"
                              className="w-full h-full object-contain rounded"
                            />
                          ) : (
                            <div className="flex flex-col items-center justify-center h-full">
                              <FileText className="w-12 h-12 text-blue-600 mb-2" />
                              <p className="text-sm text-gray-600 font-medium">PDF Preview</p>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-center">
                          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600 font-medium">
                            Klik untuk pilih file
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            PNG, JPG, PDF (Max 10MB)
                          </p>
                        </div>
                      )}
                    </label>
                  </div>

                  {/* File Info */}
                  <div className="flex items-start justify-between gap-2 p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-start gap-2 flex-1 min-w-0">
                      <FileText className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 break-all">{paymentProof.name}</p>
                        <p className="text-xs text-gray-500">
                          {(paymentProof.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleRemoveFile}
                      className="text-red-500 hover:text-red-700 p-2 flex-shrink-0"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Upload Button */}
                  <Button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="w-full"
                  >
                    {uploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Mengupload...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Bukti Pembayaran
                      </>
                    )}
                  </Button>

                  {/* Info */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">Tips Upload Bukti:</h4>
                    <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                      <li>Pastikan bukti transfer jelas dan terbaca</li>
                      <li>Nominal harus sesuai (termasuk kode unik)</li>
                      <li>Screenshot dari aplikasi banking atau e-wallet</li>
                      <li>Format: PNG, JPG, atau PDF</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Show upload preview if new file selected after edit */}
              {paymentProof && request.payment_proof_id && (
                <div className="mb-6 border-2 border-blue-200 bg-blue-50 rounded-lg p-4">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <FileText className="w-8 h-8 text-blue-600 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <div className="font-semibold text-blue-900">File baru dipilih:</div>
                          <div className="text-blue-700 break-all">{paymentProof.name}</div>
                          <div className="text-xs text-blue-600">
                            {(paymentProof.size / 1024 / 1024).toFixed(2)} MB
                          </div>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRemoveFile}
                        className="border-blue-300 text-blue-700 flex-shrink-0"
                      >
                        Batal
                      </Button>
                    </div>
                    
                    {/* Preview for new file */}
                    {previewUrl && (
                      <div className="border border-blue-200 rounded-lg overflow-hidden bg-gray-50">
                        {paymentProof.type.startsWith('image/') ? (
                          <img 
                            src={previewUrl} 
                            alt="Preview" 
                            className="w-full h-auto max-h-96 object-contain"
                          />
                        ) : paymentProof.type === 'application/pdf' ? (
                          <iframe
                            src={previewUrl}
                            className="w-full h-96"
                            title="PDF Preview"
                          />
                        ) : null}
                      </div>
                    )}
                    
                    <Button
                      onClick={handleUpload}
                      disabled={uploading}
                      className="w-full"
                    >
                      {uploading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Mengupload...
                        </>
                      ) : (
                        <>
                          <Upload className="w-4 h-4 mr-2" />
                          Upload Bukti Baru
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Show upload form when no file selected yet */}
              {!paymentProof && !request.payment_proof_id ? (
                <div className="space-y-4">
                  {/* File Input */}
                  <div>
                    <input
                      type="file"
                      id="payment-proof"
                      accept="image/*,.pdf"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                    <label
                      htmlFor="payment-proof"
                      className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition-colors"
                    >
                      {previewUrl ? (
                        <div className="relative w-full h-full p-4">
                          <img
                            src={previewUrl}
                            alt="Preview"
                            className="w-full h-full object-contain rounded"
                          />
                        </div>
                      ) : (
                        <div className="text-center">
                          <Upload className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600 font-medium">
                            Klik untuk pilih file
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            PNG, JPG, PDF (Max 10MB)
                          </p>
                        </div>
                      )}
                    </label>
                  </div>

                  {/* File Info */}
                  {paymentProof && (
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{paymentProof.name}</p>
                          <p className="text-xs text-gray-500">
                            {(paymentProof.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={handleRemoveFile}
                        className="text-red-500 hover:text-red-700 p-2"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  )}

                  {/* Upload Button */}
                  <Button
                    onClick={handleUpload}
                    disabled={!paymentProof || uploading}
                    className="w-full"
                  >
                    {uploading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Mengupload...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Bukti Pembayaran
                      </>
                    )}
                  </Button>

                  {/* Info */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h4 className="font-semibold text-blue-900 mb-2">Tips Upload Bukti:</h4>
                    <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                      <li>Pastikan bukti transfer jelas dan terbaca</li>
                      <li>Nominal harus sesuai (termasuk kode unik)</li>
                      <li>Screenshot dari aplikasi banking atau e-wallet</li>
                      <li>Format: PNG, JPG, atau PDF</li>
                    </ul>
                  </div>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
        </>
        )}
      </div>
    </div>
  );
};

export default WalletUploadProof;
