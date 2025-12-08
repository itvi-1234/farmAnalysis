import React, { useEffect, useRef, useState } from "react";
import FieldDetailsDrawer from "./FieldDetailsDrawer";
import { useAuth } from "../../contexts/authcontext/Authcontext";

const NewFieldMap = ({ showDrawer, setShowDrawer }) => {
  const mapRef = useRef(null);
  const searchRef = useRef(null);
  const { currentUser } = useAuth();
  const [fieldCoordinates, setFieldCoordinates] = useState(null);
  const [centroid, setCentroid] = useState(null);

  // -----------------------------------------
  // Load Google Maps and Initialize the Map
  // -----------------------------------------
  useEffect(() => {
    loadGoogleMaps(initMap);

    function initMap() {
      const startLoc = { lat: 17.3266, lng: 78.1695 };

      const map = new window.google.maps.Map(mapRef.current, {
        center: startLoc,
        zoom: 17,
        mapTypeId: "satellite",
      });

      // ---- SEARCH BOX ----
      const searchBox = new window.google.maps.places.SearchBox(searchRef.current);
      map.controls[window.google.maps.ControlPosition.TOP_LEFT].push(searchRef.current);

      searchBox.addListener("places_changed", () => {
        const places = searchBox.getPlaces();
        if (!places.length) return;

        const bounds = new window.google.maps.LatLngBounds();
        places.forEach((place) => {
          if (place.geometry.viewport) bounds.union(place.geometry.viewport);
          else bounds.extend(place.geometry.location);
        });
        map.fitBounds(bounds);
      });

      // ---- DRAW TOOL ----
      const drawingManager = new window.google.maps.drawing.DrawingManager({
        drawingMode: window.google.maps.drawing.OverlayType.POLYLINE,
        drawingControl: true,
        drawingControlOptions: {
          position: window.google.maps.ControlPosition.TOP_CENTER,
          drawingModes: ["polyline"],
        },
        polylineOptions: {
          strokeColor: "#00FF00",
          strokeWeight: 3,
          editable: true,
        },
      });

      drawingManager.setMap(map);

      // ---- WHEN USER FINISHES DRAWING ----
      window.google.maps.event.addListener(
        drawingManager,
        "overlaycomplete",
        (event) => {
          if (event.type === "polyline") {
            drawingManager.setDrawingMode(null);

            const polyline = event.overlay;
            const path = polyline.getPath();
            const coords = path.getArray().map((p) => ({
              lat: p.lat(),
              lng: p.lng(),
            }));

            polyline.setMap(null);

            // Make polygon
            const polygon = new window.google.maps.Polygon({
              paths: coords,
              strokeColor: "#FFFFFF",
              strokeWeight: 2,
              fillColor: "#00FF00",
              fillOpacity: 0.4,
              map,
            });

            // Centroid
            const computedCentroid = computeCentroid(coords);

            // Label "Field 1"
            new window.google.maps.Marker({
              position: computedCentroid,
              map,
              icon: { path: window.google.maps.SymbolPath.CIRCLE, scale: 0 },
              label: {
                text: "Field 1",
                color: "white",
                fontSize: "16px",
              },
            });

            // Store coordinates in state for the drawer
            setFieldCoordinates(coords);
            setCentroid(computedCentroid);
          }
        }
      );
    }
  }, []);

  // -----------------------------------------
  // Helpers
  // -----------------------------------------
  function computeCentroid(coords) {
    let lat = 0,
      lng = 0;
    coords.forEach((c) => {
      lat += c.lat;
      lng += c.lng;
    });
    return { lat: lat / coords.length, lng: lng / coords.length };
  }


  function loadGoogleMaps(callback) {
    if (window.google) return callback();

    const script = document.createElement("script");
    script.src =
      "https://maps.googleapis.com/maps/api/js?key=AIzaSyDKR_CVLRbV0lqjy_8JRWZAVDdO5Xl7jRk&libraries=places,drawing";
    script.async = true;
    script.defer = true;
    script.onload = callback;
    document.body.appendChild(script);
  }

  return (
    <>
      {/* MAP CONTAINER (unchanged UI) */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="p-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">Field Map</h2>
        </div>

        {/* REAL GOOGLE MAP */}
        <div className="relative h-[620px] bg-gray-100">
          <input
            ref={searchRef}
            type="text"
            placeholder="Search farm location..."
            className="absolute z-10 mt-3 ml-3 px-3 py-2 bg-white border rounded shadow"
          />

          <div ref={mapRef} className="w-full h-full"></div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex justify-between mt-6">
        <button
          className="w-[48%] py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          onClick={() => setShowDrawer(true)}
          disabled={!centroid}
        >
          {centroid ? "Add Field Details" : "Draw Field First"}
        </button>

        <button
          className="w-[48%] py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          onClick={() => setShowDrawer(true)}
          disabled={!centroid}
        >
          {centroid ? "Save Field" : "No Field Selected"}
        </button>
      </div>

      {/* Drawer */}
      <FieldDetailsDrawer 
        open={showDrawer} 
        onClose={() => setShowDrawer(false)}
        coordinates={fieldCoordinates}
        centroid={centroid}
      />
    </>
  );
};

export default NewFieldMap;
