import { Component } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4 text-gray-900">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-8 shadow-xl border border-gray-200 text-center space-y-4">
            <div className="w-14 h-14 bg-red-50 border border-red-100 rounded-2xl flex items-center justify-center mx-auto text-red-600">
              <AlertCircle size={28} />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Terjadi Kendala Tampilan</h2>
            <p className="text-xs text-gray-500 leading-relaxed">
              Aplikasi mengalami pembaruan sesi. Silakan muat ulang halaman untuk melanjutkan.
            </p>
            <button
              onClick={this.handleReload}
              className="w-full py-3 px-4 bg-gray-900 hover:bg-black text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              <RefreshCw size={14} />
              <span>Muat Ulang Halaman</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
