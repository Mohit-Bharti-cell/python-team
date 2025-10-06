// File: src/App.jsx
// Main App component with routing layout and navigation

import { Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import GenerateQuestions from './pages/GenerateQuestions'
import ReviewQuestions from './pages/ReviewQuestions'
import FinalizeTest from './pages/FinalizeTest'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<GenerateQuestions />} />
          <Route path="/review" element={<ReviewQuestions />} />
          <Route path="/finalize" element={<FinalizeTest />} />
        </Routes>
      </main>
    </div>
  )
}

export default App  