import React, { useState, useEffect } from 'react';
import { Plus, Trash2, AlertCircle } from 'lucide-react';

const WhatsAppCSManager = ({ whatsappNumbers, onChange }) => {
  const [csNumbers, setCsNumbers] = useState(whatsappNumbers || []);
  const [totalPercentage, setTotalPercentage] = useState(0);

  useEffect(() => {
    // Calculate total percentage
    const total = csNumbers.reduce((sum, cs) => sum + (parseInt(cs.percentage) || 0), 0);
    setTotalPercentage(total);
    
    // Notify parent component
    onChange(csNumbers);
  }, [csNumbers]);

  const addCS = () => {
    const newCS = {
      number: '',
      name: `CS ${csNumbers.length + 1}`,
      percentage: csNumbers.length === 0 ? 100 : 0
    };
    setCsNumbers([...csNumbers, newCS]);
  };

  const removeCS = (index) => {
    const updated = csNumbers.filter((_, i) => i !== index);
    setCsNumbers(updated);
  };

  const updateCS = (index, field, value) => {
    const updated = [...csNumbers];
    updated[index] = { ...updated[index], [field]: value };
    setCsNumbers(updated);
  };

  const autoDistribute = () => {
    if (csNumbers.length === 0) return;
    
    const basePercentage = Math.floor(100 / csNumbers.length);
    const remainder = 100 - (basePercentage * csNumbers.length);
    
    const updated = csNumbers.map((cs, index) => ({
      ...cs,
      percentage: index === 0 ? basePercentage + remainder : basePercentage
    }));
    
    setCsNumbers(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            WhatsApp Customer Service
          </label>
          <p className="text-xs text-gray-500">
            Tambahkan multiple nomor WA CS dengan pembagian persentase untuk auto-rotation
          </p>
        </div>
        <button
          type="button"
          onClick={addCS}
          className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
        >
          <Plus className="w-4 h-4" />
          Tambah CS
        </button>
      </div>

      {csNumbers.length > 0 && (
        <>
          <div className="flex justify-between items-center">
            <div className={`text-sm font-medium ${totalPercentage === 100 ? 'text-green-600' : 'text-red-600'}`}>
              Total Persentase: {totalPercentage}%
            </div>
            <button
              type="button"
              onClick={autoDistribute}
              className="text-sm text-blue-600 hover:text-blue-700 underline"
            >
              Auto Distribute Merata
            </button>
          </div>

          {totalPercentage !== 100 && (
            <div className="flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                Total persentase harus 100%! Sekarang: {totalPercentage}%
              </div>
            </div>
          )}
        </>
      )}

      <div className="space-y-3">
        {csNumbers.map((cs, index) => (
          <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="grid grid-cols-12 gap-3 items-start">
              <div className="col-span-4">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Nama CS
                </label>
                <input
                  type="text"
                  value={cs.name}
                  onChange={(e) => updateCS(index, 'name', e.target.value)}
                  placeholder="CS A"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="col-span-5">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Nomor WhatsApp (62...)
                </label>
                <input
                  type="text"
                  value={cs.number}
                  onChange={(e) => updateCS(index, 'number', e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder="628123456789"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Persentase
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    value={cs.percentage}
                    onChange={(e) => updateCS(index, 'percentage', Math.min(100, Math.max(0, parseInt(e.target.value) || 0)))}
                    min="0"
                    max="100"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-600">%</span>
                </div>
              </div>

              <div className="col-span-1 flex items-end pb-2">
                <button
                  type="button"
                  onClick={() => removeCS(index)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Hapus CS"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {csNumbers.length === 0 && (
        <div className="text-center py-8 text-gray-500 text-sm">
          Belum ada nomor CS. Klik "Tambah CS" untuk menambahkan.
        </div>
      )}
    </div>
  );
};

export default WhatsAppCSManager;
