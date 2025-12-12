import { Info, X } from 'lucide-react';
import { useState, useEffect } from 'react';

function Calendar({ onSelect, selectedStart, selectedEnd }) {
  const [current, setCurrent] = useState(new Date());

  const daysInMonth = new Date(
    current.getFullYear(),
    current.getMonth() + 1,
    0
  ).getDate();

  const firstDay = (
    new Date(current.getFullYear(), current.getMonth(), 1).getDay() + 6
  ) % 7;

  let days = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let d = 1; d <= daysInMonth; d++) days.push(d);

  const goPrev = () =>
    setCurrent(new Date(current.getFullYear(), current.getMonth() - 1, 1));

  const goNext = () =>
    setCurrent(new Date(current.getFullYear(), current.getMonth() + 1, 1));

  const todayNum = new Date().setHours(0, 0, 0, 0);
  const now = new Date();
  const prevMonthEnd = new Date(current.getFullYear(), current.getMonth(), 0);
  const disablePrev =
    prevMonthEnd < new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const toEnCA = (dateObj) => dateObj.toLocaleDateString('en-CA');
  const parseLocalMidnight = (s) =>
    s ? new Date(`${s}T00:00:00`) : null;

  const startDateNum = selectedStart ? parseLocalMidnight(selectedStart).getTime() : null;
  const endDateNum = selectedEnd ? parseLocalMidnight(selectedEnd).getTime() : null;

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-3">
        <button
          onClick={!disablePrev ? goPrev : undefined}
          disabled={disablePrev}
          className={`px-2 py-1 rounded ${
            disablePrev
              ? 'text-gray-400 cursor-not-allowed'
              : 'hover:bg-gray-200'
          }`}
        >
          ◀
        </button>

        <h2 className="font-bold text-gray-800">
          {current.toLocaleString('default', { month: 'long' })}{' '}
          {current.getFullYear()}
        </h2>

        <button
          onClick={goNext}
          className="px-2 py-1 bg-white rounded-full shadow"
        >
          ▶
        </button>
      </div>

      <div className="grid grid-cols-7 gap-2 text-xs text-center font-semibold text-gray-600 mb-2">
        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-2 text-center">
        {days.map((d, index) => {
          if (!d) return <div key={index}></div>;

          const currentDateObj = new Date(
            current.getFullYear(),
            current.getMonth(),
            d
          );

          const local = toEnCA(currentDateObj);
          const numeric = currentDateObj.setHours(0, 0, 0, 0);

          const isPast = numeric < todayNum;
          const isStart = selectedStart === local;
          const isEnd = selectedEnd === local;
          const inRange =
            startDateNum !== null &&
            endDateNum !== null &&
            numeric > Math.min(startDateNum, endDateNum) &&
            numeric < Math.max(startDateNum, endDateNum);

          let classes = 'p-2 rounded-full transition w-full';

          if (isPast) {
            classes += ' bg-gray-200 text-gray-400 cursor-not-allowed';
          } else if (isStart && isEnd) {
            classes += ' bg-blue-600 text-white';
          } else if (isStart) {
            classes += ' bg-blue-600 text-white';
          } else if (isEnd) {
            classes += ' bg-blue-600 text-white';
          } else if (inRange) {
            classes += ' bg-blue-300 text-white';
          } else {
            classes += ' bg-blue-100 hover:bg-blue-300';
          }

          return (
            <button
              key={index}
              disabled={isPast}
              onClick={() => onSelect(currentDateObj)}
              className={classes}
            >
              {d}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function TestDetail({
  formData,
  onUpdate,
  onNext,
  onCancel,
  loading,
}) {
  const [newSkill, setNewSkill] = useState('');

  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [selectedStart, setSelectedStart] = useState(formData.startDate || null);
  const [selectedEnd, setSelectedEnd] = useState(formData.endDate || null);
  const [selectedTime, setSelectedTime] = useState(formData.startTime || null);
  const [selectedEndTime, setSelectedEndTime] = useState(formData.endTime || null);

  const timeSlots = [
    '10:00 AM','10:30 AM','11:00 AM','11:30 AM','12:00 PM','12:30 PM','1:00 PM',
    '2:00 PM','2:30 PM','3:00 PM','3:30 PM','4:00 PM','4:30 PM','5:00 PM'
  ];

  useEffect(() => {
    if (showScheduleModal) {
        setSelectedStart(formData.startDate || null);
        setSelectedEnd(formData.endDate || null);
        setSelectedTime(formData.startTime || null);
        setSelectedEndTime(formData.endTime || null);
    }
  }, [showScheduleModal, formData]);

  // SKILL FUNCTIONS
  const addSkill = () => {
    const skillTrim = newSkill.trim().toLowerCase();
    const existing = formData.skills.map((s) => s.toLowerCase());

    if (skillTrim && !existing.includes(skillTrim)) {
      const properCase = newSkill.trim();
      onUpdate({
        skills: [...formData.skills, properCase],
        skillLevels: [
          ...formData.skillLevels,
          { skill: properCase, level: 'Any', mcq: 0, coding: 0, audio: 0, video: 0 },
        ],
      });
    }
    setNewSkill('');
  };

  const removeSkill = (skillToRemove) => {
    onUpdate({
      skills: formData.skills.filter((s) => s !== skillToRemove),
      skillLevels: formData.skillLevels.filter((sl) => sl.skill !== skillToRemove),
    });
  };

  const updateSkillLevel = (skill, field, value) => {
    onUpdate({
      skillLevels: formData.skillLevels.map((sl) =>
        sl.skill === skill ? { ...sl, [field]: value } : sl
      ),
    });
  };

  const getTotalQuestions = () => {
    return formData.skillLevels.reduce(
      (sum, sl) =>
        sum + (sl.mcq || 0) + (sl.coding || 0) + (sl.audio || 0) + (sl.video || 0),
      0
    );
  };

  // AUTOMATICALLY TOGGLE START/END DATE SELECTION
  const handleDateSelect = (date) => {
    const localDate = date.toLocaleDateString('en-CA');
    if (!selectedStart || (selectedStart && selectedEnd)) {
      setSelectedStart(localDate);
      setSelectedEnd(null);
    } else if (!selectedEnd) {
      if (new Date(localDate) < new Date(selectedStart)) {
        setSelectedEnd(selectedStart);
        setSelectedStart(localDate);
      } else {
        setSelectedEnd(localDate);
      }
    }
  };

  return (
    <div>
      {/* INFO BOX */}
      <div className="bg-[#DDEFFC] border border-blue-200 rounded-xl p-4 mb-6 flex items-start gap-3">
        <Info className="text-blue-600 mt-0.5" size={20} />
        <div>
          <h3 className="font-semibold text-gray-900 mb-1">Provide Role Information</h3>
          <p className="text-sm text-gray-600">
            Recruiters manage end-to-end hiring — from creating job descriptions to shortlisting candidates and managing assessments
          </p>
        </div>
      </div>

      {/* FORM SECTION */}
      <div className="bg-white rounded-xl shadow-md border-gray-300 p-4 sm:p-6 mb-6">
        {/* ROLE TITLE */}
        <div className="mb-4 sm:mb-6">
          <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-2">
            Role Title
          </label>
          <input
            type="text"
            value={formData.roleTitle}
            onChange={(e) => onUpdate({ roleTitle: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-500 outline-none transition"
            placeholder="e.g., UI/UX Designer"
          />
        </div>

        {/* SKILLS */}
        <div className="mb-4 sm:mb-6">
          <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-2">
            Skills
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {formData.skills.map((skill) => (
              <span
                key={skill}
                className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full flex items-center gap-2 text-sm"
              >
                {skill}
                <button onClick={() => removeSkill(skill)}>
                  <X size={14} />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-500 outline-none transition"
              placeholder="Add a skill"
            />
            <button
              onClick={addSkill}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg"
            >
              Add
            </button>
          </div>
        </div>

        {/* EXPERIENCE */}
        <div className="mb-4">
          <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-2">
            Experience (in years)
          </label>
          <input
            type="number"
            placeholder="e.g., 2 Years"
            value={formData.experience || ''}
            onChange={(e) => onUpdate({ experience: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-500 outline-none transition"
          />
        </div>

        {/* WORK ARRANGEMENT */}
        <div className="mb-4">
          <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-2">
            Work Arrangement
          </label>
          <select
            value={formData.workType || ''}
            onChange={(e) => onUpdate({ workType: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-500 outline-none transition"
          >
            <option value="">Select</option>
            <option value="remote">Remote</option>
            <option value="on-site">On-Site</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </div>

        {/* LOCATION */}
        <div className="mb-4">
          <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-2">
            Location
          </label>
          <input
            type="text"
            placeholder="e.g., Kolkata"
            value={formData.location || ''}
            onChange={(e) => onUpdate({ location: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-500 outline-none transition"
          />
        </div>

        {/* COMPENSATION RANGE */}
        <div className="mb-4">
          <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-2">
            Annual Compensation (INR)
          </label>
          <div className="flex gap-3">
            <input
              type="number"
              placeholder="Min Amount"
              value={formData.minCompensation || ''}
              onChange={(e) => onUpdate({ minCompensation: e.target.value })}
              className="w-1/2 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-500 outline-none transition"
            />
            <input
              type="number"
              placeholder="Max Amount"
              value={formData.maxCompensation || ''}
              onChange={(e) => onUpdate({ maxCompensation: e.target.value })}
              className="w-1/2 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-500 outline-none transition"
            />
          </div>
        </div>

        {/* SCHEDULE BUTTON */}
        <div className="mt-4">
          <label className="block text-xs sm:text-sm font-semibold text-gray-900 mb-2">
            Schedule Test Date
          </label>
          <button
            type="button"
            onClick={() => setShowScheduleModal(true)}
            className="px-4 py-2 w-full bg-white border rounded-lg hover:bg-gray-100"
          >
            {selectedStart && selectedTime && selectedEnd && selectedEndTime
              ? `${selectedStart} at ${selectedTime} → ${selectedEnd} at ${selectedEndTime}`
              : 'Pick Date & Time'}
          </button>
        </div>
      </div>

      {/* SKILL TABLE */}
      {formData.skills.length > 0 && (
        <div className="bg-white rounded-xl shadow-md p-4 border">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead className="bg-gray-100">
                <tr>
                  {['Skills','Level','MCQ','Coding','Audio','Video'].map((h) => (
                    <th key={h} className="px-4 py-2 text-left">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {formData.skillLevels.map((sl) => (
                  <tr key={sl.skill}>
                    <td className="px-4 py-3">{sl.skill}</td>
                    <td className="px-4 py-3">
                      <select
                        value={sl.level}
                        onChange={(e) =>
                          updateSkillLevel(sl.skill, 'level', e.target.value)
                        }
                        className="border px-2 py-1 rounded"
                      >
                        <option>Any</option>
                        <option>Beginner</option>
                        <option>Medium</option>
                        <option>Advanced</option>
                      </select>
                    </td>
                    {['mcq','coding','audio','video'].map((field) => (
                      <td key={field} className="px-4 py-3">
                        <input
                          type="number"
                          min="0"
                          value={sl[field] || 0}
                          onChange={(e) =>
                            updateSkillLevel(sl.skill, field, parseInt(e.target.value) || 0)
                          }
                          className="w-16 text-center border rounded px-2 py-1"
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center mt-3 bg-gray-50 px-4 py-3 rounded-xl">
            <span className="font-semibold">Total Questions: {getTotalQuestions()}</span>
            <div className="flex gap-3">
              <button
                onClick={onCancel}
                className="px-5 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={onNext}
                disabled={loading || getTotalQuestions() === 0}
                className="px-5 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300"
              >
                {loading ? 'Generating...' : 'Generate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SCHEDULE MODAL */}
      {showScheduleModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg w-[90%] max-w-2xl p-6">
            <h2 className="text-xl font-bold mb-4">Schedule Examination</h2>

            {/* TIME PICKERS */}
            <div className="grid grid-cols-2 gap-4 mt-6">
              <div>
                <label className="block mb-1 font-semibold text-sm">Start Time</label>
                <select
                  value={selectedTime || ''}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  className="w-full border rounded-lg p-2"
                >
                  <option value="">Select Start Time</option>
                  {timeSlots.map((slot) => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block mb-1 font-semibold text-sm">End Time</label>
                <select
                  value={selectedEndTime || ''}
                  onChange={(e) => setSelectedEndTime(e.target.value)}
                  className="w-full border rounded-lg p-2"
                  disabled={!selectedTime}
                >
                  <option value="">Select End Time</option>
                  {timeSlots.map((slot) => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* CALENDAR */}
            <Calendar
              selectedStart={selectedStart}
              selectedEnd={selectedEnd}
              onSelect={handleDateSelect}
              className="rounded-md border mt-6"
            />

            {/* ACTION BUTTONS */}
            <div className="flex justify-end mt-6 gap-3">
              <button
                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg"
                onClick={() => setShowScheduleModal(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 bg-blue-500 text-white rounded-lg"
                disabled={!selectedStart || !selectedEnd || !selectedTime || !selectedEndTime}
                onClick={() => {
                    const payload = {
                        startDate: selectedStart,
                        startTime: selectedTime,
                        endDate: selectedEnd,
                        endTime: selectedEndTime,
                    };

                    console.log("✅ Schedule saved:", payload);

                    onUpdate(payload);
                    setShowScheduleModal(false);
                }}
              >
                Save Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
