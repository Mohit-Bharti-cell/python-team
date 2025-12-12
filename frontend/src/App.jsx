import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import GenerateQuestions from './pages/GenerateQuestions';
import ReviewQuestions from './pages/ReviewQuestions';
import FinalizeTest from './pages/FinalizeTest';
import Examination from './pages/Examination.jsx';
import TestDetails from './instructions_page/InstructionsPage.jsx';
import CameraCheckWrapper from './instructions_page/CameraCheckWrapper.jsx';
import GiveTest from './pages/GiveTest';
import QuestionCreated from './components/QuestionCreated.jsx';

function App() {
  const location = useLocation();

  // Hide Navbar only on GiveTest page
  const hideNavbar = location.pathname.startsWith('/give-test');

  return (
    <div className="min-h-screen bg-gray-50">
      {!hideNavbar && <Navbar />}

      <main className={!hideNavbar ? "container mx-auto px-4 py-8" : ""}>
        <Routes>

          {/* Candidate Test Route */}
          <Route path="/give-test/:questionSetId" element={<GiveTest />} />

          {/* Camera Check (must contain the questionSetId) */}
          <Route path="/Examination/CameraCheck" element={<CameraCheckWrapper />} />

          {/* Creator/Admin Routes */}
          <Route path="/" element={<GenerateQuestions />} />
          <Route path="/review" element={<ReviewQuestions />} />
          <Route path="/finalize" element={<FinalizeTest />} />
          <Route path="/Examination" element={<Examination />} />
          <Route path="/Examination/Instructions" element={<TestDetails />} />
          <Route path="/Created" element={<QuestionCreated />} />

        </Routes>
      </main>
    </div>
  );
}

export default App;
