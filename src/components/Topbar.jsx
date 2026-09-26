import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Camera, Menu, X, LogIn, LogOut, ShieldCheck, User } from 'lucide-react';
import { useBooth } from '../context/BoothContext';

export default function Topbar() {
  const location = useLocation();
  const { 
    currentUser, 
    isAdmin, 
    openAuthModal, 
    logout 
  } = useBooth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const links = [
    { name: 'Beranda & Setup', path: '/' },
    { name: 'Mulai Booth', path: '/capture' },
    { name: 'Galeri & Edit', path: '/editor' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-white/95 backdrop-blur-md border-b border-gray-100 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-4 sm:px-6 py-3.5">
        {/* Brand Logo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-full overflow-hidden border border-gray-200 shadow-xs flex items-center justify-center bg-gray-900 group-hover:scale-105 transition-transform">
            <img src="/logo.jpeg" alt="snap.e logo" className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
          </div>
          <div className="flex flex-col">
            <span className="font-bold text-lg tracking-tight text-gray-900 flex items-center gap-1">
              snap.e <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-2">
          {links.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`text-xs font-semibold px-4 py-2 rounded-full transition-all ${
                  isActive
                    ? 'bg-gray-900 text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100/70'
                }`}
              >
                {link.name}
              </Link>
            );
          })}

          {/* Admin shortcut if logged in as Admin */}
          {isAdmin && (
            <Link
              to="/admin"
              className="text-xs font-bold px-3.5 py-1.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 flex items-center gap-1.5 transition-colors"
            >
              <ShieldCheck size={13} className="text-amber-600" />
              <span>Admin Studio</span>
            </Link>
          )}
        </nav>

        {/* Right side Auth & CTA */}
        <div className="hidden sm:flex items-center gap-2.5">
          <Link
            to="/capture"
            className="flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-full bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
          >
            <Camera size={14} />
            Buka Booth
          </Link>

          {currentUser ? (
            <div className="flex items-center gap-2">
              <div className="text-xs font-semibold text-gray-700 bg-gray-100 px-3 py-1.5 rounded-full flex items-center gap-2 border border-gray-200/60">
                {currentUser.photoURL ? (
                  <img src={currentUser.photoURL} alt="" className="w-4 h-4 rounded-full object-cover" />
                ) : (
                  <User size={13} className="text-gray-500" />
                )}
                <span className="max-w-[110px] truncate">{currentUser.displayName || currentUser.email}</span>
                {isAdmin && (
                  <span className="text-[9px] bg-amber-500 text-white font-extrabold px-1.5 py-0.2 rounded-full">
                    ADMIN
                  </span>
                )}
              </div>
              <button
                onClick={logout}
                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
                title="Keluar / Logout"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button
              onClick={() => openAuthModal()}
              className="flex items-center gap-1.5 text-xs font-bold px-4 py-1.5 rounded-full bg-gray-900 text-white hover:bg-black transition-colors shadow-xs"
            >
              <LogIn size={13} />
              <span>Masuk / Login</span>
            </button>
          )}
        </div>

        {/* Mobile Hamburger Toggle */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-lg text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white px-4 py-3 space-y-2 animate-fadeIn shadow-lg">
          {links.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setMobileMenuOpen(false)}
                className={`block text-sm font-medium px-4 py-2.5 rounded-lg transition-colors ${
                  isActive
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {link.name}
              </Link>
            );
          })}

          {isAdmin && (
            <Link
              to="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-sm font-bold px-4 py-2.5 rounded-lg text-amber-800 bg-amber-50 border border-amber-200 transition-colors"
            >
              🛡️ Dashboard Admin Studio
            </Link>
          )}

          <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs px-2">
            {currentUser ? (
              <>
                <div className="flex items-center gap-1.5 truncate max-w-[180px]">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  <span className="font-medium text-gray-700 truncate">{currentUser.displayName || currentUser.email}</span>
                </div>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                  }}
                  className="font-bold text-red-600 hover:text-red-700 flex items-center gap-1"
                >
                  <LogOut size={13} /> Keluar
                </button>
              </>
            ) : (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  openAuthModal();
                }}
                className="w-full py-2 bg-gray-900 text-white font-bold rounded-lg text-center flex items-center justify-center gap-1.5"
              >
                <LogIn size={14} /> Masuk / Login
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

