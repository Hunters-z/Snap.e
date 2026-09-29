import { X } from 'lucide-react';
import { useBooth } from '../context/BoothContext';
import LoginScreen from './LoginScreen';

export default function AuthModal() {
  const { showAuthModal, closeAuthModal } = useBooth();

  if (!showAuthModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="relative max-w-md w-full animate-scaleUp">
        <button
          onClick={closeAuthModal}
          className="absolute top-5 right-5 z-20 text-gray-400 hover:text-gray-700 p-1.5 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="Tutup"
        >
          <X size={18} />
        </button>
        <LoginScreen isModal={true} onClose={closeAuthModal} />
      </div>
    </div>
  );
}
