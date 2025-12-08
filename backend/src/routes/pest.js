import express from "express";
import multer from "multer";

const router = express.Router();
const upload = multer();

// Proxy → HuggingFace Pest Model
router.post("/predict", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Image file is required" });
    }

    // Node 18+ has native Blob + FormData
    const formData = new FormData();
    formData.append("file", new Blob([req.file.buffer]), req.file.originalname);

    const HF_URL = "https://itvi-1234-pest-pred.hf.space/predict-pest";

    const response = await fetch(HF_URL, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();
    res.json(data);

  } catch (error) {
    console.error("Pest Proxy Error:", error);
    res.status(500).json({ error: "Proxy server error" });
  }
});

export default router;
