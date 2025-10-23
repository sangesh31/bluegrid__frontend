import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Droplets, Menu, X, User, LogOut, Home, FileText, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

const Header = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleSignOut = () => {
    signOut();
    navigate('/');
    setIsMenuOpen(false);
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="bg-[#003B5C] border-b-2 border-[#007BFF] shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 hover:opacity-90 transition-opacity">
            <Droplets className="w-8 h-8 text-white" />
            <div>
              <h1 className="text-2xl font-bold text-white">BlueGrid</h1>
              <p className="text-xs text-[#90E0EF] -mt-1">Water Management System</p>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              to="/"
              className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                isActive('/') 
                  ? 'bg-[#00B4D8] text-white' 
                  : 'text-white hover:bg-[#00B4D8]/80'
              }`}
            >
              <Home className="w-4 h-4" />
              Home
            </Link>

            {user && profile ? (
              <>
                <Link
                  to={`/${profile.role.toLowerCase().replace(/ /g, '-')}`}
                  className={`flex items-center gap-2 px-3 py-2 rounded-lg transition-all ${
                    location.pathname.includes(profile.role.toLowerCase()) 
                      ? 'bg-[#00B4D8] text-white' 
                      : 'text-white hover:bg-[#00B4D8]/80'
                  }`}
                >
                  <FileText className="w-4 h-4" />
                  Dashboard
                </Link>

                <div className="flex items-center gap-3 ml-4 pl-4 border-l border-[#007BFF]">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-white">{profile.full_name}</p>
                    <p className="text-xs text-[#90E0EF]">{profile.role}</p>
                  </div>
                  <Button
                    onClick={handleSignOut}
                    variant="ghost"
                    size="sm"
                    className="bg-[#007BFF] hover:bg-[#00B4D8] text-white"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                </div>
              </>
            ) : (
              <Link to="/auth">
                <Button className="bg-white text-[#003B5C] hover:bg-[#90E0EF] hover:text-[#003B5C]">
                  <User className="w-4 h-4 mr-2" />
                  Login / Sign Up
                </Button>
              </Link>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 rounded-lg text-white hover:bg-[#00B4D8]/80 transition-colors"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t border-[#007BFF] bg-[#003B5C]">
            <nav className="flex flex-col gap-2">
              <Link
                to="/"
                onClick={() => setIsMenuOpen(false)}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-all ${
                  isActive('/') 
                    ? 'bg-[#00B4D8] text-white' 
                    : 'text-white hover:bg-[#00B4D8]/80'
                }`}
              >
                <Home className="w-4 h-4" />
                Home
              </Link>

              {user && profile ? (
                <>
                  <Link
                    to={`/${profile.role.toLowerCase().replace(/ /g, '-')}`}
                    onClick={() => setIsMenuOpen(false)}
                    className={`flex items-center gap-2 px-4 py-3 rounded-lg transition-all ${
                      location.pathname.includes(profile.role.toLowerCase()) 
                        ? 'bg-[#00B4D8] text-white' 
                        : 'text-white hover:bg-[#00B4D8]/80'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    Dashboard
                  </Link>

                  <div className="px-4 py-3 bg-[#007BFF]/20 rounded-lg border border-[#007BFF]">
                    <p className="text-sm font-semibold text-white">{profile.full_name}</p>
                    <p className="text-xs text-[#90E0EF]">{profile.role}</p>
                  </div>

                  <button
                    onClick={handleSignOut}
                    className="flex items-center gap-2 px-4 py-3 rounded-lg text-white hover:bg-[#00B4D8]/80 transition-all text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    Logout
                  </button>
                </>
              ) : (
                <Link
                  to="/auth"
                  onClick={() => setIsMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-3 bg-white text-[#003B5C] rounded-lg hover:bg-[#90E0EF] transition-all font-semibold"
                >
                  <User className="w-4 h-4" />
                  Login / Sign Up
                </Link>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
