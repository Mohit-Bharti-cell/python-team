import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Examination() {
  const navigate = useNavigate();
  const [jobs, setJobs] = useState([]);

  useEffect(() => {
    try {
      // Prefer multiple assessments list; fallback to single jobData
      const jobListRaw = localStorage.getItem("jobDataList");
      let storedJob = null;

      if (jobListRaw) {
        const jobList = JSON.parse(jobListRaw);

        // Prefer latest job that has startTime saved
        if (Array.isArray(jobList) && jobList.length > 0) {
          storedJob =
            [...jobList].reverse().find((j) => j.startTime) ||
            jobList[jobList.length - 1];
        }
      }

      if (!storedJob) {
        const single = localStorage.getItem("jobData");
        storedJob = single ? JSON.parse(single) : null;
      }

      console.log("Loaded jobData:", storedJob);

      const workTypeMap = {
        "1": "Full-time",
        "2": "Part-time",
        "3": "Contract",
        remote: "Remote",
        "on-site": "On-site",
        hybrid: "Hybrid",
      };

      const fixedWorkType =
        workTypeMap[storedJob?.workType] ||
        storedJob?.workType ||
        "Full-time";

      if (storedJob) {
        const dt = storedJob.expiryTime
          ? new Date(storedJob.expiryTime)
          : null;

        const formattedEndTime = dt
          ? dt.toTimeString().slice(0, 5)
          : "—";

        setJobs([
          {
            title: storedJob.title,
            skills: storedJob.skills || [],
            location: storedJob.location || "Remote",

            // FIXED WORK TYPE MAPPING
            workType: fixedWorkType,

            employmentMode: storedJob.employmentMode || "On-site",
            currency: storedJob.currency || "INR",
            minCompensation: storedJob.minCompensation || "-",
            maxCompensation: storedJob.maxCompensation || "-",
            description:
              storedJob.description ||
              `This is an assessment for the ${storedJob.title} role.`,

            // Dates
            startDate: storedJob.startDate || storedJob.examDate || "—",
            endDate: storedJob.endDate || "—",

            // Times
            startTime:
              storedJob.startTime ||
              (storedJob.expiryTime ? "10:00 AM" : "—"),
            endTime: storedJob.endTime || formattedEndTime,

            isActive: storedJob.isActive ?? true,
          },
        ]);
      } else {
        setJobs([
          {
            title: "No Assessment Found",
            location: "—",
            workType: "—",
            employmentMode: "—",
            description:
              "No assessment has been generated yet. Please check back later.",
            startDate: "—",
            startTime: "—",
            endDate: "—",
            endTime: "—",
            isActive: false,
          },
        ]);
      }
    } catch (err) {
      console.error("Error reading jobData from localStorage", err);

      setJobs([
        {
          title: "No Assessment Found",
          location: "—",
          workType: "—",
          employmentMode: "—",
          description:
            "No assessment has been generated yet. Please check back later.",
          startDate: "—",
          startTime: "—",
          endDate: "—",
          endTime: "—",
          isActive: false,
        },
      ]);
    }
  }, []);

  return (
    <div className="min-h-screen px-4 md:px-8 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Available Examinations
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {jobs.map((job, index) => (
          <div
            key={index}
            className="bg-white rounded-2xl p-4 sm:p-6 shadow-md border border-gray-300 hover:shadow-md transition-shadow duration-300 flex flex-col h-full"
          >
            <div className="flex-1">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                {job.title}
              </h2>

              <p className="text-red-500 text-sm sm:text-base mb-4">
                {job.location}
              </p>

              <div className="flex flex-wrap gap-2 mb-2">
                <span className="px-3 py-1 text-xs sm:text-sm font-medium text-green-700 bg-green-50 border border-green-300 rounded-xl">
                  {job.workType}
                </span>

                <span className="px-3 py-1 text-xs sm:text-sm font-medium text-purple-700 bg-purple-50 border border-purple-300 rounded-xl">
                  {job.employmentMode}
                </span>
              </div>

              <p className="text-gray-600 text-sm leading-relaxed mb-2">
                {job.description}
              </p>

              {job.skills && job.skills.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                  {job.skills.map((skill, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 text-xs sm:text-sm bg-blue-50 text-blue-700 border border-blue-200 rounded-xl"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              )}

              <div className="space-y-2 text-sm sm:text-base mb-4">
                <div className="flex">
                  <span className="font-semibold text-gray-900 min-w-[100px]">
                    From:
                  </span>
                  <span className="text-gray-700 ml-2">
                    {job.startDate} at {job.startTime}
                  </span>
                </div>

                <div className="flex">
                  <span className="font-semibold text-gray-900 min-w-[100px]">
                    To:
                  </span>
                  <span className="text-gray-700 ml-2">
                    {job.endDate} at {job.endTime}
                  </span>
                </div>
              </div>
            </div>

            <hr />

            <div className="flex justify-end">
              <button
                onClick={() => navigate("/Examination/Instructions")}
                disabled={!job.isActive}
                className={`mt-2 w-[100px] py-2 rounded-2xl font-medium text-sm sm:text-base transition-all duration-300 ${
                  job.isActive
                    ? "bg-blue-500 hover:bg-blue-600 text-white shadow-md hover:shadow-lg"
                    : "bg-gray-300 text-gray-500 cursor-not-allowed"
                }`}
              >
                Give Test
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
