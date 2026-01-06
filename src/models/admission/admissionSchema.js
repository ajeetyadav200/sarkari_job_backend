const mongoose = require('mongoose');
const validator = require('validator');
const { dynamicContentItemSchema, contentSectionSchema } = require('../common/dynamicContentSchema');

/**
 * Admission Schema - Highly flexible structure for all types of admissions
 * Supports: BSEB DELED, NTA CUET, University Admissions, Entrance Exams, etc.
 *
 * Uses dynamic content sections for maximum flexibility:
 * - Eligibility Criteria (Educational, Age, Category-wise)
 * - Application Process & Instructions
 * - Selection Procedure & Exam Pattern
 * - Fee Structure (Category-wise, Additional charges)
 * - Important Dates & Deadlines
 * - Participating Universities/Institutions
 * - FAQ, Important Links, Documents Required
 */

// Admission Status Enum
const admissionStatusEnum = {
  PENDING: 'pending',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
  CLOSED: 'closed',
  ARCHIVED: 'archived'
};

// Sub-schema for user snapshot
const userSnapshotSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin',
    required: true
  },
  firstName: String,
  lastName: String,
  email: {
    type: String,
    required: true,
    validate: [validator.isEmail, 'Please provide a valid email']
  },
  phone: String,
  role: {
    type: String,
    enum: ['admin', 'assistant', 'publisher'],
    required: true
  }
}, { _id: false });

const admissionSchema = new mongoose.Schema({
  // ========== BASIC INFORMATION ==========

  // Department/Organization Name (BSEB, NTA, etc.)
  departmentName: {
    type: String,
    required: [true, 'Department/Organization name is required'],
    trim: true,
    index: true
  },

  // Post/Program Name (DELED, CUET UG, etc.)
  postName: {
    type: String,
    required: [true, 'Post/Program name is required'],
    trim: true,
    index: true
  },

  // Short title for display
  title: {
    type: String,
    required: true,
    trim: true,
    index: true
  },

  // URL-friendly slug
  slug: {
    type: String,
    unique: true,
    trim: true,
    lowercase: true,
    index: true
  },

  // ========== CATEGORY & TYPE ==========

  // Type of admission
  category: {
    type: String,
    required: true,
    enum: [
      'university',
      'entrance-exam',
      'diploma',
      'degree',
      'government',
      'private',
      'scholarship',
      'training',
      'other'
    ],
    default: 'entrance-exam',
    index: true
  },

  // Program type
  programType: {
    type: String,
    enum: [
      'undergraduate',
      'postgraduate',
      'diploma',
      'certificate',
      'phd',
      'entrance-exam',
      'teacher-training',
      'vocational',
      'other'
    ],
    default: 'entrance-exam'
  },

  // Application mode
  modeOfApplication: {
    type: String,
    enum: ['online', 'offline', 'both'],
    default: 'online'
  },

  // Show in portal
  showInPortal: {
    type: Boolean,
    default: true,
    index: true
  },

  // ========== CONTACT INFORMATION ==========

  helpEmailId: {
    type: String,
    trim: true,
    lowercase: true,
    validate: {
      validator: function(v) {
        return !v || validator.isEmail(v);
      },
      message: 'Please provide a valid email'
    }
  },

  helpCareNo: {
    type: String,
    trim: true
  },

  officialWebsite: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        return !v || validator.isURL(v);
      },
      message: 'Please provide a valid URL'
    }
  },

  // ========== IMPORTANT DATES ==========

  importantDates: {
    // Application dates
    applicationStartDate: {
      type: Date,
      required: true
    },
    applicationEndDate: {
      type: Date,
      required: true
    },
    lastDateForFeePayment: Date,

    // Correction & Extension
    correctionStartDate: Date,
    correctionEndDate: Date,
    extendedDate: Date,

    // Exam related
    admitCardReleaseDate: Date,
    dummyAdmitCardDate: Date,
    examStartDate: Date,
    examEndDate: Date,

    // Results
    answerKeyDate: Date,
    answerKeyObjectionStartDate: Date,
    answerKeyObjectionEndDate: Date,
    resultDate: Date,

    // Other dates
    counsellingStartDate: Date,
    counsellingEndDate: Date,

    // Custom dates (stored in dynamic content sections for flexibility)
  },

  // ========== AGE LIMIT ==========

  ageLimit: {
    minimumAge: {
      type: Number,
      default: null
    },
    maximumAge: {
      type: Number,
      default: null
    },
    ageCalculationDate: {
      type: Date,
      default: null
    },
    relaxation: {
      type: String,
      trim: true,
      default: ''
    }
  },

  // ========== SEATS/VACANCIES ==========

  totalSeats: {
    type: Number,
    default: null
  },

  // Category-wise seat breakup (flexible structure)
  categorySeats: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },

  // ========== APPLICATION FEE ==========

  // Category-wise fees
  applicationFee: {
    general: {
      type: Number,
      default: 0
    },
    obc: {
      type: Number,
      default: 0
    },
    ebc: {
      type: Number,
      default: 0
    },
    ews: {
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
    ph: {
      type: Number,
      default: 0
    },
    pwd: {
      type: Number,
      default: 0
    },
    other: mongoose.Schema.Types.Mixed
  },

  // Additional fee details (like per-subject charge for CUET)
  additionalFeeDetails: {
    type: mongoose.Schema.Types.Mixed,
    default: null
  },

  // Payment modes available
  paymentModes: {
    type: [String],
    default: ['debit-card', 'credit-card', 'net-banking', 'upi']
  },

  // ========== ELIGIBILITY ==========

  // Education qualification (simple text)
  eligibilityEducational: {
    type: String,
    trim: true,
    default: ''
  },

  // Additional eligibility criteria (stored in sections for flexibility)

  // ========== SELECTION PROCESS ==========

  selectionMode: {
    type: [String],
    default: []
  },

  // Exam pattern details (stored in sections)

  // ========== PARTICIPATING INSTITUTIONS ==========

  // For exams like CUET that have multiple participating universities
  participatingInstitutions: {
    type: [String],
    default: []
  },

  // Total number of participating institutions
  totalParticipatingInstitutions: {
    type: Number,
    default: 0
  },

  // ========== DYNAMIC CONTENT SECTIONS ==========
  // This is where ALL flexible content goes

  // Simple description
  description: {
    type: String,
    trim: true,
    default: ''
  },

  // Flexible dynamic content items
  dynamicContent: {
    type: [dynamicContentItemSchema],
    default: []
  },

  // Organized content sections
  sections: {
    type: [contentSectionSchema],
    default: []
  },

  // Quick arrays for common content
  importantInstructions: {
    type: [String],
    default: []
  },

  documentsRequired: {
    type: [String],
    default: []
  },

  importantLinks: {
    applyLink: String,
    notificationLink: String,
    syllabusLink: String,
    informationBulletinLink: String,
    officialWebsiteLink: String,
    other: mongoose.Schema.Types.Mixed
  },

  // ========== MEDIA & FILES ==========

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

  informationBrochure: {
    type: String,
    trim: true,
    default: ''
  },

  // ========== SEO & METADATA ==========

  // Post date (when admission was posted on website)
  postDate: {
    type: Date,
    default: Date.now
  },

  // Tags for search
  tags: {
    type: [String],
    default: [],
    index: true
  },

  // State/Region
  state: {
    type: String,
    trim: true,
    default: 'all-india',
    index: true
  },

  // SEO fields
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

  // ========== STATUS & APPROVAL ==========

  status: {
    type: String,
    enum: Object.values(admissionStatusEnum),
    default: admissionStatusEnum.PENDING,
    index: true
  },

  statusRemark: {
    type: String,
    trim: true,
    default: ''
  },

  rejectionReason: {
    type: String,
    trim: true,
    default: ''
  },

  // Is this a latest/featured admission
  isLatest: {
    type: Boolean,
    default: true,
    index: true
  },

  isFeatured: {
    type: Boolean,
    default: false,
    index: true
  },

  // Visibility
  isVisible: {
    type: Boolean,
    default: true,
    index: true
  },

  // ========== ANALYTICS ==========

  viewCount: {
    type: Number,
    default: 0
  },

  // ========== USER TRACKING ==========

  // Creator Information (Snapshot)
  createdBy: {
    type: userSnapshotSchema,
    required: true
  },

  // Approver Information (Snapshot)
  approvedBy: {
    type: userSnapshotSchema,
    default: null
  },

  // Last Updated By
  updatedBy: {
    type: userSnapshotSchema,
    default: null
  },

  // Status change timestamp
  statusChangedAt: {
    type: Date,
    default: null
  }

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
  collection: 'admissions'
});

// ========== INDEXES ==========
admissionSchema.index({ createdAt: -1 });
admissionSchema.index({ 'importantDates.applicationEndDate': 1 });
admissionSchema.index({ category: 1, status: 1 });
admissionSchema.index({ state: 1, isLatest: 1 });
admissionSchema.index({ departmentName: 'text', postName: 'text', title: 'text' });

// ========== VIRTUALS ==========

// Check if application is currently open
admissionSchema.virtual('isApplicationOpen').get(function() {
  if (!this.importantDates.applicationStartDate || !this.importantDates.applicationEndDate) {
    return false;
  }
  const now = new Date();
  return now >= this.importantDates.applicationStartDate &&
         now <= this.importantDates.applicationEndDate &&
         this.status === admissionStatusEnum.VERIFIED;
});

// Calculate remaining days for application
admissionSchema.virtual('remainingDays').get(function() {
  if (!this.importantDates.applicationEndDate) return null;

  const now = new Date();
  const endDate = new Date(this.importantDates.applicationEndDate);
  const diffTime = endDate - now;
  const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return days > 0 ? days : 0;
});

// ========== METHODS ==========

// Method to increment view count
admissionSchema.methods.incrementViewCount = function() {
  this.viewCount += 1;
  return this.save();
};

// Check if user can edit this admission
admissionSchema.methods.canEdit = function(userId, userRole) {
  if (userRole === 'admin') return true;
  if (this.createdBy.userId.toString() !== userId.toString()) return false;
  return this.status === admissionStatusEnum.PENDING;
};

// ========== STATIC METHODS ==========

// Find active admissions
admissionSchema.statics.findActive = function(filters = {}) {
  return this.find({
    ...filters,
    status: admissionStatusEnum.VERIFIED,
    isVisible: true
  }).sort({ createdAt: -1 });
};

// Find latest admissions
admissionSchema.statics.findLatest = function(limit = 10) {
  return this.find({
    status: admissionStatusEnum.VERIFIED,
    isVisible: true,
    isLatest: true
  })
  .sort({ createdAt: -1 })
  .limit(limit);
};

// Find open admissions (applications currently open)
admissionSchema.statics.findOpenAdmissions = function() {
  const now = new Date();
  return this.find({
    status: admissionStatusEnum.VERIFIED,
    isVisible: true,
    'importantDates.applicationStartDate': { $lte: now },
    'importantDates.applicationEndDate': { $gte: now }
  }).sort({ 'importantDates.applicationEndDate': 1 });
};

// Get statistics
admissionSchema.statics.getStatistics = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const totalAdmissions = await this.countDocuments();
  const categoryWise = await this.aggregate([
    {
      $group: {
        _id: '$category',
        count: { $sum: 1 }
      }
    }
  ]);

  return {
    totalAdmissions,
    statusWise: stats,
    categoryWise
  };
};

// ========== PRE-SAVE HOOKS ==========

// Auto-generate slug if not provided
admissionSchema.pre('save', function(next) {
  if (!this.slug && this.title) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
  next();
});

// Auto-generate title if not provided
admissionSchema.pre('save', function(next) {
  if (!this.title && this.departmentName && this.postName) {
    this.title = `${this.departmentName} ${this.postName} Admission`;
  }
  next();
});

// ========== MODEL ==========

const Admission = mongoose.models.Admission || mongoose.model('Admission', admissionSchema);

module.exports = {
  Admission,
  admissionStatusEnum
};
