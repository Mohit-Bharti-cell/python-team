// ============================================
// FILE: src/components/CodingQuestion.jsx
// Component for coding questions
// ============================================

import React from 'react';

const CodingQuestion = ({ question, answer, onAnswerChange }) => {
  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
            {question.skill}
          </span>
          <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
            {question.difficulty}
          </span>
          <span className="px-3 py-1 bg-amber-100 text-amber-800 rounded-full text-sm font-medium">
            Coding
          </span>
        </div>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          {question.content.prompt}
        </h2>
      </div>

      {question.content.examples && question.content.examples.length > 0 && (
        <div className="mb-6 bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold text-gray-700 mb-3">Examples:</h3>
          <div className="space-y-2">
            {question.content.examples.map((example, index) => (
              <div key={index} className="text-sm">
                <span className="text-gray-600">Input: </span>
                <code className="bg-white px-2 py-1 rounded text-blue-600">
                  {example.input}
                </code>
                <span className="text-gray-600 ml-4">Output: </span>
                <code className="bg-white px-2 py-1 rounded text-green-600">
                  {example.output}
                </code>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Your Solution:
        </label>
        <textarea
          value={answer || ''}
          onChange={(e) => onAnswerChange(e.target.value)}
          placeholder="Write your code here..."
          className="w-full h-64 p-4 font-mono text-sm border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
          style={{ resize: 'vertical' }}
        />
      </div>
    </div>
  );
};

export default CodingQuestion;