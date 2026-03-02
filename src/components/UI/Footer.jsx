export default function Footer() {
    return (
        <footer className="bg-white border-t border-gray-200 mt-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-gray-600 text-sm">
                        © {new Date().getFullYear()} Analytics Dashboard. Powered by Frappe v15.
                    </p>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                        <span>Last updated: {new Date().toLocaleDateString()}</span>
                    </div>
                </div>
            </div>
        </footer>
    );
}