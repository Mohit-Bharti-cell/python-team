// File: src/pages/FinalizeTest.jsx
// Final page for test finalization, dashboard overview, and test publishing

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  CheckCircle, 
  Clock, 
  Copy, 
  Share2,
  BarChart3,
  Loader2
} from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { finalizeTest } from '../api/questions'
import { calculateTotalDuration, formatDuration } from '../utils/calculateDuration'

const FinalizeTest = () => {
  const [questions, setQuestions] = useState([])
  const [testTitle, setTestTitle] = useState('')
  const [testResult, setTestResult] = useState(null)
  const [isFinalized, setIsFinalized] = useState(false)
  const [loading, setLoading] = useState(false)
  const [copySuccess, setCopySuccess] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const savedQuestions = localStorage.getItem('generatedQuestions')
    const savedTestTitle = localStorage.getItem('testTitle')
    
    if (savedQuestions) {
      try {
        const parsed = JSON.parse(savedQuestions)
        
        // Ensure we have an array
        if (Array.isArray(parsed)) {
          console.log('Loaded questions for finalization:', parsed.length)
          setQuestions(parsed)
        } else if (parsed && typeof parsed === 'object' && Array.isArray(parsed.questions)) {
          console.warn('Questions wrapped in object, extracting array')
          setQuestions(parsed.questions)
        } else {
          console.error('Invalid questions format')
          navigate('/')
          return
        }
      } catch (e) {
        console.error('Error parsing questions:', e)
        navigate('/')
        return
      }
    } else {
      navigate('/')
      return
    }

    if (savedTestTitle) {
      setTestTitle(savedTestTitle)
    }

    const finalizedTest = localStorage.getItem('finalizedTest')
    if (finalizedTest) {
      try {
        setTestResult(JSON.parse(finalizedTest))
        setIsFinalized(true)
      } catch (e) {
        console.error('Error parsing finalized test:', e)
        localStorage.removeItem('finalizedTest')
      }
    }
  }, [navigate])

  const handleFinalizeTest = async () => {
    console.log('🔵 ===== FINALIZE BUTTON CLICKED =====')
    console.log('🔵 Questions length:', questions.length)
    console.log('🔵 Questions array:', questions)
    console.log('🔵 Test title:', testTitle)
    console.log('🔵 Is finalized already:', isFinalized)
    console.log('🔵 Loading state:', loading)
    
    if (questions.length === 0) {
      console.error('❌ No questions to finalize')
      alert('No questions to finalize')
      return
    }

    // Final validation before sending
    if (!Array.isArray(questions)) {
      console.error('❌ Questions is not an array:', questions)
      alert('Invalid questions format. Please regenerate your questions.')
      return
    }

    try {
      setLoading(true)
      console.log('🟢 About to call finalizeTest API...')
      console.log('🟢 Calling finalizeTest with:', questions.length, 'questions')
      console.log('🟢 API URL will be: http://localhost:5000/api/v1/finalize-test')
      
      const result = await finalizeTest(questions, testTitle, '')
      
      setTestResult(result)
      setIsFinalized(true)
      localStorage.setItem('finalizedTest', JSON.stringify(result))
      
    } catch (error) {
      console.error('Failed to finalize test:', error)
      alert(`Failed to finalize test: ${error.message}`)
    } finally {
      setLoading(false)
    }
  }

  const handleCopyLink = () => {
    if (testResult?.test_link) {
      navigator.clipboard.writeText(testResult.test_link)
      setCopySuccess(true)
      setTimeout(() => setCopySuccess(false), 2000)
    }
  }

  const handlePublishTest = () => {
    if (testResult?.test_link) {
      window.open(testResult.test_link, '_blank')
    }
  }

  const resetTest = () => {
    localStorage.removeItem('finalizedTest')
    localStorage.removeItem('generatedQuestions')
    localStorage.removeItem('skillSelections')
    localStorage.removeItem('testTitle')
    localStorage.removeItem('testDescription')
    navigate('/')
  }

  const totalDuration = calculateTotalDuration(questions)
  const skillBreakdown = questions.reduce((acc, question) => {
    acc[question.skill] = (acc[question.skill] || 0) + 1
    return acc
  }, {})

  const chartData = Object.entries(skillBreakdown).map(([skill, count]) => ({
    skill: skill.length > 10 ? skill.substring(0, 10) + '...' : skill,
    questions: count,
    fullName: skill
  }))

  const difficultyBreakdown = questions.reduce((acc, question) => {
    acc[question.difficulty] = (acc[question.difficulty] || 0) + 1
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
        <p className="text-gray-600 mb-6">Generate and review questions first before finalizing.</p>
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {isFinalized ? 'Test Dashboard' : 'Finalize Test'}
        </h1>
        <p className="text-gray-600">
          {isFinalized 
            ? 'Your test is ready! Share the link with candidates.'
            : 'Review your test configuration and finalize to generate the test link.'
          }
        </p>
      </div>

      <div className="grid grid-cols-1 2xl:grid-cols-4 gap-8">
        <div className="2xl:col-span-3 space-y-6">
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Test Configuration</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Test Title
                </label>
                <input
                  type="text"
                  value={testTitle}
                  onChange={(e) => setTestTitle(e.target.value)}
                  placeholder="Enter test title..."
                  className="input-field"
                  disabled={isFinalized}
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-xl md:text-2xl font-bold text-blue-600">{questions.length}</div>
                  <div className="text-xs md:text-sm text-gray-600">Questions</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-xl md:text-2xl font-bold text-green-600">{Object.keys(skillBreakdown).length}</div>
                  <div className="text-xs md:text-sm text-gray-600">Skills</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-xl md:text-2xl font-bold text-purple-600">{formatDuration(totalDuration)}</div>
                  <div className="text-xs md:text-sm text-gray-600">Duration</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-xl md:text-2xl font-bold text-orange-600">{Object.keys(typeBreakdown).length}</div>
                  <div className="text-xs md:text-sm text-gray-600">Types</div>
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <BarChart3 className="h-5 w-5 mr-2" />
              Skill Coverage Overview
            </h3>
            <div className="h-64 md:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="skill" 
                    fontSize={12}
                    interval={0}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis fontSize={12} />
                  <Tooltip 
                    formatter={(value, name) => [value, 'Questions']}
                    labelFormatter={(label) => {
                      const item = chartData.find(d => d.skill === label)
                      return item?.fullName || label
                    }}
                  />
                  <Bar dataKey="questions" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="card">
              <h4 className="font-semibold text-gray-900 mb-3">Difficulty Distribution</h4>
              <div className="space-y-2">
                {Object.entries(difficultyBreakdown).map(([difficulty, count]) => (
                  <div key={difficulty} className="flex justify-between items-center">
                    <span className="text-gray-700">{difficulty}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${
                            difficulty === 'Easy' ? 'bg-green-500' :
                            difficulty === 'Medium' ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${(count / questions.length) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium w-6 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <h4 className="font-semibold text-gray-900 mb-3">Question Types</h4>
              <div className="space-y-2">
                {Object.entries(typeBreakdown).map(([type, count]) => (
                  <div key={type} className="flex justify-between items-center">
                    <span className="text-gray-700">{type}</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${(count / questions.length) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium w-6 text-right">{count}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="2xl:col-span-1 space-y-6">
          <div className="card">
            <div className="text-center">
              {isFinalized ? (
                <>
                  <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Test Finalized!</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Your test is ready and available for candidates.
                  </p>
                </>
              ) : (
                <>
                  <Clock className="h-16 w-16 text-orange-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to Finalize</h3>
                  <p className="text-sm text-gray-600 mb-4">
                    Click the button below to finalize your test and generate the candidate link.
                  </p>
                </>
              )}

              {!isFinalized ? (
                <button
                  onClick={handleFinalizeTest}
                  disabled={loading}
                  className="btn-primary w-full flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Finalizing...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      <span>Finalize Test</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="space-y-3">
                  <button
                    onClick={handlePublishTest}
                    className="btn-primary w-full flex items-center justify-center space-x-2"
                  >
                    <Share2 className="h-4 w-4" />
                    <span>Open Test</span>
                  </button>
                  
                  <button
                    onClick={resetTest}
                    className="btn-secondary w-full"
                  >
                    Create New Test
                  </button>
                </div>
              )}
            </div>
          </div>

          {isFinalized && testResult && (
            <div className="card">
              <h3 className="font-semibold text-gray-900 mb-4">Test Details</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Test ID:</span>
                  <span className="font-mono text-gray-900 text-xs truncate ml-2">{testResult.question_set_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Created:</span>
                  <span className="text-gray-900">{new Date().toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Expires:</span>
                  <span className="text-gray-900">
                    {new Date(testResult.expiry_time).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t border-gray-200">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Test Link:
                </label>
                <div className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={testResult.test_link}
                    readOnly
                    className="input-field text-xs flex-1"
                  />
                  <button
                    onClick={handleCopyLink}
                    className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
                      copySuccess 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                    title="Copy link"
                  >
                    {copySuccess ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
                {copySuccess && (
                  <p className="text-xs text-green-600 mt-1">Link copied!</p>
                )}
              </div>
            </div>
          )}

          <div className="card">
            <h3 className="font-semibold text-gray-900 mb-3">Next Steps</h3>
            <div className="space-y-2 text-sm text-gray-600">
              {!isFinalized ? (
                <>
                  <p>• Review your test configuration</p>
                  <p>• Add a test title (optional)</p>
                  <p>• Click "Finalize Test" to generate the candidate link</p>
                </>
              ) : (
                <>
                  <p>• Share the test link with candidates</p>
                  <p>• Test expires in 48 hours</p>
                  <p>• Monitor candidate submissions</p>
                  <p>• Download results when complete</p>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default FinalizeTest