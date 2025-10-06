// File: src/components/QuestionCard.jsx
// Component for displaying questions in card format with type-specific layouts

import { Clock, Star, Minus, Code, Mic, Video, CheckSquare } from 'lucide-react'
import { formatDuration } from '../utils/calculateDuration'

const QuestionCard = ({ question, preview = false, onEdit, onDelete }) => {
  const getTypeIcon = (type) => {
    switch (type) {
      case 'MCQ': return <CheckSquare className="h-4 w-4" />
      case 'Coding': return <Code className="h-4 w-4" />
      case 'Audio': return <Mic className="h-4 w-4" />
      case 'Video': return <Video className="h-4 w-4" />
      default: return <CheckSquare className="h-4 w-4" />
    }
  }

  const getTypeColor = (type) => {
    switch (type) {
      case 'MCQ': return 'bg-blue-100 text-blue-700'
      case 'Coding': return 'bg-green-100 text-green-700'
      case 'Audio': return 'bg-purple-100 text-purple-700'
      case 'Video': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const getDifficultyColor = (difficulty) => {
    switch (difficulty) {
      case 'Easy': return 'bg-green-100 text-green-700'
      case 'Medium': return 'bg-yellow-100 text-yellow-700'
      case 'Hard': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="card hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-3">
          <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(question.type)}`}>
            {getTypeIcon(question.type)}
            <span>{question.type}</span>
          </div>
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(question.difficulty)}`}>
            {question.difficulty}
          </div>
          <div className="text-sm text-gray-600 font-medium">
            {question.skill}
          </div>
        </div>
        
        <div className="flex items-center space-x-4 text-sm text-gray-500">
          <div className="flex items-center space-x-1">
            <Clock className="h-4 w-4" />
            <span>{formatDuration(question.time_limit)}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Star className="h-4 w-4 text-green-500" />
            <span>+{question.positive_marking}</span>
          </div>
          {question.negative_marking > 0 && (
            <div className="flex items-center space-x-1">
              <Minus className="h-4 w-4 text-red-500" />
              <span>-{question.negative_marking}</span>
            </div>
          )}
        </div>
      </div>

      {/* Question Content */}
      <div className="space-y-3">
        <div>
          <h4 className="font-medium text-gray-900 mb-2">Question:</h4>
          <p className="text-gray-700 text-sm leading-relaxed">{question.prompt}</p>
        </div>

        {/* Type-specific content */}
        {question.type === 'MCQ' && question.options && (
          <div>
            <h5 className="font-medium text-gray-900 mb-2 text-sm">Options:</h5>
            <div className="space-y-1">
              {question.options.map((option, index) => (
                <div 
                  key={index} 
                  className={`text-sm p-2 rounded ${
                    question.correct_answer === index 
                      ? 'bg-green-50 text-green-700 border border-green-200' 
                      : 'bg-gray-50 text-gray-700'
                  }`}
                >
                  <span className="font-medium">{String.fromCharCode(65 + index)}.</span> {option}
                  {question.correct_answer === index && <span className="ml-2 text-xs font-medium">(Correct)</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {question.type === 'Coding' && question.expected_output && (
          <div>
            <h5 className="font-medium text-gray-900 mb-2 text-sm">Expected Output:</h5>
            <div className="bg-gray-50 p-3 rounded text-sm text-gray-700 font-mono">
              {question.expected_output}
            </div>
          </div>
        )}

        {(question.type === 'Audio' || question.type === 'Video') && question.rubric && (
          <div>
            <h5 className="font-medium text-gray-900 mb-2 text-sm">Evaluation Rubric:</h5>
            <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded">{question.rubric}</p>
          </div>
        )}
      </div>

      {/* Action Buttons (only show in non-preview mode) */}
      {!preview && (onEdit || onDelete) && (
        <div className="mt-4 pt-4 border-t border-gray-200 flex justify-end space-x-2">
          {onEdit && (
            <button
              onClick={() => onEdit(question)}
              className="btn-secondary text-sm px-3 py-2"
            >
              Edit
            </button>
          )}
          {onDelete && (
            <button
              onClick={() => onDelete(question.id)}
              className="btn-danger text-sm px-3 py-2"
            >
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default QuestionCard