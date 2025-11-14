import React from 'react';
import { X, AlertTriangle, Loader2 } from 'lucide-react';

const ClaimConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  isLoading,
  requestInfo 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white z-10">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-teal-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-teal-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              Konfirmasi Claim Request
            </h3>
          </div>
          {!isLoading && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-6">
          <p className="text-gray-700 mb-4">
            Apakah Anda yakin ingin mengklaim dan memproses request ini?
          </p>
          
          {requestInfo && (
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              {requestInfo.user && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">User:</span>
                  <span className="font-medium text-gray-900">{requestInfo.user}</span>
                </div>
              )}
              {requestInfo.accounts && requestInfo.accounts.length > 0 ? (
                <div className="text-sm">
                  <span className="text-gray-600 block mb-2">Akun ({requestInfo.accounts.length}):</span>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {requestInfo.accounts.map((account, idx) => (
                      <div key={idx} className="bg-white border border-gray-200 rounded p-2">
                        <div className="font-medium text-gray-900 text-xs">{account}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : requestInfo.account ? (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Akun:</span>
                  <span className="font-medium text-gray-900">{requestInfo.account}</span>
                </div>
              ) : null}
              {requestInfo.amount && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Total:</span>
                  <span className="font-medium text-gray-900">{requestInfo.amount}</span>
                </div>
              )}
            </div>
          )}

          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-xs text-yellow-800">
              <strong>Catatan:</strong> Setelah diklaim, hanya Anda yang bisa memproses request ini. 
              Admin lain tidak akan bisa mengakses request ini sampai Anda melepaskannya.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Batal
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="px-4 py-2 text-sm font-medium text-white bg-teal-600 border border-transparent rounded-lg hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Memproses...</span>
              </>
            ) : (
              <span>Ya, Klaim Request</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClaimConfirmationModal;
