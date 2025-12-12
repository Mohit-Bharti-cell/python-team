import React, { useState, useRef } from "react";
import { CheckSquare, Square } from "lucide-react";
import { useNavigate } from "react-router-dom";

const CameraCheck = ({ questionSetId, onBack }) => {
  const navigate = useNavigate();
  const [isChecked, setIsChecked] = useState(false);
  const [cameraAllowed, setCameraAllowed] = useState(false);
  const videoRef = useRef(null);

  const handleNext = () => {
    if (!cameraAllowed) return;
    navigate(`/give-test/${questionSetId}`);
  };

  const handleCheckbox = () => setIsChecked(!isChecked);

  const handleAllowCamera = async () => {
    if (!isChecked) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraAllowed(true);
    } catch (err) {
      console.error("Camera access denied:", err);
      alert("Camera access was denied. Please enable it to continue.");
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-md border border-gray-200 p-6 md:p-10 flex flex-col gap-8">
        <h1 className="text-3xl font-semibold text-center text-gray-800">
          Camera Test
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* Camera Preview */}
          <div className="border border-gray-300 rounded-xl h-56 md:h-64 bg-black flex items-center justify-center relative overflow-hidden">
            {cameraAllowed ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="absolute inset-0 w-full h-full object-cover rounded-xl"
              />
            ) : (
              <span className="text-gray-400 text-sm">Camera Preview</span>
            )}
          </div>

          {/* Text + Controls */}
          <div className="flex flex-col justify-between text-gray-800 text-sm md:text-base">
            <div className="space-y-3">
              <p>
                To continue, please allow access to your device's camera. Your
                camera will be used for identity verification and AI monitoring
                during the virtual exam.
              </p>
              <ul className="list-disc pl-5 space-y-2 text-gray-700">
                <li>
                  We do not record continuously unless required for proctored
                  exams.
                </li>
                <li>All video data is encrypted and securely stored.</li>
                <li>
                  Camera access helps us maintain a fair and secure testing
                  environment.
                </li>
              </ul>
            </div>

            {/* Checkbox */}
            <div
              onClick={handleCheckbox}
              className="flex items-start gap-2 cursor-pointer mt-5"
            >
              {isChecked ? (
                <CheckSquare className="w-5 h-5 text-green-600 mt-0.5" />
              ) : (
                <Square className="w-5 h-5 text-gray-400 mt-0.5" />
              )}
              <span className="text-xs md:text-sm">
                I understand and consent to being recorded during the
                assessment.
              </span>
            </div>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 mt-6">
              <button
                onClick={handleAllowCamera}
                disabled={!isChecked}
                className={`w-full sm:w-auto px-5 py-2.5 rounded-lg text-sm font-medium transition ${
                  isChecked
                    ? "bg-blue-600 text-white hover:bg-blue-700"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                Allow Camera Access
              </button>

              <button
                onClick={onBack}
                className="w-full sm:w-auto px-5 py-2.5 rounded-lg text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-700"
              >
                Cancel & Back
              </button>
            </div>
          </div>
        </div>

        {/* Bottom Buttons */}
        <div className="flex justify-between items-center pt-4 border-t border-gray-200">
          <button
            onClick={onBack}
            className="bg-gray-100 text-gray-700 px-6 py-2 rounded-lg text-sm md:text-base hover:bg-gray-200 transition"
          >
            Back
          </button>

          <button
            onClick={handleNext}
            disabled={!cameraAllowed}
            className={`px-6 py-2 rounded-lg text-sm md:text-base font-medium transition ${
              cameraAllowed
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-300 text-gray-500 cursor-not-allowed"
            }`}
          >
            Continue to Test
          </button>
        </div>
      </div>
    </div>
  );
};

export default CameraCheck;
