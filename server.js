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
  reviewedBy: [
    {
      type: String, // email addresses
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const LineReviewSchema = new mongoose.Schema({
  lineNumber: {
    type: Number,
    required: true,
  },
  comment: {
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
      "Debugging",
      "Refactoring",
      "Other",
    ],
  },
});

const ReviewSchema = new mongoose.Schema({
  codeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Code",
    required: true,
  },
  reviewerEmail: {
    type: String,
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
  generalComment: {
    type: String,
    required: false,
  },
  lineReviews: [LineReviewSchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Create compound index to ensure one review per user per code
ReviewSchema.index({ codeId: 1, reviewerEmail: 1 }, { unique: true });

const Code = mongoose.model("Code", CodeSchema);
const Review = mongoose.model("Review", ReviewSchema);

// Routes
// Get random code for review (excluding completed ones and ones already reviewed by this user)
app.get("/api/codes/random", async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ error: "Email parameter is required" });
    }

    // Find codes that are not completed and not reviewed by this user
    const availableCodes = await Code.find({
      isCompleted: false,
      reviewedBy: { $ne: email },
    });

    if (availableCodes.length === 0) {
      return res.status(404).json({
        message:
          "No codes available for review. You may have reviewed all available codes or all codes are completed.",
      });
    }

    // Randomly select one code
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
      reviewerEmail,
      reviewerName,
      yearsOfExperience,
      position,
      generalComment,
      lineReviews,
    } = req.body;

    // Validation
    if (
      !codeId ||
      !reviewerEmail ||
      !reviewerName ||
      !yearsOfExperience ||
      !position ||
      !lineReviews ||
      lineReviews.length === 0
    ) {
      return res.status(400).json({
        error:
          "Code ID, reviewer email, name, experience, position, and at least one line review are required",
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(reviewerEmail)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Check if code exists and is not completed
    const code = await Code.findById(codeId);
    if (!code) {
      return res.status(404).json({ error: "Code not found" });
    }

    if (code.isCompleted) {
      return res.status(400).json({
        error: "This code has already been reviewed maximum times",
      });
    }

    // Check if user has already reviewed this code
    if (code.reviewedBy.includes(reviewerEmail)) {
      return res.status(400).json({
        error: "You have already reviewed this code",
      });
    }

    // Validate line reviews
    for (let lineReview of lineReviews) {
      if (
        !lineReview.lineNumber ||
        !lineReview.comment ||
        !lineReview.category
      ) {
        return res.status(400).json({
          error:
            "Each line review must have line number, comment, and category",
        });
      }
      if (lineReview.comment.length < 10) {
        return res.status(400).json({
          error: `Comment for line ${lineReview.lineNumber} must be at least 10 characters long`,
        });
      }
    }

    // Create review
    const review = new Review({
      codeId,
      reviewerEmail,
      reviewerName,
      yearsOfExperience: parseInt(yearsOfExperience),
      position,
      generalComment,
      lineReviews,
    });

    await review.save();

    // Update code review count and add reviewer email
    code.reviewCount += 1;
    code.reviewedBy.push(reviewerEmail);

    if (code.reviewCount >= code.maxReviews) {
      code.isCompleted = true;
    }

    await code.save();

    res.status(201).json({
      message: "Review submitted successfully",
      review: {
        id: review._id,
        reviewCount: code.reviewCount,
        maxReviews: code.maxReviews,
        isCompleted: code.isCompleted,
      },
    });
  } catch (error) {
    if (error.code === 11000) {
      // Duplicate key error - user already reviewed this code
      return res.status(400).json({
        error: "You have already reviewed this code",
      });
    }
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
    const uniqueReviewers = await Review.distinct("reviewerEmail");

    res.json({
      totalCodes,
      completedCodes,
      pendingCodes,
      totalReviews,
      uniqueReviewers: uniqueReviewers.length,
    });
  } catch (error) {
    console.error("Error fetching stats:", error);
    res.status(500).json({ error: "Failed to fetch statistics" });
  }
});

// Check if user can review a specific code
app.get("/api/codes/:id/can-review", async (req, res) => {
  try {
    const { id } = req.params;
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({ error: "Email parameter is required" });
    }

    const code = await Code.findById(id);
    if (!code) {
      return res.status(404).json({ error: "Code not found" });
    }

    const canReview = !code.isCompleted && !code.reviewedBy.includes(email);

    res.json({
      canReview,
      isCompleted: code.isCompleted,
      alreadyReviewed: code.reviewedBy.includes(email),
      reviewCount: code.reviewCount,
      maxReviews: code.maxReviews,
    });
  } catch (error) {
    console.error("Error checking review eligibility:", error);
    res.status(500).json({ error: "Failed to check review eligibility" });
  }
});

// Admin routes for managing codes
// Add a new code
app.post("/api/codes", async (req, res) => {
  try {
    const { title, code, language, maxReviews } = req.body;

    if (!title || !code || !language) {
      return res.status(400).json({
        error: "Title, code, and language are required",
      });
    }

    const newCode = new Code({
      title,
      code,
      language,
      maxReviews: maxReviews || 3,
    });

    await newCode.save();
    res.status(201).json({
      message: "Code added successfully",
      code: newCode,
    });
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

// Export reviews as CSV
app.get("/api/reviews/export", async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate("codeId", "title language code")
      .sort({ createdAt: -1 });

    // Create CSV content with line reviews
    const csvHeader =
      "Code Title,Code Language,Code Content,Reviewer Name,Reviewer Email,Years of Experience,Position,General Comment,Line Number,Line Comment,Line Category,Review Date\n";

    const csvRows = [];

    reviews.forEach((review) => {
      const codeContent = review.codeId.code
        .replace(/"/g, '""')
        .replace(/\n/g, " ");
      const generalComment = (review.generalComment || "").replace(/"/g, '""');

      if (review.lineReviews && review.lineReviews.length > 0) {
        review.lineReviews.forEach((lineReview) => {
          const lineComment = lineReview.comment.replace(/"/g, '""');
          csvRows.push(
            `"${review.codeId.title}","${
              review.codeId.language
            }","${codeContent}","${review.reviewerName}","${
              review.reviewerEmail
            }",${review.yearsOfExperience},"${
              review.position
            }","${generalComment}",${lineReview.lineNumber},"${lineComment}","${
              lineReview.category
            }","${review.createdAt.toISOString()}"`
          );
        });
      } else {
        // If no line reviews, still add a row
        csvRows.push(
          `"${review.codeId.title}","${
            review.codeId.language
          }","${codeContent}","${review.reviewerName}","${
            review.reviewerEmail
          }",${review.yearsOfExperience},"${
            review.position
          }","${generalComment}","","","","${review.createdAt.toISOString()}"`
        );
      }
    });

    const csvContent = csvHeader + csvRows.join("\n");

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
