import { useEffect, useRef, useCallback } from "react";
import socket from "../utils/socket.js";

const ActivityMonitor = ({ examId, candidateName, email, faceEventRef, onViolation, testStarted }) => {
  const idleTimeout = useRef(null);
  const countsRef = useRef({
    tab_switches: 0,
    inactivities: 0,
    face_not_visible: 0,
  });
  const flushTimer = useRef(null);

  // ---- Flush batched violations to server ----
  const flush = useCallback(() => {
    const payloadCounts = Object.fromEntries(
      Object.entries(countsRef.current).filter(([, v]) => v > 0)
    );

    if (Object.keys(payloadCounts).length > 0) {
      console.log("🔄 Flushing violations to WebSocket:", payloadCounts);

      socket.emit("suspicious_event", {
        question_set_id: examId,
        candidate_name: candidateName,
        candidate_email: email,
        ...payloadCounts,
        timestamp: new Date().toISOString(),
      });

      // Reset counters
      for (const k of Object.keys(countsRef.current)) countsRef.current[k] = 0;
      console.log("✅ Counts reset after flush");
    }

    flushTimer.current = null;
  }, [examId, candidateName, email]);

  // ---- Increment a violation ----
  const bump = useCallback((key) => {
    console.log(`🚨 ActivityMonitor: ${key} violation detected`);

    countsRef.current[key] = (countsRef.current[key] || 0) + 1;
    console.log(`📊 Internal counts after bump:`, countsRef.current);

    if (onViolation) {
      onViolation(key, 1);
    }

    // Flush after 2s batch (same for all violations now)
    if (!flushTimer.current) {
      flushTimer.current = setTimeout(flush, 2000);
    }
  }, [flush, onViolation]);

  // ---- Event listeners ----
  useEffect(() => {
    if (!testStarted) return;
    // console.log("🔧 ActivityMonitor: Setting up event listeners");

    const onVisibility = () => {
      if (document.hidden) bump("tab_switches");
    };

    const resetInactivity = () => {
      clearTimeout(idleTimeout.current);
      idleTimeout.current = setTimeout(() => bump("inactivities"), 10000);
    };

    window.addEventListener("mousemove", resetInactivity);
    window.addEventListener("keydown", resetInactivity);
    document.addEventListener("visibilitychange", onVisibility);

    resetInactivity();

    return () => {
      window.removeEventListener("mousemove", resetInactivity);
      window.removeEventListener("keydown", resetInactivity);
      document.removeEventListener("visibilitychange", onVisibility);
      clearTimeout(idleTimeout.current);
      if (flushTimer.current) clearTimeout(flushTimer.current);
    };
  }, [bump, testStarted]);

  // ---- Face detection callback ----
  useEffect(() => {
    if (faceEventRef) {
      faceEventRef.current = () => bump("face_not_visible");
    }
  }, [faceEventRef, bump]);

  return null;
};

export default ActivityMonitor;
