import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../lib/api";

interface Slot {
  id: number;
  startTime: string;
  endTime: string;
}

const Schedule = () => {
  const [searchParams] = useSearchParams();
  const matchId = searchParams.get("matchId");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [mySlots, setMySlots] = useState<Slot[]>([]);
  const [newSlotTime, setNewSlotTime] = useState("");

  // Fetch slots if matchId is present (showing other person's slots)
  useEffect(() => {
    if (matchId) {
      api
        .get(`/api/schedule/slots/${matchId}`)
        .then((res) => setSlots(res.data));
    }
  }, [matchId]);

  // Fetch my slots always
  useEffect(() => {
    api.get(`/api/schedule/slots`).then((res) => setMySlots(res.data));
  }, []);

  const handleCreateSlot = async () => {
    if (!newSlotTime) return;
    const start = new Date(newSlotTime);
    const end = new Date(start.getTime() + 30 * 60000); // 30 mins

    try {
      await api.post("/api/schedule/slots", {
        startTime: start.toISOString(),
        endTime: end.toISOString(),
      });

      // refresh my slots
      api.get(`/api/schedule/slots`).then((res) => setMySlots(res.data));
      setNewSlotTime("");
    } catch (e) {
      console.error(e);
    }
  };

  const handlePropose = async (slotId: number) => {
    try {
      await api.post("/api/schedule/invite", {
        matchId: parseInt(matchId!),
        slotId,
      });
      alert("Invite sent!");
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="p-2 space-y-6">
      {/* My Availability */}
      <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
        <h2 className="text-xl font-bold mb-4 text-gray-800">
          My Availability
        </h2>
        <div className="flex space-x-2 mb-6">
          <input
            type="datetime-local"
            className="border-gray-200 bg-gray-50 p-3 rounded-xl flex-1 focus:ring-2 focus:ring-rose-500 outline-none"
            value={newSlotTime}
            onChange={(e) => setNewSlotTime(e.target.value)}
          />
          <button
            onClick={handleCreateSlot}
            className="bg-gray-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-gray-800 transition shadow-lg"
          >
            Add
          </button>
        </div>
        <div className="space-y-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
          {mySlots.map((slot) => (
            <div
              key={slot.id}
              className="p-3 border border-gray-100 rounded-xl text-sm bg-gray-50 flex justify-between"
            >
              <span className="font-medium text-gray-600">
                {new Date(slot.startTime).toLocaleDateString()}
              </span>
              <span className="font-bold text-gray-800 justify-self-end">
                {new Date(slot.startTime).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          ))}
          {mySlots.length === 0 && (
            <p className="text-gray-400 text-sm italic">
              You haven't added any slots yet.
            </p>
          )}
        </div>
      </div>

      {/* Booking Others */}
      {matchId ? (
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold mb-4 text-rose-500">Book a Call</h2>
          <div className="space-y-3">
            {slots.length === 0 && (
              <p className="text-gray-400 text-center py-4">
                No available slots.
              </p>
            )}
            {slots.map((slot) => (
              <div
                key={slot.id}
                className="p-4 border border-rose-100 bg-rose-50/50 rounded-2xl flex justify-between items-center hover:bg-rose-50 transition"
              >
                <div className="flex flex-col">
                  <span className="font-semibold text-gray-800">
                    {new Date(slot.startTime).toLocaleDateString()}
                  </span>
                  <span className="text-sm text-gray-500">
                    {new Date(slot.startTime).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <button
                  onClick={() => handlePropose(slot.id)}
                  className="bg-rose-500 text-white px-5 py-2 rounded-xl font-bold text-sm shadow-md hover:bg-rose-600 transition transform active:scale-95"
                >
                  Propose
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center text-gray-400 p-8 border-2 border-dashed border-gray-200 rounded-3xl">
          <p>Select a match to book a call.</p>
        </div>
      )}
    </div>
  );
};

export default Schedule;
