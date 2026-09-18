import { Link, useLocation } from 'react-router-dom';
import { User } from 'lucide-react';

export default function Topbar() {
  const location = useLocation();

  const links = [
    { name: 'Beranda', path: '/' },
    { name: 'Mulai Booth', path: '/capture' },
    { name: 'Galeri & Edit', path: '/editor' },
    { name: 'Admin Studio', path: '/admin' }
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-100 flex items-center justify-between px-6 py-4">
      <div className="flex items-center gap-3">
        <img src="/logo.jpeg" alt="snap.e logo" className="w-8 h-8 rounded-full object-cover" />
        <span className="font-bold text-xl tracking-tight">snap.e</span>
      </div>

      <nav className="hidden md:flex items-center gap-8">
        {links.map((link) => (
          <Link
            key={link.path}
            to={link.path}
            className={`text-sm font-medium transition-colors ${
              location.pathname === link.path || (location.pathname === '/' && link.path === '/editor')
                ? 'text-gray-900 bg-gray-900 text-white px-4 py-2 rounded-md'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {link.name}
          </Link>
        ))}
      </nav>

      <div className="flex items-center gap-4">
        <button className="w-9 h-9 rounded-full bg-gray-900 text-white flex items-center justify-center hover:bg-black transition-colors">
          <User size={18} />
        </button>
      </div>
    </header>
  );
}
