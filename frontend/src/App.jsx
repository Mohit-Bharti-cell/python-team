// ============================================
// FILE: src/App.jsx
// Main App component with routing layout and navigation
// Updated to include GiveTest route without Navbar
// ============================================

import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import GenerateQuestions from './pages/GenerateQuestions'
import ReviewQuestions from './pages/ReviewQuestions'
import FinalizeTest from './pages/FinalizeTest'
import GiveTest from './pages/GiveTest'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        {/* Test taking route - NO NAVBAR (clean interface for candidates) */}
        <Route path="/give-test/:questionSetId" element={<GiveTest />} />
        
        {/* Admin routes - WITH NAVBAR (for test creators/admins) */}
        <Route
          path="/*"
          element={
            <>
              <Navbar />
              <main className="container mx-auto px-4 py-8">
                <Routes>
                  <Route path="/" element={<GenerateQuestions />} />
                  <Route path="/review" element={<ReviewQuestions />} />
                  <Route path="/finalize" element={<FinalizeTest />} />
                </Routes>
              </main>
            </>
          }
        />
      </Routes>
    </div>
  )
}

export default App