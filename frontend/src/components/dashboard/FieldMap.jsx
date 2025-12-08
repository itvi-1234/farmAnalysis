import React from "react";
import { MapPin } from "lucide-react";

const FieldMap = () => {
  return (
    <div className="rounded-2xl border border-gray-200 shadow-md bg-white/70 backdrop-blur-xl">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center gap-2 bg-white/50 backdrop-blur-md rounded-t-2xl">
        <MapPin className="h-5 w-5 text-green-600" />
        <h2 className="text-lg font-semibold text-gray-700">Field Map</h2>
      </div>

      {/* Map Placeholder */}
      <div className="p-4">
        <div
          className="h-[500px] rounded-2xl bg-white
                     border border-gray-200 shadow-inner
                     flex items-center justify-center"
        >
          <div className="text-center">
            <p className="text-gray-700 font-medium text-lg">
              Interactive Map Coming Soon
            </p>
            <p className="text-sm text-gray-500 opacity-80 mt-2">
              Field boundaries • Soil data • Vegetation layers
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FieldMap;
