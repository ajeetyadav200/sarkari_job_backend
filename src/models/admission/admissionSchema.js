const mongoose = require('mongoose');
const { dynamicContentItemSchema, contentSectionSchema } = require('../common/dynamicContentSchema');

/**
 * Admission Schema - Flexible structure for admission criteria and rules
 * Uses dynamic content sections to support various types of admission requirements
 *
 * Examples:
 * - Eligibility Criteria: Educational qualifications, age limits, physical standards
 * - Application Process: Step-by-step instructions, required documents
 * - Selection Procedure: Written test, interview, merit list criteria
 * - Fee Structure: Application fee, course fee, payment methods
 * - Important Instructions: Do's and Don'ts, special instructions
 */

const admissionSchema = new mongoose.Schema({
  // Basic Information
  admissionId: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true
  },

  title: {
    type: String,
    required: true,
    trim: true,
    index: true
  },

  organizationName: {
    type: String,
    required: true,
    trim: true,
    index: true
  },

  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    index: true
  },

  // Category
  category: {
    type: String,
    required: true,
    enum: [
      'university',
      'college',
      'school',
      'government',
      'private',
      'entrance-exam',
      'scholarship',
      'training-program',
      'other'
    ],
    default: 'college',
    index: true
  },

  // Course/Program Details
  programName: {
    type: String,
    trim: true,
    default: ''
  },

  programType: {
    type: String,
    enum: [
      'undergraduate',
      'postgraduate',
      'diploma',
      'certificate',
      'phd',
      'vocational',
      'entrance-exam',
      'other'
    ],
    default: 'undergraduate'
  },

  // Important Dates
  dates: {
    applicationStartDate: {
      type: Date,
      required: true
    },
    applicationEndDate: {
      type: Date,
      required: true
    },
    lastDateForFeePayment: Date,
    correctionStartDate: Date,
    correctionEndDate: Date,
    admitCardAvailableDate: Date,
    examDate: Date,
    resultDate: Date
  },

  // Application Details
  applicationFee: {
    general: {
      type: Number,
      default: 0
    },
    obc: {
      type: Number,
      default: 0
    },
    sc: {
      type: Number,
      default: 0
    },
    st: {
      type: Number,
      default: 0
    },
    ews: {
      type: Number,
      default: 0
    },
    other: mongoose.Schema.Types.Mixed
  },

  // Age Limit
  ageLimit: {
    minimum: {
      type: Number,
      default: null
    },
    maximum: {
      type: Number,
      default: null
    },
    relaxation: {
      type: mongoose.Schema.Types.Mixed,
      default: null
    }
  },

  // Total Seats/Vacancies
  totalSeats: {
    type: Number,
    default: null
  },

  seatsBreakup: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },

  // Application Mode
  applicationMode: {
    type: String,
    enum: ['online', 'offline', 'both'],
    default: 'online'
  },

  // Official Links
  officialWebsite: {
    type: String,
    trim: true,
    default: ''
  },

  applyLink: {
    type: String,
    trim: true,
    default: ''
  },

  notificationPDF: {
    type: String,
    trim: true,
    default: ''
  },

  syllabusPDF: {
    type: String,
    trim: true,
    default: ''
  },

  // Dynamic Content Sections for Flexible Criteria & Rules
  sections: {
    type: [contentSectionSchema],
    default: []
  },

  // Quick Summary (can be auto-generated or manual)
  summary: {
    type: String,
    trim: true,
    default: ''
  },

  // Tags for better search
  tags: {
    type: [String],
    default: [],
    index: true
  },

  // State/Location
  state: {
    type: String,
    trim: true,
    default: 'all-india',
    index: true
  },

  // Status
  status: {
    type: String,
    enum: ['draft', 'active', 'closed', 'cancelled', 'archived'],
    default: 'active',
    index: true
  },

  // Is Latest
  isLatest: {
    type: Boolean,
    default: true,
    index: true
  },

  // Visibility
  isVisible: {
    type: Boolean,
    default: true,
    index: true
  },

  // View Count
  viewCount: {
    type: Number,
    default: 0
  },

  // SEO Fields
  metaTitle: {
    type: String,
    trim: true,
    default: ''
  },

  metaDescription: {
    type: String,
    trim: true,
    default: ''
  },

  metaKeywords: {
    type: [String],
    default: []
  },

  // Created By (Admin reference)
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null
  },

  // Last Updated By
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    default: null
  }

}, {
  timestamps: true,
  collection: 'admissions'
});

// Indexes for better query performance
admissionSchema.index({ createdAt: -1 });
admissionSchema.index({ 'dates.applicationEndDate': 1 });
admissionSchema.index({ category: 1, status: 1 });
admissionSchema.index({ state: 1, isLatest: 1 });

// Virtual for checking if application is open
admissionSchema.virtual('isApplicationOpen').get(function() {
  const now = new Date();
  return now >= this.dates.applicationStartDate &&
         now <= this.dates.applicationEndDate &&
         this.status === 'active';
});

// Method to increment view count
admissionSchema.methods.incrementViewCount = function() {
  this.viewCount += 1;
  return this.save();
};

// Static method to find active admissions
admissionSchema.statics.findActive = function(filters = {}) {
  return this.find({
    ...filters,
    status: 'active',
    isVisible: true
  }).sort({ createdAt: -1 });
};

// Static method to find latest admissions
admissionSchema.statics.findLatest = function(limit = 10) {
  return this.find({
    status: 'active',
    isVisible: true,
    isLatest: true
  })
  .sort({ createdAt: -1 })
  .limit(limit);
};

// Pre-save hook to auto-generate slug if not provided
admissionSchema.pre('save', function(next) {
  if (!this.slug && this.title) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  next();
});

const Admission = mongoose.model('Admission', admissionSchema);

module.exports = Admission;
