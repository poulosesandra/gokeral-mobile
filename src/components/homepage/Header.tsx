import { Car, Users, Phone } from "lucide-react";

interface HeaderProps {
  isMenuOpen: boolean;
  setIsMenuOpen: (value: boolean) => void;
}

const Header = ({ isMenuOpen, setIsMenuOpen }: HeaderProps) => {
  return (
    <>
      {/* Header */}
      <header className="bg-white/95 backdrop-blur-md shadow-sm fixed w-full top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              {!isMenuOpen && (
                <>
                  <Car className="h-8 w-8 text-green-600" />
                  <span className="text-2xl font-bold text-gray-900 tracking-tight">Kerides</span>
                </>
              )}
            </div>
            <nav className="hidden md:flex space-x-8">
              <a href="/driver/register" className="text-gray-700 hover:text-green-600 transition-colors font-medium">Drivers</a>
              <a href="/contact" className="text-gray-700 hover:text-green-600 transition-colors font-medium">Contact</a>
              <a href="/about" className="text-gray-700 hover:text-green-600 transition-colors font-medium">About</a>
            </nav>
            <div className="hidden md:flex space-x-4 items-center">
              <a href="/user/login">
                <button className="text-green-600 hover:text-green-700 font-semibold transition-colors">Login</button>
              </a>
              <a href="/user/register">
                <button className="bg-green-600 text-white px-6 py-2.5 rounded-full hover:bg-green-700 transition-all transform hover:scale-105 font-semibold shadow-md">
                  Sign Up
                </button>
              </a>
            </div>
            <button
              className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              <div className="w-6 h-6 flex flex-col justify-center space-y-1.5">
                <div className="w-full h-0.5 bg-gray-700 rounded-full transition-all"></div>
                <div className="w-full h-0.5 bg-gray-700 rounded-full transition-all"></div>
                <div className="w-full h-0.5 bg-gray-700 rounded-full transition-all"></div>
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Sidebar */}
      {isMenuOpen && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 transition-opacity"
            onClick={() => setIsMenuOpen(false)}
          />
          {/* Sidebar */}
          <nav
            className="fixed top-0 right-0 h-full w-80 bg-white z-50 shadow-2xl flex flex-col p-0 overflow-hidden transition-transform duration-300"
            style={{ transform: isMenuOpen ? "translateX(0)" : "translateX(100%)" }}
          >
            {/* Green accent bar and logo */}
            <div className="flex items-center gap-3 px-6 py-6 bg-gradient-to-r from-green-600 to-green-500">
              <Car className="h-8 w-8 text-white" />
              <span className="text-2xl font-bold text-white tracking-tight">Kerides</span>
              <button
                className="ml-auto text-white text-3xl font-light hover:text-green-100 transition-colors"
                onClick={() => setIsMenuOpen(false)}
                aria-label="Close menu"
              >
                &times;
              </button>
            </div>
            {/* Menu links */}
            <div className="flex flex-col gap-2 px-6 py-8 flex-1">
              <a
                href="/driver/register"
                className="flex items-center gap-3 text-lg font-semibold text-gray-800 rounded-xl px-4 py-3.5 hover:bg-green-50 hover:text-green-600 transition-all"
                onClick={() => setIsMenuOpen(false)}
              >
                <Car className="h-5 w-5 text-green-500" /> Drivers
              </a>
              <a
                href="/contact"
                className="flex items-center gap-3 text-lg font-semibold text-gray-800 rounded-xl px-4 py-3.5 hover:bg-green-50 hover:text-green-600 transition-all"
                onClick={() => setIsMenuOpen(false)}
              >
                <Phone className="h-5 w-5 text-green-500" /> Contact
              </a>
              <a
                href="/about"
                className="flex items-center gap-3 text-lg font-semibold text-gray-800 rounded-xl px-4 py-3.5 hover:bg-green-50 hover:text-green-600 transition-all"
                onClick={() => setIsMenuOpen(false)}
              >
                <Users className="h-5 w-5 text-green-500" /> About
              </a>
              <div className="border-t border-gray-200 my-4"></div>
              <a
                href="/user/login"
                className="flex items-center gap-3 text-lg font-semibold text-green-600 rounded-xl px-4 py-3.5 hover:bg-green-100 hover:text-green-700 transition-all"
                onClick={() => setIsMenuOpen(false)}
              >
                Login
              </a>
              <a
                href="/user/register"
                className="flex items-center gap-3 text-lg font-semibold bg-green-600 text-white rounded-xl px-4 py-3.5 hover:bg-green-700 transition-all mt-2"
                onClick={() => setIsMenuOpen(false)}
              >
                Sign Up
              </a>
            </div>
          </nav>
        </>
      )}
    </>
  );
};

export default Header;
