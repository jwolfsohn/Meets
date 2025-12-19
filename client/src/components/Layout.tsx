import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Home, User, Heart, Calendar, LogOut } from "lucide-react";

const Layout = () => {
  const { logout } = useAuth();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;
  const title =
    location.pathname === "/discovery"
      ? "Discover"
      : location.pathname === "/matches"
      ? "Matches"
      : location.pathname === "/schedule"
      ? "Schedule"
      : location.pathname === "/profile-setup"
      ? "Profile"
      : "Meets";

  return (
    <div className="min-h-screen bg-[#0b0b0f] flex items-center justify-center p-0 sm:p-4">
      <div className="bg-[#fafafa] w-full max-w-md h-[100vh] sm:h-[820px] sm:rounded-[3rem] shadow-2xl overflow-hidden relative flex flex-col sm:border-8 sm:border-[#151522]">
        {/* Header */}
        <header className="bg-white/85 backdrop-blur-md p-4 sticky top-0 z-20 border-b border-gray-100 flex justify-between items-center">
          <div>
            <div className="text-[11px] font-black tracking-widest uppercase text-gray-400">
              Meets
            </div>
            <div className="text-xl font-black text-gray-900">{title}</div>
          </div>
          <button
            onClick={logout}
            className="text-gray-400 hover:text-gray-700 transition"
            aria-label="Log out"
          >
            <LogOut size={18} />
          </button>
        </header>

        {/* content */}
        <main className="flex-1 overflow-y-auto p-4 pb-24 scrollbar-hide">
          <Outlet />
        </main>

        {/* Bottom Nav */}
        <nav className="absolute bottom-0 w-full bg-white border-t border-gray-100 flex justify-around p-4 pb-6 z-20">
          <Link
            to="/discovery"
            className={`flex flex-col items-center transition ${
              isActive("/discovery") ? "text-gray-900" : "text-gray-400"
            }`}
          >
            <Home size={26} strokeWidth={isActive("/discovery") ? 2.5 : 2} />
            <div
              className={`mt-1 h-1 w-6 rounded-full transition ${
                isActive("/discovery") ? "bg-rose-500" : "bg-transparent"
              }`}
            />
          </Link>
          <Link
            to="/matches"
            className={`flex flex-col items-center transition ${
              isActive("/matches") ? "text-gray-900" : "text-gray-400"
            }`}
          >
            <Heart size={26} strokeWidth={isActive("/matches") ? 2.5 : 2} />
            <div
              className={`mt-1 h-1 w-6 rounded-full transition ${
                isActive("/matches") ? "bg-rose-500" : "bg-transparent"
              }`}
            />
          </Link>
          <Link
            to="/schedule"
            className={`flex flex-col items-center transition ${
              isActive("/schedule") ? "text-gray-900" : "text-gray-400"
            }`}
          >
            <Calendar size={26} strokeWidth={isActive("/schedule") ? 2.5 : 2} />
            <div
              className={`mt-1 h-1 w-6 rounded-full transition ${
                isActive("/schedule") ? "bg-rose-500" : "bg-transparent"
              }`}
            />
          </Link>
          <Link
            to="/profile-setup"
            className={`flex flex-col items-center transition ${
              isActive("/profile-setup") ? "text-gray-900" : "text-gray-400"
            }`}
          >
            <User
              size={26}
              strokeWidth={isActive("/profile-setup") ? 2.5 : 2}
            />
            <div
              className={`mt-1 h-1 w-6 rounded-full transition ${
                isActive("/profile-setup") ? "bg-rose-500" : "bg-transparent"
              }`}
            />
          </Link>
        </nav>
      </div>
    </div>
  );
};

export default Layout;
