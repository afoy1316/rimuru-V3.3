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
  const [paymentData, setPaymentData] = useState(null);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    fetchPaymentStatus();
  }, [requestId]);

  const fetchPaymentStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      let dataFound = false;
      
      // Try wallet top-up first (more specific)
      try {
        const walletResponse = await axios.get(`${API}/wallet-topup/${requestId}/status`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('=== WALLET TOP-UP RESPONSE ===');
        console.log('Full Response:', JSON.stringify(walletResponse.data, null, 2));
        console.log('Transfer Details Object:', walletResponse.data.transfer_details);
        console.log('Wallet Address:', walletResponse.data.transfer_details?.wallet_address);
        console.log('Network:', walletResponse.data.transfer_details?.network);
        console.log('Wallet Name:', walletResponse.data.transfer_details?.wallet_name);
        
        // Construct wallet data carefully without overriding valid data
        const walletData = {
          request_id: walletResponse.data.request_id,
          status: walletResponse.data.status,
          reference_code: walletResponse.data.reference_code,
          currency: walletResponse.data.currency,
          wallet_type: walletResponse.data.wallet_type,
          payment_method: walletResponse.data.payment_method,
          created_at: walletResponse.data.created_at || new Date().toISOString(),
          verified_at: walletResponse.data.verified_at,
          admin_notes: walletResponse.data.admin_notes,
          type: 'wallet',
          total_amount: walletResponse.data.amount || 0,
          amount: walletResponse.data.amount || 0,
          payment_proof: walletResponse.data.payment_proof || {},
          // Keep transfer_details exactly as returned from backend
          transfer_details: walletResponse.data.transfer_details,
          // Also add direct fields for fallback access
          wallet_address: walletResponse.data.transfer_details?.wallet_address || walletResponse.data.wallet_address,
          network: walletResponse.data.transfer_details?.network || walletResponse.data.network,
          wallet_name: walletResponse.data.transfer_details?.wallet_name || walletResponse.data.wallet_name
        };
        console.log('=== WALLET DATA CONSTRUCTED ===');
        console.log('Transfer Details:', JSON.stringify(walletData.transfer_details, null, 2));
        console.log('Direct Wallet Address:', walletData.wallet_address);
        console.log('Direct Network:', walletData.network);
        console.log('Direct Wallet Name:', walletData.wallet_name);
        console.log('=== BEFORE SET PAYMENT DATA ===');
        console.log('paymentData state will be set to:', walletData);
        setPaymentData(walletData);
        console.log('=== AFTER SET PAYMENT DATA ===');
        dataFound = true;
      } catch (walletError) {
        console.log('Wallet Top-Up Error:', walletError.response?.status, walletError.message);
        // If wallet top-up fails with 404, try regular top-up
        if (walletError.response?.status === 404) {
          try {
            const response = await axios.get(`${API}/topup/${requestId}/status`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            console.log('Regular Top-Up Success - Response:', response.data);
            const regularData = { 
              ...response.data, 
              type: 'regular',
              total_amount: response.data.total_amount || 0,
              created_at: response.data.created_at || new Date().toISOString(),
              payment_proof: response.data.payment_proof || {},
              transfer_details: response.data.transfer_details || {}
            };
            console.log('Regular Data transfer_details:', regularData.transfer_details);
            setPaymentData(regularData);
            dataFound = true;
          } catch (regularError) {
            console.error('Error fetching regular top-up status:', regularError);
            throw regularError;
          }
        } else {
          throw walletError;
        }
      }
      
      if (!dataFound) {
        throw new Error('Payment data not found');
      }
    } catch (error) {
      console.error('Error fetching payment status:', error);
      toast.error('Failed to load payment information');
      navigate('/dashboard/topup');
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Only JPG, PNG, and PDF files are allowed');
        return;
      }

      // Validate file size (10MB max)
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error('File size must be less than 10MB');
        return;
      }

      setUploadFile(file);
    }
  };

  const handleUploadProof = async () => {
    if (!uploadFile) {
      toast.error('Please select a file first');
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('file', uploadFile);

      const uploadEndpoint = paymentData.type === 'wallet' 
        ? `${API}/wallet-topup/${requestId}/upload-proof`
        : `${API}/topup/${requestId}/upload-proof`;
        
      const response = await axios.post(
        uploadEndpoint,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          },
          onUploadProgress: (progressEvent) => {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(progress);
          }
        }
      );

      toast.success("✅ Bukti pembayaran berhasil diupload! Status: Menunggu verifikasi admin. Anda akan mendapat notifikasi saat pembayaran dikonfirmasi.");
      setUploadFile(null);
      fetchPaymentStatus(); // Refresh payment status
    } catch (error) {
      console.error('Error uploading proof:', error);
      toast.error(error.response?.data?.detail || 'Failed to upload payment proof');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const copyToClipboard = async (text, label = 'Text') => {
    if (!text) {
      toast.error(`${label} tidak tersedia untuk di-copy`);
      return;
    }
    
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`✅ ${label} berhasil di-copy!`);
    } catch (error) {
      console.error('Failed to copy text: ', error);
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
    console.log('PaymentConfirmation: LOADING STATE');
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!paymentData) {
    console.log('PaymentConfirmation: NO PAYMENT DATA');
    return (
      <div className="text-center py-8">
        <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Payment Not Found</h2>
        <Button onClick={() => navigate('/dashboard/topup')}>Back to Top Up</Button>
      </div>
    );
  }

  console.log('=== RENDERING PAYMENT CONFIRMATION ===');
  console.log('Payment Data:', paymentData);
  console.log('Payment Data Type:', paymentData.type);
  console.log('Transfer Details:', paymentData.transfer_details);
  console.log('Transfer Details Type:', paymentData.transfer_details?.type);
  console.log('Wallet Address from transfer_details:', paymentData.transfer_details?.wallet_address);
  console.log('Wallet Address direct:', paymentData.wallet_address);
  console.log('Network from transfer_details:', paymentData.transfer_details?.network);
  console.log('Network direct:', paymentData.network);
  console.log('Wallet Name from transfer_details:', paymentData.transfer_details?.wallet_name);
  console.log('Wallet Name direct:', paymentData.wallet_name);

  const statusInfo = getStatusText(paymentData.status);
  const currencySymbol = paymentData.currency === 'IDR' ? 'Rp' : '$';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Button
          variant="outline"
          onClick={() => navigate('/dashboard/topup')}
          className="flex items-center gap-2"
        >
          ← Back to Top Up
        </Button>
        <h1 className="text-2xl font-bold">Payment Confirmation</h1>
      </div>

      {/* Status Card */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getStatusIcon(paymentData.status)}
              <div>
                <CardTitle className="text-lg">Payment Status</CardTitle>
                <CardDescription className={statusInfo.color}>
                  {statusInfo.text}
                </CardDescription>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-500">Reference Code</div>
              <div className="font-mono font-semibold text-lg">{paymentData.reference_code}</div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Payment Details */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            {t('paymentDetails') || 'Payment Details'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <Label className="text-sm font-medium text-gray-500">{t('totalAmount') || 'Total Amount'}</Label>
              <div className="flex items-center gap-2 text-2xl font-bold">
                {paymentData.currency === 'IDR' ? (
                  <Banknote className="w-6 h-6 text-blue-500" />
                ) : (
                  <DollarSign className="w-6 h-6 text-green-500" />
                )}
                {currencySymbol} {((paymentData.total_amount || paymentData.amount || 0)).toLocaleString()}
              </div>
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-500">{t('paymentDate') || 'Payment Date'}</Label>
              <div className="text-lg font-semibold">
                {paymentData.created_at ? new Date(paymentData.created_at).toLocaleDateString('id-ID', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                }) : 'N/A'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload Payment Proof - Moved to top for better visibility */}
      {paymentData.status === 'pending' && (
        <Card className="border-2 border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-800">
              <Upload className="w-5 h-5" />
              {t('uploadPaymentProof') || 'Upload Payment Proof'}
            </CardTitle>
            <CardDescription className="text-orange-700">
              {t('uploadProofDescription') || 'Upload screenshot or photo of your transfer receipt to verify payment'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label className="text-orange-800">
                {t('selectFileType') || 'Select File (JPG, PNG, or PDF - Max 10MB)'}
              </Label>
              <Input
                type="file"
                accept="image/jpeg,image/png,image/jpg,application/pdf"
                onChange={handleFileSelect}
                className="mt-2 border-orange-300 focus:border-orange-500 focus:ring-orange-200"
              />
            </div>

            {uploadFile && (
              <div className="bg-white border border-orange-200 p-3 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="w-8 h-8 text-orange-500" />
                  <div className="flex-1">
                    <div className="font-medium text-orange-900">{uploadFile.name}</div>
                    <div className="text-sm text-orange-700">
                      {(uploadFile.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setUploadFile(null)}
                    className="border-orange-300 text-orange-700 hover:bg-orange-100"
                  >
                    {t('remove') || 'Remove'}
                  </Button>
                </div>
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
                  {t('uploading') || 'Uploading...'} {uploadProgress}%
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Upload className="w-4 h-4" />
                  {t('uploadPaymentProof') || 'Upload Payment Proof'}
                </div>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Payment Proof Status - Show if already uploaded */}
      {paymentData.payment_proof.uploaded && (
        <Card className="border-2 border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div>
                <div className="font-semibold text-green-800">
                  {t('paymentProofUploaded') || 'Payment Proof Uploaded'}
                </div>
                <div className="text-sm text-green-700">
                  {t('uploadedAt') || 'Uploaded'}: {paymentData.payment_proof?.uploaded_at ? new Date(paymentData.payment_proof.uploaded_at).toLocaleString() : 'N/A'}
                </div>
                <div className="text-sm text-green-600 mt-1">
                  {paymentData.status === 'proof_uploaded' ? (
                    t('waitingVerification') || 'Waiting for admin verification...'
                  ) : paymentData.status === 'verified' ? (
                    t('paymentVerified') || 'Payment verified! Balance will be added soon.'
                  ) : paymentData.status === 'rejected' ? (
                    t('paymentRejected') || 'Payment rejected. Please contact support.'
                  ) : null}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Transfer Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>
            {paymentData.transfer_details?.type === 'bank_transfer' 
              ? (t('bankTransferInstructions') || 'Bank Transfer Instructions')
              : (t('cryptoWalletInstructions') || 'Crypto Wallet Transfer Instructions')
            }
          </CardTitle>
          <CardDescription>
            {paymentData.transfer_details?.type === 'bank_transfer' 
              ? (t('bankTransferDescription') || 'Please transfer the exact amount to the following bank account')
              : (t('cryptoTransferDescription') || 'Please send the exact amount to the following USDT wallet address')
            }
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {paymentData.transfer_details?.type === 'bank_transfer' ? (
            <div className="bg-blue-50 p-4 rounded-lg space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">Bank</Label>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{paymentData.transfer_details.bank_name}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(paymentData.transfer_details.bank_name, 'Nama Bank')}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">{t('accountNumber') || 'Account Number'}</Label>
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-semibold">{paymentData.transfer_details.account_number}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(paymentData.transfer_details.account_number, 'Nomor Rekening')}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Account Holder</Label>
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{paymentData.transfer_details.account_holder}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(paymentData.transfer_details.account_holder, 'Nama Penerima')}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              {/* Payment Breakdown */}
              <div className="bg-white border border-blue-200 p-4 rounded-lg space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Subtotal (Saldo + Fee)</span>
                  <span className="font-medium">{currencySymbol} {((paymentData.transfer_details?.subtotal || paymentData.total_amount || paymentData.amount || 0)).toLocaleString()}</span>
                </div>
                {paymentData.transfer_details.unique_code && paymentData.transfer_details.unique_code > 0 && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Kode Unik</span>
                    <span className="font-medium text-orange-600">+ {paymentData.transfer_details.unique_code}</span>
                  </div>
                )}
                <hr className="border-gray-200" />
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">Total Transfer</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-lg text-blue-600">
                      {currencySymbol} {((paymentData.transfer_details?.total_transfer || paymentData.total_amount || paymentData.amount || 0)).toLocaleString()}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(((paymentData.transfer_details?.total_transfer || paymentData.total_amount || paymentData.amount || 0)).toString(), 'Jumlah Transfer')}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-green-50 p-4 rounded-lg space-y-3">
              <div>
                <Label className="text-sm font-medium text-gray-600">{t('walletAddress') || 'Wallet Address'} ({paymentData.transfer_details?.network || paymentData.network || 'USDT TRC20'})</Label>
                <div className="flex items-center justify-between">
                  <span className="font-mono font-semibold text-sm break-all">{paymentData.transfer_details?.wallet_address || paymentData.wallet_address || 'Data not available'}</span>
                  {(paymentData.transfer_details?.wallet_address || paymentData.wallet_address) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(paymentData.transfer_details?.wallet_address || paymentData.wallet_address, 'Alamat Wallet')}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium text-gray-600">{t('network') || 'Network'}</Label>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{paymentData.transfer_details?.network || paymentData.network || 'Data not available'}</span>
                    {(paymentData.transfer_details?.network || paymentData.network) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(paymentData.transfer_details?.network || paymentData.network, 'Network')}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
                <div>
                  <Label className="text-sm font-medium text-gray-600">Wallet Label</Label>
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{paymentData.transfer_details?.wallet_name || paymentData.wallet_name || 'Data not available'}</span>
                    {(paymentData.transfer_details?.wallet_name || paymentData.wallet_name) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyToClipboard(paymentData.transfer_details?.wallet_name || paymentData.wallet_name, 'Nama Wallet')}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-600">Amount to Send</Label>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-lg text-green-600">
                    {paymentData.total_amount} USDT
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(paymentData.total_amount.toString(), 'Jumlah Pembayaran')}
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
                <div className="font-semibold text-yellow-800">{t('importantNotes') || 'Important Notes'}:</div>
                <ul className="text-sm text-yellow-700 mt-1 space-y-1">
                  <li>• {t('transferExactAmountNote') || 'Transfer the exact amount shown above'}</li>
                  {paymentData.transfer_details?.type === 'bank_transfer' ? (
                    <>
                      <li>• Include reference code "{paymentData.reference_code}" in transfer notes</li>
                      {paymentData.transfer_details.unique_code && paymentData.transfer_details.unique_code > 0 && (
                        <li>• <strong>Kode unik {paymentData.transfer_details.unique_code} memudahkan admin verifikasi pembayaran</strong></li>
                      )}
                    </>
                  ) : (
                    <li>• {t('usdtTrc20Warning') || 'Send only USDT on TRC20 network to avoid loss of funds'}</li>
                  )}
                  <li>• {t('uploadProofAfterTransfer') || 'Upload payment proof after transfer completion'}</li>
                  <li>• {t('processingTime') || 'Processing time: 1-24 hours after proof upload'}</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Duplicate upload sections removed - already moved to top for better visibility */}

      {/* Admin Notes */}
      {paymentData.admin_notes && (
        <Card>
          <CardHeader>
            <CardTitle>Admin Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700">{paymentData.admin_notes}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          onClick={() => navigate('/dashboard/topup')}
          className="flex-1"
        >
          Back to Top Up
        </Button>
        <Button
          onClick={() => navigate('/dashboard/topup/history')}
          className="flex-1"
        >
          View Payment History
        </Button>
      </div>
    </div>
  );
};

export default PaymentConfirmation;