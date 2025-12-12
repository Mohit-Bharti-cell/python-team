import * as blazeface from "@tensorflow-models/blazeface";
import "@tensorflow/tfjs";
import { useEffect, useRef } from "react";

const FaceDetection = ({ faceEventRef }) => {
  const videoRef = useRef(null);
  const modelRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    let videoEl = null;
    let missCount = 0;

    const startDetectionLoop = () => {
      intervalRef.current = setInterval(async () => {
        if (!videoEl || !modelRef.current) return; // safety check

        try {
          const predictions = await modelRef.current.estimateFaces(videoEl, false);
          const faceNotVisible = !predictions.length;

          if (faceNotVisible) {
            missCount++;
            if (missCount >= 2 && faceEventRef?.current) {
              faceEventRef.current();
              missCount = 0;
            }
          } else {
            missCount = 0;
          }
        } catch (err) {
          console.warn("Face detection error:", err);
        }
      }, 3000);
    };

    const setupCamera = async () => {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });
      if (videoRef.current) {
        videoEl = videoRef.current;
        videoEl.srcObject = stream;
        await new Promise((resolve) => {
          videoEl.onloadedmetadata = () => {
            videoEl.play();
            resolve();
          };
        });
      }
    };

    const loadModelAndStart = async () => {
      try {
        modelRef.current = await blazeface.load();
        await setupCamera();
        startDetectionLoop(); // ✅ make sure this is called
      } catch (err) {
        console.error("Error loading BlazeFace:", err);
      }
    };

    loadModelAndStart();

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      const stream = videoEl?.srcObject;
      stream?.getTracks().forEach((track) => track.stop());
    };
  }, [faceEventRef]);

  return (
    <video ref={videoRef} style={{ display: "none" }} autoPlay playsInline muted />
  );
};

export default FaceDetection;
