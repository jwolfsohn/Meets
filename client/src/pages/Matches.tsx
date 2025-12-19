import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { HeartHandshake } from "lucide-react";

interface Match {
  id: number;
  matchedAt: string;
  otherUser: {
    id: number;
    name: string;
    photo?: string;
  };
}

const Matches = () => {
  const [matches, setMatches] = useState<Match[]>([]);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        const res = await api.get("/api/matches");
        setMatches(res.data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchMatches();
  }, []);

  return (
    <div className="p-2 space-y-4">
      <h2 className="text-3xl font-black text-gray-900 px-2">Matches</h2>

      <div className="space-y-3">
        {matches.map((match) => (
          <div
            key={match.id}
            className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex items-center space-x-4 hover:shadow-md transition"
          >
            <div className="w-16 h-16 bg-gray-200 rounded-full flex-shrink-0 overflow-hidden">
              {match.otherUser.photo ? (
                <img
                  src={match.otherUser.photo}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-400 to-rose-400" />
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg text-gray-800">
                {match.otherUser.name}
              </h3>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">
                Matched {new Date(match.matchedAt).toLocaleDateString()}
              </p>
            </div>
            <Link
              to={`/schedule?matchId=${match.id}`}
              className="bg-rose-50 text-rose-600 px-4 py-2 rounded-xl font-bold text-sm hover:bg-rose-100 transition"
            >
              Book Call
            </Link>
          </div>
        ))}
        {matches.length === 0 && (
          <div className="text-center py-16">
            <div className="mx-auto w-16 h-16 rounded-2xl bg-gray-100 flex items-center justify-center">
              <HeartHandshake className="text-gray-300" />
            </div>
            <p className="mt-4 font-black text-gray-800">No matches yet</p>
            <p className="text-sm text-gray-500 mt-1">
              Like a few people and you’ll see them here.
            </p>
            <div className="mt-5">
              <Link
                to="/discovery"
                className="inline-flex items-center justify-center bg-gray-900 text-white px-5 py-3 rounded-2xl font-black shadow-lg hover:bg-gray-800 transition"
              >
                Start swiping
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Matches;
