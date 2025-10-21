// ============================================
// FILE: src/pages/GiveTest.jsx
// Section-based test taking flow
// Shows MCQ section first, then Coding section
// Submits ALL sections together at the end
// ============================================

import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { testApi } from '../api/tests';
import McqQuestion from '../components/McqQuestion';
import CodingQuestion from '../components/CodingQuestion';
import Timer from '../components/Timer';

const GiveTest = () => {
  const { questionSetId } = useParams();

  // State management
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [testData, setTestData] = useState(null);
  
  // Section management
  const [sections, setSections] = useState([]);
  const [currentSectionIndex, setCurrentSectionIndex] = useState(0);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [completedSections, setCompletedSections] = useState(new Set());
  
  // Answer storage for all sections
  const [allAnswers, setAllAnswers] = useState({});
  
  // Submission states
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submissionResults, setSubmissionResults] = useState([]);

  // Generate candidate ID once
  // const [candidateId] = useState(() => {
  //   let id = localStorage.getItem('candidate_id');
  //   if (!id) {
  //     id = 'candidate-' + crypto.randomUUID();
  //     localStorage.setItem('candidate_id', id);
  //   }
  //   return id;
  // });
  const [candidateId] = useState(null);

  // Fetch test and organize into sections
  useEffect(() => {
    const fetchTest = async () => {
      try {
        setLoading(true);
        const data = await testApi.startTest(questionSetId);
        setTestData(data);

        // Organize questions into sections by type
        const mcqQuestions = data.questions.filter(q => q.type === 'mcq');
        const codingQuestions = data.questions.filter(q => q.type === 'coding');

        const organizedSections = [];
        
        if (mcqQuestions.length > 0) {
          organizedSections.push({
            name: 'MCQ',
            displayName: 'Multiple Choice Questions',
            questions: mcqQuestions,
            type: 'mcq'
          });
        }

        if (codingQuestions.length > 0) {
          organizedSections.push({
            name: 'Coding',
            displayName: 'Coding Problems',
            questions: codingQuestions,
            type: 'coding'
          });
        }

        setSections(organizedSections);
        setLoading(false);
      } catch (err) {
        setError('Failed to load test. Please check your link and try again.');
        setLoading(false);
      }
    };

    fetchTest();
  }, [questionSetId]);

  const currentSection = sections[currentSectionIndex];
  const currentQuestion = currentSection?.questions[currentQuestionIndex];
  const totalQuestionsInSection = currentSection?.questions.length || 0;

  // Handle answer change for current question
  const handleAnswerChange = (answer) => {
    setAllAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: answer
    }));
  };

  // Move to next question or section
  const handleNext = () => {
    if (currentQuestionIndex < totalQuestionsInSection - 1) {
      // Move to next question in current section
      setCurrentQuestionIndex(prev => prev + 1);
    } else if (currentSectionIndex < sections.length - 1) {
      // Mark current section as completed
      setCompletedSections(prev => new Set([...prev, currentSectionIndex]));
      // Move to next section
      setCurrentSectionIndex(prev => prev + 1);
      setCurrentQuestionIndex(0);
    } else {
      // Last question of last section - submit all
      handleSubmitAllSections();
    }
  };

  // Move to previous question (NOT previous section once moved forward)
  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
    // Do NOT allow going back to previous section
  };

  // Handle time up for current question
  const handleTimeUp = () => {
    handleNext();
  };

  // Submit ALL sections at once
  const handleSubmitAllSections = async () => {
    setSubmitting(true);

    try {
      const results = [];

      // Submit each section separately
      for (const section of sections) {
        // Prepare responses for this section
        const responses = section.questions.map((question) => ({
          question_id: question.id,
          question_type: question.type,
          question_text: question.content.prompt,
          correct_answer: question.content.answer || 'N/A',
          candidate_answer: allAnswers[question.id] || '',
        }));

        const submissionData = {
          question_set_id: questionSetId,
          section_name: section.name,
          candidate_id: candidateId,
          responses: responses,
        };

        console.log(`📤 Submitting ${section.name} section:`, submissionData);
        console.log("Submitting section data:", JSON.stringify(submissionData, null, 2));

        
        const result = await testApi.submitSection(submissionData);
        results.push({
          sectionName: section.name,
          result: result
        });
      }

      setSubmissionResults(results);
      setSubmitted(true);
    } catch (err) {
      setError('Failed to submit test. Please try again.');
      console.error('Test submission error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading test...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error && !submitting) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Test completed - show results
  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center py-8">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-3xl w-full">
          <div className="text-green-500 text-6xl mb-4 text-center">✓</div>
          <h2 className="text-3xl font-bold text-gray-800 mb-4 text-center">
            Test Completed Successfully!
          </h2>
          <p className="text-gray-600 mb-8 text-center">
            All sections have been submitted and evaluated.
          </p>

          {/* Results for each section */}
          <div className="space-y-6">
            {submissionResults.map((sectionResult, sectionIdx) => (
              <div key={sectionIdx} className="border rounded-lg p-6">
                <h3 className="text-xl font-bold text-gray-800 mb-4">
                  {sectionResult.sectionName} Section
                </h3>
                <p className="text-gray-600 mb-4">
                  {sectionResult.result.message}
                </p>

                {sectionResult.result.evaluations && sectionResult.result.evaluations.length > 0 && (
                  <div className="space-y-3">
                    {sectionResult.result.evaluations.map((evaluation, evalIdx) => (
                      <div
                        key={evalIdx}
                        className={`p-4 rounded-lg ${
                          evaluation.is_correct
                            ? 'bg-green-50 border-l-4 border-green-500'
                            : 'bg-red-50 border-l-4 border-red-500'
                        }`}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <span className="font-medium text-gray-700">
                            Question {evalIdx + 1}
                          </span>
                          <span className="text-lg font-bold">
                            Score: {(evaluation.score * 100).toFixed(0)}%
                          </span>
                        </div>
                        {evaluation.feedback && (
                          <p className="text-sm text-gray-600">{evaluation.feedback}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>

          <button
            onClick={() => window.location.href = '/'}
            className="mt-8 w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  // Test taking interface
  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Section Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-1 bg-blue-600 text-white rounded-full text-sm font-bold">
                  Section {currentSectionIndex + 1} of {sections.length}
                </span>
                <span className="text-lg font-bold text-gray-800">
                  {currentSection?.displayName}
                </span>
              </div>
              <p className="text-gray-600">
                Question {currentQuestionIndex + 1} of {totalQuestionsInSection}
              </p>
            </div>
            <Timer
              timeLimit={currentQuestion?.time_limit || 60}
              onTimeUp={handleTimeUp}
              key={`${currentSectionIndex}-${currentQuestion?.id}`}
            />
          </div>

          {/* Section Progress Bar */}
          <div className="mb-2">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>Section Progress</span>
              <span>{currentQuestionIndex + 1} / {totalQuestionsInSection}</span>
            </div>
            <div className="bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${((currentQuestionIndex + 1) / totalQuestionsInSection) * 100}%`,
                }}
              />
            </div>
          </div>

          {/* Overall Progress */}
          <div className="mt-4">
            <div className="flex gap-2">
              {sections.map((section, idx) => (
                <div
                  key={idx}
                  className={`flex-1 h-2 rounded-full ${
                    completedSections.has(idx)
                      ? 'bg-green-500'
                      : idx === currentSectionIndex
                      ? 'bg-blue-600'
                      : 'bg-gray-200'
                  }`}
                  title={section.displayName}
                />
              ))}
            </div>
            <div className="flex justify-between mt-1 text-xs text-gray-500">
              {sections.map((section, idx) => (
                <span 
                  key={idx} 
                  className={`${
                    idx === currentSectionIndex 
                      ? 'font-bold text-blue-600' 
                      : completedSections.has(idx)
                      ? 'text-green-600'
                      : ''
                  }`}
                >
                  {section.name}
                  {completedSections.has(idx) && ' ✓'}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Question Display */}
        {currentQuestion && (
          <div className="mb-6">
            {currentQuestion.type === 'mcq' ? (
              <McqQuestion
                question={currentQuestion}
                answer={allAnswers[currentQuestion.id]}
                onAnswerChange={handleAnswerChange}
              />
            ) : currentQuestion.type === 'coding' ? (
              <CodingQuestion
                question={currentQuestion}
                answer={allAnswers[currentQuestion.id]}
                onAnswerChange={handleAnswerChange}
              />
            ) : (
              <div className="bg-white rounded-lg shadow-md p-6">
                <p className="text-gray-600">Unknown question type</p>
              </div>
            )}
          </div>
        )}

        {/* Navigation */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center">
            <button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>

            <div className="text-sm text-gray-600 text-center">
              {currentQuestionIndex === totalQuestionsInSection - 1 &&
               currentSectionIndex === sections.length - 1 ? (
                <span className="font-medium text-blue-600">
                  Final submission - All sections will be submitted
                </span>
              ) : currentQuestionIndex === totalQuestionsInSection - 1 ? (
                <div>
                  <span className="text-amber-600 font-medium">
                    ⚠️ Moving to next section
                  </span>
                  <br />
                  <span className="text-xs text-gray-500">
                    You cannot go back after proceeding
                  </span>
                </div>
              ) : null}
            </div>

            <button
              onClick={handleNext}
              disabled={submitting}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
            >
              {submitting
                ? 'Submitting...'
                : currentQuestionIndex === totalQuestionsInSection - 1 &&
                  currentSectionIndex === sections.length - 1
                ? 'Submit All'
                : currentQuestionIndex === totalQuestionsInSection - 1
                ? 'Proceed to Next Section'
                : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};


export default GiveTest;