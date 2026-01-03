import express from "express";
import multer from "multer";

const router = express.Router();
const upload = multer();

router.post("/predict", upload.single("file"), async (req, res) => {
  try {
    // Native FormData + Blob (Node 18+)
    const formData = new FormData();
    formData.append("file", new Blob([req.file.buffer]), req.file.originalname);

    const response = await fetch(
      "https://itvi-1234-dis-32-sumit.hf.space/predict",
      {
        method: "POST",
        body: formData
      }
    );

    const data = await response.json();
    res.json(data);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Proxy server error" });
  }
});

export default router;
