import express from "express";
import Design from "../models/Design.js";

const router = express.Router();

const categories = ["Blouse", "Kurti", "Indo Western", "Lehenga", "Other Designs"];

const toNumber = (value) => {
  if (value === "" || value === null || value === undefined) {
    return 0;
  }

  const numericValue = Number(value);
  return Number.isNaN(numericValue) ? 0 : numericValue;
};

router.post("/", async (req, res) => {
  try {
    const { title, category, description, price, image = {} } = req.body;

    if (!title || !category || !description) {
      return res.status(400).json({
        message: "Title, category, and description are required",
      });
    }

    if (!categories.includes(category)) {
      return res.status(400).json({
        message: "Valid design category is required",
      });
    }

    const numericPrice = toNumber(price);

    if (numericPrice < 0) {
      return res.status(400).json({
        message: "Price cannot be negative",
      });
    }

    const design = await Design.create({
      title,
      category,
      description,
      price: numericPrice,
      image: {
        name: image?.name || "",
        preview: image?.preview || "",
      },
    });

    res.status(201).json({
      message: "Design added successfully",
      design,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

router.get("/", async (req, res) => {
  try {
    const filter =
      req.query.category && req.query.category !== "All"
        ? { category: req.query.category }
        : {};

    const designs = await Design.find(filter).sort({ createdAt: -1 });

    res.json({
      designs,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

router.get("/:designId", async (req, res) => {
  try {
    const design = await Design.findById(req.params.designId);

    if (!design) {
      return res.status(404).json({
        message: "Design not found",
      });
    }

    res.json({
      design,
    });
  } catch (error) {
    res.status(500).json({
      message: error.message,
    });
  }
});

export default router;
