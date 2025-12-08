import React, { useState } from "react";

export default function PestScanner() {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  // Handle file selection
  const handleFileSelect = (e) => {
    const f = e.target.files[0];
    if (f) {
      setFile(f);
      setFileName(f.name);
    }
  };

  // Main pest detection function
  const checkPests = async () => {
    if (!file) {
      alert("Please select an image!");
      return;
    }

    setLoading(true);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      // If you use your node proxy:
      // const API_URL = "http://localhost:5000/api/pest/predict";

      // If you call HuggingFace directly:
     const response = await fetch("http://localhost:5000/api/pest/predict", {
  method: "POST",
  body: formData,
});

      const data = await response.json();
      setResult(data);

    } catch (error) {
      console.error(error);
      alert("Error connecting to server!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-orange-50">
      <div className="bg-white p-8 w-[450px] rounded-xl shadow-xl text-center">

        <h2 className="text-2xl font-bold text-orange-700 mb-2">
          🦗 Phasal Pest Doctor
        </h2>

        <p className="text-gray-600 text-sm mb-4">
          Upload photo to detect & count insects
        </p>

        {/* Upload Box */}
        <label
          htmlFor="fileInput"
          className="border-2 border-orange-700 bg-orange-100 p-6 rounded-lg 
                     cursor-pointer font-semibold text-orange-700 hover:bg-orange-200"
        >
          📸 Click to Upload Image
        </label>

        <input id="fileInput" type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />

        {fileName && (
          <p className="text-gray-500 text-sm mt-2">Selected: {fileName}</p>
        )}

        {/* Button */}
        <button
          disabled={loading}
          onClick={checkPests}
          className={`w-full py-3 mt-4 rounded-lg font-bold text-white transition 
            ${loading ? "bg-gray-400" : "bg-orange-600 hover:bg-orange-700"}`}
        >
          {loading ? "Scanning..." : "🔍 Scan for Pests"}
        </button>

        {loading && (
          <p className="text-orange-600 font-semibold mt-2">
            🦟 Scanning Field... (Please wait)
          </p>
        )}

        {/* Result Section */}
        {result && (
          <div className="mt-6 text-left border-t pt-4">

            {/* MAIN STATUS */}
            <div
              className={`text-center font-bold text-lg p-3 rounded-lg mb-4 
                ${result.status === "SAFE"
                ? "bg-green-100 text-green-700"
                : "bg-red-100 text-red-700"
                }`}
            >
              {result.status === "SAFE" ? (
                <>✅ Fasal Surakshit Hai (Safe)</>
              ) : (
                <>⚠ {result.total_pests} Keede Mile (Infected)</>
              )}
            </div>

            {/* SAFE CASE */}
            {result.status === "SAFE" && (
              <p className="text-center text-gray-600 mb-3">
                Koi hanikarak keeda nahi mila.
              </p>
            )}

            {/* INFECTED CASE */}
            {result.status !== "SAFE" &&
              result.report?.map((pest, idx) => (
                <div
                  key={idx}
                  className="bg-slate-50 border-l-4 p-3 rounded-md shadow-sm mb-4"
                  style={{
                    borderColor:
                      pest.severity === "CRITICAL" ? "#dc2626" : "#eab308",
                  }}
                >
                  {/* Name & count */}
                  <div className="flex justify-between font-bold text-gray-700">
                    <span>{pest.pest}</span>
                    <span className="bg-gray-800 text-white px-2 py-1 rounded-full text-xs">
                      {pest.count} detected
                    </span>
                  </div>

                  {/* Severity */}
                  <div
                    className={`inline-block mt-2 text-xs font-bold px-2 py-1 rounded 
                      ${pest.severity === "CRITICAL"
                        ? "bg-red-100 text-red-600 border border-red-300"
                        : "bg-yellow-100 text-yellow-700 border border-yellow-300"}  
                    `}
                  >
                    {pest.severity}
                  </div>

                  {/* Advice */}
                  <p className="text-gray-600 text-sm italic mt-2">
                    💡 {pest.solution}
                  </p>

                  {/* Buy Button */}
                  <a
                    href={pest.links?.amazon}
                    target="_blank"
                    className="block bg-blue-600 text-white text-center mt-3 py-1 rounded text-sm"
                  >
                    🛒 Buy Medicine ({pest.links?.medicine})
                  </a>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
