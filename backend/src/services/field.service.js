import { db } from "../config/firebase.js";

export const saveCentroid = async (userId, centroid) => {
  await db.collection("fields").doc(userId).set(
    {
      lat: centroid.lat,
      lng: centroid.lng,
      updatedAt: Date.now(),
    },
    { merge: true }
  );

  return centroid;
};
