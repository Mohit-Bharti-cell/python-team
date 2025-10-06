// File: src/api/questions.js
// API functions for generating, managing, and finalizing questions

const API_BASE_URL = 'http://localhost:5000/api/v1'

export const generateQuestions = async (skillSelections, testTitle = '', testDescription = '') => {
  try {
    // Transform frontend data to backend format
    const skills = skillSelections.map(selection => ({
      name: selection.skill.name,
      difficulty: selection.difficulty.toLowerCase(),
      counts: {
        mcq: selection.mcq,
        coding: selection.coding,
        audio: selection.audio,
        video: selection.video
      }
    }))

    const payload = {
      test_title: testTitle || "Generated Test",
      test_desc: testDescription || "Auto-generated test",
      skills: skills,
      global_settings: {
        language: "en",
        mcq_options: 4
      }
    }

    const response = await fetch(`${API_BASE_URL}/generate-test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.message || 'Failed to generate questions')
    }
    
    const data = await response.json()
    
    // IMPORTANT: Extract ONLY the questions array, ignore the status field
    const questionsArray = data.questions || []
    
    // Transform backend response to frontend format
    const transformedQuestions = questionsArray.map(question => ({
      id: question.question_id,
      type: question.type.toUpperCase(),
      skill: question.skill,
      difficulty: question.difficulty.charAt(0).toUpperCase() + question.difficulty.slice(1),
      content: `${question.skill} ${question.type} question`,
      prompt: question.content.prompt || question.content.prompt_text,
      options: question.content.options || null,
      correct_answer: question.content.answer ? 
        (question.content.options?.findIndex(opt => opt.startsWith(question.content.answer)) || 0) : null,
      expected_output: question.content.expected_output || question.content.expected_keywords?.join(', ') || null,
      rubric: question.content.rubric || null,
      positive_marking: question.positive_marking || getDefaultMarking(question.type).positive,
      negative_marking: question.negative_marking || getDefaultMarking(question.type).negative,
      time_limit: question.time_limit || getDefaultTimeLimit(question.type),
      // Store original backend data for finalization
      original_data: question
    }))

    // Return ONLY the questions array, not wrapped in an object
    return transformedQuestions
  } catch (error) {
    console.error('Error generating questions:', error)
    throw error
  }
}

export const finalizeTest = async (questions, testTitle = '', testDescription = '') => {
  try {
    console.log('='.repeat(50))
    console.log('FRONTEND: Starting finalize test request')
    console.log('='.repeat(50))
    console.log('Test Title:', testTitle)
    console.log('Test Description:', testDescription)
    console.log('Number of questions:', questions.length)
    
    // CRITICAL CHECK: Ensure questions is an array, not an object with status
    if (!Array.isArray(questions)) {
      console.error('ERROR: questions is not an array:', typeof questions)
      console.error('Questions value:', questions)
      
      // If questions is an object with a questions property, extract it
      if (questions && typeof questions === 'object' && Array.isArray(questions.questions)) {
        console.warn('Extracting questions array from wrapper object')
        questions = questions.questions
      } else {
        throw new Error('Invalid questions format: expected array, got ' + typeof questions)
      }
    }
    
    // IMPORTANT: Send questions in the EXACT format they came from generate-test
    // The backend generates UUIDs, so we use original_data when available
    const transformedQuestions = questions.map((question, index) => {
      console.log(`Processing question ${index + 1}:`, question.id, question.type)
      
      // If we have the original data from generation, use it directly
      if (question.original_data) {
        console.log('Using original_data for question:', question.id)
        return question.original_data
      }
      
      // This should rarely happen - only for manually added questions
      console.warn('No original_data for question:', question.id, '- this may cause issues')
      console.log('Creating new question object without question_id (backend will generate UUID)')
      
      return {
        type: question.type.toLowerCase(),
        skill: question.skill,
        difficulty: question.difficulty.toLowerCase(),
        content: createContentObject(question),
        time_limit: question.time_limit || getDefaultTimeLimit(question.type),
        positive_marking: question.positive_marking || getDefaultMarking(question.type).positive,
        negative_marking: question.negative_marking || getDefaultMarking(question.type).negative
      }
    })

    // Send in the EXACT format the backend expects
    const payload = {
      test_title: testTitle || "Untitled Test",
      test_description: testDescription || "",
      questions: transformedQuestions
    }

    console.log('\nFRONTEND: Payload structure:')
    console.log('- test_title:', payload.test_title)
    console.log('- test_description:', payload.test_description)
    console.log('- questions count:', payload.questions.length)
    console.log('- questions is array:', Array.isArray(payload.questions))
    console.log('\nFull payload being sent:')
    console.log(JSON.stringify(payload, null, 2))
    
    const url = `${API_BASE_URL}/finalize-test`
    console.log('\nFRONTEND: Making POST request to:', url)

    const response = await fetch(url, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify(payload)
    })
    
    console.log('\nFRONTEND: Response received')
    console.log('- Status:', response.status)
    console.log('- Status Text:', response.statusText)
    
    if (!response.ok) {
      let errorMessage = 'Failed to finalize test'
      let errorDetails = null
      
      try {
        const errorData = await response.json()
        console.error('FRONTEND: Backend error response:', errorData)
        errorMessage = errorData.message || errorData.error || errorMessage
        errorDetails = errorData
      } catch (e) {
        console.error('FRONTEND: Could not parse error response:', e)
        const textError = await response.text().catch(() => 'No response text')
        console.error('FRONTEND: Response text:', textError)
        errorMessage = `Server error (${response.status}): ${textError.substring(0, 100)}`
      }
      
      const error = new Error(errorMessage)
      error.details = errorDetails
      error.status = response.status
      throw error
    }
    
    const data = await response.json()
    console.log('FRONTEND: Success response:', data)
    console.log('='.repeat(50))
    
    return {
      question_set_id: data.question_set_id,
      expiry_time: data.expiry_time,
      test_link: `http://localhost:5173/test/${data.question_set_id}`,
      test_title: testTitle,
      message: data.message
    }
  } catch (error) {
    console.error('='.repeat(50))
    console.error('FRONTEND: Error finalizing test')
    console.error('Error message:', error.message)
    console.error('Error details:', error.details)
    console.error('='.repeat(50))
    throw error
  }
}

// Helper function to create content object for different question types
// This is ONLY used as a fallback when original_data is missing
const createContentObject = (question) => {
  const baseContent = {
    prompt: question.prompt
  }

  switch (question.type.toLowerCase()) {
    case 'mcq':
      return {
        ...baseContent,
        options: question.options || ['Option A', 'Option B', 'Option C', 'Option D'],
        answer: question.correct_answer !== null && question.correct_answer !== undefined ? 
          String.fromCharCode(65 + question.correct_answer) : 'A'
      }
    
    case 'coding':
      return {
        ...baseContent,
        input_spec: "Input specification",
        output_spec: "Output specification", 
        examples: question.expected_output ? [{
          input: "sample input",
          output: question.expected_output
        }] : [{
          input: "example input",
          output: "example output"
        }]
      }
    
    case 'audio':
      return {
        prompt_text: question.prompt,
        expected_keywords: question.expected_output ? 
          question.expected_output.split(', ').filter(k => k.trim()) : 
          ["keyword1", "keyword2"],
        rubric: question.rubric || "Evaluate based on understanding and communication"
      }
    
    case 'video':
      return {
        prompt_text: question.prompt,
        expected_keywords: question.expected_output ? 
          question.expected_output.split(', ').filter(k => k.trim()) : 
          ["keyword1", "keyword2"],
        rubric: question.rubric || "Evaluate based on presentation and knowledge"
      }
    
    default:
      return baseContent
  }
}

// Helper functions for default values
const getDefaultMarking = (type) => {
  switch (type.toLowerCase()) {
    case 'mcq': return { positive: 4, negative: 1 }
    case 'coding': return { positive: 10, negative: 0 }
    case 'audio': return { positive: 8, negative: 0 }
    case 'video': return { positive: 12, negative: 0 }
    default: return { positive: 4, negative: 1 }
  }
}

const getDefaultTimeLimit = (type) => {
  switch (type.toLowerCase()) {
    case 'mcq': return 60
    case 'coding': return 1800 // 30 minutes
    case 'audio': return 300 // 5 minutes
    case 'video': return 600 // 10 minutes
    default: return 60
  }
}