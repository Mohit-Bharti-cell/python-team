// ============================================
// FILE: src/components/McqQuestion.jsx
// Component for MCQ questions
// ============================================

import React from 'react';

const McqQuestion = ({ question, answer, onAnswerChange }) => {
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
          <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
            MCQ
          </span>
        </div>
        <h2 className="text-xl font-semibold text-gray-800 mb-4">
          {question.content.prompt}
        </h2>
      </div>

      <div className="space-y-3">
        {question.content.options.map((option, index) => (
          <label
            key={index}
            className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-all ${
              answer === option
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
            }`}
          >
            <input
              type="radio"
              name="mcq-option"
              value={option}
              checked={answer === option}
              onChange={(e) => onAnswerChange(e.target.value)}
              className="w-5 h-5 text-blue-600 focus:ring-2 focus:ring-blue-500"
            />
            <span className="ml-3 text-gray-700 font-medium">{option}</span>
          </label>
        ))}
      </div>
    </div>
  );
};

export default McqQuestion;
