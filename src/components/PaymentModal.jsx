import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { QrCode, CheckCircle2, Zap, X } from 'lucide-react';
import { useBooth } from '../context/BoothContext';

export default function PaymentModal({ isOpen, onClose, onSuccess, title = "Pembayaran Sesi Baru" }) {
  const { appConfig } = useBooth();
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = () => {
    setPaymentSuccess(true);
    setTimeout(() => {
      setPaymentSuccess(false);
      if (onSuccess) onSuccess();
      if (onClose) onClose();
    }, 1200);
  };

  const price = appConfig?.payment?.price || 15000;
  const qrisUrl = appConfig?.payment?.qrisUrl || 'https://snap.e.studio/pay';
  const provider = appConfig?.paymentGateway?.provider?.toUpperCase() || 'DOKU';

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white w-full max-w-sm rounded-2xl p-6 sm:p-7 text-center space-y-4 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
          title="Tutup"
        >
          <X size={18} />
        </button>

        <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 mx-auto flex items-center justify-center">
          <QrCode size={24} />
        </div>

        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-700 text-[10px] font-bold uppercase tracking-wider mb-1">
            <span>{provider} QRIS PAYMENT GATEWAY</span>
          </div>
          <h3 className="text-xl font-bold text-gray-900">{title}</h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Pindai kode QRIS dengan BCA Mobile, GoPay, ShopeePay, OVO, atau Dana untuk membuka sesi foto 15 menit.
          </p>
        </div>

        {/* QRIS Code */}
        <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl inline-block mx-auto relative">
          <QRCodeSVG 
            value={qrisUrl} 
            size={170} 
            level="M" 
            includeMargin={false}
          />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white p-1 shadow-xs border border-gray-200 flex items-center justify-center">
            <span className="font-extrabold text-[9px] text-red-600">QRIS</span>
          </div>
        </div>

        <div className="bg-gray-50 border border-gray-100 p-2.5 rounded-xl space-y-1 text-left text-xs">
          <div className="flex items-center justify-between text-gray-500 text-[11px]">
            <span>No. Transaksi</span>
            <span className="font-mono font-bold text-gray-800">INV-{Date.now().toString().slice(-6)}</span>
          </div>
          <div className="flex items-center justify-between text-gray-500 text-[11px]">
            <span>Masa Aktif QR</span>
            <span className="font-mono font-bold text-red-600">14:59 Menit</span>
          </div>
          <div className="flex items-center justify-between pt-1 border-t border-gray-200/60">
            <span className="font-bold text-gray-700">Total Pembayaran</span>
            <span className="text-base font-extrabold text-gray-900">
              Rp {price.toLocaleString('id-ID')}
            </span>
          </div>
        </div>

        {/* Action Button */}
        <div className="space-y-2">
          <button
            onClick={handleConfirm}
            disabled={paymentSuccess}
            className={`w-full py-3 rounded-xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
              paymentSuccess
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
            }`}
          >
            {paymentSuccess ? (
              <>
                <CheckCircle2 size={18} />
                Pembayaran Terkonfirmasi! Sesi Aktif
              </>
            ) : (
              <>
                <Zap size={16} />
                Konfirmasi Pembayaran Selesai
              </>
            )}
          </button>
          <button
            onClick={onClose}
            className="text-xs text-gray-400 hover:text-gray-600 font-medium"
          >
            Batal
          </button>
        </div>
      </div>
    </div>
  );
}
