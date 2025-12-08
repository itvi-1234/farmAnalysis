import React, { useState } from "react";

export default function LiveCheck() {
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  // Handle file selection
  const handleFileSelect = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setFileName(selected.name);
    }
  };

  // Main disease check handler
  const checkDisease = async () => {
    if (!file) {
      alert("Please select an image!");
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("http://localhost:5000/api/disease/predict", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error(error);
      alert("Server error! Did you enable CORS?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-green-50">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-96 text-center">
        <h2 className="text-green-800 text-2xl font-bold mb-4">🌿 Phasal Doctor</h2>
        <p className="text-gray-700 mb-4">Upload a leaf photo to verify</p>

        {/* Upload Box */}
        <label
          htmlFor="fileInput"
          className="border-2 border-green-700 bg-green-100 p-4 rounded-lg cursor-pointer font-semibold text-green-700 hover:bg-green-200"
        >
          📁 Click to Select Image
        </label>

        <input
          id="fileInput"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileSelect}
        />

        {fileName && (
          <p className="text-gray-500 text-sm mt-2">Selected: {fileName}</p>
        )}

        {/* Button */}
        <button
          onClick={checkDisease}
          disabled={loading}
          className={`mt-4 w-full py-3 rounded-lg text-white font-semibold transition ${
            loading ? "bg-gray-400" : "bg-green-700 hover:bg-green-900"
          }`}
        >
          {loading ? "Analyzing..." : "Check Disease"}
        </button>

        {loading && (
          <p className="text-green-700 mt-2 font-semibold">
            ⏳ Analyzing... (Server jaag raha hai)
          </p>
        )}

        {/* Result Section */}
        {result && (
          <div className="mt-6 text-left border-t pt-4">
            <div className="text-xs font-bold text-gray-600 uppercase">
              Diagnosis
            </div>
            <div className="text-red-600 text-xl font-bold mb-2">
              {result.disease}
            </div>

            <div className="text-xs font-bold text-gray-600 uppercase">
              Suggested Cure
            </div>
            <div className="bg-orange-50 p-3 border-l-4 border-orange-500 rounded-md text-gray-700 mb-3">
              {result.cure}
            </div>

            <div className="text-xs font-bold text-gray-600 uppercase mb-2">
              Buy Medicine Online
            </div>

            <div className="flex gap-3">
              <a
                href={result.buy_links?.amazon}
                target="_blank"
                className="flex-1 bg-orange-500 text-white py-2 rounded-md text-center font-semibold"
              >
                🛒 Amazon
              </a>

              <a
                href={result.buy_links?.flipkart}
                target="_blank"
                className="flex-1 bg-blue-600 text-white py-2 rounded-md text-center font-semibold"
              >
                🛍 Flipkart
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
