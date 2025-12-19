import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api, getApiErrorMessage } from "../lib/api";
import { Image, Sparkles } from "lucide-react";

type Prompt = { question: string; answer: string };

const PROMPT_BANK = [
  "I'm overly competitive about…",
  "A non‑negotiable for me is…",
  "My ideal Sunday looks like…",
  "The way to win me over is…",
  "Two truths and a lie…",
  "You should not go out with me if…",
  "The last time I laughed way too hard was…",
  "Biggest green flag…",
  "The quickest way to my heart is…",
];

function safeJsonParse(input: unknown): any | null {
  if (typeof input !== "string") return null;
  try {
    return JSON.parse(input);
  } catch {
    return null;
  }
}

const ProfileSetup = () => {
  const { refresh } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [displayName, setDisplayName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [location, setLocation] = useState("");
  const [bio, setBio] = useState("");
  const [prompts, setPrompts] = useState<Prompt[]>([
    { question: PROMPT_BANK[0], answer: "" },
    { question: PROMPT_BANK[2], answer: "" },
  ]);
  const [photoUrls, setPhotoUrls] = useState<string[]>(["", "", ""]);

  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/api/profile/me");
        const p = res.data;
        if (p) {
          setDisplayName(p.displayName ?? "");
          setAge(p.age != null ? String(p.age) : "");
          setBio(p.bio ?? "");
          setLocation(p.location ?? "");
          setGender(p.gender ?? "");

          const pref = safeJsonParse(p.preferences);
          const prefPrompts = Array.isArray(pref?.prompts)
            ? pref.prompts
            : null;
          if (prefPrompts && prefPrompts.length > 0) {
            const cleaned = prefPrompts
              .filter((x: any) => x && typeof x.question === "string")
              .slice(0, 2)
              .map((x: any) => ({
                question: x.question,
                answer: typeof x.answer === "string" ? x.answer : "",
              }));
            if (cleaned.length > 0)
              setPrompts((prev) =>
                cleaned.length === 2 ? cleaned : [cleaned[0], prev[1]]
              );
          }

          if (Array.isArray(p.photos) && p.photos.length > 0) {
            const urls = p.photos
              .sort((a: any, b: any) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
              .slice(0, 3)
              .map((ph: any) => ph.url)
              .filter((u: any) => typeof u === "string");
            setPhotoUrls((prev) => [
              urls[0] ?? prev[0],
              urls[1] ?? prev[1],
              urls[2] ?? prev[2],
            ]);
          }
        }
      } catch {
        // ignore if no profile yet
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const steps = useMemo(
    () => [
      { title: "Basics", subtitle: "Name + a few details" },
      { title: "Prompts", subtitle: "Make it easy to like you" },
      { title: "Photos", subtitle: "Add 1–3 photos (URLs for now)" },
    ],
    []
  );

  const canGoNext = useMemo(() => {
    if (step === 0)
      return displayName.trim().length > 0 && age.trim().length > 0;
    if (step === 1) return true;
    return true;
  }, [step, displayName, age]);

  const handleSave = async () => {
    setError("");
    setFieldErrors({});
    setIsSaving(true);
    try {
      const pref = JSON.stringify({
        prompts: prompts
          .map((p) => ({ question: p.question, answer: p.answer.trim() }))
          .filter((p) => p.question && p.answer),
      });

      await api.post("/api/profile", {
        displayName,
        age: parseInt(age, 10),
        bio,
        location,
        gender,
        preferences: pref,
        photos: photoUrls,
      });
      await refresh();
      navigate("/discovery");
    } catch (err) {
      const fe = (err as any)?.response?.data?.fieldErrors;
      if (fe && typeof fe === "object") setFieldErrors(fe);
      setError(getApiErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-md mx-auto px-2 pb-6">
      <div className="pt-2 pb-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs font-bold tracking-widest text-gray-400 uppercase">
              Onboarding
            </div>
            <div className="text-2xl font-black text-gray-900">
              {steps[step]?.title}
            </div>
            <div className="text-sm text-gray-500">{steps[step]?.subtitle}</div>
          </div>
          <div className="flex items-center gap-2">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`h-2.5 w-2.5 rounded-full transition ${
                  i <= step ? "bg-rose-500" : "bg-gray-200"
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 border border-red-100 p-3 rounded-2xl mb-3 text-sm">
          {error}
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
        {isLoading ? (
          <div className="p-6 text-gray-500">Loading your profile…</div>
        ) : (
          <div className="p-6">
            {step === 0 && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-gray-500 ml-1">
                    DISPLAY NAME
                  </label>
                  <input
                    className="w-full p-4 bg-gray-50 border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-rose-500 transition"
                    placeholder="e.g. Jack"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                  />
                  {fieldErrors.displayName && (
                    <div className="mt-1 text-xs text-red-500">
                      {fieldErrors.displayName}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-gray-500 ml-1">
                      AGE
                    </label>
                    <input
                      className="w-full p-4 bg-gray-50 border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-rose-500 transition"
                      placeholder="e.g. 24"
                      inputMode="numeric"
                      value={age}
                      onChange={(e) => setAge(e.target.value)}
                    />
                    {fieldErrors.age && (
                      <div className="mt-1 text-xs text-red-500">
                        {fieldErrors.age}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 ml-1">
                      GENDER
                    </label>
                    <select
                      className="w-full p-4 bg-gray-50 border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-rose-500 transition"
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                    >
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Non-binary">Non-binary</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 ml-1">
                    LOCATION
                  </label>
                  <input
                    className="w-full p-4 bg-gray-50 border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-rose-500 transition"
                    placeholder="e.g. NYC"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                  {fieldErrors.location && (
                    <div className="mt-1 text-xs text-red-500">
                      {fieldErrors.location}
                    </div>
                  )}
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-5">
                <div className="flex items-center gap-2 text-gray-900">
                  <Sparkles size={18} className="text-rose-500" />
                  <div className="font-black">Prompts people can like</div>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-500 ml-1">
                    ABOUT YOU (OPTIONAL)
                  </label>
                  <textarea
                    className="w-full min-h-[110px] p-4 bg-gray-50 border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-rose-500 transition resize-none"
                    placeholder="One line that makes it easy to start a conversation…"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                  />
                  {fieldErrors.bio && (
                    <div className="mt-1 text-xs text-red-500">
                      {fieldErrors.bio}
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  {prompts.map((p, idx) => (
                    <div
                      key={idx}
                      className="bg-gray-50 rounded-2xl p-4 border border-gray-100"
                    >
                      <div className="flex items-center gap-2">
                        <select
                          className="flex-1 bg-white rounded-xl p-3 border border-gray-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
                          value={p.question}
                          onChange={(e) => {
                            const q = e.target.value;
                            setPrompts((prev) =>
                              prev.map((x, i) =>
                                i === idx ? { ...x, question: q } : x
                              )
                            );
                          }}
                        >
                          {PROMPT_BANK.map((q) => (
                            <option key={q} value={q}>
                              {q}
                            </option>
                          ))}
                        </select>
                      </div>
                      <textarea
                        className="mt-3 w-full min-h-[70px] p-3 bg-white rounded-xl border border-gray-100 focus:outline-none focus:ring-2 focus:ring-rose-500 transition resize-none"
                        placeholder="Your answer…"
                        value={p.answer}
                        onChange={(e) => {
                          const a = e.target.value;
                          setPrompts((prev) =>
                            prev.map((x, i) =>
                              i === idx ? { ...x, answer: a } : x
                            )
                          );
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-gray-900">
                  <Image size={18} className="text-rose-500" />
                  <div className="font-black">Add photos</div>
                </div>
                <div className="text-sm text-gray-500">
                  For now, paste image URLs. (Upload support is the next obvious
                  upgrade.)
                </div>

                <div className="space-y-3">
                  {photoUrls.map((url, idx) => (
                    <div key={idx}>
                      <label className="text-xs font-bold text-gray-500 ml-1">
                        PHOTO URL {idx + 1}
                      </label>
                      <input
                        className="w-full p-4 bg-gray-50 border-gray-100 rounded-2xl focus:outline-none focus:ring-2 focus:ring-rose-500 transition"
                        placeholder="https://…"
                        value={url}
                        onChange={(e) => {
                          const v = e.target.value;
                          setPhotoUrls((prev) =>
                            prev.map((x, i) => (i === idx ? v : x))
                          );
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="p-4 border-t border-gray-100 bg-white">
          <div className="flex items-center justify-between gap-3">
            <button
              disabled={step === 0 || isSaving}
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              className="flex-1 bg-gray-100 text-gray-800 rounded-2xl font-bold py-3 hover:bg-gray-200 transition disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Back
            </button>
            {step < steps.length - 1 ? (
              <button
                disabled={!canGoNext || isSaving}
                onClick={() =>
                  setStep((s) => Math.min(steps.length - 1, s + 1))
                }
                className="flex-1 bg-gray-900 text-white rounded-2xl font-black py-3 hover:bg-gray-800 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Next
              </button>
            ) : (
              <button
                disabled={isSaving}
                onClick={handleSave}
                className="flex-1 bg-gradient-to-r from-rose-500 to-purple-600 text-white rounded-2xl font-black py-3 shadow-lg hover:opacity-90 transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {isSaving ? "Saving…" : "Finish"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSetup;
