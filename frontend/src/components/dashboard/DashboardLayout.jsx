import React, { useState, useEffect } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import StatsCards from "./StatsCards";
import FieldMap from "./FieldMap";
import VegetationIndexCard from "./VegetationIndexCard";
import NewsSection from "./NewsSection";
import KisanMitraChat from "./KisanMitraChat";
import { Bot, Trash2, MessageCircle } from "lucide-react";
import { db } from "../../firebase/firebase";
import { collection, getDocs, doc, setDoc, getDoc, deleteDoc } from "firebase/firestore";
import axios from "axios";
import { useTranslation } from "react-i18next";

const OPENWEATHER_API_KEY = "6af24b4f823c9044d1cbad4c94379de5";
const OPENWEATHER_BASE_URL = "https://api.openweathermap.org/data/2.5";

const DashboardLayout = ({ currentUser, onLogout }) => {
  const { t } = useTranslation();
  const [fields, setFields] = useState([]);
  const [selectedField, setSelectedField] = useState(null);
  const [loading, setLoading] = useState(true);
  const [alertsData, setAlertsData] = useState({ total: 0, highPriority: 0 });
  const [weatherData, setWeatherData] = useState(null);
  const [lstmData, setLstmData] = useState(null);
  const [heatmapOverlay, setHeatmapOverlay] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isChatMinimized, setIsChatMinimized] = useState(false);

  // Fetch weather data for selected field
  useEffect(() => {
    const fetchWeather = async () => {
      if (!selectedField || !selectedField.lat || !selectedField.lng) {
        setWeatherData(null);
        return;
      }

      try {
        const weatherUrl = `${OPENWEATHER_BASE_URL}/weather`;
        const weatherParams = {
          lat: selectedField.lat,
          lon: selectedField.lng,
          appid: OPENWEATHER_API_KEY,
          units: 'metric'
        };
        
        const response = await axios.get(weatherUrl, {
          params: weatherParams,
          timeout: 10000
        });

        if (response.data) {
          setWeatherData(response.data);
        }
      } catch (err) {
        console.error("Error fetching weather:", err);
        setWeatherData(null);
      }
    };

    fetchWeather();
  }, [selectedField]);

  // Load alerts count from cache and sync with Alerts page
  useEffect(() => {
    const loadAlertsFromCache = () => {
      if (!selectedField || !currentUser) {
        setAlertsData({ total: 0, highPriority: 0 });
        return;
      }

      try {
        const cacheKey = `alerts_cache_${currentUser.uid}_${selectedField.id}`;
        const cached = localStorage.getItem(cacheKey);
        
        if (cached) {
          const cacheData = JSON.parse(cached);
          const alerts = cacheData.alerts;
          
          // Count total alerts and high priority alerts
          let total = 0;
          let highPriority = 0;
          
          // Check all periods: daily, weekly, biweekly
          ['daily', 'weekly', 'biweekly'].forEach(period => {
            if (alerts[period] && Array.isArray(alerts[period])) {
              alerts[period].forEach(alert => {
                total += 1;
                if (alert.priority === "high") {
                  highPriority += 1;
                }
              });
            }
          });
          
          setAlertsData({ total, highPriority });
          console.log("Loaded alerts from cache:", { total, highPriority, alerts });
        } else {
          // If no cache, try to fetch alerts directly
          console.log("No alerts cache found, fetching alerts directly...");
          fetchAlertsDirectly();
        }
      } catch (err) {
        console.error("Error loading alerts from cache:", err);
        fetchAlertsDirectly();
      }
    };

    const fetchAlertsDirectly = async () => {
      if (!selectedField || !selectedField.lat || !selectedField.lng) {
        setAlertsData({ total: 0, highPriority: 0 });
        return;
      }

      try {
        const response = await fetch("https://itvi-1234-lstm-sumit-2.hf.space/predict", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lat: selectedField.lat,
            lon: selectedField.lng
          })
        });

        if (response.ok) {
          const result = await response.json();
          if (result && result.success) {
            const data = result.data || {};
            const forecast = data.forecast || {};
            
            let total = 0;
            let highPriority = 0;
            
            // Count alerts from all periods
            ['day_1', 'day_7', 'day_14'].forEach(period => {
              if (forecast[period]) {
                total += 1;
                const periodData = forecast[period];
                const disease = periodData.disease_risk ?? 0;
                const pest = periodData.pest_risk ?? 0;
                const stressIndex = data.stress_index ?? 0;
                
                if (Number(disease) > 60 || Number(pest) > 60 || Number(stressIndex) > 60) {
                  highPriority += 1;
                }
              }
            });
            
            setAlertsData({ total, highPriority });
            console.log("Fetched alerts directly:", { total, highPriority });
          }
        }
      } catch (err) {
        console.error("Error fetching alerts directly:", err);
        setAlertsData({ total: 0, highPriority: 0 });
      }
    };

    loadAlertsFromCache();
    
    // Listen to storage events (when Alerts page updates cache in another tab)
    const handleStorageChange = (e) => {
      if (e.key && e.key.startsWith(`alerts_cache_${currentUser?.uid}_${selectedField?.id}`)) {
        console.log("Storage event detected, reloading alerts...");
        loadAlertsFromCache();
      }
    };
    
    // Listen to custom events (when Alerts page updates cache in same tab)
    const handleAlertsUpdated = (e) => {
      if (e.detail && e.detail.fieldId === selectedField?.id) {
        console.log("Custom alertsUpdated event detected, reloading alerts...");
        loadAlertsFromCache();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('alertsUpdated', handleAlertsUpdated);
    
    // Re-check cache every 2 seconds to stay in sync
    const interval = setInterval(loadAlertsFromCache, 2000);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('alertsUpdated', handleAlertsUpdated);
    };
  }, [selectedField, currentUser]);

  // Fetch LSTM data for disease risk calculation
  useEffect(() => {
    const fetchLSTMData = async () => {
      if (!selectedField || !selectedField.lat || !selectedField.lng) {
        setLstmData(null);
        return;
      }

      try {
        console.log("Fetching LSTM data for dashboard:", selectedField.lat, selectedField.lng);
        
        const response = await fetch("https://itvi-1234-lstm-sumit-2.hf.space/predict", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            lat: selectedField.lat,
            lon: selectedField.lng
          })
        });

        console.log("LSTM API Response status:", response.status);
        const result = await response.json();
        console.log("LSTM API Result:", result);

        if (result && result.success) {
          const data = result.data || {};
          setLstmData(data);
          console.log("LSTM data updated");
        } else {
          setLstmData(null);
        }
      } catch (err) {
        console.error("Error fetching LSTM data:", err);
        setLstmData(null);
      }
    };

    fetchLSTMData();
  }, [selectedField]);

  // Fetch fields from Firebase
  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const fetchFields = async () => {
      try {
        console.log("Fetching fields for user:", currentUser.uid);
        
        // Fetch fields from subcollection
        const fieldsRef = collection(db, "users", currentUser.uid, "fields");
        const fieldsSnapshot = await getDocs(fieldsRef);
        
        const fetchedFields = [];
        fieldsSnapshot.forEach((doc) => {
          fetchedFields.push({
            id: doc.id,
            name: doc.data().fieldName || "Unnamed Field",
            area: doc.data().area || "N/A",
            ndvi: doc.data().ndvi || 0.72,
            soil: doc.data().soil || 85,
            lat: doc.data().lat,
            lng: doc.data().lng,
            coordinates: doc.data().coordinates || [],
            cropName: doc.data().cropName,
            createdAt: doc.data().createdAt || new Date().toISOString(),
            ...doc.data()
          });
        });

        // Sort fields by creation date (oldest first) to maintain field numbering
        fetchedFields.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

        console.log("Fetched fields:", fetchedFields);

        if (fetchedFields.length === 0) {
          // No fields found, create a default one
          console.log("No fields found, using default");
          const defaultField = {
            id: "default",
            name: "My Field",
            area: "2.5 Acres",
            ndvi: 0.72,
            soil: 85,
            lat: null,
            lng: null,
            coordinates: []
          };
          setFields([defaultField]);
          setSelectedField(defaultField);
        } else {
          setFields(fetchedFields);
          
          // Check for saved field preference
          const userRef = doc(db, "users", currentUser.uid);
          const userDoc = await getDoc(userRef);
          
          if (userDoc.exists() && userDoc.data().selectedFieldId) {
            const savedFieldId = userDoc.data().selectedFieldId;
            const savedField = fetchedFields.find(f => f.id === savedFieldId);
            if (savedField) {
              setSelectedField(savedField);
            } else {
              setSelectedField(fetchedFields[0]);
            }
          } else {
            // Default to first field
            setSelectedField(fetchedFields[0]);
          }
        }
      } catch (error) {
        console.error("Error fetching fields:", error);
        // Fallback to default field
        const defaultField = {
          id: "default",
          name: "My Field",
          area: "2.5 Acres",
          ndvi: 0.72,
          soil: 85,
          lat: null,
          lng: null,
          coordinates: []
        };
        setFields([defaultField]);
        setSelectedField(defaultField);
      } finally {
        setLoading(false);
      }
    };

    fetchFields();
  }, [currentUser]);

  // Save selected field to user preferences
  const handleFieldChange = async (fieldId) => {
    const field = fields.find(f => f.id === fieldId);
    if (!field) return;
    
    setSelectedField(field);
    setHeatmapOverlay(null);
    
    // Save to Firebase
    if (currentUser) {
      try {
        const userRef = doc(db, "users", currentUser.uid);
        await setDoc(userRef, { selectedFieldId: fieldId }, { merge: true });
        console.log("Saved field preference:", fieldId);
      } catch (error) {
        console.error("Error saving field preference:", error);
      }
    }
  };

  // Delete field function
  const handleDeleteField = async (fieldId) => {
    if (!currentUser) return;
    
    const fieldToDelete = fields.find(f => f.id === fieldId);
    if (!fieldToDelete) return;
    
    const confirmDelete = window.confirm(
      `Are you sure you want to delete "${fieldToDelete.name}"? This action cannot be undone.`
    );
    
    if (!confirmDelete) return;
    
    try {
      // Delete from Firebase
      const fieldRef = doc(db, "users", currentUser.uid, "fields", fieldId);
      await deleteDoc(fieldRef);
      
      console.log("Field deleted:", fieldId);
      
      // Update local state
      const updatedFields = fields.filter(f => f.id !== fieldId);
      setFields(updatedFields);
      
      // If deleted field was selected, select another field
      if (selectedField?.id === fieldId) {
        if (updatedFields.length > 0) {
          setSelectedField(updatedFields[0]);
          // Update user preference
          const userRef = doc(db, "users", currentUser.uid);
          await setDoc(userRef, { selectedFieldId: updatedFields[0].id }, { merge: true });
        } else {
          setSelectedField(null);
        }
      }
      
      alert(`Field "${fieldToDelete.name}" deleted successfully!`);
    } catch (error) {
      console.error("Error deleting field:", error);
      alert(`Failed to delete field: ${error.message}`);
    }
  };

  return (
    <>
      <Navbar currentUser={currentUser} onLogout={onLogout} />
      <Sidebar />

      {/* Light green + glass effect */}
      <div
  className="
    pt-20 lg:ml-64 p-6 min-h-screen 
    bg-linear-to-br from-green-50 via-white to-green-100
  "
>
        <div className="max-w-screen-2xl mx-auto">

          {/* FIELD SELECTOR DROPDOWN */}
          {loading ? (
            <div className="mb-6 text-center text-gray-500">
              {t("loading_fields")}
            </div>
          ) : (
            <div className="mb-6 flex items-center gap-4 flex-wrap">
              <label className="text-sm font-semibold text-gray-700">
                {t("select_field_label")}
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={selectedField?.id || ""}
                  onChange={(e) => handleFieldChange(e.target.value)}
                  className="px-4 py-2 border border-green-200 bg-white rounded-lg shadow-sm focus:ring-2 focus:ring-green-400"
                >
                  {fields.map((field) => (
                    <option key={field.id} value={field.id}>
                      {field.name} ({field.area})
                    </option>
                  ))}
                </select>
                
                {/* Delete Field Button */}
                {selectedField && selectedField.id !== "default" && (
                  <button
                    onClick={() => handleDeleteField(selectedField.id)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title={t("delete_field_tooltip")}
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* PASS SELECTED FIELD */}
          {selectedField && <StatsCards field={selectedField} totalFields={fields.length} alertsData={alertsData} weatherData={weatherData} lstmData={lstmData} />}

          {/* Larger map + larger vegetation card */}
          {selectedField && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

            {/* BIGGER FIELD MAP */}
            <div className="lg:col-span-2">
              <div className="h-[600px]">
                  <FieldMap field={selectedField} heatmapOverlay={heatmapOverlay} />
              </div>
            </div>

              {/* BIGGER VEGETATION INDEX - Matched to Field Map height */}
              <div className="h-[600px]">
                <VegetationIndexCard field={selectedField} onHeatmapReady={setHeatmapOverlay} />
            </div>

          </div>
          )}

          <NewsSection selectedField={selectedField} />
        </div>
      </div>

      {/* Floating Kisan Mitra Button */}
      {!isChatOpen && (
        <button
          onClick={() => {
            setIsChatOpen(true);
            setIsChatMinimized(false);
          }}
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 bg-green-600 hover:bg-green-700 text-white px-4 py-3 sm:px-5 sm:py-3.5 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-200 flex items-center gap-3 z-40"
          aria-label="Open Kisan Mitra Chat"
        >
          <div className="relative">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <MessageCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white"></div>
          </div>
          <div className="flex flex-col items-start">
            <span className="font-bold text-base sm:text-lg">Kisan Mitra</span>
            <span className="text-xs text-white">AI Assistant</span>
          </div>
        </button>
      )}

      {/* Kisan Mitra Chat Widget */}
      <KisanMitraChat
        isOpen={isChatOpen && !isChatMinimized}
        onClose={() => setIsChatOpen(false)}
        onMinimize={() => setIsChatMinimized(true)}
      />

      {/* Minimized Chat Button */}
      {isChatMinimized && (
        <button
          onClick={() => {
            setIsChatMinimized(false);
            setIsChatOpen(true);
          }}
          className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-xl shadow-xl hover:shadow-2xl transition-all duration-200 flex items-center gap-2.5 z-40"
          aria-label="Restore Kisan Mitra Chat"
        >
          <div className="w-8 h-8 bg-white rounded-lg flex items-center justify-center">
            <MessageCircle className="h-5 w-5 text-green-600" />
          </div>
          <span className="font-bold text-sm sm:text-base">Kisan Mitra</span>
        </button>
      )}
    </>
  );
};

export default DashboardLayout;
