import { useState } from 'react';
import { Info, Edit, Copy, Trash2, Clock, RefreshCcw, Check, X } from 'lucide-react';

export default function QuestionMaker({ questions, onUpdate, onNext, onBack, loading }) {
    const [editingQuestion, setEditingQuestion] = useState(null);
    const [editedData, setEditedData] = useState(null);

    // Transform API questions to display format
    const displayQuestions = questions.map((q, idx) => {
        const content = q.content || {};
        
        if (q.type === 'mcq') {
            return {
                id: idx + 1,
                question_id: q.question_id,
                text: content.prompt || content.question || '',
                options: content.options || [],
                correctAnswer: content.answer || '',
                explanation: content.explanation || 'No explanation provided',
                tags: [q.skill],
                skills: [q.skill],
                time: q.time_limit || 60,
                difficulty: q.difficulty || 'medium',
                questionType: 'MCQ',
                marks: q.positive_marking || 1,
                negative_marking: q.negative_marking || 0,
                type: q.type
            };
        } else if (q.type === 'coding') {
            return {
                id: idx + 1,
                question_id: q.question_id,
                text: content.prompt || content.question || '',
                input_spec: content.input_spec || '',
                output_spec: content.output_spec || '',
                examples: content.examples || [],
                tags: [q.skill],
                skills: [q.skill],
                time: q.time_limit || 300,
                difficulty: q.difficulty || 'medium',
                questionType: 'Coding',
                marks: q.positive_marking || 5,
                type: q.type
            };
        } else if (q.type === 'audio') {
            return {
                id: idx + 1,
                question_id: q.question_id,
                text: content.prompt_text || content.question || '',
                expected_keywords: content.expected_keywords || [],
                rubric: content.rubric || '',
                tags: [q.skill],
                skills: [q.skill],
                time: q.time_limit || content.suggested_time_seconds || 120,
                difficulty: q.difficulty || 'medium',
                questionType: 'Audio',
                marks: 0,
                type: q.type
            };
        } else if (q.type === 'video') {
            return {
                id: idx + 1,
                question_id: q.question_id,
                text: content.prompt_text || content.question || '',
                rubric: content.rubric || '',
                tags: [q.skill],
                skills: [q.skill],
                time: q.time_limit || content.suggested_time_seconds || 180,
                difficulty: q.difficulty || 'medium',
                questionType: 'Video',
                marks: 0,
                type: q.type
            };
        }
        
        return {
            id: idx + 1,
            question_id: q.question_id,
            text: 'Question format not supported',
            type: q.type
        };
    });

    const handleEditClick = (question) => {
        setEditingQuestion(question);
        
        if (question.questionType === 'MCQ') {
            setEditedData({
                ...question,
                questionType: question.questionType || 'MCQ',
                timeLimit: question.time?.toString() || '60',
                marks: question.marks?.toString() || '1',
                level: question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1) || 'Medium',
                skills: question.skills || question.tags || [],
                questionText: question.text,
                options: Array.isArray(question.options) ? question.options.map((opt, idx) => {
                    const optionText = typeof opt === 'string' ? opt : opt.text || opt;
                    const isCorrect = question.correctAnswer === String.fromCharCode(65 + idx) ||
                                    question.correctAnswer === optionText ||
                                    question.correctAnswer === (idx + 1).toString();
                    
                    return {
                        id: String.fromCharCode(65 + idx),
                        text: optionText.replace(/^[A-D]\.\s*/, ''),
                        isCorrect
                    };
                }) : []
            });
        } else if (question.questionType === 'Coding') {
            setEditedData({
                ...question,
                questionType: 'Coding',
                timeLimit: question.time?.toString() || '300',
                marks: question.marks?.toString() || '5',
                level: question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1) || 'Medium',
                skills: question.skills || question.tags || [],
                questionText: question.text,
                input_spec: question.input_spec || '',
                output_spec: question.output_spec || '',
                examples: question.examples || []
            });
        } else if (question.questionType === 'Audio') {
            setEditedData({
                ...question,
                questionType: 'Audio',
                timeLimit: question.time?.toString() || '120',
                marks: '0',
                level: question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1) || 'Medium',
                skills: question.skills || question.tags || [],
                questionText: question.text,
                expected_keywords: question.expected_keywords || [],
                rubric: question.rubric || ''
            });
        } else if (question.questionType === 'Video') {
            setEditedData({
                ...question,
                questionType: 'Video',
                timeLimit: question.time?.toString() || '180',
                marks: '0',
                level: question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1) || 'Medium',
                skills: question.skills || question.tags || [],
                questionText: question.text,
                rubric: question.rubric || ''
            });
        }
    };

    const handleSaveEdit = () => {
        if (!editedData || !editingQuestion) return;

        // Transform edited data back to API format
        const updatedQuestion = questions.find(q => q.question_id === editingQuestion.question_id);
        
        if (!updatedQuestion) return;

        if (editedData.questionType === 'MCQ') {
            updatedQuestion.time_limit = parseInt(editedData.timeLimit);
            updatedQuestion.positive_marking = parseInt(editedData.marks);
            updatedQuestion.difficulty = editedData.level.toLowerCase();
            updatedQuestion.content.prompt = editedData.questionText;
            updatedQuestion.content.options = editedData.options.map(opt => opt.text);
            
            const correctOption = editedData.options.find(opt => opt.isCorrect);
            updatedQuestion.content.answer = correctOption ? correctOption.id : 'A';
        } else if (editedData.questionType === 'Coding') {
            updatedQuestion.time_limit = parseInt(editedData.timeLimit);
            updatedQuestion.positive_marking = parseInt(editedData.marks);
            updatedQuestion.difficulty = editedData.level.toLowerCase();
            updatedQuestion.content.prompt = editedData.questionText;
            updatedQuestion.content.input_spec = editedData.input_spec;
            updatedQuestion.content.output_spec = editedData.output_spec;
        } else if (editedData.questionType === 'Audio') {
            updatedQuestion.time_limit = parseInt(editedData.timeLimit);
            updatedQuestion.difficulty = editedData.level.toLowerCase();
            updatedQuestion.content.prompt_text = editedData.questionText;
            updatedQuestion.content.expected_keywords = editedData.expected_keywords;
            updatedQuestion.content.rubric = editedData.rubric;
        } else if (editedData.questionType === 'Video') {
            updatedQuestion.time_limit = parseInt(editedData.timeLimit);
            updatedQuestion.difficulty = editedData.level.toLowerCase();
            updatedQuestion.content.prompt_text = editedData.questionText;
            updatedQuestion.content.rubric = editedData.rubric;
        }
        
        if (onUpdate) {
            onUpdate([...questions]);
        }
        
        setEditingQuestion(null);
        setEditedData(null);
    };

    const handleCancelEdit = () => {
        setEditingQuestion(null);
        setEditedData(null);
    };

    const handleDeleteQuestion = (question) => {
        if (window.confirm('Are you sure you want to delete this question?')) {
            const updatedQuestions = questions.filter(q => q.question_id !== question.question_id);
            if (onUpdate) {
                onUpdate(updatedQuestions);
            }
        }
    };

    const updateOptionText = (id, text) => {
        if (!editedData) return;
        setEditedData({
            ...editedData,
            options: editedData.options.map(opt => opt.id === id ? { ...opt, text } : opt)
        });
    };

    const toggleCorrectAnswer = (id) => {
        if (!editedData) return;
        setEditedData({
            ...editedData,
            options: editedData.options.map(opt => ({ ...opt, isCorrect: opt.id === id }))
        });
    };

    const addOption = () => {
        if (!editedData || !editedData.options) return;
        const newId = String.fromCharCode(65 + editedData.options.length);
        setEditedData({
            ...editedData,
            options: [...editedData.options, { id: newId, text: '', isCorrect: false }]
        });
    };

    const removeOption = (id) => {
        if (!editedData || !editedData.options) return;
        if (editedData.options.length <= 2) {
            alert('Minimum 2 options required');
            return;
        }
        setEditedData({
            ...editedData,
            options: editedData.options.filter(opt => opt.id !== id)
        });
    };

    const removeSkill = (skill) => {
        if (!editedData) return;
        setEditedData({
            ...editedData,
            skills: editedData.skills.filter(s => s !== skill)
        });
    };

    const isQuestionComplete = editedData?.questionText?.trim() !== '' &&
        (editedData?.questionType !== 'MCQ' || 
         (editedData?.options?.every(opt => opt.text.trim() !== '') &&
          editedData?.options?.some(opt => opt.isCorrect)));

    if (displayQuestions.length === 0) {
        return (
            <div className="p-6 border border-gray-300 shadow-md rounded-xl">
                <div className="text-center py-8">
                    <p className="text-gray-600">No questions generated yet.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 flex items-start gap-3">
                <Info className="text-blue-600 mt-0.5" size={20} />
                <div>
                    <h3 className="font-semibold text-gray-900 mb-1">Review & Edit Questions</h3>
                    <p className="text-sm text-gray-600">
                        Review the generated questions below. You can edit, delete, or regenerate any question before proceeding.
                    </p>
                </div>
            </div>

            <div className="p-6 border border-gray-300 shadow-md rounded-xl">
                <div className="mb-4 flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-gray-900">Generated Questions ({displayQuestions.length})</h2>
                    <span className="text-sm text-gray-600">Total Duration: {displayQuestions.reduce((sum, q) => sum + parseInt(q.time), 0)}s</span>
                </div>

                <div className="space-y-4">
                    {displayQuestions.map((question) => (
                        <div key={question.id} className="bg-white p-4 sm:p-6 border border-gray-300 shadow-md rounded-xl">
                            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                                <div className="flex flex-col sm:flex-row sm:items-start gap-3 flex-1">
                                    <span className="text-lg font-semibold text-gray-900 shrink-0">Q{question.id}</span>
                                    <div className="flex-1">
                                        <p className="text-sm sm:text-base text-gray-900 font-medium mb-4">{question.text}</p>

                                        {/* MCQ Options */}
                                        {question.questionType === 'MCQ' && question.options && (
                                            <>
                                                <div className="space-y-2 mb-4">
                                                    {question.options.map((option, idx) => {
                                                        const optionText = typeof option === 'string' ? option : option;
                                                        const isCorrect = question.correctAnswer === String.fromCharCode(65 + idx) ||
                                                                        question.correctAnswer === optionText;
                                                        
                                                        return (
                                                            <div 
                                                                key={idx} 
                                                                className={`flex items-start sm:items-center gap-2 p-2 rounded ${isCorrect ? 'bg-green-50 border border-green-300' : ''}`}
                                                            >
                                                                <input
                                                                    type="radio"
                                                                    name={`question-${question.id}`}
                                                                    checked={isCorrect}
                                                                    readOnly
                                                                    className="w-4 h-4 text-blue-600 mt-0.5 sm:mt-0 shrink-0"
                                                                />
                                                                <label className={`text-xs sm:text-sm break-words ${isCorrect ? 'text-green-800 font-semibold' : 'text-gray-700'}`}>
                                                                    {String.fromCharCode(65 + idx)}. {optionText}
                                                                    {isCorrect && <span className="ml-2">✅</span>}
                                                                </label>
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                {question.explanation && (
                                                    <div className="bg-blue-50 border border-blue-200 rounded-xl sm:rounded-2xl p-3 sm:p-4 mb-4">
                                                        <p className="text-xs sm:text-sm text-gray-700">
                                                            <span className="font-semibold">Explanation:</span> {question.explanation}
                                                        </p>
                                                    </div>
                                                )}
                                            </>
                                        )}

                                        {/* Coding Question Details */}
                                        {question.questionType === 'Coding' && (
                                            <div className="space-y-2 mb-4">
                                                {question.input_spec && (
                                                    <div className="text-xs sm:text-sm">
                                                        <span className="font-semibold text-gray-700">Input:</span>
                                                        <span className="text-gray-600 ml-2">{question.input_spec}</span>
                                                    </div>
                                                )}
                                                {question.output_spec && (
                                                    <div className="text-xs sm:text-sm">
                                                        <span className="font-semibold text-gray-700">Output:</span>
                                                        <span className="text-gray-600 ml-2">{question.output_spec}</span>
                                                    </div>
                                                )}
                                                {question.examples && question.examples.length > 0 && (
                                                    <div className="bg-gray-50 border border-gray-200 rounded p-2 mt-2">
                                                        <span className="text-xs font-semibold text-gray-700">Examples:</span>
                                                        <pre className="text-xs text-gray-600 mt-1 whitespace-pre-wrap">
                                                            {JSON.stringify(question.examples, null, 2)}
                                                        </pre>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Video Question Details */}
                                        {question.questionType === 'Video' && question.rubric && (
                                            <div className="bg-purple-50 border border-purple-200 rounded-xl p-3 mb-4">
                                                <p className="text-xs sm:text-sm text-gray-700">
                                                    <span className="font-semibold">Rubric:</span> {question.rubric}
                                                </p>
                                            </div>
                                        )}

                                        {/* Audio Question Details */}
                                        {question.questionType === 'Audio' && (
                                            <div className="space-y-2 mb-4">
                                                {question.expected_keywords && question.expected_keywords.length > 0 && (
                                                    <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
                                                        <span className="text-xs font-semibold text-gray-700">Expected Keywords:</span>
                                                        <div className="flex flex-wrap gap-1 mt-1">
                                                            {question.expected_keywords.map((keyword, idx) => (
                                                                <span key={idx} className="px-2 py-0.5 bg-yellow-200 text-yellow-800 rounded text-xs">
                                                                    {keyword}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                {question.rubric && (
                                                    <div className="bg-orange-50 border border-orange-200 rounded p-2">
                                                        <span className="text-xs font-semibold text-gray-700">Rubric:</span>
                                                        <p className="text-xs text-gray-600 mt-1">{question.rubric}</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 mt-4 text-xs sm:text-sm text-gray-600">
                                            <div className="flex items-center gap-1">
                                                <Clock size={14} className="sm:w-4 sm:h-4" />
                                                <span>{question.time}s</span>
                                            </div>

                                            <span className="px-2 py-0.5 sm:py-1 bg-green-100 text-green-700 rounded text-xs font-medium">
                                                +{question.marks} marks
                                            </span>

                                            {question.negative_marking > 0 && (
                                                <span className="px-2 py-0.5 sm:py-1 bg-red-100 text-red-700 rounded text-xs font-medium">
                                                    -{question.negative_marking} marks
                                                </span>
                                            )}

                                            <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                                                {(question.tags || question.skills || []).map((tag, idx) => (
                                                    <span key={idx} className="px-2 py-0.5 sm:py-1 bg-orange-100 text-orange-700 rounded text-xs">
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>

                                            <span className="px-2 py-0.5 sm:py-1 bg-blue-100 text-blue-700 rounded text-xs capitalize">
                                                {question.difficulty}
                                            </span>

                                            <span className="px-2 py-0.5 sm:py-1 bg-purple-100 text-purple-700 rounded text-xs">
                                                {question.questionType}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex flex-row lg:flex-col xl:flex-row gap-1 sm:gap-2 justify-end lg:justify-start shrink-0">
                                    <button 
                                        onClick={() => handleEditClick(question)}
                                        className="p-1.5 sm:p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                        title="Edit Question"
                                    >
                                        <Edit className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                                    </button>
                                    <button 
                                        onClick={() => handleDeleteQuestion(question)}
                                        className="p-1.5 sm:p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                                        title="Delete Question"
                                    >
                                        <Trash2 className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                
                <div className="mt-6 flex justify-between">
                    <button
                        onClick={onBack}
                        disabled={loading}
                        className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Back
                    </button>
                    <button
                        onClick={onNext}
                        disabled={loading || displayQuestions.length === 0}
                        className="px-6 py-2 bg-[#9157ED] text-white rounded-lg hover:bg-[#7940d6] font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Next: Review & Finalize
                    </button>
                </div>
            </div>

            {/* Edit Modal */}
            {editingQuestion && editedData && (
                <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
                            
                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 gap-4">
                                <h2 className="text-2xl font-bold text-gray-800">Edit Q{editingQuestion.id}</h2>
                                <div className="flex items-center gap-2 flex-wrap">
                                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded text-sm font-medium">
                                        <Check className="w-4 h-4" />
                                        Editing
                                    </span>
                                    <button 
                                        onClick={handleCancelEdit}
                                        className="p-2 hover:bg-gray-100 rounded border border-gray-300"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Question Type</label>
                                    <input
                                        type="text"
                                        value={editedData.questionType || ''}
                                        readOnly
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Time limit (seconds)</label>
                                    <input
                                        type="number"
                                        value={editedData.timeLimit || ''}
                                        onChange={(e) => setEditedData({...editedData, timeLimit: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        min="10"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Marks</label>
                                    <input
                                        type="number"
                                        value={editedData.marks || ''}
                                        onChange={(e) => setEditedData({...editedData, marks: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        min="0"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Level</label>
                                    <select
                                        value={editedData.level || 'Medium'}
                                        onChange={(e) => setEditedData({...editedData, level: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option>Easy</option>
                                        <option>Medium</option>
                                        <option>Hard</option>
                                    </select>
                                </div>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Skills</label>
                                <div className="flex flex-wrap gap-2 p-3 border border-gray-300 rounded-md bg-gray-50 min-h-[42px]">
                                    {editedData.skills?.map(skill => (
                                        <span key={skill} className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="mb-6">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Question Text</label>
                                <textarea
                                    value={editedData.questionText || ''}
                                    onChange={(e) => setEditedData({...editedData, questionText: e.target.value})}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px] resize-y"
                                    placeholder="Enter your question here..."
                                />
                            </div>

                            {/* MCQ Options Editor */}
                            {editedData?.questionType === 'MCQ' && (
                                <div className="mb-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <label className="block text-sm font-medium text-gray-700">
                                            Options (Click to mark as correct)
                                        </label>
                                        <button
                                            onClick={addOption}
                                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-black text-white rounded text-sm hover:bg-gray-800 transition-colors"
                                        >
                                            + Add Option
                                        </button>
                                    </div>

                                    <div className="space-y-3">
                                        {editedData.options?.map((option) => (
                                            <div key={option.id} className="flex items-center gap-2">
                                                <span className="text-sm font-medium text-gray-700 w-6">{option.id}.</span>
                                                <input
                                                    type="text"
                                                    value={option.text || ''}
                                                    onChange={(e) => updateOptionText(option.id, e.target.value)}
                                                    onClick={() => toggleCorrectAnswer(option.id)}
                                                    className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer ${
                                                        option.isCorrect ? 'bg-green-50 border-green-400 font-semibold' : 'bg-gray-50 border-gray-300'
                                                    }`}
                                                    placeholder="Enter option text..."
                                                />
                                                {option.isCorrect && <span className="text-green-600 text-xl">✅</span>}
                                                <button
                                                    onClick={() => removeOption(option.id)}
                                                    className="p-2 text-red-500 hover:bg-red-50 rounded transition-colors"
                                                    disabled={editedData.options.length <= 2}
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Coding Specific Fields */}
                            {editedData?.questionType === 'Coding' && (
                                <>
                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Input Specification</label>
                                        <textarea
                                            value={editedData.input_spec || ''}
                                            onChange={(e) => setEditedData({...editedData, input_spec: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                                            rows="2"
                                            placeholder="Describe the input format..."
                                        />
                                    </div>
                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Output Specification</label>
                                        <textarea
                                            value={editedData.output_spec || ''}
                                            onChange={(e) => setEditedData({...editedData, output_spec: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                                            rows="2"
                                            placeholder="Describe the expected output..."
                                        />
                                    </div>
                                </>
                            )}

                            {/* Video Specific Fields */}
                            {editedData?.questionType === 'Video' && (
                                <div className="mb-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Rubric</label>
                                    <textarea
                                        value={editedData.rubric || ''}
                                        onChange={(e) => setEditedData({...editedData, rubric: e.target.value})}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                                        rows="3"
                                        placeholder="Evaluation criteria..."
                                    />
                                </div>
                            )}

                            {/* Audio Specific Fields */}
                            {editedData?.questionType === 'Audio' && (
                                <>
                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Expected Keywords (comma-separated)</label>
                                        <input
                                            type="text"
                                            value={Array.isArray(editedData.expected_keywords) ? editedData.expected_keywords.join(', ') : ''}
                                            onChange={(e) => setEditedData({...editedData, expected_keywords: e.target.value.split(',').map(k => k.trim()).filter(k => k)})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            placeholder="e.g., leadership, teamwork, communication"
                                        />
                                    </div>
                                    <div className="mb-6">
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Rubric</label>
                                        <textarea
                                            value={editedData.rubric || ''}
                                            onChange={(e) => setEditedData({...editedData, rubric: e.target.value})}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
                                            rows="3"
                                            placeholder="Evaluation criteria..."
                                        />
                                    </div>
                                </>
                            )}

                            {isQuestionComplete && (
                                <div className="mb-6 p-3 bg-[#C2FABA] border border-green-300 rounded-md text-green-700 text-sm">
                                    Question {editingQuestion.id} is ready and complete.
                                </div>
                            )}

                            <div className="flex justify-center gap-4">
                                <button 
                                    onClick={handleCancelEdit}
                                    className="px-8 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={handleSaveEdit}
                                    disabled={!isQuestionComplete}
                                    className="px-8 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Save Changes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}