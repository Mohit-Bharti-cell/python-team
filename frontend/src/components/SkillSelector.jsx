// File: src/components/SkillSelector.jsx
// Component for selecting skills and configuring question parameters

import { useState } from 'react'
import { ChevronDown, X } from 'lucide-react'

const SkillSelector = ({ skills, onSelectionChange }) => {
  const [selections, setSelections] = useState([])

  const addSkill = (skill) => {
    const newSelection = {
      id: Date.now(),
      skill,
      difficulty: 'Medium',
      mcq: 2,
      coding: 1,
      audio: 0,
      video: 0
    }
    const updated = [...selections, newSelection]
    setSelections(updated)
    onSelectionChange(updated)
  }

  const updateSelection = (id, field, value) => {
    const updated = selections.map(selection =>
      selection.id === id ? { ...selection, [field]: value } : selection
    )
    setSelections(updated)
    onSelectionChange(updated)
  }

  const removeSelection = (id) => {
    const updated = selections.filter(selection => selection.id !== id)
    setSelections(updated)
    onSelectionChange(updated)
  }

  const availableSkills = skills.filter(skill => 
    !selections.some(selection => selection.skill.id === skill.id)
  )

  const totalQuestions = selections.reduce((sum, sel) => 
    sum + sel.mcq + sel.coding + sel.audio + sel.video, 0
  )

  return (
    <div className="space-y-6 w-full">
      {/* Add Skill Dropdown */}
      {availableSkills.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Skills</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
            {availableSkills.map(skill => (
              <button
                key={skill.id}
                onClick={() => addSkill(skill)}
                className="px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium text-center"
              >
                {skill.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Selected Skills Configuration */}
      {selections.length > 0 && (
        <div className="card">
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-4 gap-4">
            <h3 className="text-lg font-semibold text-gray-900">Configure Question Generation</h3>
            <div className="text-sm text-gray-600">
              Total Questions: <span className="font-medium">{totalQuestions}</span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-full">
              <table className="w-full table-auto">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-2 font-semibold text-gray-700 min-w-[120px]">Skill</th>
                    <th className="text-left py-3 px-2 font-semibold text-gray-700 min-w-[100px]">Difficulty</th>
                    <th className="text-center py-3 px-2 font-semibold text-gray-700 min-w-[60px]">MCQ</th>
                    <th className="text-center py-3 px-2 font-semibold text-gray-700 min-w-[70px]">Coding</th>
                    <th className="text-center py-3 px-2 font-semibold text-gray-700 min-w-[60px]">Video</th>
                    <th className="text-center py-3 px-2 font-semibold text-gray-700 min-w-[60px]">Audio</th>
                    <th className="text-center py-3 px-2 font-semibold text-gray-700 min-w-[70px]">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {selections.map(selection => (
                    <tr key={selection.id} className="border-b border-gray-100">
                      <td className="py-4 px-2">
                        <div className="font-medium text-gray-900">{selection.skill.name}</div>
                      </td>
                      <td className="py-4 px-2">
                        <select
                          value={selection.difficulty}
                          onChange={(e) => updateSelection(selection.id, 'difficulty', e.target.value)}
                          className="select-field text-sm w-full min-w-[90px]"
                        >
                          <option value="Easy">Easy</option>
                          <option value="Medium">Medium</option>
                          <option value="Hard">Hard</option>
                        </select>
                      </td>
                      <td className="py-4 px-2">
                        <input
                          type="number"
                          min="0"
                          max="10"
                          value={selection.mcq}
                          onChange={(e) => updateSelection(selection.id, 'mcq', parseInt(e.target.value) || 0)}
                          className="input-field text-center text-sm w-full max-w-[60px] mx-auto"
                        />
                      </td>
                      <td className="py-4 px-2">
                        <input
                          type="number"
                          min="0"
                          max="10"
                          value={selection.coding}
                          onChange={(e) => updateSelection(selection.id, 'coding', parseInt(e.target.value) || 0)}
                          className="input-field text-center text-sm w-full max-w-[60px] mx-auto"
                        />
                      </td>
                      <td className="py-4 px-2">
                        <input
                          type="number"
                          min="0"
                          max="10"
                          value={selection.video}
                          onChange={(e) => updateSelection(selection.id, 'video', parseInt(e.target.value) || 0)}
                          className="input-field text-center text-sm w-full max-w-[60px] mx-auto"
                        />
                      </td>
                      <td className="py-4 px-2">
                        <input
                          type="number"
                          min="0"
                          max="10"
                          value={selection.audio}
                          onChange={(e) => updateSelection(selection.id, 'audio', parseInt(e.target.value) || 0)}
                          className="input-field text-center text-sm w-full max-w-[60px] mx-auto"
                        />
                      </td>
                      <td className="py-4 px-2 text-center">
                        <button
                          onClick={() => removeSelection(selection.id)}
                          className="text-red-500 hover:text-red-700 p-1"
                          title="Remove skill"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile-friendly cards for small screens */}
          <div className="block lg:hidden mt-4">
            {selections.map(selection => (
              <div key={selection.id} className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-medium text-gray-900">{selection.skill.name}</h4>
                  <button
                    onClick={() => removeSelection(selection.id)}
                    className="text-red-500 hover:text-red-700 p-1"
                    title="Remove skill"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Difficulty</label>
                    <select
                      value={selection.difficulty}
                      onChange={(e) => updateSelection(selection.id, 'difficulty', e.target.value)}
                      className="select-field text-sm"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-4 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">MCQ</label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={selection.mcq}
                      onChange={(e) => updateSelection(selection.id, 'mcq', parseInt(e.target.value) || 0)}
                      className="input-field text-center text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Coding</label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={selection.coding}
                      onChange={(e) => updateSelection(selection.id, 'coding', parseInt(e.target.value) || 0)}
                      className="input-field text-center text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Video</label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={selection.video}
                      onChange={(e) => updateSelection(selection.id, 'video', parseInt(e.target.value) || 0)}
                      className="input-field text-center text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Audio</label>
                    <input
                      type="number"
                      min="0"
                      max="10"
                      value={selection.audio}
                      onChange={(e) => updateSelection(selection.id, 'audio', parseInt(e.target.value) || 0)}
                      className="input-field text-center text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default SkillSelector