// ============================================
// FILE: src/components/Timer.jsx
// Countdown timer component
// ============================================

import React, { useState, useEffect } from 'react';

const Timer = ({ timeLimit, onTimeUp }) => {
  const [timeLeft, setTimeLeft] = useState(timeLimit);

  useEffect(() => {
    setTimeLeft(timeLimit);
  }, [timeLimit]);

  useEffect(() => {
    if (timeLeft <= 0) {
      onTimeUp();
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft, onTimeUp]);

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;

  const isLowTime = timeLeft <= 30;

  return (
    <div
      className={`px-4 py-2 rounded-lg font-mono text-lg font-bold ${
        isLowTime
          ? 'bg-red-100 text-red-700 animate-pulse'
          : 'bg-blue-100 text-blue-700'
      }`}
    >
      {minutes}:{seconds.toString().padStart(2, '0')}
    </div>
  );
};

export default Timer;
