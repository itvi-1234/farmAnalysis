import { saveCentroid } from "../services/field.service.js";

function computeCentroid(coords) {
  let lat = 0, lng = 0;
  coords.forEach((c) => {
    lat += c.lat;
    lng += c.lng;
  });

  return {
    lat: lat / coords.length,
    lng: lng / coords.length,
  };
}

export const processRegion = async (req, res) => {
  try {
    const { polygon_coords, userId } = req.body;

    if (!polygon_coords || polygon_coords.length < 3) {
      return res.status(400).json({ message: "Invalid polygon coordinates" });
    }

    if (!userId) {
      return res.status(400).json({ message: "Missing userId" });
    }

    // Compute centroid
    const centroid = computeCentroid(polygon_coords);

    // Save in Firebase
    await saveCentroid(userId, centroid);

    return res.status(200).json({
      message: "Centroid saved successfully",
      centroid,
    });
  } catch (error) {
    console.error("🔥 Error in processRegion:", error);
    return res.status(500).json({ message: "Server error" });
  }
};
