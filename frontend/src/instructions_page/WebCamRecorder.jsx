import React, {
  useEffect,
  useRef,
  useState,
  forwardRef,
  useImperativeHandle,
} from "react";

const WebCamRecorder = forwardRef((props, ref) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const audioRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const [isRecording, setIsRecording] = useState(false);
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [status, setStatus] = useState("idle");
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [interviewEnded, setInterviewEnded] = useState(false);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [qaData, setQaData] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);

  const baseUrl = window.REACT_APP_BASE_URL || "http://127.0.0.1:8000";
  const candidateId = window.REACT_APP_CANDIDATE_ID || `candidate_${Date.now()}`;
  const questionSetId = window.REACT_APP_QUESTION_SET_ID || "default_set";

  const [answerLanguage, setAnswerLanguage] = useState('en'); // 'en' or 'hi'

  // ✅ Fetch questions on mount
  useEffect(() => {
    fetchQuestions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchQuestions = async () => {
    try {
      setStatus("Fetching questions...");
      const res = await fetch(`${baseUrl}/get_questions?question_set_id=${questionSetId}`);
      const data = await res.json();
      
      if (data.status === "success" && data.questions) {
        setQuestions(data.questions);
        setStatus(`Loaded ${data.count} questions`);
      } else {
        setStatus("No questions found");
      }
    } catch (err) {
      console.error("Error fetching questions:", err);
      setStatus("Error loading questions");
    }
  };

  // ✅ Initialize camera
  useEffect(() => {
    let mounted = true;
    async function initCamera() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        if (!mounted) return;
        streamRef.current = stream;
        if (videoRef.current) videoRef.current.srcObject = stream;

        // Full video recorder (background recording)
        mediaRecorderRef.current = new MediaRecorder(stream, {
          mimeType: "video/webm;codecs=vp9,opus",
        });

        mediaRecorderRef.current.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
        };

        mediaRecorderRef.current.onstop = async () => {
          if (!chunksRef.current.length) return;
          await uploadFullVideo();
        };

        // Audio-only recorder for individual answers
        audioRecorderRef.current = new MediaRecorder(stream, {
          mimeType: "audio/webm",
        });

        audioRecorderRef.current.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
        };

        // Audio chunks collected but handled in submitAnswer()
        audioRecorderRef.current.onstop = () => {
          // Audio recording stopped - chunks remain for potential upload
        };

      } catch (err) {
        console.error("Camera access error", err);
        alert("Could not access camera/microphone. Please allow permissions and reload.");
      }
    }

    initCamera();

    return () => {
      mounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ Start interview - begins full video recording
  const startInterview = async () => {
    if (questions.length === 0) {
      alert("No questions loaded. Please refresh.");
      return;
    }

    setInterviewStarted(true);
    setStatus("Interview started - Recording full video");
    
    // Start full video recording in background
    if (mediaRecorderRef.current) {
      chunksRef.current = [];
      mediaRecorderRef.current.start(1000);
      setIsRecording(true);
    }

    // Ask first question
    askQuestion(0);
  };

  // ✅ Ask question with TTS
  const askQuestion = async (index) => {
    if (index >= questions.length) {
      endInterview();
      return;
    }

    const question = questions[index];
    setCurrentQuestion(question);
    setCurrentQuestionIndex(index);
    setCurrentAnswer(""); // Reset answer input
    setStatus(`Question ${index + 1}/${questions.length}`);

    // Get TTS audio for question
    try {
      const res = await fetch(`${baseUrl}/tts_question`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: question.prompt_text }),
      });
      const data = await res.json();
      
      if (data.status === "success" && data.tts_url) {
        // Play TTS audio
        const audio = new Audio(`${baseUrl}${data.tts_url}`);
        audio.play();
        
        // Don't auto-start recording - wait for user input
        audio.onended = () => {
          setStatus("Ready to answer - Type or speak your answer");
        };
      } else {
        // Fallback to speech synthesis
        speakText(question.prompt_text);
        setTimeout(() => setStatus("Ready to answer - Type or speak your answer"), 2000);
      }
    } catch (err) {
      console.error("TTS error:", err);
      speakText(question.prompt_text);
      setTimeout(() => setStatus("Ready to answer - Type or speak your answer"), 2000);
    }
  };

  // ✅ Text-to-speech fallback
  const speakText = (text) => {
    if (!window.speechSynthesis) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-US";
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utter);
  };

  // ✅ Start recording individual answer (audio only)
  const startRecordingAnswer = () => {
    if (!streamRef.current) {
      console.error("Stream not available");
      alert("Camera/microphone not initialized. Please refresh the page.");
      return;
    }
    
    // Check if audio recorder exists and is in recording state
    if (audioRecorderRef.current && audioRecorderRef.current.state === "recording") {
      console.warn("Already recording");
      return;
    }

    // Create a fresh MediaRecorder for each recording session
    try {
      // Try different MIME types for better compatibility
      let options = { mimeType: "audio/webm" };
      
      if (!MediaRecorder.isTypeSupported("audio/webm")) {
        console.log("audio/webm not supported, trying audio/webm;codecs=opus");
        options = { mimeType: "audio/webm;codecs=opus" };
        
        if (!MediaRecorder.isTypeSupported("audio/webm;codecs=opus")) {
          console.log("audio/webm;codecs=opus not supported, using default");
          options = {};
        }
      }
      
      console.log("Creating MediaRecorder with options:", options);
      audioRecorderRef.current = new MediaRecorder(streamRef.current, options);

      audioRecorderRef.current.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          console.log("Audio data chunk received:", e.data.size, "bytes");
          audioChunksRef.current.push(e.data);
        }
      };

      audioRecorderRef.current.onstop = () => {
        console.log("Audio recording stopped, total chunks:", audioChunksRef.current.length);
      };

      audioRecorderRef.current.onerror = (e) => {
        console.error("MediaRecorder error:", e);
        setIsRecordingAudio(false);
      };

      audioChunksRef.current = [];
      audioRecorderRef.current.start(1000);
      setIsRecordingAudio(true);
      setStatus("🎤 Recording voice answer...");
      console.log("Started voice recording successfully");
    } catch (err) {
      console.error("Start audio recording error:", err);
      alert(`Failed to start recording: ${err.message}\n\nTry refreshing the page.`);
    }
  };

  // ✅ Stop recording answer
  const stopRecordingAnswer = () => {
    if (!audioRecorderRef.current) return;
    if (audioRecorderRef.current.state !== "recording") return;

    try {
      audioRecorderRef.current.stop();
      setIsRecordingAudio(false);
      setStatus("Voice answer recorded");
    } catch (err) {
      console.error("Stop audio recording error", err);
    }
  };

  // ✅ Submit answer and move to next question
  const submitAnswer = async () => {
    if (!currentAnswer.trim()) {
      alert("Please type your answer before proceeding.");
      return;
    }

    // Prevent double click on Next/Finish
    setIsNextDisabled(true);

    // Detect Hindi (Devanagari) characters
    const isHindi = /[\u0900-\u097F]/.test(currentAnswer);
    if (isHindi) {
      setStatus("Translating from Hindi to English...");
    }

    // Save answer to state
    const newQA = {
      question: currentQuestion.prompt_text,
      questionId: currentQuestion.question_id,
      answer: currentAnswer.trim(),
      timestamp: new Date().toISOString(),
    };

    setQaData((prev) => [...prev, newQA]);

    // Save to backend
    try {
      const res = await fetch(`${baseUrl}/save_qa`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          candidate_id: candidateId,
          question: currentQuestion.prompt_text,
          answer: newQA.answer,
        }),
      });
      const data = await res.json();
      if (isHindi && data.status === "success") {
        setStatus("Answer translated and saved!");
      }
    } catch (err) {
      console.error("Save answer error:", err);
      setStatus("Error saving answer");
    }

    // Move to next question
    const nextIndex = currentQuestionIndex + 1;
    if (nextIndex < questions.length) {
      setTimeout(() => {
        askQuestion(nextIndex);
        setIsNextDisabled(false);
      }, 500);
    } else {
      endInterview();
      setIsNextDisabled(false);
    }
  };

  // ✅ Toggle voice recording
  const toggleVoiceRecording = () => {
    if (isRecordingAudio) {
      stopRecordingAnswer();
    } else {
      startRecordingAnswer();
    }
  };

  // ✅ Start speech recognition
  const startSpeechRecognition = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert("Speech recognition is not supported in your browser. Please use Chrome or Edge.");
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;
    recognitionRef.current.lang = answerLanguage === 'hi' ? 'hi-IN' : 'en-US';

    recognitionRef.current.onstart = () => {
      setIsListening(true);
      setStatus(answerLanguage === 'hi' ? "🎤 सुन रहे हैं... हिंदी में उत्तर दें" : "🎤 Listening... Speak your answer");
      console.log("Speech recognition started");
    };

    recognitionRef.current.onresult = (event) => {
      let interimTranscript = '';
      let finalTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        setCurrentAnswer(finalTranscript.trim());
        setStatus(answerLanguage === 'hi'
          ? "हिंदी में उत्तर मिला है। आप नीचे संपादित कर सकते हैं।"
          : "Speech recognized. You can edit your answer below.");
      }
    };

    recognitionRef.current.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
      if (event.error !== 'no-speech') {
        alert(`Speech recognition error: ${event.error}`);
      }
    };

    recognitionRef.current.onend = () => {
      setIsListening(false);
      setStatus(answerLanguage === 'hi'
        ? "उत्तर देने के लिए तैयार हैं - हिंदी में टाइप या बोलें"
        : "Ready to answer - Type or speak your answer");
      console.log("Speech recognition ended");
    };

    try {
      recognitionRef.current.start();
    } catch (err) {
      console.error("Failed to start speech recognition:", err);
      setIsListening(false);
    }
  };

  // ✅ Stop speech recognition
  const stopSpeechRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  // ✅ Toggle speech-to-text
  const toggleSpeechToText = () => {
    if (isListening) {
      stopSpeechRecognition();
    } else {
      startSpeechRecognition();
    }
  };

  // ✅ End interview - upload full video for processing
  const endInterview = () => {
    setInterviewEnded(true);
    setStatus("Interview complete - Stopping video...");

    // Stop full video recording
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // ✅ Upload full video for processing
  const uploadFullVideo = async () => {
    if (!chunksRef.current.length) return;

    const blob = new Blob(chunksRef.current, { type: "video/webm" });
    chunksRef.current = [];

    const ts = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `interview_${candidateId}_${ts}.webm`;
    const file = new File([blob], filename, { type: "video/webm" });

    try {
      setStatus("Uploading full interview video...");
      const fd = new FormData();
      fd.append("candidate_id", candidateId);
      fd.append("language", "en");
      fd.append("qa_data", JSON.stringify(qaData.map(qa => ({
        question: qa.question,
        answer: qa.answer
      }))));
      fd.append("file", file);

      const res = await fetch(`${baseUrl}/upload_video`, {
        method: "POST",
        body: fd,
      });

      const data = await res.json();

      if (data.status === "success") {
        setStatus("Interview completed! Processing results...");
        console.log("Interview results:", data);
        
        // Show results to user
        alert(`Interview Complete!\n\nCandidate ID: ${data.candidate_id}\n\nTranscription, evaluation, and cheating detection completed.\n\nCheck the backend for full results.`);
      } else {
        setStatus("Upload failed");
        console.error("Upload error:", data);
      }
    } catch (err) {
      console.error("Upload error:", err);
      setStatus("Upload error");
    }
  };

  const stopAll = () => {
    try {
      if (isRecording && mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
      if (isRecordingAudio && audioRecorderRef.current) {
        audioRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      setStatus("Webcam disconnected");
    } catch (err) {
      console.error("Stop all error", err);
    }
  };

  // ✅ Expose functions to parent
  useImperativeHandle(ref, () => ({
    startInterview,
    endInterview,
    stopAll,
  }));

  const [isNextDisabled, setIsNextDisabled] = useState(false);

  return (
    <div
      className="p-4"
      style={{
        fontFamily: "Inter, system-ui, sans-serif",
        maxWidth: 980,
        margin: "0 auto",
      }}
    >
      <h1 style={{ fontSize: 24, marginBottom: 16, fontWeight: 700 }}>
        AI Interview System
      </h1>

      <div style={{ display: "flex", gap: 12 }}>
        <div style={{ flex: 1 }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: "100%",
              borderRadius: 8,
              background: "#000",
              border: isRecording ? "3px solid #ef4444" : "1px solid #ddd",
            }}
          />

          <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
            {!interviewStarted && (
              <button
                onClick={startInterview}
                disabled={questions.length === 0}
                style={{
                  padding: "10px 20px",
                  fontSize: 16,
                  fontWeight: 600,
                  background: "#10b981",
                  color: "white",
                  border: "none",
                  borderRadius: 6,
                  cursor: questions.length === 0 ? "not-allowed" : "pointer",
                  opacity: questions.length === 0 ? 0.5 : 1,
                }}
              >
                Start Interview ({questions.length} questions)
              </button>
            )}

            {interviewStarted && !interviewEnded && currentQuestion && (
              <>
                <button
                  onClick={submitAnswer}
                  disabled={!currentAnswer.trim() || isNextDisabled}
                  style={{
                    padding: "10px 20px",
                    fontSize: 16,
                    fontWeight: 600,
                    background: "#10b981",
                    color: "white",
                    border: "none",
                    borderRadius: 6,
                    cursor: !currentAnswer.trim() || isNextDisabled ? "not-allowed" : "pointer",
                    opacity: !currentAnswer.trim() || isNextDisabled ? 0.5 : 1,
                  }}
                >
                  {currentQuestionIndex < questions.length - 1 ? "Next Question →" : "Finish Interview"}
                </button>
              </>
            )}

            {interviewStarted && !interviewEnded && (
              <button
                onClick={endInterview}
                style={{
                  padding: "10px 20px",
                  fontSize: 14,
                  background: "#6b7280",
                  color: "white",
                  border: "none",
                  borderRadius: 6,
                  cursor: "pointer",
                }}
              >
                End Interview Early
              </button>
            )}
          </div>

          <div style={{ marginTop: 12, padding: 12, background: "#f3f4f6", borderRadius: 6 }}>
            <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Status</div>
            <div style={{ fontSize: 13 }}>{status}</div>
            <div style={{ fontSize: 12, marginTop: 6, display: "flex", gap: 12 }}>
              <span>
                Video: {isRecording ? "🔴 Recording" : "⚫ Stopped"}
              </span>
              <span>
                Answer: {isRecordingAudio ? "🎤 Recording" : "⚫ Idle"}
              </span>
            </div>
          </div>
        </div>

        <div style={{ width: 400 }}>
          <div
            style={{
              marginBottom: 12,
              padding: 16,
              borderRadius: 8,
              border: "2px solid #3b82f6",
              background: "#eff6ff",
            }}
          >
            <strong style={{ fontSize: 16 }}>Current Question</strong>
            <div style={{ marginTop: 12, minHeight: 60 }}>
              {currentQuestion ? (
                <>
                  <div style={{ fontSize: 15, fontWeight: 600, lineHeight: 1.5 }}>
                    {currentQuestion.prompt_text}
                  </div>
                  <div style={{ marginTop: 8, fontSize: 12, color: "#6b7280" }}>
                    Question {currentQuestionIndex + 1} of {questions.length}
                  </div>
                  {currentQuestion.suggested_time_seconds && (
                    <div style={{ marginTop: 4, fontSize: 12, color: "#6b7280" }}>
                      Suggested time: {currentQuestion.suggested_time_seconds}s
                    </div>
                  )}
                </>
              ) : interviewStarted ? (
                <div style={{ color: "#6b7280", fontStyle: "italic" }}>
                  Loading next question...
                </div>
              ) : (
                <div style={{ color: "#6b7280", fontStyle: "italic" }}>
                  Click "Start Interview" to begin
                </div>
              )}
            </div>

            {/* Answer Input */}
            {interviewStarted && !interviewEnded && currentQuestion && (
              <div style={{ marginTop: 16 }}>
                <label style={{ display: "block", fontSize: 14, fontWeight: 600, marginBottom: 8 }}>
                  {answerLanguage === 'hi' ? 'आपका उत्तर:' : 'Your Answer:'}
                </label>
                <div style={{ marginBottom: 8 }}>
                  <span style={{ fontSize: 13, marginRight: 10 }}>Answer Language:</span>
                  <select
                    value={answerLanguage}
                    onChange={e => setAnswerLanguage(e.target.value)}
                    style={{ fontSize: 13, padding: '4px 8px', borderRadius: 4 }}
                  >
                    <option value="en">English</option>
                    <option value="hi">हिंदी</option>
                  </select>
                </div>
                <textarea
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  placeholder={answerLanguage === 'hi'
                    ? "यहाँ अपना उत्तर लिखें... (या बोलने के लिए माइक्रोफोन बटन दबाएँ)"
                    : "Type your answer here... (or use the microphone button to speak)"}
                  style={{
                    width: "100%",
                    minHeight: 100,
                    padding: 10,
                    fontSize: 14,
                    borderRadius: 6,
                    border: isListening ? "2px solid #4CAF50" : "1px solid #d1d5db",
                    fontFamily: answerLanguage === 'hi' ? 'Noto Sans Devanagari, Mangal, Arial, sans-serif' : 'inherit',
                    resize: "vertical",
                  }}
                />
                <div style={{ marginTop: 8, display: "flex", gap: 8, alignItems: "center" }}>
                  <button
                    onClick={toggleSpeechToText}
                    style={{
                      padding: "8px 16px",
                      backgroundColor: isListening ? '#f44336' : '#4CAF50',
                      color: 'white',
                      border: 'none',
                      borderRadius: '5px',
                      cursor: 'pointer',
                      fontSize: '14px',
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    {isListening
                      ? (answerLanguage === 'hi' ? '🎤 सुनना बंद करें' : '🎤 Stop Listening')
                      : (answerLanguage === 'hi' ? '🎤 वॉयस इनपुट' : '🎤 Voice Input')}
                  </button>
                  <span style={{ fontSize: 12, color: "#6b7280" }}>
                    {answerLanguage === 'hi'
                      ? '💡 आपके बोले गए उत्तर पूरे वीडियो रिकॉर्डिंग में कैप्चर होते हैं'
                      : '💡 Your spoken answers are captured in the full video recording'}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div
            style={{
              padding: 16,
              borderRadius: 8,
              border: "1px solid #e5e7eb",
              maxHeight: 450,
              overflow: "auto",
              background: "white",
            }}
          >
            <strong style={{ fontSize: 16 }}>Questions & Answers</strong>
            <div style={{ marginTop: 12 }}>
              {qaData.length === 0 && (
                <div style={{ color: "#9ca3af", fontSize: 14, fontStyle: "italic" }}>
                  No answers recorded yet
                </div>
              )}
              {qaData.slice().reverse().map((qa, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: 12,
                    marginBottom: 12,
                    borderRadius: 6,
                    background: "#f9fafb",
                    border: "1px solid #e5e7eb",
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 6, color: "#1f2937" }}>
                    Q{qaData.length - idx}: {qa.question}
                  </div>
                  <div style={{ fontSize: 13, color: "#4b5563", marginBottom: 4, lineHeight: 1.4 }}>
                    <strong>Answer:</strong> {qa.answer}
                  </div>
                  <div style={{ fontSize: 11, color: "#9ca3af" }}>
                    {new Date(qa.timestamp).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {interviewEnded && (
            <div
              style={{
                marginTop: 12,
                padding: 16,
                borderRadius: 8,
                background: "#10b981",
                color: "white",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: 18, fontWeight: 700 }}>✓ Interview Complete!</div>
              <div style={{ fontSize: 13, marginTop: 8 }}>
                Your interview is being processed with AI evaluation and cheating detection.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default WebCamRecorder;
