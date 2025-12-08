import React, { useState } from "react";
import { useAuth } from "../../contexts/authcontext/Authcontext";
import { db } from "../../firebase/firebase";
import { doc, setDoc } from "firebase/firestore";

const FieldDetailsDrawer = ({ open, onClose, coordinates, centroid }) => {
  const { currentUser } = useAuth();
  const [cropName, setCropName] = useState("");
  const [fieldName, setFieldName] = useState("");
  const [sowingDate, setSowingDate] = useState("");
  const [loading, setLoading] = useState(false);

  // Debug: Log when component mounts
  React.useEffect(() => {
    console.log("🎯 FieldDetailsDrawer mounted");
    console.log("DB object:", db);
    console.log("Current user:", currentUser);
  }, [currentUser]);

  const handleSave = async () => {
    console.log("🔍 handleSave called");
    console.log("currentUser:", currentUser);
    console.log("centroid:", centroid);
    console.log("coordinates:", coordinates);

    if (!currentUser) {
      alert("User not authenticated!");
      return;
    }

    if (!centroid) {
      alert("Please draw a field on the map first!");
      return;
    }

    if (!cropName || !fieldName) {
      alert("Please fill in all required fields!");
      return;
    }

    setLoading(true);

    try {
      console.log("🔥 Attempting to save to Firestore...");
      console.log("User ID:", currentUser.uid);
      
      // Save to Firebase Firestore
      const fieldRef = doc(db, "fields", currentUser.uid);
      
      const fieldData = {
        cropName,
        fieldName,
        sowingDate,
        lat: centroid.lat,
        lng: centroid.lng,
        coordinates: coordinates || [],
        updatedAt: new Date().toISOString(),
        userId: currentUser.uid
      };
      
      console.log("📝 Field data to save:", fieldData);
      
      await setDoc(fieldRef, fieldData, { merge: true });

      console.log("✅ Field details saved successfully!");
      alert("Field details saved successfully!");
      
      // Reset form
      setCropName("");
      setFieldName("");
      setSowingDate("");
      
      onClose();
    } catch (error) {
      console.error("❌ Error saving field details:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);
      alert(`Failed to save field details: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  return (
    <div
      className={`fixed top-0 right-0 h-full w-96 bg-white shadow-xl border-l border-gray-200 z-50 transform transition-transform duration-300 ${
        open ? "translate-x-0" : "translate-x-full"
      }`}
    >
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="text-lg font-semibold">Add Field Details</h2>
        <button onClick={onClose} className="text-gray-500 text-xl hover:text-gray-700">
          ✕
        </button>
      </div>

      {/* Form Content */}
      <div className="p-4 space-y-4">

        {/* Crop Name */}
        <div>
          <label className="block text-sm font-medium mb-1">Crop Name *</label>
          <input
            type="text"
            placeholder="Corn, Wheat…"
            value={cropName}
            onChange={(e) => setCropName(e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-600"
          />
        </div>

        {/* Field Name */}
        <div>
          <label className="block text-sm font-medium mb-1">Field Name *</label>
          <input
            type="text"
            placeholder="North Block A"
            value={fieldName}
            onChange={(e) => setFieldName(e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-600"
          />
        </div>

        {/* Sowing Date */}
        <div>
          <label className="block text-sm font-medium mb-1">Sowing Date</label>
          <input
            type="date"
            value={sowingDate}
            onChange={(e) => setSowingDate(e.target.value)}
            className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-green-600"
          />
        </div>

        {/* Upload Images */}
        <div>
          <label className="block text-sm font-medium mb-1">Upload Field & Crop Images</label>
          <div className="border-2 border-dashed rounded-md p-5 text-center cursor-pointer hover:border-green-600 transition">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-sm text-gray-600 mt-2">Drop images here or click to browse</p>
          </div>
        </div>

        {/* Coordinates Info */}
        {centroid && (
          <div className="bg-green-50 border border-green-200 rounded-md p-3 text-sm">
            <p className="font-medium text-green-800">✓ Field Area Selected</p>
            <p className="text-green-600 text-xs mt-1">
              Lat: {centroid.lat.toFixed(6)}, Lng: {centroid.lng.toFixed(6)}
            </p>
          </div>
        )}

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={loading}
          className={`w-full text-white py-2 rounded-md mt-4 ${
            loading 
              ? "bg-gray-400 cursor-not-allowed" 
              : "bg-green-600 hover:bg-green-700"
          }`}
        >
          {loading ? "Saving..." : "Save Field Details"}
        </button>
      </div>
    </div>
  );
};

export default FieldDetailsDrawer;
