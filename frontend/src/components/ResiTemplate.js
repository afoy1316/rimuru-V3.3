import React from 'react';
import rimuruLogo from '../assets/rimuru-logo.png';

const ResiTemplate = ({ orderData }) => {
  const {
    waybill_id = "24RMR000000013",
    courier_name = "JNE", 
    sender_name = "Rimuru Warehouse Jakarta (1)",
    sender_full_address = "Komplek Rimuru Center No. 11, Jakarta Selatan 12440",
    receiver_name = "Test Customer",
    receiver_phone = "081222334953",
    receiver_address = "Jl. Test Customer Residence No. 17, Jakarta 12430",
    weight = "1",
    shipping_cost = 7000,
    service_type = "Reguler",
    reference_number = "24RMR5Z82tCBgIA",
    product_name = "Produk Test",
    product_category = "Fashion"
  } = orderData || {};

  // Simple CSS-based courier logos
  const getCourierLogo = (courier) => {
    const logos = {
      jne: (
        <div className="w-16 h-16 bg-yellow-500 rounded-lg flex items-center justify-center text-white font-bold text-lg">
          JNE
        </div>
      ),
      jnt: (
        <div className="w-16 h-16 bg-red-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
          J&T
        </div>
      ),
      sicepat: (
        <div className="w-16 h-16 bg-green-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">
          SiCepat
        </div>
      ),
      lion: (
        <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">
          LION
        </div>
      ),
      anteraja: (
        <div className="w-16 h-16 bg-purple-600 rounded-lg flex items-center justify-center text-white font-bold text-xs">
          Anteraja
        </div>
      )
    };
    return logos[courier.toLowerCase()] || logos.jne;
  };

  // Generate barcode pattern
  const generateBarcode = (text, height = "h-16") => {
    return (
      <div className={`flex justify-center ${height} items-end space-x-0.5`}>
        {text.split('').map((char, index) => {
          const charCode = char.charCodeAt(0);
          const heights = ['h-8', 'h-12', 'h-10', 'h-16', 'h-6', 'h-14'];
          return (
            <div 
              key={index}
              className={`w-0.5 bg-black ${heights[charCode % heights.length]}`}
            />
          );
        })}
      </div>
    );
  };

  return (
    <div className="bg-white max-w-2xl mx-auto border-2 border-black font-sans text-xs leading-tight">
      {/* Header with both logos */}
      <div className="border-b-2 border-black p-4 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          {/* Courier Logo */}
          {getCourierLogo(courier_name)}
          <div className="text-sm font-medium">
            <div className="font-bold">RIMURU</div>
            <div>ORDER SYSTEM</div>
          </div>
        </div>
        <div className="flex items-center space-x-4">
          {/* Rimuru Logo */}
          <img 
            src={rimuruLogo} 
            alt="Rimuru" 
            className="w-12 h-12"
          />
          <div>
            <div className="text-2xl font-bold text-teal-600">rimuru</div>
            <div className="text-xs text-gray-600">www.rimuru.com</div>
          </div>
        </div>
      </div>

      {/* Main Barcode & Waybill */}
      <div className="text-center py-6 border-b-2 border-black">
        {generateBarcode(waybill_id, "h-20")}
        <div className="text-xl font-bold mt-2">Nomor Resi - {waybill_id}</div>
      </div>

      {/* Shipping Cost */}
      <div className="text-center py-3 border-b-2 border-black bg-gray-50">
        <div className="text-lg font-bold">Ongkos Kirim: Rp {shipping_cost.toLocaleString('id-ID')}</div>
      </div>

      {/* Service Type */}
      <div className="text-center py-3 border-b-2 border-black">
        <div className="text-lg font-semibold">Jenis Layanan - {courier_name} {service_type}</div>
      </div>

      {/* Reference Number & Package Info */}
      <div className="border-b-2 border-black">
        <div className="grid grid-cols-2">
          {/* Reference Number */}
          <div className="border-r-2 border-black p-4 text-center">
            <div className="text-sm font-semibold mb-2">Reference Number</div>
            {generateBarcode(reference_number, "h-10")}
            <div className="text-sm font-mono mt-1">{reference_number}</div>
          </div>
          
          {/* Package Details */}
          <div className="p-4">
            <div className="space-y-2">
              <div><strong>Quantity</strong> : 1 Pcs</div>
              <div><strong>Weight</strong> : {weight} Kg</div>
            </div>
          </div>
        </div>
      </div>

      {/* Addresses */}
      <div className="border-b-2 border-black">
        <div className="grid grid-cols-2">
          {/* Receiver Address */}
          <div className="border-r-2 border-black p-4">
            <div className="font-bold text-sm mb-2">Alamat Penerima:</div>
            <div className="font-bold">{receiver_name}</div>
            <div>{receiver_phone}</div>
            <div className="mt-1">{receiver_address}</div>
          </div>
          
          {/* Sender Address */}
          <div className="p-4">
            <div className="font-bold text-sm mb-2">Alamat Pengirim:</div>
            <div className="font-bold">{sender_name}</div>
            <div>{sender_full_address}</div>
          </div>
        </div>
      </div>

      {/* Product Info */}
      <div className="border-b-2 border-black p-4">
        <div><strong>Jenis Barang :</strong> 1x {product_name} - {product_category}</div>
      </div>

      {/* Notes */}
      <div className="border-b-2 border-black p-4">
        <div><strong>Catatan :</strong> Tidak Ada</div>
      </div>

      {/* Footer */}
      <div className="text-center p-4 bg-gray-50">
        <div className="text-sm font-semibold">Pengiriman melalui platform Rimuru</div>
        <div className="text-xs text-gray-600">www.rimuru.com</div>
      </div>
    </div>
  );
};

export default ResiTemplate;