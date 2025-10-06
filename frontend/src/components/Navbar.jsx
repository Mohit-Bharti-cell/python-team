// File: src/components/Navbar.jsx
// Navigation bar component with routing links

import { Link, useLocation } from 'react-router-dom'
import { FileText, Edit, CheckSquare } from 'lucide-react'

const Navbar = () => {
  const location = useLocation()

  const isActive = (path) => location.pathname === path

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2">
            <FileText className="h-8 w-8 text-orange-500" />
            <h1 className="text-xl font-bold text-gray-900">HR Test Management</h1>
          </div>
          
          <div className="flex space-x-8">
            <Link
              to="/"
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                isActive('/') 
                  ? 'bg-orange-100 text-orange-700' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <FileText className="h-4 w-4" />
              <span>Generate</span>
            </Link>
            
            <Link
              to="/review"
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                isActive('/review') 
                  ? 'bg-orange-100 text-orange-700' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Edit className="h-4 w-4" />
              <span>Review</span>
            </Link>
            
            <Link
              to="/finalize"
              className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                isActive('/finalize') 
                  ? 'bg-orange-100 text-orange-700' 
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <CheckSquare className="h-4 w-4" />
              <span>Finalize</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navbar