import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { toast } from "sonner";
import { useLanguage } from "../contexts/LanguageContext";
import { 
  Upload, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Copy,
  FileText,
  CreditCard,
  DollarSign,
  Banknote
} from "lucide-react";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const PaymentConfirmation = () => {
  const { requestId } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  
  const [loading, setLoading] = useState(true);
  const [requestData, setRequestData] = useState(null);
  const [isWalletTopup, setIsWalletTopup] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Helper function to clear file and preview
  const clearFileAndPreview = () => {
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setUploadFile(null);
    setPreviewUrl(null);
  };

  useEffect(() => {
    fetchPaymentStatus();
    
    // Cleanup blob URL on unmount
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [requestId]);

  const fetchPaymentStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Determine if this is wallet or account topup from the current URL path
      // If URL contains "wallet", it's wallet topup, otherwise account topup
      const isWallet = window.location.pathname.includes('/wallet/');
      
      const endpoint = isWallet 
        ? `${API}/wallet-topup/${requestId}/status`
        : `${API}/topup/${requestId}/status`;
      
      const response = await axios.get(endpoint, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      setRequestData(response.data);
      setIsWalletTopup(isWallet);
      setLoading(false);
      
    } catch (error) {
      console.error('Error fetching payment status:', error);
      if (error.response?.status === 404) {
        toast.error('Permintaan top-up tidak ditemukan');
      } else {
        toast.error('Gagal memuat informasi pembayaran');
      }
      setLoading(false);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Hanya file JPG, PNG, dan PDF yang diperbolehkan');
        return;
      }

      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error('Ukuran file maksimal 10MB');
        return;
      }

      setUploadFile(file);
      
      // Create preview for both images and PDF
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result);
      };
      
      if (file.type.startsWith('image/')) {
        reader.readAsDataURL(file);
      } else if (file.type === 'application/pdf') {
        // For PDF, create a blob URL for iframe preview
        const blobUrl = URL.createObjectURL(file);
        setPreviewUrl(blobUrl);
      }
    }
  };

  const handleUploadProof = async () => {
    if (!uploadFile) {
      toast.error('Pilih file terlebih dahulu');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', uploadFile);

      const uploadEndpoint = isWalletTopup
        ? `${API}/wallet-topup/${requestId}/upload-proof`
        : `${API}/topup/${requestId}/upload-proof`;
        
      await axios.post(uploadEndpoint, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(progress);
        }
      });

      toast.success("✅ Bukti pembayaran berhasil diupload! Menunggu verifikasi admin.");
      clearFileAndPreview();
      
      // Force reload data after upload to get latest proof info
      await fetchPaymentStatus();
      
      // Small delay to ensure UI updates
      setTimeout(() => {
        setUploading(false);
        setUploadProgress(0);
      }, 500);
      
    } catch (error) {
      console.error('Error uploading proof:', error);
      toast.error(error.response?.data?.detail || 'Gagal upload bukti pembayaran');
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const copyToClipboard = async (text, label = 'Text') => {
    if (!text) {
      toast.error(`${label} tidak tersedia`);
      return;
    }
    
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`✅ ${label} berhasil di-copy!`);
    } catch (error) {
      toast.error(`❌ Gagal copy ${label}`);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-6 h-6 text-yellow-500" />;
      case 'proof_uploaded':
        return <Upload className="w-6 h-6 text-blue-500" />;
      case 'verified':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'rejected':
        return <AlertCircle className="w-6 h-6 text-red-500" />;
      default:
        return <Clock className="w-6 h-6 text-gray-500" />;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'pending':
        return { text: 'Menunggu Bukti Pembayaran', color: 'text-yellow-600' };
      case 'proof_uploaded':
        return { text: 'Sedang Ditinjau Admin', color: 'text-blue-600' };
      case 'verified':
        return { text: 'Pembayaran Terverifikasi', color: 'text-green-600' };
      case 'rejected':
        return { text: 'Pembayaran Ditolak', color: 'text-red-600' };
      default:
        return { text: 'Memproses', color: 'text-gray-600' };
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!requestData) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Data Pembayaran Tidak Ditemukan</h2>
        <Button onClick={() => navigate('/dashboard/topup')}>Kembali ke Top Up</Button>
      </div>
    );
  }

  const statusInfo = getStatusText(requestData.status);
  const amount = isWalletTopup ? requestData.amount : requestData.total_amount;
  const currency = requestData.currency;
  const currencySymbol = currency === 'IDR' ? 'Rp' : '$';
  
  // Get transfer details - support both direct fields and transfer_details object
  const transferDetails = requestData.transfer_details || {};
  const isBank = currency === 'IDR' || transferDetails.type === 'bank_transfer';
  const isCrypto = currency === 'USD' || transferDetails.type === 'crypto_wallet';

  return (
    <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6 p-4 sm:p-0">
      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
        <Button
          variant="outline"
          onClick={() => navigate('/dashboard/topup')}
          className="flex items-center gap-1 sm:gap-2 text-sm sm:text-base px-2 sm:px-4"
        >
          ← <span className="hidden sm:inline">Kembali</span>
        </Button>
        <h1 className="text-lg sm:text-2xl font-bold">Konfirmasi Pembayaran</h1>
      </div>

      {/* Status Card */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-start gap-2 sm:gap-3">
              <div className="flex-shrink-0">{getStatusIcon(requestData.status)}</div>
              <div className="flex-1 min-w-0">
                <CardTitle className="text-base sm:text-lg">Status Pembayaran</CardTitle>
                <CardDescription className={`text-sm sm:text-base ${statusInfo.color}`}>
                  {statusInfo.text}
                </CardDescription>
              </div>
            </div>
            <div className="sm:text-right">
              <div className="text-xs sm:text-sm text-gray-500">Kode Referensi</div>
              <div className="font-mono font-semibold text-base sm:text-lg break-all">{requestData.reference_code}</div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Payment Details */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
            <span>Detail Pembayaran</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
          {/* Accounts Breakdown Section */}
          {requestData.accounts && requestData.accounts.length > 0 && (
            <div className="bg-blue-50 p-3 sm:p-4 rounded-lg border border-blue-200 mb-3 sm:mb-4">
              <h3 className="font-semibold text-sm sm:text-base text-blue-900 mb-2 sm:mb-3">Detail Akun yang Di Top-Up:</h3>
              <div className="space-y-2 sm:space-y-3">
                {requestData.accounts.map((acc, index) => (
                  <div key={index} className="bg-white p-2 sm:p-3 rounded border border-blue-100">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm">
                      <div>
                        <span className="text-gray-600 text-xs sm:text-sm">Nama Akun:</span>
                        <div className="font-medium text-gray-900 break-words">{acc.account_name || 'Unknown'}</div>
                      </div>
                      <div>
                        <span className="text-gray-600 text-xs sm:text-sm">ID Akun Iklan:</span>
                        <div className="font-mono text-xs sm:text-sm text-gray-900 break-all">{acc.platform_account_id || acc.account_id}</div>
                      </div>
                      {acc.account_platform && (
                        <div>
                          <span className="text-gray-600 text-xs sm:text-sm">Platform:</span>
                          <div className="font-medium text-gray-900 capitalize break-words">{acc.account_platform}</div>
                        </div>
                      )}
                      <div>
                        <span className="text-gray-600 text-xs sm:text-sm">Jumlah Top-Up:</span>
                        <div className="font-semibold text-blue-700 text-sm sm:text-base">
                          {currencySymbol} {acc.amount?.toLocaleString() || '0'}
                        </div>
                      </div>
                      {acc.fee_amount > 0 && (
                        <div>
                          <span className="text-gray-600 text-xs sm:text-sm">Biaya Admin:</span>
                          <div className="font-medium text-gray-900 text-sm sm:text-base">
                            {currencySymbol} {acc.fee_amount?.toLocaleString() || '0'}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {/* Hide subtotal section when bank payment with unique code to avoid confusion */}
            {!(isBank && (transferDetails.unique_code || requestData.unique_code)) && (
              <div>
                <Label className="text-xs sm:text-sm font-medium text-gray-500">
                  {isBank ? 'Subtotal (Saldo + Fee)' : 'Total Jumlah'}
                </Label>
                <div className="flex items-center gap-2 text-xl sm:text-2xl font-bold">
                  {currency === 'IDR' ? (
                    <Banknote className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500 flex-shrink-0" />
                  ) : (
                    <DollarSign className="w-5 h-5 sm:w-6 sm:h-6 text-green-500 flex-shrink-0" />
                  )}
                  <span className="break-all">{currencySymbol} {amount.toLocaleString()}</span>
                </div>
                {isBank && (
                  <div className="text-xs text-gray-500 mt-1">
                    Jumlah top-up termasuk biaya admin
                  </div>
                )}
              </div>
            )}
            <div>
              <Label className="text-xs sm:text-sm font-medium text-gray-500">Tanggal</Label>
              <div className="text-base sm:text-lg font-semibold break-words">
                {new Date(requestData.created_at).toLocaleDateString('id-ID', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                })}
              </div>
            </div>
          </div>
          
          {isBank && (transferDetails.unique_code || requestData.unique_code) && (
            <div className="mt-3 sm:mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="text-xs sm:text-sm font-medium text-blue-800 mb-2">Rincian Transfer:</div>
              <div className="space-y-1 text-xs sm:text-sm">
                <div className="flex justify-between items-start gap-2">
                  <span className="text-gray-600">Subtotal (Saldo + Fee):</span>
                  <span className="font-medium text-right break-all">{currencySymbol} {amount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-start gap-2">
                  <span className="text-gray-600">Kode Unik (untuk verifikasi):</span>
                  <span className="font-medium text-orange-600 text-right">+ {transferDetails.unique_code || requestData.unique_code}</span>
                </div>
                <div className="border-t border-blue-200 pt-1 mt-1"></div>
                <div className="flex justify-between items-start gap-2">
                  <span className="font-semibold text-gray-700">Total yang Harus Ditransfer:</span>
                  <span className="font-bold text-blue-600 text-base sm:text-lg text-right break-all">
                    {currencySymbol} {(transferDetails.total_transfer || requestData.total_with_unique_code || amount).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Payment Proof */}
      {requestData.status === 'pending' && (
        <Card className="border-2 border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <Upload className="w-5 h-5" />
              Upload Bukti Pembayaran
            </CardTitle>
            <CardDescription className="text-orange-700">
              Upload screenshot atau foto bukti transfer untuk verifikasi pembayaran
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-orange-800">
                Pilih File (JPG, PNG, atau PDF - Maks 10MB)
              </Label>
              <Input
                type="file"
                accept="image/jpeg,image/png,image/jpg,application/pdf"
                onChange={handleFileSelect}
                className="mt-2 border-orange-300"
              />
            </div>

            {/* Show upload preview for INITIAL upload (no proof uploaded yet) */}
            {uploadFile && !requestData.payment_proof?.uploaded && (
              <div className="bg-white border border-orange-200 p-3 rounded-lg space-y-3">
                {/* File info */}
                <div className="flex items-start gap-2 sm:gap-3">
                  <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-orange-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm sm:text-base text-orange-900 break-all">{uploadFile.name}</div>
                    <div className="text-xs sm:text-sm text-orange-700">
                      {(uploadFile.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={clearFileAndPreview}
                    className="border-orange-300 text-orange-700 flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3"
                  >
                    Hapus
                  </Button>
                </div>
                
                {/* Preview for images and PDF */}
                {previewUrl && (
                  <div className="border border-orange-200 rounded-lg overflow-hidden bg-gray-50">
                    {uploadFile.type.startsWith('image/') ? (
                      <img 
                        src={previewUrl} 
                        alt="Preview" 
                        className="w-full h-auto max-h-96 object-contain"
                      />
                    ) : uploadFile.type === 'application/pdf' ? (
                      <iframe
                        src={previewUrl}
                        className="w-full h-96"
                        title="PDF Preview"
                      />
                    ) : null}
                  </div>
                )}
              </div>
            )}

            <Button
              onClick={handleUploadProof}
              disabled={!uploadFile || uploading}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white"
            >
              {uploading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Uploading... {uploadProgress}%
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  Upload Bukti Pembayaran
                </div>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Payment Proof Status */}
      {(requestData.payment_proof?.uploaded || requestData.status === 'rejected') && (
        <Card className={`border-2 ${
          requestData.status === 'rejected' 
            ? 'border-red-200 bg-red-50' 
            : 'border-green-200 bg-green-50'
        }`}>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {requestData.status === 'rejected' ? (
                  <AlertCircle className="w-8 h-8 text-red-600" />
                ) : (
                  <CheckCircle className="w-8 h-8 text-green-600" />
                )}
                <div>
                  <div className={`font-semibold ${
                    requestData.status === 'rejected' ? 'text-red-800' : 'text-green-800'
                  }`}>
                    {requestData.status === 'rejected' 
                      ? 'Bukti Pembayaran Ditolak' 
                      : 'Bukti Pembayaran Sudah Diupload'
                    }
                  </div>
                  <div className={`text-sm ${
                    requestData.status === 'rejected' ? 'text-red-700' : 'text-green-700'
                  }`}>
                    Upload: {requestData.proof_uploaded_at 
                      ? new Date(requestData.proof_uploaded_at).toLocaleString('id-ID') 
                      : (requestData.payment_proof?.uploaded_at 
                        ? new Date(requestData.payment_proof.uploaded_at).toLocaleString('id-ID') 
                        : 'N/A')
                    }
                  </div>
                  {requestData.status === 'rejected' && requestData.admin_notes && (
                    <div className="text-sm text-red-700 mt-1">
                      <strong>Alasan:</strong> {requestData.admin_notes}
                    </div>
                  )}
                </div>
              </div>
              {/* Only show Edit button if status is NOT approved/verified */}
              {requestData?.status !== 'verified' && requestData?.status !== 'approved' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    clearFileAndPreview();
                    document.getElementById('file-upload-edit').click();
                  }}
                  className={requestData.status === 'rejected' 
                    ? 'border-red-600 text-red-700 hover:bg-red-100' 
                    : 'border-green-600 text-green-700 hover:bg-green-100'
                  }
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {requestData.status === 'rejected' ? 'Upload Bukti Baru' : 'Edit Bukti'}
                </Button>
              )}
            </div>
            {/* Hidden file input for edit */}
            <input
              id="file-upload-edit"
              type="file"
              accept="image/*,application/pdf"
              onChange={handleFileSelect}
              className="hidden"
            />
          </CardContent>
        </Card>
      )}

      {/* Show upload preview and button if file selected after edit - only for EDITING existing proof */}
      {uploadFile && requestData.payment_proof?.uploaded && requestData?.status !== 'verified' && requestData?.status !== 'approved' && (
        <Card className="border-2 border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex items-start sm:items-center justify-between gap-2">
                <div className="flex items-start gap-2 sm:gap-3 flex-1 min-w-0">
                  <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 flex-shrink-0 mt-0.5 sm:mt-0" />
                  <div className="text-xs sm:text-sm flex-1 min-w-0">
                    <div className="font-semibold text-blue-900">File baru dipilih:</div>
                    <div className="text-blue-700 break-all">{uploadFile.name}</div>
                    <div className="text-xs text-blue-600">
                      {(uploadFile.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                  </div>
                </div>
                <Button
                  onClick={clearFileAndPreview}
                  variant="outline"
                  size="sm"
                  className="border-blue-300 text-blue-700 flex-shrink-0 text-xs sm:text-sm px-2 sm:px-3"
                >
                  Batal
                </Button>
              </div>
              
              {/* Preview for images and PDF in edit mode */}
              {previewUrl && (
                <div className="border border-blue-200 rounded-lg overflow-hidden bg-gray-50">
                  {uploadFile.type.startsWith('image/') ? (
                    <img 
                      src={previewUrl} 
                      alt="Preview" 
                      className="w-full h-auto max-h-96 object-contain"
                    />
                  ) : uploadFile.type === 'application/pdf' ? (
                    <iframe
                      src={previewUrl}
                      className="w-full h-96"
                      title="PDF Preview"
                    />
                  ) : null}
                </div>
              )}
              
              <Button
                onClick={handleUploadProof}
                disabled={uploading}
                className="w-full"
              >
                {uploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Uploading... {uploadProgress}%
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload Bukti Baru
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transfer Instructions */}
      <Card>
        <CardHeader className="p-4 sm:p-6">
          <CardTitle className="text-base sm:text-lg">
            {isBank ? 'Instruksi Transfer Bank' : 'Instruksi Transfer Crypto Wallet'}
          </CardTitle>
          <CardDescription className="text-xs sm:text-sm">
            {isBank 
              ? 'Silakan transfer jumlah yang tepat ke rekening bank berikut'
              : 'Silakan kirim jumlah yang tepat ke alamat wallet USDT berikut'
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3 sm:space-y-4 p-4 sm:p-6 pt-0">
          {isBank ? (
            // BANK TRANSFER
            <div className="bg-blue-50 p-3 sm:p-4 rounded-lg space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <Label className="text-xs sm:text-sm font-medium text-gray-600">Bank</Label>
                  <div className="flex items-center justify-between gap-2 bg-white p-2 rounded border border-blue-200 mt-1">
                    <span className="font-semibold text-sm sm:text-base break-words flex-1 min-w-0">{transferDetails.bank_name || requestData.bank_name || 'BRI'}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(transferDetails.bank_name || requestData.bank_name || 'BRI', 'Nama Bank')}
                      className="flex-shrink-0 h-8 w-8 p-0"
                    >
                      <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label className="text-xs sm:text-sm font-medium text-gray-600">Nomor Rekening</Label>
                  <div className="flex items-center justify-between gap-2 bg-white p-2 rounded border border-blue-200 mt-1">
                    <span className="font-mono font-semibold text-xs sm:text-sm break-all flex-1 min-w-0">{transferDetails.account_number || requestData.bank_account || '057901002665566'}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(transferDetails.account_number || requestData.bank_account || '057901002665566', 'Nomor Rekening')}
                      className="flex-shrink-0 h-8 w-8 p-0"
                    >
                      <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <div>
                <Label className="text-xs sm:text-sm font-medium text-gray-600">Nama Penerima</Label>
                <div className="flex items-center justify-between gap-2 bg-white p-2 rounded border border-blue-200 mt-1">
                  <span className="font-semibold text-sm sm:text-base break-words flex-1 min-w-0">{transferDetails.account_holder || requestData.bank_holder || 'PT RINAIYANTI CAHAYA INTERMA'}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(transferDetails.account_holder || requestData.bank_holder || 'PT RINAIYANTI CAHAYA INTERMA', 'Nama Penerima')}
                    className="flex-shrink-0 h-8 w-8 p-0"
                  >
                    <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                </div>
              </div>
              <div className="bg-white border border-blue-200 p-3 sm:p-4 rounded-lg">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                  <span className="text-xs sm:text-sm font-medium text-gray-700">Total Transfer</span>
                  <div className="flex items-center justify-between sm:justify-end gap-2">
                    <span className="font-bold text-base sm:text-lg text-blue-600 break-all">
                      {currencySymbol} {(transferDetails.total_transfer || requestData.total_with_unique_code || amount).toLocaleString()}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard((transferDetails.total_transfer || requestData.total_with_unique_code || amount).toString(), 'Jumlah Transfer')}
                      className="flex-shrink-0 h-8 w-8 p-0"
                    >
                      <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            // CRYPTO WALLET
            <div className="bg-green-50 p-3 sm:p-4 rounded-lg space-y-3">
              <div>
                <Label className="text-xs sm:text-sm font-medium text-gray-600">Alamat Wallet (USDT TRC20)</Label>
                <div className="flex items-start sm:items-center gap-2 bg-white p-2 sm:p-3 rounded border border-green-200 mt-1">
                  <span className="font-mono font-semibold text-xs sm:text-sm break-all flex-1 min-w-0">
                    {transferDetails.wallet_address || requestData.wallet_address || 'TBCJiUoYGxBYBpqMNb9ZtuwXWJLuCwBPXa'}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(transferDetails.wallet_address || requestData.wallet_address, 'Alamat Wallet')}
                    className="flex-shrink-0 h-8 w-8 p-0"
                  >
                    <Copy className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <Label className="text-xs sm:text-sm font-medium text-gray-600">Network</Label>
                  <div className="flex items-center justify-between gap-2 bg-white p-2 rounded border border-green-200 mt-1">
                    <span className="font-semibold text-sm sm:text-base break-words flex-1 min-w-0">{transferDetails.network || requestData.network || 'USDT TRC20'}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-shrink-0 h-8 w-8 p-0"
                      onClick={() => copyToClipboard(transferDetails.network || requestData.network || 'USDT TRC20', 'Network')}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Wallet Label</Label>
                  <div className="flex items-center justify-between bg-white p-2 rounded border border-green-200">
                    <span className="font-semibold">{transferDetails.wallet_name || requestData.wallet_name || 'BINANCE'}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(transferDetails.wallet_name || requestData.wallet_name, 'Nama Wallet')}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Jumlah yang Dikirim</Label>
                <div className="flex items-center justify-between bg-white p-3 rounded border border-green-200">
                  <span className="font-bold text-lg text-green-600">
                    {amount} USDT
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(amount.toString(), 'Jumlah Pembayaran')}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
            <div className="flex gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div>
                <div className="font-semibold text-yellow-800">Catatan Penting:</div>
                <ul className="text-sm text-yellow-700 mt-1 space-y-1">
                  {isBank ? (
                    <>
                      <li>• <strong>Transfer nominal PERSIS: {currencySymbol} {(transferDetails.total_transfer || requestData.total_with_unique_code || amount).toLocaleString()}</strong></li>
                      <li>• Kode unik ({transferDetails.unique_code || requestData.unique_code}) memudahkan admin verifikasi pembayaran Anda</li>
                      <li>• Sertakan kode referensi "{requestData.reference_code}" pada catatan transfer</li>
                      <li>• Upload bukti pembayaran setelah transfer selesai</li>
                      <li>• Waktu pemrosesan: 1-24 jam setelah bukti diupload</li>
                    </>
                  ) : (
                    <>
                      <li>• Transfer jumlah yang tepat sesuai yang tertera di atas</li>
                      <li>• Kirim hanya USDT pada jaringan TRC20 untuk menghindari kehilangan dana</li>
                      <li>• Upload bukti pembayaran setelah transfer selesai</li>
                      <li>• Waktu pemrosesan: 1-24 jam setelah bukti diupload</li>
                    </>
                  )}
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Admin Notes */}
      {requestData.admin_notes && (
        <Card>
          <CardHeader>
            <CardTitle>Catatan Admin</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700">{requestData.admin_notes}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 max-w-2xl mx-auto">
        <Button
          variant="outline"
          onClick={() => navigate('/dashboard/topup')}
          className="flex-1 text-sm sm:text-base"
        >
          Kembali ke Top Up
        </Button>
        <Button
          onClick={() => navigate('/dashboard/topup/history')}
          className="flex-1 text-sm sm:text-base"
        >
          Lihat Riwayat Pembayaran
        </Button>
      </div>
    </div>
  );
};

export default PaymentConfirmation;
