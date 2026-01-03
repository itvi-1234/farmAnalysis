import React, { useState, useEffect } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend, AreaChart, Area, ComposedChart, Bar, ReferenceLine
} from "recharts";
import { 
  CloudRain, Sun, Droplets, Activity, Sprout, Wind, AlertTriangle, 
  Sparkles, Loader2 
} from "lucide-react";
import Navbar from "../components/dashboard/Navbar";
import Sidebar from "../components/dashboard/Sidebar";
import { useAuth } from "../contexts/authcontext/Authcontext";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { doSignOut } from "../firebase/auth";
import { useNavigate } from "react-router-dom";
import Groq from "groq-sdk";

// Read Groq key from Vite env (do NOT hardcode secrets)
const apiKey = import.meta.env.VITE_GROQ_API_KEY;

const Analytics = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  // Data States
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState([]);
  const [fields, setFields] = useState([]);
  const [selectedField, setSelectedField] = useState(null);
  const [fieldsLoading, setFieldsLoading] = useState(true);
  
  // Stats & Error
  const [stats, setStats] = useState({
    avgNDVI: 0, waterStressDays: 0, totalRain: 0, diseaseRiskDays: 0
  });
  const [error, setError] = useState("");

  // --- AI INSIGHT STATES ---
  const [insights, setInsights] = useState({
    water: null,
    stress: null,
    health: null,
    disease: null
  });
  const [analyzing, setAnalyzing] = useState({
    water: false,
    stress: false,
    health: false,
    disease: false
  });

  const API_URL = "https://itvi-1234-collectdata-itvi.hf.space/generate_data";

  const handleLogout = () => {
    doSignOut().then(() => navigate("/login"));
  };

  useEffect(() => {
    const fetchFields = async () => {
      if (!currentUser) return;
      try {
        const fieldsRef = collection(db, "users", currentUser.uid, "fields");
        const fieldsSnap = await getDocs(fieldsRef);
        const fetchedFields = fieldsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        fetchedFields.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        setFields(fetchedFields);
        if (fetchedFields.length > 0) setSelectedField(fetchedFields[0]);
      } catch (err) {
        console.error("Error fetching fields:", err);
      } finally {
        setFieldsLoading(false);
      }
    };
    fetchFields();
  }, [currentUser]);

  const processData = (csvText) => {
    const lines = csvText.trim().split("\n");
    const headers = lines[0].split(",");
    let rawData = lines.slice(1).map(line => {
      const values = line.split(",");
      const obj = {};
      headers.forEach((header, index) => {
        const val = values[index];
        obj[header.trim()] = isNaN(val) ? val : parseFloat(val);
      });
      return obj;
    });

    let currentMoisture = 50; 
    const processed = rawData.map((d, i) => {
      if (d.precipitation > 0) currentMoisture += d.precipitation * 2; 
      else currentMoisture -= (d.vpd * 0.8) + 0.5; 
      currentMoisture = Math.max(10, Math.min(90, currentMoisture)); 

      const prevGDD = i > 0 ? rawData[i-1].cum_gdd || 0 : 0;
      const cum_gdd = prevGDD + (d.gdd || 0);
      d.cum_gdd = cum_gdd;

      return {
        ...d,
        dateShort: d.date.substring(5),
        soil_moisture: d.soil_moisture || parseFloat(currentMoisture.toFixed(1)),
        ndvi_smooth: d.ndvi, 
      };
    });

    for (let i = 3; i < processed.length - 3; i++) {
      let sum = 0;
      for (let j = -3; j <= 3; j++) sum += processed[i+j].ndvi;
      processed[i].ndvi_smooth = parseFloat((sum / 7).toFixed(3));
    }
    return processed;
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!currentUser || !selectedField || fieldsLoading) return;
      setLoading(true);
      setError("");
      setInsights({ water: null, stress: null, health: null, disease: null });
      
      try {
        let lat = selectedField.lat || 31.22;
        let lon = selectedField.lng || 75.26;
        let fieldName = selectedField.name || "Field_1";

        const response = await fetch(API_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lat, lon, field_name: fieldName })
        });

        if (!response.ok) throw new Error("API Error");

        const csvText = await response.text();
        const finalData = processData(csvText);
        setData(finalData);

        const avgNDVI = finalData.reduce((s, d) => s + (d.ndvi || 0), 0) / finalData.length;
        const totalRain = finalData.reduce((s, d) => s + (d.precipitation || 0), 0);
        const stressDays = finalData.filter(d => d.vpd > 1.5).length;
        const diseaseDays = finalData.filter(d => d.leaf_wetness_hours > 10).length;

        setStats({
          avgNDVI: avgNDVI.toFixed(2),
          totalRain: totalRain.toFixed(0),
          waterStressDays: stressDays,
          diseaseRiskDays: diseaseDays
        });
      } catch (err) {
        console.error(err);
        setError("Failed to load data.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [currentUser, selectedField, fieldsLoading]);

  // --- 🚀 GROQ AI INTEGRATION ---
  const generateInsight = async (section, dataContext) => {
    if (!apiKey || apiKey.includes("gsk_xxxx")) {
      setInsights(prev => ({
        ...prev,
        [section]: "Groq API key missing. Add VITE_GROQ_API_KEY in frontend/.env and restart dev server."
      }));
      return;
    }

    setAnalyzing(prev => ({ ...prev, [section]: true }));

    try {
      // ✅ Groq Initialization
      // dangerouslyAllowBrowser: true is needed for frontend React
      const groq = new Groq({ apiKey, dangerouslyAllowBrowser: true });

      const prompt = `
        Act as an Expert Agronomist. Analyze this field data:
        Context: ${dataContext.description}
        Stats: ${JSON.stringify(dataContext.stats)}
        
        Task: Provide 2 very short, actionable bullet points (max 15 words each) for a farmer.
        Focus: Practical advice or risk warning.
      `;

      const chatCompletion = await groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: "llama-3.3-70b-versatile", // Using Llama 3 (Fast & Smart)
        temperature: 0.5,
        max_tokens: 100,
      });

      const text = chatCompletion.choices[0]?.message?.content || "No insights generated.";
      
      setInsights(prev => ({ ...prev, [section]: text }));
    } catch (error) {
      console.error("Groq AI Error:", error);
      const message = (() => {
        const raw = error?.message || "";
        if (raw.toLowerCase().includes("401") || raw.toLowerCase().includes("invalid api key")) {
          return "Invalid Groq API key. Update VITE_GROQ_API_KEY in frontend/.env and restart dev server.";
        }
        return raw || "Service unavailable. Check key, network, or usage limits.";
      })();
      setInsights(prev => ({ ...prev, [section]: message }));
    } finally {
      setAnalyzing(prev => ({ ...prev, [section]: false }));
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-xl rounded-lg z-50">
          <p className="text-xs font-bold text-gray-500 mb-2">{label}</p>
          {payload.map((entry, index) => (
            <div key={index} className="text-xs flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full" style={{ background: entry.color }}></div>
              <span className="capitalize text-gray-700">{entry.name}:</span>
              <span className="font-bold text-gray-900">
                {typeof entry.value === 'number' ? entry.value.toFixed(2) : entry.value}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  if (fieldsLoading || (loading && selectedField)) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-gray-50">
        <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-600 font-semibold">Fetching results...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar currentUser={currentUser} onLogout={handleLogout} />
      <Sidebar />

      <div className="pt-24 lg:ml-64 px-6 pb-12">
        <div className="max-w-7xl mx-auto space-y-8">
          
           {!loading && !fieldsLoading && fields.length > 0 && data.length > 0 && (
            <>
          {/* HEADER & KPI CARDS */}
          <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Advanced Analytics</h1>
              <p className="text-gray-500 mt-1">Satellite & Weather Intelligence for Precision Farming</p>
            </div>
             <div className="flex items-center gap-3 flex-wrap">
              {fields.length > 0 && (
                <div className="flex items-center gap-2">
                  <label className="text-sm font-semibold text-gray-700">Field:</label>
                  <select
                    value={selectedField?.id || ""}
                    onChange={(e) => setSelectedField(fields.find(f => f.id === e.target.value))}
                    className="min-w-[150px] px-4 py-2 border border-green-200 bg-white rounded-lg shadow-sm"
                  >
                    {fields.map((field, index) => (
                      <option key={field.id} value={field.id}>Field {index + 1}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard title="Avg Health (NDVI)" value={stats.avgNDVI} unit="Index" icon={Sprout} color="text-green-600" bg="bg-green-50" />
            <StatCard title="Total Rainfall" value={stats.totalRain} unit="mm" icon={CloudRain} color="text-blue-600" bg="bg-blue-50" />
            <StatCard title="High Stress Days" value={stats.waterStressDays} unit="days" icon={Sun} color="text-orange-600" bg="bg-orange-50" desc="VPD > 1.5 kPa" />
            <StatCard title="Disease Risk" value={stats.diseaseRiskDays} unit="days" icon={AlertTriangle} color="text-red-600" bg="bg-red-50" desc="High Leaf Wetness" />
          </div>

          {/* --- SECTION 1: WATER MANAGEMENT --- */}
          <div className="grid grid-cols-1">
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                  <Droplets className="w-5 h-5 text-blue-500" />
                  Soil Moisture vs Rainfall
                </h3>
              </div>
              <div className="h-[380px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="dateShort" tick={{fontSize: 11}} minTickGap={30}/>
                    <YAxis yAxisId="left" domain={[0, 100]} />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend verticalAlign="top" height={36}/>
                    <Bar yAxisId="right" dataKey="precipitation" name="Rainfall" fill="#60a5fa" barSize={10} radius={[4,4,0,0]} />
                    <Line yAxisId="left" type="monotone" dataKey="soil_moisture" name="Soil Moisture" stroke="#0ea5e9" strokeWidth={3} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>

              {/* 🤖 AI INSIGHT BLOCK 1 */}
              <AIInsightBox 
                section="water"
                insight={insights.water}
                loading={analyzing.water}
                onAnalyze={() => generateInsight("water", {
                  description: "Soil Moisture levels (%) over time plotted against Rainfall (mm).",
                  stats: {
                    avgMoisture: (data.reduce((a,b)=>a+b.soil_moisture,0)/data.length).toFixed(1),
                    totalRain: stats.totalRain,
                    daysBelowThreshold: data.filter(d => d.soil_moisture < 30).length
                  }
                })}
              />
            </div>
          </div>

          {/* --- SECTION 2: CROP STRESS & HEALTH --- */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* VPD & TEMP */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col">
              <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Sun className="w-5 h-5 text-orange-500" />
                Water Stress (VPD) & Temperature
              </h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="dateShort" minTickGap={30} />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" unit="°C"/>
                    <Tooltip content={<CustomTooltip />} />
                    <ReferenceLine yAxisId="left" y={1.5} label="High Stress" stroke="red" strokeDasharray="3 3" />
                    <Area yAxisId="left" type="monotone" dataKey="vpd" name="VPD (Stress)" stroke="#f97316" fill="#ffedd5" />
                    <Line yAxisId="right" type="monotone" dataKey="temperature_max" name="Max Temp" stroke="#ef4444" dot={false} strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* 🤖 AI INSIGHT BLOCK 2 */}
              <div className="mt-auto">
                <AIInsightBox 
                  section="stress"
                  insight={insights.stress}
                  loading={analyzing.stress}
                  onAnalyze={() => generateInsight("stress", {
                    description: "Vapor Pressure Deficit (VPD in kPa) vs Maximum Temperature. VPD > 1.5 indicates crop water stress.",
                    stats: {
                      highStressDays: stats.waterStressDays,
                      avgTemp: (data.reduce((a,b)=>a+b.temperature_max,0)/data.length).toFixed(1),
                      peakVPD: Math.max(...data.map(d=>d.vpd)).toFixed(2)
                    }
                  })}
                />
              </div>
            </div>

            {/* CROP HEALTH */}
            <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm flex flex-col">
              <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-500" />
                Crop Health Indices Comparison
              </h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="dateShort" minTickGap={30} />
                    <YAxis domain={[0, 1]} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend />
                    <Line type="monotone" dataKey="ndvi_smooth" name="NDVI" stroke="#16a34a" strokeWidth={3} dot={false} />
                    <Line type="monotone" dataKey="evi" name="EVI" stroke="#2563eb" strokeWidth={2} dot={false} strokeDasharray="3 3" />
                    <Line type="monotone" dataKey="ndre" name="NDRE" stroke="#9333ea" strokeWidth={2} dot={false} strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* 🤖 AI INSIGHT BLOCK 3 */}
              <div className="mt-auto">
                <AIInsightBox 
                  section="health"
                  insight={insights.health}
                  loading={analyzing.health}
                  onAnalyze={() => generateInsight("health", {
                    description: "Multispectral Indices Comparison: NDVI (Biomass), EVI (Canopy), NDRE (Nitrogen).",
                    stats: {
                      avgNDVI: stats.avgNDVI,
                      peakNDRE: Math.max(...data.map(d=>d.ndre)).toFixed(2),
                    }
                  })}
                />
              </div>
            </div>
          </div>

          {/* --- SECTION 3: DISEASE & GROWTH --- */}
          <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-2 flex items-center gap-2">
              <Wind className="w-5 h-5 text-gray-600" />
              Disease Risk & Growth Tracking
            </h3>
            <p className="text-xs text-gray-500 mb-6">High Leaf Wetness + Moderate Temp = Fungal Risk</p>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="dateShort" minTickGap={30} />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Bar yAxisId="left" dataKey="leaf_wetness_hours" name="Leaf Wetness (Hrs)" fill="#a5b4fc" />
                  <Line yAxisId="right" type="monotone" dataKey="cum_gdd" name="GDD" stroke="#f59e0b" strokeWidth={3} dot={false} />
                  <ReferenceLine yAxisId="left" y={10} label="Disease Risk" stroke="red" strokeDasharray="3 3" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* 🤖 AI INSIGHT BLOCK 4 */}
            <AIInsightBox 
              section="disease"
              insight={insights.disease}
              loading={analyzing.disease}
              onAnalyze={() => generateInsight("disease", {
                description: "Disease risk based on Leaf Wetness Hours duration and Cumulative Growing Degree Days (GDD).",
                stats: {
                  highRiskDays: stats.diseaseRiskDays,
                  totalGDD: data[data.length-1]?.cum_gdd?.toFixed(0),
                  maxWetness: Math.max(...data.map(d=>d.leaf_wetness_hours)).toFixed(1)
                }
              })}
            />
          </div>
          </>
        )}
        </div>
      </div>
    </div>
  );
};

// --- SUB-COMPONENTS ---
const AIInsightBox = ({ section, insight, loading, onAnalyze }) => {
  return (
    <div className="mt-4 pt-4 border-t border-gray-100">
      {!insight && !loading && (
        <button 
          onClick={onAnalyze}
          className="flex items-center gap-2 text-sm font-semibold text-orange-600 hover:text-orange-800 transition-colors bg-orange-50 px-4 py-2 rounded-lg w-full justify-center border border-orange-100 border-dashed"
        >
          <Sparkles className="w-4 h-4" />
          Get Instant Analysis
        </button>
      )}

      {loading && (
        <div className="flex items-center gap-2 text-sm text-orange-500 bg-orange-50 px-4 py-3 rounded-lg animate-pulse">
          <Loader2 className="w-4 h-4 animate-spin" />
          Processing 
        </div>
      )}

      {insight && (
        <div className="bg-gradient-to-r from-orange-50 to-red-50 p-4 rounded-lg border border-orange-100">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-orange-600" />
            <h4 className="text-sm font-bold text-orange-900">Get Insights</h4>
          </div>
          <div className="text-sm text-gray-800 leading-relaxed space-y-1 pl-1">
             {/* Markdown/Text Cleaning */}
            {insight.replace(/\\/g, "").split("\n").filter(i => i.trim()).map((point, idx) => (
              <div key={idx} className="flex gap-2 items-start">
                {point.trim().startsWith("-") || point.trim().startsWith("•") ? (
                  <>
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-orange-400 flex-shrink-0"></span>
                  <span>{point.replace(/^[•-]\s*/, "").trim()}</span>
                  </>
                ) : (
                   <span>{point}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ title, value, unit, icon: Icon, color, bg, desc }) => (
  <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all">
    <div className="flex justify-between items-start">
      <div>
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">{title}</p>
        <div className="flex items-baseline gap-1 mt-2">
          <span className={`text-3xl font-bold ${color}`}>{value}</span>
          <span className="text-xs text-gray-400 font-medium">{unit}</span>
        </div>
        {desc && <p className="text-[10px] text-gray-400 mt-1">{desc}</p>}
      </div>
      <div className={`p-2.5 rounded-lg ${bg}`}>
        <Icon className={`w-6 h-6 ${color}`} />
      </div>
    </div>
  </div>
);

export default Analytics;