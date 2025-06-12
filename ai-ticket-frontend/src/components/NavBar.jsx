import { Link, useNavigate } from "react-router-dom";

export default function Navbar() {
  const token = localStorage.getItem("token");
  let user = localStorage.getItem("user");
  if (user) {
    user = JSON.parse(user);
  }
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link 
            to="/" 
            className="flex items-center space-x-2"
          >
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="text-xl font-bold text-gray-900">
              TicketMate
            </span>
          </Link>

          {/* Navigation */}
          <div className="flex items-center space-x-4">
            {!token ? (
              <>
                <Link 
                  to="/signup" 
                  className="px-4 py-2 text-gray-700 hover:text-blue-600 font-medium"
                >
                  Sign Up
                </Link>
                <Link 
                  to="/login" 
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 font-medium"
                >
                  Login
                </Link>
              </>
            ) : (
              <>
                <div className="flex items-center space-x-3">
                  <span className="text-sm font-medium text-gray-900">
                    Hi, {user?.email}
                  </span>
                  
                  {user && user?.role === "admin" && (
                    <Link 
                      to="/admin" 
                      className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-md text-sm font-medium hover:bg-yellow-200"
                    >
                      Admin
                    </Link>
                  )}
                  
                  <button 
                    onClick={logout} 
                    className="px-3 py-1 text-gray-700 hover:text-red-600 font-medium text-sm"
                  >
                    Logout
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}