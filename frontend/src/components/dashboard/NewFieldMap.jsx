import React from "react";
import FieldDetailsDrawer from "./FieldDetailsDrawer";

const NewFieldMap = ({ showDrawer, setShowDrawer }) => {
  return (
    <>
      {/* MAP BOX */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">Field Map</h2>

          <div className="flex gap-2">
            <button className="text-gray-600 hover:text-gray-900">+</button>
            <button className="text-gray-600 hover:text-gray-900">-</button>
          </div>
        </div>

        <div className="relative h-[620px] bg-gray-100">
          <img
            src="https://upload.wikimedia.org/wikipedia/en/8/80/Wikipedia-logo-v2.svg"
            alt="map"
            className="w-full h-full object-cover opacity-20"
          />
        </div>
      </div>

      {/* Buttons */}
      <div className="flex justify-between mt-6">
        <button
          className="w-[48%] py-3 bg-green-600 text-white rounded-md hover:bg-green-700"
          onClick={() => setShowDrawer(true)}
        >
          Add Field Details
        </button>

        <button
          className="w-[48%] py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          Save Field
        </button>
      </div>

      {/* DRAWER */}
      <FieldDetailsDrawer open={showDrawer} onClose={() => setShowDrawer(false)} />
    </>
  );
};

export default NewFieldMap;
