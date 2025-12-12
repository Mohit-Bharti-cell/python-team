import React, { useState, useEffect } from "react";
import axios from "axios";

export default function ScheduleTest() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [availableDates, setAvailableDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [timeSlots, setTimeSlots] = useState([]);
  const [selectedTime, setSelectedTime] = useState(null);

  // Load available dates once
  useEffect(() => {
    axios.get("http://127.0.0.1:8000/available-dates")
      .then(res => setAvailableDates(res.data.availableDates));
  }, []);

  // Load time slots when date selected
  useEffect(() => {
    if (selectedDate) {
      axios.get(`http://127.0.0.1:8000/available-times/${selectedDate}`)
        .then(res => setTimeSlots(res.data.timeSlots));
    }
  }, [selectedDate]);


  // Generate calendar grid
  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();

  const firstDayIndex = new Date(year, month, 1).getDay(); // day index
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonthEmptyCells = (firstDayIndex + 6) % 7;

  const daysArray = [...Array(prevMonthEmptyCells).fill(null)];

  for (let i = 1; i <= daysInMonth; i++) {
    const full = `${year}-${String(month + 1).padStart(2, "0")}-${String(i).padStart(2, "0")}`;
    daysArray.push(full);
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(year, month + 1));
    setSelectedDate(null);
    setSelectedTime(null);
  };

  const prevMonth = () => {
    setCurrentMonth(new Date(year, month - 1));
    setSelectedDate(null);
    setSelectedTime(null);
  };

  const submitSchedule = () => {
    axios.post("http://127.0.0.1:8000/schedule", {
      candidateId: "12345",
      date: selectedDate,
      time: selectedTime
    })
    .then(() => alert("Scheduled successfully!"));
  };

  return (
    <div className="flex flex-col md:flex-row gap-8 p-6 bg-white shadow-xl rounded-xl w-[90%] max-w-5xl mx-auto">

      {/* Calendar Section */}
      <div className="w-full md:w-1/2">

        <div className="flex justify-between items-center mb-4">
          <button onClick={prevMonth} className="p-2 bg-gray-200 rounded-lg">◀</button>
          <h2 className="text-xl font-semibold">
            {currentMonth.toLocaleString("default", { month: "long" })} {year}
          </h2>
          <button onClick={nextMonth} className="p-2 bg-gray-200 rounded-lg">▶</button>
        </div>

        <div className="grid grid-cols-7 gap-3 text-center">
          {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d => (
            <div key={d} className="font-semibold text-gray-800">{d}</div>
          ))}

          {daysArray.map((day, i) => {
            if (!day) return <div key={i}></div>;

            const isAvailable = availableDates.includes(day);

            return (
              <button
                key={day}
                disabled={!isAvailable}
                onClick={() => isAvailable && setSelectedDate(day)}
                className={[
                  "w-12 h-12 flex items-center justify-center rounded-full",
                  isAvailable
                    ? "bg-blue-100 hover:bg-blue-300 cursor-pointer"
                    : "bg-gray-100 text-gray-400 cursor-not-allowed",
                  selectedDate === day ? "ring-4 ring-blue-500" : ""
                ].join(" ")}
              >
                {parseInt(day.split("-")[2])}
              </button>
            );
          })}
        </div>
      </div>

      {/* Time Slots */}
      <div className="w-full md:w-1/2">
        <h2 className="text-lg font-semibold mb-3">
          {selectedDate ? `Times for ${selectedDate}` : "Pick a date"}
        </h2>

        <div className="grid grid-cols-2 gap-3">
          {timeSlots.map(slot => (
            <button
              key={slot}
              onClick={() => setSelectedTime(slot)}
              className={[
                "py-2 rounded-lg text-white",
                selectedTime === slot
                  ? "bg-blue-700"
                  : "bg-blue-500 hover:bg-blue-600"
              ].join(" ")}
            >
              {slot}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={submitSchedule}
        className="w-full mt-6 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl"
        disabled={!selectedDate || !selectedTime}
      >
        Confirm Schedule
      </button>
    </div>
  );
}
