const mongoose = require('mongoose');
const { dynamicContentItemSchema, contentSectionSchema } = require('../common/dynamicContentSchema');

// Sub-schema for uploaded files
const uploadedFileSchema = new mongoose.Schema({
  fileName: {
    type: String,
    required: true,
    trim: true
  },
  fileUrl: {
    type: String,
    required: true,
    trim: true
  },
  cloudinaryId: {
    type: String,
    trim: true
  },
  fileType: {
    type: String,
    enum: ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx', 'other'],
    default: 'pdf'
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const answerSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["Job", "Admission", "LatestNotice", "Other"],
      required: true,
    },

    referenceId: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "referenceModel",
      required: false,
    },

    referenceModel: {
      type: String,
      enum: ["Job", "Admission", "LatestNotice", "OtherModel"],
      required: false,
    },

    directWebURL: {
      type: String,
      trim: true,
    },

    linkMenuField: {
      type: String,
      trim: true,
    },

    postTypeDetails: {
      type: String,
      trim: true,
    },

    alsoShowLink: {
      type: Boolean,
      default: false,
    },

    // ========== DYNAMIC CONTENT SECTION ==========
    // Simple text description
    description: {
      type: String,
      trim: true,
      default: ''
    },

    // Dynamic flexible content
    dynamicContent: {
      type: [dynamicContentItemSchema],
      default: []
    },

    // Organized sections
    contentSections: {
      type: [contentSectionSchema],
      default: []
    },

    // Common quick fields
    importantInstructions: {
      type: [String],
      default: []
    },

    documentsRequired: {
      type: [String],
      default: []
    },

    // ========== SPECIFIC FILE UPLOADS ==========
    // Specific file type fields for easy access
    officialNotification: uploadedFileSchema,
    examDateNotice: uploadedFileSchema,
    syllabusFile: uploadedFileSchema,
    admitCardFile: uploadedFileSchema,
    answerKeyFile: uploadedFileSchema,
    resultFile: uploadedFileSchema,
    otherFile: uploadedFileSchema,

    // ========== ANSWER SPECIFIC FIELDS ==========
    examName: {
      type: String,
      trim: true,
    },

    publishDate: {
      type: Date,
      default: Date.now,
    },

    lastDate: {
      type: Date,
    },

    status: {
      type: String,
      enum: ["pending", "verified", "rejected", "onHold"],
      default: "pending",
    },

    answerStatus: {
      type: String,
      enum: ["active", "inactive"],
      required: true,
      default: "active",
    },

    // -------------------------------
    // USER WHO CREATED THE ANSWER
    // -------------------------------
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    createdByDetails: {
      name: { type: String, trim: true },
      email: { type: String, trim: true },
      phone: { type: String, trim: true },
      role: { type: String, trim: true },
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
    },

    // -------------------------------
    // USER WHO VERIFIED THE ANSWER
    // -------------------------------
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },

    verifiedByDetails: {
      name: { type: String, trim: true },
      email: { type: String, trim: true },
      phone: { type: String, trim: true },
      role: { type: String, trim: true },
      userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
    },

    verifiedAt: {
      type: Date,
    },

    rejectionReason: {
      type: String,
      trim: true,
    },

    tags: [
      {
        type: String,
        trim: true,
      },
    ],

    category: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Answer", answerSchema);
