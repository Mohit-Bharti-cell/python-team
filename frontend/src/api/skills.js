// File: src/api/skills.js
// API functions for fetching skills data

const API_BASE_URL = 'http://localhost:5000/api/v1'

export const fetchSkills = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/skills`)
    if (!response.ok) throw new Error('Failed to fetch skills')
    const data = await response.json()
    return data.skills
  } catch (error) {
    console.error('Error fetching skills:', error)
    throw error
  }
}