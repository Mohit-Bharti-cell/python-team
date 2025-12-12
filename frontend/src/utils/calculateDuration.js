// File: src/utils/calculateDuration.js
// Utility functions for calculating test duration and formatting time

export const calculateTotalDuration = (questions) => {
  return questions.reduce((total, question) => total + (question.time_limit || 0), 0)
}

export const formatDuration = (seconds) => {
  if (seconds < 60) {
    return `${seconds}s`
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return remainingSeconds > 0 ? `${minutes}m ${remainingSeconds}s` : `${minutes}m`
  } else {
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const remainingSeconds = seconds % 60
    
    let result = `${hours}h`
    if (minutes > 0) result += ` ${minutes}m`
    if (remainingSeconds > 0) result += ` ${remainingSeconds}s`
    
    return result
  }
}

export const formatTime = (seconds) => {
  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`
}