import { useState } from "react";
import { Info, CheckCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import ReviewAPI from "../api/reviewApi";

export default function ReviewFinalise({ formData, questions, onBack, loading }) {
  const navigate = useNavigate();
  const [localLoading, setLocalLoading] = useState(false);
  const [error, setError] = useState(null);

  const displayQuestions = questions.map((q, idx) => {
    const content = q.content || {};

    const base = {
      id: idx + 1,
      question_id: q.question_id,
      text:
        content.prompt ||
        content.question ||
        content.prompt_text ||
        "No question text provided",
      tags: [q.skill],
      skills: [q.skill],
      difficulty: q.difficulty || "medium",
      skill: q.skill,
      type: q.type,
    };

    switch (q.type) {
      case "mcq":
        return {
          ...base,
          options: content.options || [],
          correctAnswer: content.answer || "",
          explanation: content.explanation || "No explanation provided",
          time: q.time_limit || 60,
          marks: q.positive_marking || 1,
          negative_marking: q.negative_marking || 0,
          questionType: "MCQ",
        };
      case "coding":
        return {
          ...base,
          input_spec: content.input_spec || "",
          output_spec: content.output_spec || "",
          examples: content.examples || [],
          time: q.time_limit || 300,
          marks: q.positive_marking || 5,
          questionType: "Coding",
        };
      case "audio":
        return {
          ...base,
          expected_keywords: content.expected_keywords || [],
          rubric: content.rubric || "",
          time: q.time_limit || content.suggested_time_seconds || 120,
          marks: 0,
          questionType: "Audio",
        };
      case "video":
        return {
          ...base,
          rubric: content.rubric || "",
          time: q.time_limit || content.suggested_time_seconds || 180,
          marks: 0,
          questionType: "Video",
        };
      default:
        return { ...base, text: "Question format not supported" };
    }
  });

  const totalQuestions = displayQuestions.length;
  const totalMarks = displayQuestions.reduce((sum, q) => sum + (q.marks || 0), 0);
  const totalTime = Math.ceil(
    displayQuestions.reduce((sum, q) => sum + parseInt(q.time || 0), 0) / 60
  );

  const skillDistribution = displayQuestions.reduce((acc, q) => {
    const skill = q.skill || "Unknown";
    if (!acc[skill]) acc[skill] = { count: 0, marks: 0 };
    acc[skill].count += 1;
    acc[skill].marks += q.marks || 0;
    return acc;
  }, {});

  const skills = Object.entries(skillDistribution).map(([name, data]) => ({
    name,
    value: data.count,
    marks: data.marks,
    maxValue: totalQuestions,
  }));

  const handleFinalize = async () => {
    setLocalLoading(true);
    setError(null);

    try {
      const payload = ReviewAPI.prepareFinalizePayload(formData, questions);
      const response = await ReviewAPI.finalizeTest(payload);

      if (response.status === "success") {
        const jobData = {
          title: response.test_title || formData.roleTitle,
          skills: formData.skills || [],
          location: formData.location || "Remote",
          workType: formData.experience || "Full-time",
          employmentMode: formData.workArrangement || "On-site",
          currency: formData.currency || "INR",
          minCompensation: formData.minCompensation || "-",
          maxCompensation: formData.maxCompensation || "-",
          description: `Assessment for ${formData.roleTitle} role.`,
          examDate: formData.startDate || "—",
          endDate: formData.endDate || "—",
          expiryTime: response.expiry_time,
          isActive: true,
          questionSetId: response.question_set_id,
        };

        const saved = JSON.parse(localStorage.getItem("jobDataList")) || [];
        saved.push(jobData);
        localStorage.setItem("jobDataList", JSON.stringify(saved));
        localStorage.setItem("jobData", JSON.stringify(jobData));

        navigate("/Created", {
          state: {
            testTitle: response.test_title,
            questionSetId: response.question_set_id,
            totalQuestions,
            totalMarks,
            expiryTime: response.expiry_time,
          },
        });
      } else {
        throw new Error("Failed to finalize test");
      }
    } catch (err) {
      setError(err.message || "Failed to finalize test. Please try again.");
    } finally {
      setLocalLoading(false);
    }
  };

  const isLoading = loading || localLoading;

  return (
    <div className="min-h-screen bg-gray-50 flex justify-center p-6">
      <div className="w-full max-w-5xl flex flex-col gap-8">

        {/* Review Header */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5 flex items-start gap-3">
          <Info className="text-blue-600 mt-0.5 shrink-0" size={20} />
          <div>
            <h3 className="font-semibold text-gray-900 text-lg mb-1">
              Review & Finalize Test
            </h3>
            <p className="text-sm text-gray-600">
              Review all test details and questions below. Click <strong>“Finalize”</strong> to publish.
            </p>
          </div>
        </div>

        {/* Graph Section */}
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-300">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Question Distribution by Skill</h2>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-sm text-gray-700 font-medium">Questions Count</span>
            </div>
          </div>

          <div className="overflow-x-auto pb-4">
            <div className="min-w-[400px] relative pl-12">

              {/* Clean Y-axis Labels */}
              <div className="absolute left-0 top-0 h-64 flex flex-col justify-between text-sm text-gray-500 font-medium">
                {Array.from(
                  new Set([
                    totalQuestions,
                    Math.ceil(totalQuestions * 0.75),
                    Math.ceil(totalQuestions * 0.5),
                    Math.ceil(totalQuestions * 0.25),
                    0,
                  ])
                )
                .sort((a, b) => b - a)
                .map((val, idx) => (
                  <span key={idx}>{val}</span>
                ))}
              </div>

              {/* Graph Body */}
              <div className="border-l-2 border-b-2 border-gray-300 h-64 relative">

                {/* Horizontal Grid Lines */}
                {[0, 25, 50, 75].map((percentage) => (
                  <div
                    key={percentage}
                    className="absolute w-full border-t border-gray-200"
                    style={{ bottom: `${percentage}%` }}
                  ></div>
                ))}

                {/* Bars */}
                <div className="h-full flex items-end justify-around px-8 pb-2 gap-4">
                  {skills.map((skill, index) => {
                    const heightPercentage = (skill.value / totalQuestions) * 100;

                    return (
                      <div key={index} className="flex flex-col items-center group">
                        <div className="relative flex flex-col items-center">
                          <span className="text-sm font-semibold text-gray-700 mb-2">
                            {skill.value}
                          </span>

                          <div
                            className="w-16 lg:w-20 bg-gradient-to-t from-blue-600 to-blue-400 rounded-t-lg transition-all duration-300 hover:from-blue-700 hover:to-blue-500 hover:shadow-lg cursor-pointer"
                            style={{ height: `${(heightPercentage / 100) * 240}px` }}
                          >
                            {/* Tooltip */}
                            <div className="absolute -top-16 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                              {skill.value} questions<br />
                              {skill.marks} marks
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* X-axis Labels */}
              <div className="flex items-start justify-around px-8 mt-4">
                {skills.map((skill, index) => (
                  <div key={index} className="text-center w-16 lg:w-20">
                    <span className="text-sm text-gray-700 font-medium break-words">
                      {skill.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Questions Section */}
        <div className="border border-gray-200 rounded-xl shadow-sm p-6 bg-gray-50">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">All Questions</h3>

          <div className="space-y-4">
            {displayQuestions.map((question) => (
              <div key={question.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <span className="text-lg font-semibold text-blue-600 shrink-0">Q{question.id}</span>
                    <p className="text-gray-900 text-base leading-relaxed">{question.text}</p>
                  </div>
                  <div className="text-sm text-gray-600 font-medium mt-1 md:mt-0">
                    {question.questionType || "—"} • <span className="capitalize">{question.difficulty}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center mt-6 pt-4 border-t border-gray-200 text-sm text-gray-700">
            <p><strong>Total Questions:</strong> {totalQuestions}</p>
            <p><strong>Total Marks:</strong> {totalMarks}</p>
            <p><strong>Total Time:</strong> {totalTime} mins</p>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-between items-center pt-2">
          <button
            onClick={onBack}
            disabled={isLoading}
            className="px-6 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Back
          </button>

          <button
            onClick={handleFinalize}
            disabled={isLoading || displayQuestions.length === 0}
            className={`px-8 py-3 rounded-lg font-semibold flex items-center gap-2 transition ${
              isLoading ? "bg-blue-400 text-white cursor-not-allowed" : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                Finalizing...
              </>
            ) : (
              <>
                <CheckCircle size={20} /> Finalize & Publish Test
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
