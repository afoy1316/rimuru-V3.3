import React, { useRef } from 'react';
import { toPng } from 'html-to-image';
import ResiTemplate from './ResiTemplate';
import { Button } from './ui/button';

const ResiGenerator = () => {
  const resiRef = useRef();

  const downloadSampleResi = async () => {
    try {
      const dataUrl = await toPng(resiRef.current, {
        backgroundColor: 'white',
        width: 400,
        height: 600,
        style: {
          transform: 'scale(2)',
          transformOrigin: 'top left'
        }
      });
      
      // Create download link
      const link = document.createElement('a');
      link.download = 'sample-resi-bitship-activation.png';
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Error generating resi:', error);
      alert('Error generating resi. Please try again.');
    }
  };

  const sampleOrderData = {
    waybill_id: "24RMR000000013",
    courier_name: "JNE",
    sender_name: "Rimuru Warehouse Jakarta (1)",
    sender_full_address: "Komplek Rimuru Center No. 11, Jakarta Selatan 12440",
    receiver_name: "Test Customer",
    receiver_phone: "081222334953", 
    receiver_address: "Jl. Test Customer Residence No. 17, Jakarta 12430",
    weight: "1",
    shipping_cost: 7000,
    service_type: "Reguler",
    reference_number: "24RMR5Z82tCBgIA",
    product_name: "Produk Test",
    product_category: "Fashion",
    order_number: "ORD-12345678"
  };

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold mb-6 text-center">
        🧾 Sample Resi Generator untuk BitShip Activation
      </h2>
      
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <p className="text-sm text-yellow-800">
          <strong>📋 Cara Penggunaan:</strong><br/>
          1. Preview resi sample di bawah<br/>
          2. Klik "Download Sample Resi" untuk save image<br/>
          3. Upload image ke form aktivasi BitShip<br/>
          4. Nanti setelah aktif, sistem akan auto-generate resi untuk setiap order!
        </p>
      </div>

      {/* Resi Preview */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4">Preview Sample Resi:</h3>
        <div className="border-2 border-gray-300 p-4 rounded-lg bg-gray-50">
          <div ref={resiRef} className="bg-white">
            <ResiTemplate orderData={sampleOrderData} />
          </div>
        </div>
      </div>

      {/* Download Button */}
      <div className="text-center">
        <Button
          onClick={downloadSampleResi}
          className="bg-teal-600 hover:bg-teal-700 text-white px-8 py-3 text-lg"
        >
          📥 Download Sample Resi (PNG)
        </Button>
        <p className="text-xs text-gray-600 mt-2">
          File akan di-download sebagai "sample-resi-bitship-activation.png"
        </p>
      </div>

      {/* Future Production Note */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-6">
        <h4 className="font-semibold text-green-800 mb-2">🚀 Nanti di Production:</h4>
        <p className="text-sm text-green-700">
          Setelah BitShip aktif, merchant bisa klik <strong>"Print Resi"</strong> button dan sistem akan:
          <br/>• Auto-generate resi dengan data order real
          <br/>• Include barcode untuk tracking  
          <br/>• Print-ready format (A4/thermal printer)
          <br/>• Semua otomatis, tidak perlu manual design!
        </p>
      </div>
    </div>
  );
};

export default ResiGenerator;