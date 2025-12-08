import React, { useState } from "react";
import Navbar from "../components/dashboard/Navbar";
import Sidebar from "../components/dashboard/Sidebar";
import { useAuth } from "../contexts/authcontext/Authcontext";
import { Navigate, useNavigate } from "react-router-dom";
import { doSignOut } from "../firebase/auth";

export default function LiveCheck() {
  const { currentUser, userLoggedIn } = useAuth();
  const navigate = useNavigate();

  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState("");
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleLogout = async () => {
    try {
      await doSignOut();
      navigate("/");
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (!userLoggedIn) return <Navigate to="/login" replace />;

 const handleFileSelect = (e) => {
  const selected = e.target.files[0];
  if (selected) {
    setFile(selected);
    setFileName(selected.name);
    setPreview(URL.createObjectURL(selected));
    setResult(null);   // 🔥 Clear previous result when new image is uploaded
  }
};

  const checkDisease = async () => {
    if (!file) {
      alert("Please upload an image!");
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
    } catch (err) {
      console.error(err);
      alert("Server error! Did you enable CORS?");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-green-100">
      <Navbar currentUser={currentUser} onLogout={handleLogout} />
      <Sidebar />

      <div className="pt-28 lg:ml-64 px-8">  {/* increased top padding */}
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 mb-3">🌿 Live Disease Check</h2>
          <p className="text-gray-600 mb-8">
            Upload a leaf image and get instant AI-powered diagnosis.
          </p>

          <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 border border-gray-200 p-8 grid grid-cols-1 lg:grid-cols-2 gap-10">
            
            {/* Preview Left */}
            <div className="flex flex-col items-center">
              <div className="w-full h-96 bg-gray-100 rounded-lg border overflow-hidden flex items-center justify-center">
                {preview ? (
                  <img
                    src={preview}
                    alt="preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <p className="text-gray-400">No image selected</p>
                )}
              </div>

              <label
                htmlFor="fileInput"
                className="mt-6 cursor-pointer bg-green-700 hover:bg-green-900 text-white px-6 py-3 rounded-lg font-medium text-lg"
              >
                📁 Upload Leaf Image
              </label>

              <input
                id="fileInput"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />

              {fileName && (
                <p className="mt-3 text-sm text-gray-500">Selected: {fileName}</p>
              )}
            </div>

            {/* Result Right */}
            <div>
              <button
                onClick={checkDisease}
                disabled={loading}
                className={`w-full py-4 rounded-lg text-white font-semibold text-lg transition ${
                  loading ? "bg-gray-400" : "bg-green-700 hover:bg-green-900"
                }`}
              >
                {loading ? "Analyzing..." : "🔍 Analyze Disease"}
              </button>

              {loading && (
                <p className="text-green-800 mt-3 font-medium">
                  ⏳ Processing... Please wait.
                </p>
              )}

              {result && (
  <div className="mt-6 space-y-5">

    {/* DIAGNOSIS CARD — COMPACT */}
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-red-700 uppercase flex items-center gap-2">
        🩺 Diagnosis
      </h3>

      <div className="text-xl font-bold text-red-700 mt-1">
        {result.disease}
      </div>

      <p className="text-xs text-red-600 mt-1">
        AI detected symptoms based on leaf texture.
      </p>
    </div>


    {/* SUGGESTED CURE — COMPACT */}
    <div className="bg-green-50 border border-green-200 rounded-lg p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-green-800 uppercase flex items-center gap-2">
        🌱 Suggested Cure
      </h3>

      <div className="bg-white p-3 text-sm rounded-md border border-green-200 shadow-inner mt-2 leading-snug">
        {result.cure}
      </div>
    </div>


    {/* BUY MEDICINE — COMPACT */}
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-sm">
      <h3 className="text-sm font-semibold text-blue-800 uppercase flex items-center gap-2">
        🛒 Buy Medicine
      </h3>

      <div className="grid grid-cols-2 gap-3 mt-3">

        <a
          href={result.buy_links?.amazon}
          target="_blank"
          className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-medium py-2 rounded-md text-center"
        >
          Amazon
        </a>

        <a
          href={result.buy_links?.flipkart}
          target="_blank"
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 rounded-md text-center"
        >
          Flipkart
        </a>

      </div>
    </div>

  </div>
)}

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
