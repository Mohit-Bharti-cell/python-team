// File: RecruiterAdmin/api/reviewApi.js
// API integration for test review and finalization

const API_BASE_URL = 'http://localhost:5000/api/v1';

class ReviewAPI {
    /**
     * Prepare finalization payload from formData and questions
     */
    static prepareFinalizePayload(formData, questions) {
        // Extract test metadata from formData
        const testTitle = formData.roleTitle || 'Untitled Test';
        const testDescription = `Assessment for ${formData.roleTitle} - ${formData.experience || ''} experience`;
        
        // You can add job_id if available in formData
        const jobId = formData.jobId || null;

        return {
            test_title: testTitle,
            test_description: testDescription,
            job_id: jobId,
            questions: questions,

            // ✅ SEND SCHEDULE
            examDate: formData.startDate,
            startTime: formData.startTime,
            endDate: formData.endDate,
            endTime: formData.endTime,
        };
    }

    /**
     * Finalize test and save to database
     */
    static async finalizeTest(payload) {
        try {
            console.log('Sending finalize request to backend:', payload);

            const response = await fetch(`${API_BASE_URL}/finalize-test`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            console.log('Response status:', response.status);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            console.log('Finalize response:', data);

            return data;
        } catch (error) {
            console.error('Error in finalizeTest:', error);
            throw error;
        }
    }

    /**
     * Get test by question_set_id (optional - for future use)
     */
    static async getTest(questionSetId) {
        try {
            const response = await fetch(`${API_BASE_URL}/test/${questionSetId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error in getTest:', error);
            throw error;
        }
    }

    /**
     * Get all tests (optional - for future use)
     */
    static async getAllTests() {
        try {
            const response = await fetch(`${API_BASE_URL}/tests`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error in getAllTests:', error);
            throw error;
        }
    }

    /**
     * Delete test (optional - for future use)
     */
    static async deleteTest(questionSetId) {
        try {
            const response = await fetch(`${API_BASE_URL}/test/${questionSetId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error in deleteTest:', error);
            throw error;
        }
    }
}

export default ReviewAPI;