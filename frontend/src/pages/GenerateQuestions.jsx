// File: src/pages/GenerateQuestions.jsx
// Main page for generating questions with skill selection and configuration

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, Sparkles, ArrowRight } from 'lucide-react'
import SkillSelector from '../components/SkillSelector'
import QuestionCard from '../components/QuestionCard'
import { fetchSkills } from '../api/skills'
import { generateQuestions } from '../api/questions'

const GenerateQuestions = () => {
  const [skills, setSkills] = useState([])
  const [skillSelections, setSkillSelections] = useState([])
  const [questions, setQuestions] = useState([])
  const [loading, setLoading] = useState(false)
  const [skillsLoading, setSkillsLoading] = useState(true)
  const [testTitle, setTestTitle] = useState('')
  const [testDescription, setTestDescription] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    loadSkills()
  }, [])

  const loadSkills = async () => {
    try {
      setSkillsLoading(true)
      const skillsData = await fetchSkills()
      setSkills(skillsData)
    } catch (error) {
      console.error('Failed to load skills:', error)
      alert('Failed to load skills. Please check if the backend is running.')
    } finally {
      setSkillsLoading(false)
    }
  }

  const handleGenerateQuestions = async () => {
    if (skillSelections.length === 0) {
      alert('Please select at least one skill')
      return
    }

    const hasQuestions = skillSelections.some(sel => 
      sel.mcq > 0 || sel.coding > 0 || sel.audio > 0 || sel.video > 0
    )

    if (!hasQuestions) {
      alert('Please specify at least one question for any skill')
      return
    }

    try {
      setLoading(true)
      const generatedQuestions = await generateQuestions(skillSelections, testTitle, testDescription)
      setQuestions(generatedQuestions)
      
      // Store questions in localStorage for other pages to access
      localStorage.setItem('generatedQuestions', JSON.stringify(generatedQuestions))
      localStorage.setItem('skillSelections', JSON.stringify(skillSelections))
      localStorage.setItem('testTitle', testTitle)
      localStorage.setItem('testDescription', testDescription)
    } catch (error) {
      console.error('Failed to generate questions:', error)
      alert('Failed to generate questions. Please check if the backend is running and try again.')
    } finally {
      setLoading(false)
    }
  }

  const proceedToReview = () => {
    if (questions.length > 0) {
      navigate('/review')
    }
  }

  const totalQuestions = skillSelections.reduce((sum, sel) => 
    sum + sel.mcq + sel.coding + sel.audio + sel.video, 0
  )

  if (skillsLoading) {
    return (
      <div className="flex justify-center items-center min-h-64">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        <span className="ml-2 text-gray-600">Loading skills...</span>
      </div>
    )
  }

  return (
    <div className="w-full max-w-none px-4">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Configure Question Generation</h1>
        <p className="text-gray-600">Select the number of questions to generate for each skill and difficulty level.</p>
      </div>

      {/* Test Configuration */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-8">
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Test Information</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Test Title
              </label>
              <input
                type="text"
                value={testTitle}
                onChange={(e) => setTestTitle(e.target.value)}
                placeholder="e.g., Frontend Developer - JS & React"
                className="input-field"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Test Description
              </label>
              <textarea
                value={testDescription}
                onChange={(e) => setTestDescription(e.target.value)}
                placeholder="Brief description of the test..."
                className="input-field h-20 resize-none"
              />
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{skillSelections.length}</div>
              <div className="text-sm text-gray-600">Skills Selected</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{totalQuestions}</div>
              <div className="text-sm text-gray-600">Total Questions</div>
            </div>
          </div>
        </div>
      </div>

      {/* Skill Selection */}
      <SkillSelector 
        skills={skills}
        onSelectionChange={setSkillSelections}
      />

      {/* Generate Button */}
      {skillSelections.length > 0 && (
        <div className="mt-8 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
          <div className="text-sm text-gray-600">
            <span className="font-medium">{totalQuestions}</span> questions will be generated across{' '}
            <span className="font-medium">{skillSelections.length}</span> skills
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <button
              onClick={handleGenerateQuestions}
              disabled={loading || skillSelections.length === 0}
              className="btn-primary flex items-center justify-center space-x-2 px-6 py-3 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Generate Questions</span>
                </>
              )}
            </button>

            {questions.length > 0 && (
              <button
                onClick={proceedToReview}
                className="btn-secondary flex items-center justify-center space-x-2 px-6 py-3 w-full sm:w-auto"
              >
                <span>Review Questions</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Generated Questions Preview */}
      {questions.length > 0 && (
        <div className="mt-8">
          <div className="card">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
              <h2 className="text-xl font-semibold text-gray-900">Generated Questions Preview</h2>
              <div className="text-sm text-gray-600">
                <span className="font-medium">{questions.length}</span> questions generated
              </div>
            </div>
            
            <div className="grid gap-4 max-h-96 overflow-y-auto">
              {questions.slice(0, 6).map((question) => (
                <QuestionCard key={question.id} question={question} preview={true} />
              ))}
              
              {questions.length > 6 && (
                <div className="text-center py-4 text-gray-500 text-sm">
                  ... and {questions.length - 6} more questions
                </div>
              )}
            </div>
            
            <div className="mt-6 pt-4 border-t border-gray-200 flex justify-end">
              <button
                onClick={proceedToReview}
                className="btn-primary flex items-center space-x-2 px-6 py-3"
              >
                <span>Review & Edit All Questions</span>
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default GenerateQuestions
      
     
