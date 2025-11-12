import React, { useState, useEffect, useRef } from "react";
import { ChevronDown, Wallet, DollarSign, ArrowDownToLine } from "lucide-react";
import axios from "axios";

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const WalletDropdownSidebar = ({ user }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState("main_wallet_idr");
  const [balances, setBalances] = useState({});
  const dropdownRef = useRef(null);

  // Fetch wallet balances
  useEffect(() => {
    const fetchBalances = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(`${API}/wallet/balances`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setBalances(response.data);
      } catch (error) {
        console.error('Error fetching balances:', error);
      }
    };
    
    fetchBalances();
    // Refresh every 30 seconds
    const interval = setInterval(fetchBalances, 30000);
    return () => clearInterval(interval);
  }, []);

  // Load selected wallet from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("selected_sidebar_wallet");
    if (saved) {
      setSelectedWallet(saved);
    }
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const wallets = [
    {
      id: "main_wallet_idr",
      label: "Main Wallet IDR",
      value: balances.main_wallet_idr || 0,
      pending: balances.main_wallet_idr_pending || 0,
      available: balances.main_wallet_idr_available || 0,
      currency: "IDR",
      icon: <Wallet className="w-4 h-4 text-blue-600" />,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      id: "main_wallet_usd",
      label: "Main Wallet USD",
      value: balances.main_wallet_usd || 0,
      pending: balances.main_wallet_usd_pending || 0,
      available: balances.main_wallet_usd_available || 0,
      currency: "USD",
      icon: <DollarSign className="w-4 h-4 text-green-600" />,
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      id: "withdrawal_wallet_idr",
      label: "Withdrawal Wallet IDR",
      value: balances.withdrawal_wallet_idr || 0,
      pending: balances.withdrawal_wallet_idr_pending || 0,
      available: balances.withdrawal_wallet_idr_available || 0,
      currency: "IDR",
      icon: <ArrowDownToLine className="w-4 h-4 text-purple-600" />,
      color: "text-purple-600",
      bgColor: "bg-purple-50"
    },
    {
      id: "withdrawal_wallet_usd",
      label: "Withdrawal Wallet USD",
      value: balances.withdrawal_wallet_usd || 0,
      pending: balances.withdrawal_wallet_usd_pending || 0,
      available: balances.withdrawal_wallet_usd_available || 0,
      currency: "USD",
      icon: <ArrowDownToLine className="w-4 h-4 text-indigo-600" />,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50"
    }
  ];

  const currentWallet = wallets.find(w => w.id === selectedWallet) || wallets[0];

  const handleSelectWallet = (walletId) => {
    setSelectedWallet(walletId);
    localStorage.setItem("selected_sidebar_wallet", walletId);
    setIsOpen(false);
  };

  const formatCurrency = (value, currency) => {
    if (currency === "IDR") {
      return `Rp ${value.toLocaleString('id-ID')}`;
    } else {
      return `$${value.toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Dropdown Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-all duration-200 ease-in-out"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`p-1.5 rounded-md ${currentWallet.bgColor}`}>
              {currentWallet.icon}
            </div>
            <div className="text-left">
              <p className="text-xs text-gray-500 font-medium">{currentWallet.label}</p>
              <p className={`text-sm font-bold ${currentWallet.color}`}>
                {formatCurrency(currentWallet.value, currentWallet.currency)}
              </p>
              {currentWallet.pending > 0 && (
                <p className="text-xs text-yellow-600">
                  Pending: {formatCurrency(currentWallet.pending, currentWallet.currency)}
                </p>
              )}
            </div>
          </div>
          <ChevronDown 
            className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
              isOpen ? 'transform rotate-180' : ''
            }`}
          />
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-100 z-50 overflow-hidden animate-in slide-in-from-top-2 fade-in duration-200">
          <div className="py-2">
            {wallets.map((wallet) => (
              <button
                key={wallet.id}
                onClick={() => handleSelectWallet(wallet.id)}
                className={`w-full px-3 py-2.5 hover:bg-gray-50 transition-colors duration-150 ${
                  selectedWallet === wallet.id ? 'bg-teal-50' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-md ${wallet.bgColor}`}>
                    {wallet.icon}
                  </div>
                  <div className="flex-1 text-left">
                    <p className="text-sm font-medium text-gray-900">{wallet.label}</p>
                    <p className={`text-xs font-bold ${wallet.color}`}>
                      Total: {formatCurrency(wallet.value, wallet.currency)}
                    </p>
                    {wallet.pending > 0 && (
                      <p className="text-xs text-yellow-600">
                        Pending: {formatCurrency(wallet.pending, wallet.currency)}
                      </p>
                    )}
                    <p className="text-xs text-green-600 font-semibold">
                      Available: {formatCurrency(wallet.available, wallet.currency)}
                    </p>
                  </div>
                  {selectedWallet === wallet.id && (
                    <div className="w-2 h-2 bg-teal-600 rounded-full"></div>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WalletDropdownSidebar;
