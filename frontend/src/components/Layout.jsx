import { Link, useLocation } from 'react-router-dom';

export default function Layout({ children }) {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center hover:opacity-80 transition-opacity">
              <h1 className="text-2xl font-bold text-primary-600">
                Mautic Dashboard
              </h1>
            </Link>

            {/* Show current page indicator */}
            {location.pathname.startsWith('/dashboard/') && (
              <div className="flex items-center text-sm text-gray-600">
                <Link to="/" className="hover:text-primary-600 transition-colors">
                  Clients
                </Link>
                <span className="mx-2">/</span>
                <span className="text-gray-900 font-medium">Dashboard</span>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
