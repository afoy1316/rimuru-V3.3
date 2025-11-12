import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { toast } from "sonner";
import { useLanguage } from "../contexts/LanguageContext";
import TopUp from "./TopUp"; // Import existing TopUp component
import WalletTopUpForm from "./WalletTopUpForm";
import WalletToAccountTransfer from "./WalletToAccountTransfer";
import {
  Wallet,
  CreditCard,
  ArrowRight,
  ArrowLeft,
  DollarSign,
  Plus,
  RefreshCw
} from "lucide-react";
import { formatCurrency } from '../utils/currencyFormatter';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const WalletTopUp = ({ onRefresh }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  
  // Flow state
  const [currentFlow, setCurrentFlow] = useState('main'); // 'main', 'wallet-topup', 'account-topup', 'account-from-wallet', 'account-via-transfer'
  const [walletType, setWalletType] = useState(''); // 'main' or 'withdrawal'
  
  // Wallet data state
  const [walletBalances, setWalletBalances] = useState({
    main_wallet_idr: 0,
    main_wallet_usd: 0,
    withdrawal_wallet_idr: 0,
    withdrawal_wallet_usd: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchWalletBalances();
  }, []);

  // Fetch wallet balances
  const fetchWalletBalances = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/wallet/balances`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWalletBalances(response.data);
    } catch (error) {
      console.error('Error fetching wallet balances:', error);
      // Use default values if API fails
      setWalletBalances({
        main_wallet_idr: 0,
        main_wallet_usd: 0,
        withdrawal_wallet_idr: 0,
        withdrawal_wallet_usd: 0
      });
    } finally {
      setLoading(false);
    }
  };

  // Reset flow
  const resetFlow = () => {
    setCurrentFlow('main');
    setWalletType('');
  };

  // Handle flow navigation
  const handleFlowSelection = (flow, type = '') => {
    setCurrentFlow(flow);
    if (type) setWalletType(type);
  };

  // Main selection screen
  const renderMainSelection = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Pilih Jenis Isi Saldo</h2>
        <p className="text-gray-600">Pilih metode pengisian saldo yang Anda inginkan</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Isi Saldo Wallet */}
        <Card className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-blue-500"
              onClick={() => handleFlowSelection('wallet-topup')}>
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Wallet className="w-8 h-8 text-blue-600" />
            </div>
            <CardTitle className="text-lg">Isi Saldo Wallet</CardTitle>
            <CardDescription>
              Isi saldo ke wallet utama Anda melalui transfer bank atau crypto
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <Button className="w-full" variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Pilih Isi Saldo Wallet
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Isi Saldo Akun */}
        <Card className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-green-500"
              onClick={() => handleFlowSelection('account-topup')}>
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CreditCard className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-lg">Isi Saldo Akun</CardTitle>
            <CardDescription>
              Isi saldo langsung ke akun iklan Anda dari wallet atau transfer
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <Button className="w-full" variant="outline">
                <CreditCard className="w-4 h-4 mr-2" />
                Pilih Isi Saldo Akun
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="text-center">
        <Button variant="ghost" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Kembali ke Dashboard
        </Button>
      </div>
    </div>
  );

  // Wallet selection screen (for account topup)
  const renderAccountTopUpSelection = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Pilih Sumber Dana</h2>
        <p className="text-gray-600">Pilih dari mana Anda ingin mengisi saldo akun</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Dari Wallet */}
        <Card className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-purple-500"
              onClick={() => handleFlowSelection('account-from-wallet')}>
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Wallet className="w-8 h-8 text-purple-600" />
            </div>
            <CardTitle className="text-lg">Dari Wallet</CardTitle>
            <CardDescription>
              Transfer saldo dari wallet ke akun iklan Anda
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <Button className="w-full" variant="outline">
                <ArrowRight className="w-4 h-4 mr-2" />
                Transfer dari Wallet
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Via Transfer Bank/Crypto */}
        <Card className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-orange-500"
              onClick={() => handleFlowSelection('account-via-transfer')}>
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <DollarSign className="w-8 h-8 text-orange-600" />
            </div>
            <CardTitle className="text-lg">Via Transfer Bank/Crypto</CardTitle>
            <CardDescription>
              Isi saldo akun langsung melalui transfer bank atau cryptocurrency
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <Button className="w-full" variant="outline">
                <DollarSign className="w-4 h-4 mr-2" />
                Transfer Bank/Crypto
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="text-center">
        <Button variant="ghost" onClick={() => handleFlowSelection('main')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Kembali
        </Button>
      </div>
    </div>
  );

  // Wallet type selection (for account from wallet)
  const renderWalletTypeSelection = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Pilih Jenis Wallet</h2>
        <p className="text-gray-600">Pilih wallet mana yang ingin Anda gunakan</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Main Wallet */}
        <Card className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-blue-500"
              onClick={() => handleFlowSelection('wallet-to-account-transfer', 'main')}>
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Wallet className="w-8 h-8 text-blue-600" />
            </div>
            <CardTitle className="text-lg">Main Wallet</CardTitle>
            <CardDescription>
              Saldo dari top-up langsung ke wallet utama
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin text-blue-600" />
                </div>
              ) : (
                <>
                  <div className="space-y-1 mb-4">
                    <div className="text-xl font-bold text-blue-600">
                      {formatCurrency(walletBalances.main_wallet_idr_available, 'IDR')}
                    </div>
                    <div className="text-lg font-semibold text-blue-500">
                      {formatCurrency(walletBalances.main_wallet_usd_available, 'USD')}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">Saldo tersedia</p>
                  <Button className="w-full">
                    Gunakan Main Wallet
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Withdrawal Wallet */}
        <Card className="cursor-pointer hover:shadow-lg transition-shadow border-2 hover:border-green-500"
              onClick={() => handleFlowSelection('wallet-to-account-transfer', 'withdrawal')}>
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Wallet className="w-8 h-8 text-green-600" />
            </div>
            <CardTitle className="text-lg">Withdrawal Wallet</CardTitle>
            <CardDescription>
              Saldo dari penarikan akun iklan (bebas fee tambahan)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <RefreshCw className="w-6 h-6 animate-spin text-green-600" />
                </div>
              ) : (
                <>
                  <div className="space-y-1 mb-4">
                    <div className="text-xl font-bold text-green-600">
                      {formatCurrency(walletBalances.withdrawal_wallet_idr_available, 'IDR')}
                    </div>
                    <div className="text-lg font-semibold text-green-500">
                      {formatCurrency(walletBalances.withdrawal_wallet_usd_available, 'USD')}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">Saldo tersedia (bebas fee)</p>
                  <Button className="w-full">
                    Gunakan Withdrawal Wallet
                  </Button>
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="text-center">
        <Button variant="ghost" onClick={() => handleFlowSelection('account-topup')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Kembali
        </Button>
      </div>
    </div>
  );

  // Wallet TopUp Form
  const renderWalletTopUp = () => (
    <WalletTopUpForm 
      onBack={() => handleFlowSelection('main')}
      onRefresh={onRefresh}
    />
  );

  // Render content based on current flow
  const renderContent = () => {
    switch (currentFlow) {
      case 'main':
        return renderMainSelection();
      case 'wallet-topup':
        return renderWalletTopUp();
      case 'account-topup':
        return renderAccountTopUpSelection();
      case 'account-from-wallet':
        return renderWalletTypeSelection();
      case 'wallet-to-account-transfer':
        return (
          <WalletToAccountTransfer 
            onBack={() => handleFlowSelection('account-from-wallet')}
            onRefresh={onRefresh}
            walletType={walletType}
          />
        );
      case 'account-via-transfer':
        // Navigate to legacy TopUp component
        navigate('/dashboard/topup/legacy');
        return null;
      default:
        return renderMainSelection();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {renderContent()}
      </div>
    </div>
  );
};

export default WalletTopUp;