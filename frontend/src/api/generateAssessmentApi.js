// API service for Generate Assessment
const API_BASE_URL = 'http://localhost:5000/api/v1';

class AssessmentAPI {
  /**
   * Generate test questions based on skills and difficulty levels
   * @param {Object} payload - Skills configuration
   * @returns {Promise<Object>} Generated questions
   */
  static async generateTest(payload) {
    try {
      const response = await fetch(`${API_BASE_URL}/generate-test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate test');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error generating test:', error);
      throw error;
    }
  }

  /**
   * Finalize and save test to database
   * @param {Object} payload - Complete test data with questions
   * @returns {Promise<Object>} Saved test information
   */
  static async finalizeTest(payload) {
    try {
      const response = await fetch(`${API_BASE_URL}/finalize-test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to finalize test');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error finalizing test:', error);
      throw error;
    }
  }

  /**
   * Transform frontend formData to backend payload format
   * @param {Object} formData - Frontend form data
   * @returns {Object} Backend-compatible payload
   */
  static transformToBackendPayload(formData) {
    const skills = formData.skillLevels
      .filter(skill => {
        const totalQuestions = (skill.mcq || 0) + (skill.coding || 0) + (skill.audio || 0) + (skill.video || 0);
        return totalQuestions > 0;
      })
      .map(skill => ({
        name: skill.skill,
        difficulty: skill.level.toLowerCase() === 'any' ? 'medium' : skill.level.toLowerCase(),
        counts: {
          mcq: skill.mcq || 0,
          coding: skill.coding || 0,
          audio: skill.audio || 0,
          video: skill.video || 0,
        },
      }));

    return {
      skills,
      global_settings: {
        mcq_options: 4,
      },
    };
  }

  /**
   * Transform backend questions to frontend format
   * @param {Array} backendQuestions - Questions from backend
   * @returns {Array} Frontend-compatible questions
   */
  static transformToFrontendQuestions(backendQuestions) {
    if (!Array.isArray(backendQuestions)) {
      console.error('Backend questions is not an array:', backendQuestions);
      return [];
    }

    return backendQuestions.map(q => ({
      question_id: q.question_id,
      skill: q.skill,
      type: q.type,
      difficulty: q.difficulty,
      content: q.content,
      time_limit: q.content?.time_limit || 60,
      positive_marking: q.content?.positive_marking || 1,
      negative_marking: q.content?.negative_marking || 0,
    }));
  }

  /**
   * Prepare finalization payload
   * @param {Object} formData - Form data from step 1
   * @param {Array} questions - Questions from step 2
   * @returns {Object} Finalization payload
   */
  static prepareFinalizePayload(formData, questions) {
    return {
      test_title: `${formData.roleTitle} Assessment`,
      test_description: `Assessment for ${formData.roleTitle} position requiring ${formData.experience} experience`,
      job_id: formData.jobId || null, // Can be added to formData if needed
      questions: questions.map(q => ({
        question_id: q.question_id,
        type: q.type,
        skill: q.skill,
        difficulty: q.difficulty,
        content: q.content,
        time_limit: q.time_limit || 60,
        positive_marking: q.positive_marking || 1,
        negative_marking: q.negative_marking || 0,
      })),
    };
  }
}

export default AssessmentAPI;