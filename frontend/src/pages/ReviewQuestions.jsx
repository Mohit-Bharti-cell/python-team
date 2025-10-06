// File: src/pages/ReviewQuestions.jsx
// Page for reviewing and editing generated questions before finalization

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Clock, Plus, ArrowRight, BarChart3 } from 'lucide-react'
import QuestionCard from '../components/QuestionCard'
import QuestionEditor from '../components/QuestionEditor'
import { calculateTotalDuration, formatDuration } from '../utils/calculateDuration'

const ReviewQuestions = () => {
  const [questions, setQuestions] = useState([])
  const [editingQuestion, setEditingQuestion] = useState(null)
  const [isEditorOpen, setIsEditorOpen] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const savedQuestions = localStorage.getItem('generatedQuestions')
    
    if (savedQuestions) {
      try {
        const parsed = JSON.parse(savedQuestions)
        
        // CRITICAL: Ensure we have an array, not an object with questions property
        if (Array.isArray(parsed)) {
          console.log('Loaded questions array:', parsed.length, 'questions')
          setQuestions(parsed)
        } else if (parsed && typeof parsed === 'object' && Array.isArray(parsed.questions)) {
          console.warn('Questions was wrapped in object, extracting array')
          setQuestions(parsed.questions)
          // Fix the storage
          localStorage.setItem('generatedQuestions', JSON.stringify(parsed.questions))
        } else {
          console.error('Invalid questions format in localStorage')
          navigate('/')
        }
      } catch (e) {
        console.error('Error parsing questions:', e)
        navigate('/')
      }
    } else {
      navigate('/')
    }
  }, [navigate])

  const handleEditQuestion = (question) => {
    setEditingQuestion(question)
    setIsEditorOpen(true)
  }

  const handleSaveQuestion = (updatedQuestion) => {
    const updatedQuestions = questions.map(q => 
      q.id === updatedQuestion.id ? updatedQuestion : q
    )
    setQuestions(updatedQuestions)
    // Save as array only
    localStorage.setItem('generatedQuestions', JSON.stringify(updatedQuestions))
  }

  const handleDeleteQuestion = (questionId) => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      const updatedQuestions = questions.filter(q => q.id !== questionId)
      setQuestions(updatedQuestions)
      localStorage.setItem('generatedQuestions', JSON.stringify(updatedQuestions))
    }
  }

  const handleAddQuestion = () => {
    const newQuestion = {
      id: Date.now(),
      type: 'MCQ',
      skill: 'General',
      difficulty: 'Medium',
      content: 'New question',
      prompt: 'Enter your question here...',
      options: ['Option A', 'Option B', 'Option C', 'Option D'],
      correct_answer: 0,
      positive_marking: 4,
      negative_marking: 1,
      time_limit: 60
    }
    setEditingQuestion(newQuestion)
    setIsEditorOpen(true)
  }

  const handleSaveNewQuestion = (newQuestion) => {
    const updatedQuestions = [...questions, newQuestion]
    setQuestions(updatedQuestions)
    localStorage.setItem('generatedQuestions', JSON.stringify(updatedQuestions))
  }

  const proceedToFinalize = () => {
    if (questions.length > 0) {
      navigate('/finalize')
    }
  }

  const totalDuration = calculateTotalDuration(questions)
  const skillBreakdown = questions.reduce((acc, question) => {
    acc[question.skill] = (acc[question.skill] || 0) + 1
    return acc
  }, {})

  const typeBreakdown = questions.reduce((acc, question) => {
    acc[question.type] = (acc[question.type] || 0) + 1
    return acc
  }, {})

  if (questions.length === 0) {
    return (
      <div className="text-center py-12">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">No Questions Found</h2>
        <p className="text-gray-600 mb-6">Generate some questions first to review them.</p>
        <button
          onClick={() => navigate('/')}
          className="btn-primary"
        >
          Go to Question Generation
        </button>
      </div>
    )
  }

  return (
    <div className="w-full max-w-none px-4">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Review Questions</h1>
        <p className="text-gray-600">Review, edit, and finalize your test questions before publishing.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
        <div className="card text-center p-4">
          <div className="text-xl md:text-2xl font-bold text-blue-600">{questions.length}</div>
          <div className="text-xs md:text-sm text-gray-600">Total Questions</div>
        </div>
        <div className="card text-center p-4">
          <div className="text-xl md:text-2xl font-bold text-green-600">{Object.keys(skillBreakdown).length}</div>
          <div className="text-xs md:text-sm text-gray-600">Skills Covered</div>
        </div>
        <div className="card text-center p-4">
          <div className="text-xl md:text-2xl font-bold text-purple-600">{formatDuration(totalDuration)}</div>
          <div className="text-xs md:text-sm text-gray-600">Total Duration</div>
        </div>
        <div className="card text-center p-4">
          <div className="text-xl md:text-2xl font-bold text-orange-600">{Object.keys(typeBreakdown).length}</div>
          <div className="text-xs md:text-sm text-gray-600">Question Types</div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Questions by Skill
          </h3>
          <div className="space-y-3">
            {Object.entries(skillBreakdown).map(([skill, count]) => (
              <div key={skill}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700 truncate pr-2">{skill}</span>
                  <span className="font-medium whitespace-nowrap">{count} questions</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full" 
                    style={{ width: `${(count / questions.length) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Questions by Type
          </h3>
          <div className="space-y-3">
            {Object.entries(typeBreakdown).map(([type, count]) => (
              <div key={type}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-700">{type}</span>
                  <span className="font-medium">{count} questions</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ width: `${(count / questions.length) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
        <button
          onClick={handleAddQuestion}
          className="btn-secondary flex items-center space-x-2 w-full lg:w-auto justify-center lg:justify-start"
        >
          <Plus className="h-4 w-4" />
          <span>Add Question</span>
        </button>

        <div className="flex flex-col lg:flex-row items-start lg:items-center space-y-2 lg:space-y-0 lg:space-x-4 w-full lg:w-auto">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <Clock className="h-4 w-4" />
            <span>Total Duration: <strong>{formatDuration(totalDuration)}</strong></span>
          </div>
          
          <button
            onClick={proceedToFinalize}
            className="btn-primary flex items-center justify-center space-x-2 w-full lg:w-auto"
            disabled={questions.length === 0}
          >
            <span>Finalize Test</span>
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {questions.map((question, index) => (
          <div key={question.id} className="relative">
            <div className="absolute -left-4 top-4 bg-gray-100 text-gray-700 rounded-full h-8 w-8 flex items-center justify-center text-sm font-medium z-10">
              {index + 1}
            </div>
            <div className="ml-0">
              <QuestionCard
                question={question}
                onEdit={handleEditQuestion}
                onDelete={handleDeleteQuestion}
              />
            </div>
          </div>
        ))}
      </div>

      <QuestionEditor
        question={editingQuestion}
        isOpen={isEditorOpen}
        onClose={() => {
          setIsEditorOpen(false)
          setEditingQuestion(null)
        }}
        onSave={editingQuestion?.id && questions.some(q => q.id === editingQuestion.id) 
          ? handleSaveQuestion 
          : handleSaveNewQuestion
        }
      />
    </div>
  )
}

export default ReviewQuestions