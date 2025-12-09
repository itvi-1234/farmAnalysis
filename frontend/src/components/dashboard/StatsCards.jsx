import React from "react";
import { Leaf, Sprout, Trees, AlertTriangle, Thermometer, Activity } from "lucide-react";
import { useTranslation } from "react-i18next";

const StatsCards = ({ field, totalFields = 1, alertsData = { total: 0, highPriority: 0 }, weatherData = null, lstmData = null }) => {
  const { t } = useTranslation();

  // Calculate percentage for active fields (assuming max 10 fields as 100%)
  const fieldPercentage = totalFields > 0 ? Math.min((totalFields / 10) * 100, 100).toFixed(0) : "0";
  
  // Calculate high priority percentage (out of total alerts)
  const highPriorityPercentage = alertsData.total > 0 
    ? ((alertsData.highPriority / alertsData.total) * 100).toFixed(0)
    : "0";

  // Get temperature from weather data
  const temperature = weatherData && weatherData.main && weatherData.main.temp 
    ? `${Math.round(weatherData.main.temp)}°C`
    : "--";
  
  const tempStatus = weatherData && weatherData.main && weatherData.main.temp 
    ? (weatherData.main.temp >= 15 && weatherData.main.temp <= 30 ? "Optimal range" : "Monitor required")
    : "Loading...";

  // Calculate disease risk from NDVI data
  let diseasePercentage = 0;
  let diseaseStatus = "Loading...";
  
  if (lstmData && lstmData.forecast && lstmData.forecast.day_1) {
    // Get NDVI from day_1 forecast
    const ndviValue = lstmData.forecast.day_1.ndvi || lstmData.forecast.day_1.NDVI || 0;
    
    // Calculate disease percentage based on NDVI zones
    // NDVI Reference: -1 to 0.15 (Red), 0.15 to 0.25 (Orange), 0.25 to 0.40 (Light Green), > 0.40 (Dark Green)
    if (ndviValue < 0.15) {
      // Very poor vegetation - Very high disease (80-100%)
      diseasePercentage = Math.round(100 - ((ndviValue + 1) / 1.15) * 20);
    } else if (ndviValue >= 0.15 && ndviValue < 0.25) {
      // Poor vegetation - High disease (60-80%)
      diseasePercentage = Math.round(80 - ((ndviValue - 0.15) / 0.1) * 20);
    } else if (ndviValue >= 0.25 && ndviValue < 0.40) {
      // Moderate vegetation - Moderate disease (30-60%)
      diseasePercentage = Math.round(60 - ((ndviValue - 0.25) / 0.15) * 30);
    } else if (ndviValue >= 0.40) {
      // Healthy vegetation - Low disease (0-30%)
      diseasePercentage = Math.round(Math.max(0, 30 - ((ndviValue - 0.40) / 0.6) * 30));
    } else {
      diseasePercentage = 0;
    }
    
    // Ensure percentage is within 0-100 range
    diseasePercentage = Math.max(0, Math.min(100, diseasePercentage));
    
    // Set status based on percentage
    if (diseasePercentage === 0) {
      diseaseStatus = "No disease detected";
    } else if (diseasePercentage < 30) {
      diseaseStatus = "Low risk";
    } else if (diseasePercentage < 60) {
      diseaseStatus = "Moderate risk";
    } else {
      diseaseStatus = "High risk - Action needed";
    }
    
    console.log("Disease Risk Calculation:", { ndviValue, diseasePercentage, diseaseStatus });
  } else if (!lstmData) {
    diseaseStatus = "No data available";
  }

  const stats = [
    {
      titleKey: "stats_active_fields",
      subtitleKey: "stats_active_fields_sub",
      value: totalFields,
      percentage: `${fieldPercentage}% from the last week`,
      icon: Trees,
      bg: "bg-green-50",
      border: "border-green-200",
      iconBg: "bg-green-100",
      text: "text-green-700",
    },
    {
      title: "Temperature",
      subtitle: tempStatus,
      value: temperature,
      icon: Thermometer,
      bg: "bg-lime-50",
      border: "border-lime-200",
      iconBg: "bg-lime-100",
      text: "text-lime-700",
    },
    {
      title: "Disease Risk",
      subtitle: diseaseStatus,
      value: `${diseasePercentage}%`,
      icon: Activity,
      bg: "bg-yellow-50",
      border: "border-yellow-200",
      iconBg: "bg-yellow-100",
      text: "text-yellow-700",
    },
    {
      titleKey: "stats_active_alerts",
      subtitleKey: "stats_active_alerts_sub",
      value: alertsData.total,
      percentage: alertsData.total > 0 ? `${highPriorityPercentage}% High Priority` : "",
      icon: AlertTriangle,
      bg: "bg-red-50",
      border: "border-red-200",
      iconBg: "bg-red-100",
      text: "text-red-700",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {stats.map((card, i) => {
        const Icon = card.icon;

        return (
          <div
            key={i}
            className={`
              rounded-xl p-6 border transition-all hover:shadow-md
              ${card.bg} ${card.border}
            `}
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <h3 className={`text-sm font-medium ${card.text}`}>
                {card.titleKey ? t(card.titleKey) : card.title}
              </h3>

              <div className={`p-2 rounded-lg ${card.iconBg}`}>
                <Icon className={`w-5 h-5 ${card.text}`} />
              </div>
            </div>

            {/* Values (exact screenshot styling) */}
            <div className="space-y-1">
              <div
                className={`text-[1.75rem] font-semibold leading-tight ${card.text}`}
              >
                {card.value}
              </div>

              <p className={`text-[11px] opacity-60 ${card.text}`}>
                {card.subtitleKey ? t(card.subtitleKey) : card.subtitle}
              </p>
              
              {/* Show percentage if available */}
              {card.percentage && (
                <p className={`text-xs font-semibold ${card.text} mt-1`}>
                  {card.percentage}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default StatsCards;
