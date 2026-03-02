import { Link } from 'react-router-dom';
import { Home, TrendingUp } from 'lucide-react';

export default function Header() {
    return (
        <header className="bg-white border-b border-gray-200 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                        <TrendingUp className="w-8 h-8 text-blue-600" />
                        <div className="flex flex-col">
                            <span className="text-xl font-bold text-gray-900">Analytics Dashboard</span>
                        </div>
                    </Link>

                    <nav className="flex items-center gap-6">
                        <Link
                            to={`${import.meta.env.VITE_FRAPPE_URL}`}
                            target='_blank'
                            className="flex items-center gap-2 text-gray-700 hover:text-blue-600 font-medium transition-colors"
                        >
                            <Home size={18} />
                            <span>Home</span>
                        </Link>
                    </nav>
                </div>
            </div>
        </header>
    );
}