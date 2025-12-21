const mongoose = require('mongoose');
const { dynamicContentItemSchema, contentSectionSchema } = require('../common/dynamicContentSchema');

const resultSchema = new mongoose.Schema(
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
    // Use this for result specific content like merit lists, cut-off marks, toppers, etc.

    // Simple text description
    description: {
      type: String,
      trim: true,
      default: ''
    },

    // Dynamic flexible content (type + value structure)
    // Examples:
    // - Merit list: { type: 'table', value: {...} }
    // - Cut-off marks: { type: 'table', value: {...} }
    // - Toppers list: { type: 'list', value: [...] }
    dynamicContent: {
      type: [dynamicContentItemSchema],
      default: []
    },

    // Organized sections (for complex results)
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

    // ========== RESULT SPECIFIC FIELDS ==========

    resultType: {
      type: String,
      enum: ["Final", "Provisional", "MeritList", "CutOff", "AnswerKey", "ScoreCard", "Other"],
      required: true,
      default: "Final",
    },

    examName: {
      type: String,
      trim: true,
    },

    publishDate: {
      type: Date,
      default: Date.now,
    },

    resultDate: {
      type: Date,
    },

    status: {
      type: String,
      enum: ["pending", "verified", "rejected", "onHold"],
      default: "pending",
    },

    resultStatus: {
      type: String,
      enum: ["active", "inactive"],
      required: true,
      default: "active",
    },

    // -------------------------------
    // USER WHO CREATED THE RESULT
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
    // USER WHO VERIFIED THE RESULT
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

module.exports = mongoose.model("Result", resultSchema);
