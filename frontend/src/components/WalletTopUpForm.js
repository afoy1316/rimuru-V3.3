import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "./ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { toast } from "sonner";
import { useLanguage } from "../contexts/LanguageContext";
import {
  Wallet,
  ArrowLeft,
  Upload,
  DollarSign,
  CreditCard,
  Banknote,
  CheckCircle,
  FileText,
  Eye,
  RefreshCw,
  Clock
} from "lucide-react";
import { formatCurrency } from '../utils/currencyFormatter';
import ProcessingModal from './ProcessingModal';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const WalletTopUpForm = ({ onBack, onRefresh }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  // Form state
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    currency: 'IDR',
    amount: '',
    payment_method: 'bank_bri', // Default to BRI for IDR
    notes: ''
  });
  
  // Payment state
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showProcessingModal, setShowProcessingModal] = useState(false);
  const [showUploadPrompt, setShowUploadPrompt] = useState(false);
  const [pendingRequestId, setPendingRequestId] = useState(null);
  const [paymentProof, setPaymentProof] = useState(null);
  const [paymentRequest, setPaymentRequest] = useState(null);
  const [uniqueCode, setUniqueCode] = useState(0);
  const [totalWithUniqueCode, setTotalWithUniqueCode] = useState(0);
  const [previewUrl, setPreviewUrl] = useState(null);
  
  // Payment methods based on currency
  const getPaymentMethods = (currency) => {
    if (currency === 'IDR') {
      return [
        { 
          value: 'bank_bri', 
          label: 'Bank BRI', 
          icon: <Banknote className="w-4 h-4" />,
          details: 'Transfer ke rekening BRI'
        }
      ];
    } else {
      return [
        { 
          value: 'usdt_trc20', 
          label: 'USDT TRC20', 
          icon: <DollarSign className="w-4 h-4" />,
          details: 'Transfer cryptocurrency USDT'
        }
      ];
    }
  };

  // Form validation
  const validateStep = (step) => {
    switch (step) {
      case 1:
        if (!formData.currency || !formData.amount || !formData.payment_method) {
          toast.error('Harap lengkapi semua field yang wajib diisi');
          return false;
        }
        if (parseFloat(formData.amount) <= 0) {
          toast.error('Nominal harus lebih besar dari 0');
          return false;
        }
        return true;
      case 2:
        return true; // Step 2 is just confirmation, submit without requiring payment proof
      default:
        return true;
    }
  };

  // Handle form input changes
  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Reset payment method if currency changes
      if (field === 'currency') {
        const availableMethods = getPaymentMethods(value);
        newData.payment_method = availableMethods.length > 0 ? availableMethods[0].value : '';
      }
      
      return newData;
    });
  };

  // Handle file upload
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('File harus berupa gambar (JPG, PNG) atau PDF');
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Ukuran file maksimal 5MB');
        return;
      }
      
      setPaymentProof(file);
      
      // Create preview URL for images
      if (file.type.startsWith('image/')) {
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
      } else {
        setPreviewUrl(null); // PDF doesn't need preview
      }
      
      toast.success('Bukti pembayaran berhasil dipilih');
    }
  };

  // Remove file
  const removeFile = () => {
    setPaymentProof(null);
    setPreviewUrl(null);
    // Reset file input
    const fileInput = document.getElementById('payment_proof');
    if (fileInput) {
      fileInput.value = '';
    }
  };

  // Submit wallet top-up request
  const submitTopUpRequest = async () => {
    setSubmitting(true);
    setShowProcessingModal(true); // Show processing modal
    
    try {
      
      const token = localStorage.getItem('token');
      const formDataObj = new FormData();
      
      // Add form data
      formDataObj.append('wallet_type', 'main'); // For now, always main wallet
      formDataObj.append('currency', formData.currency);
      formDataObj.append('amount', formData.amount);
      formDataObj.append('payment_method', formData.payment_method);
      formDataObj.append('notes', formData.notes);
      formDataObj.append('unique_code', uniqueCode.toString());
      formDataObj.append('total_with_unique_code', totalWithUniqueCode.toString());
      
      // Payment proof is now OPTIONAL - user can upload later
      if (paymentProof) {
        formDataObj.append('payment_proof', paymentProof);
      }
      
      const response = await axios.post(`${API}/wallet/topup`, formDataObj, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setPaymentRequest(response.data);
      const requestId = response.data.id;
      
      // Complete the progress animation
      if (window.completeProcessingModal) {
        window.completeProcessingModal();
      }
      
      // Wait for animation to complete before showing upload prompt
      setTimeout(() => {
        setShowProcessingModal(false);
        
        if (onRefresh) {
          onRefresh();
        }
        
        toast.success('✅ Permintaan top-up wallet berhasil diajukan!');
        
        // Show upload prompt modal
        setPendingRequestId(requestId);
        setShowUploadPrompt(true);
      }, 2000);
      
    } catch (error) {
      console.error('Error submitting wallet top-up:', error);
      setShowProcessingModal(false);
      toast.error(error.response?.data?.detail || 'Terjadi kesalahan saat mengirim permintaan');
    } finally {
      setSubmitting(false);
    }
  };

  // Next step handler
  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep === 1) {
        // Generate unique code when moving to step 2
        generateUniqueCode();
        setCurrentStep(currentStep + 1);
      } else if (currentStep === 2) {
        // Submit from step 2, no need for step 3 anymore
        submitTopUpRequest();
      } else {
        setCurrentStep(currentStep + 1);
      }
    }
  };

  // Previous step handler
  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      onBack();
    }
  };

  // Get payment method details
  const getSelectedPaymentMethod = () => {
    const availableMethods = getPaymentMethods(formData.currency);
    return availableMethods.find(method => method.value === formData.payment_method);
  };

  // Generate unique code for IDR transfers
  const generateUniqueCode = () => {
    if (formData.currency === 'IDR' && formData.amount) {
      const code = Math.floor(Math.random() * 900) + 100; // Random 3-digit number (100-999)
      const total = parseFloat(formData.amount) + code;
      setUniqueCode(code);
      setTotalWithUniqueCode(total);
      return { code, total };
    } else {
      setUniqueCode(0);
      setTotalWithUniqueCode(parseFloat(formData.amount) || 0);
      return { code: 0, total: parseFloat(formData.amount) || 0 };
    }
  };

  // Render step 1: Amount and method selection
  const renderStep1 = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Wallet className="w-5 h-5 mr-2 text-blue-600" />
          Detail Top-Up Wallet
        </CardTitle>
        <CardDescription>
          Masukkan nominal dan pilih metode pembayaran untuk mengisi saldo wallet Anda
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Currency Selection */}
        <div className="space-y-2">
          <Label htmlFor="currency">Mata Uang *</Label>
          <Select value={formData.currency} onValueChange={(value) => handleInputChange('currency', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih mata uang" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="IDR">Indonesian Rupiah (IDR)</SelectItem>
              <SelectItem value="USD">US Dollar (USD)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Amount Input */}
        <div className="space-y-2">
          <Label htmlFor="amount">Nominal Top-Up *</Label>
          <Input
            id="amount"
            type="number"
            placeholder={formData.currency === 'IDR' ? 'Contoh: 100000' : 'Contoh: 50'}
            value={formData.amount}
            onChange={(e) => handleInputChange('amount', e.target.value)}
            min="0"
            step={formData.currency === 'IDR' ? '1000' : '0.01'}
          />
          {formData.amount && (
            <p className="text-sm text-gray-600">
              Nominal: {formatCurrency(formData.amount, formData.currency)}
            </p>
          )}
        </div>

        {/* Payment Method Selection */}
        <div className="space-y-2">
          <Label>Metode Pembayaran *</Label>
          <div className="grid grid-cols-1 gap-3">
            {getPaymentMethods(formData.currency).map((method) => (
              <Card 
                key={method.value}
                className={`cursor-pointer transition-all ${
                  formData.payment_method === method.value 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'hover:border-gray-300'
                }`}
                onClick={() => handleInputChange('payment_method', method.value)}
              >
                <CardContent className="flex items-center space-x-3 p-4">
                  <div className={`p-2 rounded-full ${
                    formData.payment_method === method.value ? 'bg-blue-100' : 'bg-gray-100'
                  }`}>
                    {method.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium">{method.label}</h4>
                    <p className="text-sm text-gray-600">{method.details}</p>
                  </div>
                  {formData.payment_method === method.value && (
                    <CheckCircle className="w-5 h-5 text-blue-600" />
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes">Catatan (Opsional)</Label>
          <Input
            id="notes"
            placeholder="Tambahkan catatan jika diperlukan..."
            value={formData.notes}
            onChange={(e) => handleInputChange('notes', e.target.value)}
          />
        </div>
      </CardContent>
    </Card>
  );

  // Render step 2: Payment details
  const renderStep2 = () => {
    const selectedMethod = getSelectedPaymentMethod();
    
    // Payment details using actual system data
    const getPaymentDetails = () => {
      switch (formData.payment_method) {
        case 'bank_bri':
          return {
            account_name: 'PT RINAIYANTI CAHAYA INTERMA',
            account_number: '057901002665566',
            bank_name: 'Bank BRI'
          };
        case 'usdt_trc20':
          return {
            wallet_address: 'TBCJiUoYGxBYBpqMNb9ZtuwXWJLuCwBPXa',
            wallet_name: 'BINANCE',
            network: 'USDT TRC20',
            currency: 'USDT'
          };
        default:
          return null;
      }
    };

    const paymentDetails = getPaymentDetails();

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="w-5 h-5 mr-2 text-blue-600" />
            Detail Pembayaran
          </CardTitle>
          <CardDescription>
            Lakukan pembayaran sesuai detail di bawah ini
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Order Summary */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-3">Ringkasan Pesanan</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Jenis:</span>
                <span className="font-medium">Top-Up Wallet</span>
              </div>
              <div className="flex justify-between">
                <span>Mata Uang:</span>
                <span className="font-medium">{formData.currency}</span>
              </div>
              <div className="flex justify-between">
                <span>Nominal:</span>
                <span className="font-medium">{formatCurrency(formData.amount, formData.currency)}</span>
              </div>
              <div className="flex justify-between">
                <span>Metode:</span>
                <span className="font-medium">{selectedMethod?.label}</span>
              </div>
            </div>
          </div>

          {/* Payment Details */}
          {paymentDetails && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium mb-3">Detail Pembayaran</h4>
              <div className="space-y-2 text-sm">
                {formData.payment_method.startsWith('bank_') ? (
                  <>
                    <div className="flex justify-between">
                      <span>Bank:</span>
                      <span className="font-medium">{paymentDetails.bank_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>No. Rekening:</span>
                      <span className="font-medium font-mono">{paymentDetails.account_number}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Nama Penerima:</span>
                      <span className="font-medium">{paymentDetails.account_name}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex justify-between">
                      <span>Wallet Name:</span>
                      <span className="font-medium">{paymentDetails.wallet_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Network:</span>
                      <span className="font-medium">{paymentDetails.network}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Currency:</span>
                      <span className="font-medium">{paymentDetails.currency}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Wallet Address:</span>
                      <span className="font-medium font-mono text-xs break-all">{paymentDetails.wallet_address}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {/* Transfer Amount with Unique Code */}
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <h4 className="font-medium mb-3 text-yellow-800">Nominal Transfer</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Nominal Top-Up:</span>
                <span className="font-medium">{formatCurrency(formData.amount, formData.currency)}</span>
              </div>
              {formData.currency === 'IDR' && uniqueCode > 0 && (
                <>
                  <div className="flex justify-between text-blue-600">
                    <span>Kode Unik:</span>
                    <span className="font-bold">+{uniqueCode}</span>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total Transfer:</span>
                      <span className="text-green-600">{formatCurrency(totalWithUniqueCode, formData.currency)}</span>
                    </div>
                  </div>
                </>
              )}
              {formData.currency === 'USD' && (
                <div className="border-t pt-2 mt-2">
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total Transfer:</span>
                    <span className="text-green-600">{formatCurrency(formData.amount, formData.currency)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <h4 className="font-medium mb-2 text-orange-800">Petunjuk Pembayaran</h4>
            <ol className="text-sm space-y-1 list-decimal list-inside">
              <li>
                Lakukan transfer <strong>TEPAT</strong> sesuai nominal {' '}
                <span className="font-bold text-green-600">
                  {formData.currency === 'IDR' && uniqueCode > 0 
                    ? formatCurrency(totalWithUniqueCode, formData.currency)
                    : formatCurrency(formData.amount, formData.currency)
                  }
                </span>
              </li>
              {formData.currency === 'IDR' && uniqueCode > 0 && (
                <li className="text-blue-600 font-medium">
                  <strong>WAJIB</strong> transfer dengan kode unik <strong>{uniqueCode}</strong> untuk verifikasi otomatis
                </li>
              )}
              <li>Simpan bukti pembayaran/transfer</li>
              <li>Upload bukti pembayaran pada step berikutnya</li>
              <li>Tim kami akan memverifikasi dalam 1×24 jam</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Render step 3: Upload proof
  const renderStep3 = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Upload className="w-5 h-5 mr-2 text-blue-600" />
          Upload Bukti Pembayaran
        </CardTitle>
        <CardDescription>
          Upload bukti transfer atau pembayaran yang telah Anda lakukan
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Modern File Upload with Preview */}
        <div className="space-y-4">
          <Label htmlFor="payment_proof" className="text-lg font-medium">Upload Bukti Pembayaran *</Label>
          
          {!paymentProof ? (
            /* Upload Area */
            <div className="border-2 border-dashed border-blue-300 rounded-xl p-8 text-center bg-gradient-to-br from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-colors">
              <input
                id="payment_proof"
                type="file"
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
              <label htmlFor="payment_proof" className="cursor-pointer block">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Upload className="w-8 h-8 text-blue-600" />
                </div>
                <h4 className="text-lg font-medium text-gray-800 mb-2">
                  Upload Bukti Transfer
                </h4>
                <p className="text-sm text-gray-600 mb-2">
                  Klik untuk pilih file atau drag & drop di sini
                </p>
                <p className="text-xs text-gray-500 mb-4">
                  Format: JPG, PNG, PDF • Maksimal 5MB
                </p>
                <div className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <Upload className="w-4 h-4 mr-2" />
                  Pilih File
                </div>
              </label>
            </div>
          ) : (
            /* File Preview */
            <div className="border border-gray-200 rounded-xl p-6 bg-white shadow-sm">
              <div className="flex items-start space-x-4">
                {/* Preview Image or PDF Icon */}
                <div className="flex-shrink-0">
                  {previewUrl ? (
                    <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden">
                      <img 
                        src={previewUrl} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-24 h-24 bg-red-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-8 h-8 text-red-600" />
                    </div>
                  )}
                </div>
                
                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900 truncate">
                        {paymentProof.name}
                      </h4>
                      <p className="text-sm text-gray-500 mt-1">
                        {(paymentProof.size / 1024 / 1024).toFixed(2)} MB • {paymentProof.type}
                      </p>
                      <div className="flex items-center space-x-2 mt-2">
                        <CheckCircle className="w-4 h-4 text-green-600" />
                        <span className="text-sm text-green-600 font-medium">
                          File siap diupload
                        </span>
                      </div>
                    </div>
                    
                    {/* Remove Button */}
                    <button
                      type="button"
                      onClick={removeFile}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      title="Hapus file"
                    >
                      ×
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Change File Button */}
              <div className="mt-4 pt-4 border-t border-gray-100">
                <label htmlFor="payment_proof_change" className="cursor-pointer">
                  <input
                    id="payment_proof_change"
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <span className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                    <Upload className="w-4 h-4 mr-2" />
                    Ganti File
                  </span>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Detailed Transfer Summary */}
        <div className="bg-gradient-to-r from-blue-50 to-green-50 p-6 rounded-xl border border-blue-200">
          <h4 className="font-bold text-lg text-gray-800 mb-4 flex items-center">
            <DollarSign className="w-5 h-5 mr-2 text-blue-600" />
            Pastikan Transfer Sesuai Nominal Ini
          </h4>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Nominal Top-Up:</span>
              <span className="font-medium text-gray-800">{formatCurrency(formData.amount, formData.currency)}</span>
            </div>
            {formData.currency === 'IDR' && uniqueCode > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-blue-600">Kode Unik:</span>
                <span className="font-bold text-blue-600 text-lg">+{uniqueCode}</span>
              </div>
            )}
            <div className="border-t border-gray-200 pt-3">
              <div className="flex justify-between items-center">
                <span className="font-medium text-gray-700">Yang Harus Ditransfer:</span>
                <span className="font-bold text-2xl text-green-600">
                  {formData.currency === 'IDR' && uniqueCode > 0 
                    ? formatCurrency(totalWithUniqueCode, formData.currency)
                    : formatCurrency(formData.amount, formData.currency)
                  }
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-gray-600">Metode:</span>
              <span className="font-medium">{getSelectedPaymentMethod()?.label}</span>
            </div>
          </div>
          
          {formData.currency === 'IDR' && uniqueCode > 0 && (
            <div className="mt-4 p-3 bg-yellow-100 rounded-lg border border-yellow-300">
              <p className="text-yellow-800 font-medium text-sm">
                ⚠️ PENTING: Transfer HARUS dengan nominal tepat {formatCurrency(totalWithUniqueCode, formData.currency)} 
                (termasuk kode unik {uniqueCode}) untuk verifikasi otomatis!
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  // Render step 4: Success
  const renderStep4 = () => (
    <Card>
      <CardContent className="text-center py-12">
        <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Permintaan Top-Up Berhasil Dikirim!
        </h3>
        <p className="text-gray-600 mb-6">
          Permintaan top-up wallet Anda telah berhasil dikirim. Tim kami akan memverifikasi pembayaran dalam 1x24 jam.
        </p>
        
        {paymentRequest && (
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <p className="text-sm font-medium">ID Permintaan: {paymentRequest.id}</p>
            <p className="text-sm text-gray-600">Status: Menunggu Verifikasi</p>
          </div>
        )}
        
        <div className="space-x-3">
          <Button onClick={() => navigate('/dashboard/topup/history')}>
            <Eye className="w-4 h-4 mr-2" />
            Lihat Riwayat
          </Button>
          <Button variant="outline" onClick={() => navigate('/dashboard')}>
            Kembali ke Dashboard
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          {currentStep < 4 && (
            <Button
              variant="ghost"
              onClick={handlePrevStep}
              className="mr-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Kembali
            </Button>
          )}
          <h2 className="text-2xl font-bold text-gray-900">
            Isi Saldo Wallet
          </h2>
        </div>
        <p className="text-gray-600">
          Top-up saldo ke wallet utama Anda melalui transfer bank atau cryptocurrency
        </p>
      </div>

      {/* Progress Steps */}
      {currentStep < 4 && (
        <div className="flex items-center justify-center mb-8">
          {[1, 2, 3].map((step) => (
            <React.Fragment key={step}>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium ${
                step <= currentStep 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-gray-200 text-gray-600'
              }`}>
                {step}
              </div>
              {step < 3 && (
                <div className={`w-12 h-1 mx-2 ${
                  step < currentStep ? 'bg-blue-600' : 'bg-gray-200'
                }`} />
              )}
            </React.Fragment>
          ))}
        </div>
      )}

      {/* Step Content */}
      {currentStep === 1 && renderStep1()}
      {currentStep === 2 && renderStep2()}
      {currentStep === 3 && renderStep3()}
      {currentStep === 4 && renderStep4()}

      {/* Actions */}
      {currentStep < 4 && (
        <div className="flex justify-end space-x-3">
          <Button
            onClick={handleNextStep}
            disabled={loading || submitting}
            className="min-w-24"
          >
            {submitting ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Mengirim...
              </>
            ) : (
              currentStep === 2 ? 'Submit Permintaan' : 'Lanjutkan'
            )}
          </Button>
        </div>
      )}

      {/* Upload Prompt Modal */}
      {showUploadPrompt && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-md w-full shadow-2xl">
            <div className="p-6">
              <div className="flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mx-auto mb-4">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
              
              <h3 className="text-xl font-bold text-center text-gray-900 mb-2">
                ✅ Top Up Berhasil Diajukan!
              </h3>
              
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                <div className="text-sm space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Request ID:</span>
                    <span className="font-mono font-semibold text-gray-900 text-xs break-all">{pendingRequestId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className="text-orange-600 font-semibold">Menunggu Pembayaran</span>
                  </div>
                </div>
              </div>

              <p className="text-center text-gray-600 mb-6">
                Silakan lakukan transfer dan upload bukti pembayaran
              </p>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    setShowUploadPrompt(false);
                    navigate(`/dashboard/wallet/upload-proof/${pendingRequestId}`);
                  }}
                  className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold flex items-center justify-center gap-2"
                >
                  <Upload className="w-5 h-5" />
                  Upload Bukti Sekarang
                </button>
                
                <button
                  onClick={() => {
                    setShowUploadPrompt(false);
                    navigate('/dashboard/topup/history');
                  }}
                  className="w-full py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-semibold flex items-center justify-center gap-2"
                >
                  <Clock className="w-5 h-5" />
                  Upload Nanti di Riwayat Top Up
                </button>
              </div>

              <p className="text-xs text-center text-gray-500 mt-4">
                💡 Anda bisa upload bukti kapan saja di halaman <strong>Riwayat Top Up</strong>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Processing Modal */}
      <ProcessingModal 
        isOpen={showProcessingModal}
        onComplete={() => setShowProcessingModal(false)}
        estimatedTime={60000}
      />
    </div>
  );
};

export default WalletTopUpForm;