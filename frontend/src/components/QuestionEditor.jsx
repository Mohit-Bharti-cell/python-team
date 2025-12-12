// File: src/components/QuestionEditor.jsx
// Modal component for editing individual questions with type-specific forms

import { useState, useEffect } from 'react'
import { X, Plus, Trash2 } from 'lucide-react'

const QuestionEditor = ({ question, isOpen, onClose, onSave }) => {
  const [editedQuestion, setEditedQuestion] = useState(null)

  useEffect(() => {
    if (question) {
      setEditedQuestion({ ...question })
    }
  }, [question])

  const handleSave = () => {
    if (editedQuestion) {
      onSave(editedQuestion)
      onClose()
    }
  }

  const updateField = (field, value) => {
    setEditedQuestion(prev => ({ ...prev, [field]: value }))
  }

  const updateOption = (index, value) => {
    const newOptions = [...(editedQuestion.options || [])]
    newOptions[index] = value
    updateField('options', newOptions)
  }

  const addOption = () => {
    const newOptions = [...(editedQuestion.options || []), '']
    updateField('options', newOptions)
  }

  const removeOption = (index) => {
    const newOptions = editedQuestion.options.filter((_, i) => i !== index)
    updateField('options', newOptions)
    // Adjust correct answer if needed
    if (editedQuestion.correct_answer >= newOptions.length) {
      updateField('correct_answer', Math.max(0, newOptions.length - 1))
    }
  }

  if (!isOpen || !editedQuestion) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-semibold text-gray-900">Edit Question</h2>
            <div className="flex space-x-2">
              <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm font-medium">
                {editedQuestion.type}
              </span>
              <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm font-medium">
                {editedQuestion.skill}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Basic Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Difficulty
              </label>
              <select
                value={editedQuestion.difficulty}
                onChange={(e) => updateField('difficulty', e.target.value)}
                className="select-field"
              >
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time Limit (seconds)
              </label>
              <input
                type="number"
                value={editedQuestion.time_limit}
                onChange={(e) => updateField('time_limit', parseInt(e.target.value) || 0)}
                className="input-field"
                min="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Positive Marking
              </label>
              <input
                type="number"
                value={editedQuestion.positive_marking}
                onChange={(e) => updateField('positive_marking', parseInt(e.target.value) || 0)}
                className="input-field"
                min="0"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Negative Marking
              </label>
              <input
                type="number"
                value={editedQuestion.negative_marking}
                onChange={(e) => updateField('negative_marking', parseInt(e.target.value) || 0)}
                className="input-field"
                min="0"
              />
            </div>
          </div>

          {/* Question Prompt */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Question Prompt
            </label>
            <textarea
              value={editedQuestion.prompt}
              onChange={(e) => updateField('prompt', e.target.value)}
              className="input-field h-32 resize-none"
              placeholder="Enter the question prompt..."
            />
          </div>

          {/* Type-specific fields */}
          {editedQuestion.type === 'MCQ' && (
            <div>
              <div className="flex justify-between items-center mb-3">
                <label className="block text-sm font-medium text-gray-700">
                  Answer Options
                </label>
                <button
                  onClick={addOption}
                  className="btn-secondary text-sm px-3 py-1 flex items-center space-x-1"
                >
                  <Plus className="h-3 w-3" />
                  <span>Add Option</span>
                </button>
              </div>
              
              <div className="space-y-2">
                {(editedQuestion.options || []).map((option, index) => (
                  <div key={index} className="flex items-center space-x-2">
                    <input
                      type="radio"
                      name="correct_answer"
                      checked={editedQuestion.correct_answer === index}
                      onChange={() => updateField('correct_answer', index)}
                      className="text-orange-500"
                    />
                    <span className="text-sm font-medium text-gray-700 w-6">
                      {String.fromCharCode(65 + index)}.
                    </span>
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => updateOption(index, e.target.value)}
                      className="input-field flex-1"
                      placeholder={`Option ${String.fromCharCode(65 + index)}`}
                    />
                    {editedQuestion.options.length > 2 && (
                      <button
                        onClick={() => removeOption(index)}
                        className="text-red-500 hover:text-red-700 p-1"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {editedQuestion.type === 'Coding' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Expected Output / Solution Approach
              </label>
              <textarea
                value={editedQuestion.expected_output || ''}
                onChange={(e) => updateField('expected_output', e.target.value)}
                className="input-field h-24 resize-none font-mono text-sm"
                placeholder="Describe the expected solution approach or output..."
              />
            </div>
          )}

          {(editedQuestion.type === 'Audio' || editedQuestion.type === 'Video') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Evaluation Rubric
              </label>
              <textarea
                value={editedQuestion.rubric || ''}
                onChange={(e) => updateField('rubric', e.target.value)}
                className="input-field h-24 resize-none"
                placeholder="Describe how this question should be evaluated..."
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="btn-secondary px-4 py-2"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="btn-primary px-4 py-2"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}

export default QuestionEditor