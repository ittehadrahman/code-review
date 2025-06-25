// server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(
  process.env.MONGODB_URI || "mongodb://localhost:27017/codereview",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
  console.log("Connected to MongoDB");
});

// Schemas
const CodeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  code: {
    type: String,
    required: true,
  },
  language: {
    type: String,
    required: true,
  },
  maxReviews: {
    type: Number,
    default: 3,
  },
  reviewCount: {
    type: Number,
    default: 0,
  },
  isCompleted: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const ReviewSchema = new mongoose.Schema({
  codeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Code",
    required: true,
  },
  reviewerName: {
    type: String,
    required: true,
  },
  yearsOfExperience: {
    type: Number,
    required: true,
  },
  position: {
    type: String,
    required: true,
  },
  reviewComment: {
    type: String,
    required: true,
  },
  category: {
    type: String,
    required: true,
    enum: [
      "Bug/Error",
      "Performance",
      "Code Style",
      "Best Practices",
      "Security",
      "Functionality",
      "Other",
    ],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Code = mongoose.model("Code", CodeSchema);
const Review = mongoose.model("Review", ReviewSchema);

// Routes

// Get random code for review (excluding completed ones)
app.get("/api/codes/random", async (req, res) => {
  try {
    const availableCodes = await Code.find({ isCompleted: false });

    if (availableCodes.length === 0) {
      return res.status(404).json({ message: "No codes available for review" });
    }

    const randomIndex = Math.floor(Math.random() * availableCodes.length);
    const selectedCode = availableCodes[randomIndex];

    res.json(selectedCode);
  } catch (error) {
    console.error("Error fetching random code:", error);
    res.status(500).json({ error: "Failed to fetch code" });
  }
});

// Submit a review
app.post("/api/reviews", async (req, res) => {
  try {
    const {
      codeId,
      reviewerName,
      yearsOfExperience,
      position,
      reviewComment,
      category,
    } = req.body;

    // Validation
    if (
      !codeId ||
      !reviewerName ||
      !yearsOfExperience ||
      !position ||
      !reviewComment ||
      !category
    ) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Check if code exists and is not completed
    const code = await Code.findById(codeId);
    if (!code) {
      return res.status(404).json({ error: "Code not found" });
    }

    if (code.isCompleted) {
      return res
        .status(400)
        .json({ error: "This code has already been reviewed maximum times" });
    }

    // Create review
    const review = new Review({
      codeId,
      reviewerName,
      yearsOfExperience: parseInt(yearsOfExperience),
      position,
      reviewComment,
      category,
    });

    await review.save();

    // Update code review count
    code.reviewCount += 1;
    if (code.reviewCount >= code.maxReviews) {
      code.isCompleted = true;
    }
    await code.save();

    res.status(201).json({ message: "Review submitted successfully", review });
  } catch (error) {
    console.error("Error submitting review:", error);
    res.status(500).json({ error: "Failed to submit review" });
  }
});

// Get statistics
app.get("/api/stats", async (req, res) => {
  try {
    const totalCodes = await Code.countDocuments();
    const completedCodes = await Code.countDocuments({ isCompleted: true });
    const pendingCodes = await Code.countDocuments({ isCompleted: false });
    const totalReviews = await Review.countDocuments();

    res.json({
      totalCodes,
      completedCodes,
      pendingCodes,
      totalReviews,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ error: "Failed to fetch statistics" });
  }
});

// Admin routes for managing codes

// Add a new code (for adding your extracted codes)
app.post("/api/codes", async (req, res) => {
  try {
    const { title, code, language, maxReviews } = req.body;

    if (!title || !code || !language) {
      return res
        .status(400)
        .json({ error: "Title, code, and language are required" });
    }

    const newCode = new Code({
      title,
      code,
      language,
      maxReviews: maxReviews || 3,
    });

    await newCode.save();
    res.status(201).json({ message: "Code added successfully", code: newCode });
  } catch (error) {
    console.error("Error adding code:", error);
    res.status(500).json({ error: "Failed to add code" });
  }
});

// Bulk add codes
app.post("/api/codes/bulk", async (req, res) => {
  try {
    const { codes } = req.body;

    if (!Array.isArray(codes) || codes.length === 0) {
      return res.status(400).json({ error: "Codes array is required" });
    }

    const validCodes = codes.filter(
      (code) => code.title && code.code && code.language
    );

    if (validCodes.length === 0) {
      return res.status(400).json({ error: "No valid codes found" });
    }

    const insertedCodes = await Code.insertMany(
      validCodes.map((code) => ({
        ...code,
        maxReviews: code.maxReviews || 3,
      }))
    );

    res.status(201).json({
      message: `${insertedCodes.length} codes added successfully`,
      addedCount: insertedCodes.length,
      totalProvided: codes.length,
    });
  } catch (error) {
    console.error("Error bulk adding codes:", error);
    res.status(500).json({ error: "Failed to add codes" });
  }
});

// Get all codes (admin)
app.get("/api/codes", async (req, res) => {
  try {
    const codes = await Code.find().sort({ createdAt: -1 });
    res.json(codes);
  } catch (error) {
    console.error("Error fetching codes:", error);
    res.status(500).json({ error: "Failed to fetch codes" });
  }
});

// Get all reviews (admin)
app.get("/api/reviews", async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate("codeId", "title language")
      .sort({ createdAt: -1 });
    res.json(reviews);
  } catch (error) {
    console.error("Error fetching reviews:", error);
    res.status(500).json({ error: "Failed to fetch reviews" });
  }
});

// Export reviews as CSV (for your thesis data)
app.get("/api/reviews/export", async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate("codeId", "title language code")
      .sort({ createdAt: -1 });

    // Create CSV content
    const csvHeader =
      "Code Title,Code Language,Code Content,Reviewer Name,Years of Experience,Position,Review Category,Review Comment,Review Date\n";
    const csvRows = reviews
      .map((review) => {
        const codeContent = review.codeId.code
          .replace(/"/g, '""')
          .replace(/\n/g, " ");
        const reviewComment = review.reviewComment.replace(/"/g, '""');

        return `"${review.codeId.title}","${
          review.codeId.language
        }","${codeContent}","${review.reviewerName}",${
          review.yearsOfExperience
        },"${review.position}","${
          review.category
        }","${reviewComment}","${review.createdAt.toISOString()}"`;
      })
      .join("\n");

    const csvContent = csvHeader + csvRows;

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      'attachment; filename="code_reviews.csv"'
    );
    res.send(csvContent);
  } catch (error) {
    console.error("Error exporting reviews:", error);
    res.status(500).json({ error: "Failed to export reviews" });
  }
});

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
