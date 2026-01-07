const mongoose = require('mongoose');
const validator = require('validator');
const { dynamicContentItemSchema, contentSectionSchema } = require('../common/dynamicContentSchema');

// Enums
const answerStatusEnum = {
  PENDING: 'pending',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
  ON_HOLD: 'onHold'
};

const categoryEnum = {
  GOVERNMENT: 'government',
  PRIVATE: 'private',
  SEMI_GOVERNMENT: 'semi-government'
};

const examTypeEnum = {
  SSC: 'ssc',
  UPSC: 'upsc',
  RAILWAY: 'railway',
  BANKING: 'banking',
  STATE_GOVT: 'state-govt',
  POLICE: 'police',
  TEACHING: 'teaching',
  DEFENSE: 'defense',
  PSU: 'psu',
  OTHER: 'other'
};

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

// Sub-schema for important dates
const importantDateSchema = new mongoose.Schema({
  examDate: Date,
  answerKeyDate: Date,
  resultDate: Date,
  applicationStartDate: Date,
  applicationEndDate: Date,
  examStartDate: Date,
  examEndDate: Date,
  objectionStartDate: Date,
  objectionEndDate: Date,
  admitCardDate: Date,
  correctionDate: Date,
  feeLastDate: Date,
  revisedAnswerKeyDate: Date
}, { _id: false });

// Sub-schema for user snapshot
const userSnapshotSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  firstName: {
    type: String
  },
  lastName: {
    type: String
  },
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

// Sub-schema for category fees
const categoryFeeSchema = new mongoose.Schema({
  general: {
    type: Number,
    default: 0,
    min: 0
  },
  obc: {
    type: Number,
    default: 0,
    min: 0
  },
  sc: {
    type: Number,
    default: 0,
    min: 0
  },
  st: {
    type: Number,
    default: 0,
    min: 0
  },
  ews: {
    type: Number,
    default: 0,
    min: 0
  },
  ph: {
    type: Number,
    default: 0,
    min: 0
  }
}, { _id: false });

// Sub-schema for category posts/vacancies
const categoryPostSchema = new mongoose.Schema({
  general: {
    type: Number,
    default: 0,
    min: 0
  },
  obc: {
    type: Number,
    default: 0,
    min: 0
  },
  sc: {
    type: Number,
    default: 0,
    min: 0
  },
  st: {
    type: Number,
    default: 0,
    min: 0
  },
  ews: {
    type: Number,
    default: 0,
    min: 0
  },
  ph: {
    type: Number,
    default: 0,
    min: 0
  }
}, { _id: false });

// Sub-schema for age limits
const ageLimitSchema = new mongoose.Schema({
  minimumAge: {
    type: Number,
    min: 0
  },
  maximumAge: {
    type: Number,
    min: 0
  },
  ageCalculationDate: Date,
  relaxation: {
    type: String,
    trim: true
  }
}, { _id: false });

// Sub-schema for FAQ
const faqSchema = new mongoose.Schema({
  question: {
    type: String,
    required: true,
    trim: true
  },
  answer: {
    type: String,
    required: true,
    trim: true
  }
}, { _id: true });

// Sub-schema for Important Links
const importantLinkSchema = new mongoose.Schema({
  linkName: {
    type: String,
    required: true,
    trim: true
  },
  linkUrl: {
    type: String,
    required: true,
    trim: true,
    validate: [validator.isURL, 'Please provide a valid URL']
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { _id: true });

// Main Answer Schema
const answerSchema = new mongoose.Schema({
  // ========== BASIC INFORMATION ==========
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [300, 'Title cannot exceed 300 characters']
  },

  organizationName: {
    type: String,
    required: [true, 'Organization name is required'],
    trim: true,
    maxlength: [200, 'Organization name cannot exceed 200 characters']
  },

  postName: {
    type: String,
    trim: true,
    maxlength: [200, 'Post name cannot exceed 200 characters']
  },

  examName: {
    type: String,
    trim: true,
    maxlength: [200, 'Exam name cannot exceed 200 characters']
  },

  category: {
    type: String,
    enum: Object.values(categoryEnum),
    default: 'government',
    lowercase: true
  },

  examType: {
    type: String,
    enum: Object.values(examTypeEnum),
    lowercase: true
  },

  state: {
    type: String,
    trim: true
  },

  // ========== POST/VACANCY DETAILS ==========
  totalPosts: {
    type: Number,
    min: 0
  },

  categoryPosts: {
    type: categoryPostSchema,
    default: () => ({})
  },

  // ========== APPLICATION FEE ==========
  applicationFee: {
    type: categoryFeeSchema,
    default: () => ({})
  },

  // ========== AGE LIMIT ==========
  ageLimit: {
    type: ageLimitSchema,
    default: () => ({})
  },

  // ========== IMPORTANT DATES ==========
  importantDates: {
    type: importantDateSchema,
    default: () => ({})
  },

  // ========== ELIGIBILITY ==========
  eligibilityEducational: {
    type: String,
    trim: true,
    maxlength: [1000, 'Educational eligibility cannot exceed 1000 characters']
  },

  eligibilityNationality: {
    type: String,
    trim: true,
    default: 'Indian Citizen'
  },

  // ========== SELECTION MODE/PROCESS ==========
  selectionMode: {
    type: [String],
    default: []
  },

  // ========== DYNAMIC FILE UPLOADS ==========
  uploadedFiles: {
    type: [uploadedFileSchema],
    default: []
  },

  // Specific file type fields for easy access
  officialNotification: uploadedFileSchema,
  examDateNotice: uploadedFileSchema,
  syllabusFile: uploadedFileSchema,
  admitCardFile: uploadedFileSchema,
  answerKeyFile: uploadedFileSchema,
  resultFile: uploadedFileSchema,

  // ========== IMPORTANT LINKS ==========
  importantLinks: {
    type: [importantLinkSchema],
    default: []
  },

  // Quick access links
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

  applyLink: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        return !v || validator.isURL(v);
      },
      message: 'Please provide a valid URL'
    }
  },

  admitCardLink: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        return !v || validator.isURL(v);
      },
      message: 'Please provide a valid URL'
    }
  },

  answerKeyLink: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        return !v || validator.isURL(v);
      },
      message: 'Please provide a valid URL'
    }
  },

  resultLink: {
    type: String,
    trim: true,
    validate: {
      validator: function(v) {
        return !v || validator.isURL(v);
      },
      message: 'Please provide a valid URL'
    }
  },

  // ========== CONTACT & HELP ==========
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

  // ========== DYNAMIC CONTENT ==========
  description: {
    type: String,
    trim: true
  },

  shortDescription: {
    type: String,
    trim: true,
    maxlength: [500, 'Short description cannot exceed 500 characters']
  },

  dynamicContent: {
    type: [dynamicContentItemSchema],
    default: []
  },

  contentSections: {
    type: [contentSectionSchema],
    default: []
  },

  importantInstructions: {
    type: [String],
    default: []
  },

  // ========== FAQ SECTION ==========
  faqs: {
    type: [faqSchema],
    default: []
  },

  // ========== OTHER DETAILS ==========
  modeOfApplication: {
    type: String,
    enum: ['online', 'offline', 'both'],
    default: 'online',
    lowercase: true
  },

  modeOfExam: {
    type: String,
    enum: ['online', 'offline', 'both'],
    lowercase: true
  },

  paymentMode: {
    type: String,
    enum: ['free', 'paid', 'conditional'],
    lowercase: true
  },

  // ========== META INFORMATION ==========
  showInPortal: {
    type: Boolean,
    default: true
  },

  isLatest: {
    type: Boolean,
    default: false
  },

  isFeatured: {
    type: Boolean,
    default: false
  },

  views: {
    type: Number,
    default: 0,
    min: 0
  },

  // ========== POST DATE ==========
  postDate: {
    type: Date,
    default: Date.now
  },

  // ========== STATUS AND APPROVAL ==========
  status: {
    type: String,
    enum: Object.values(answerStatusEnum),
    default: answerStatusEnum.PENDING
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

  // Timestamps
  statusChangedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});



// ========== VIRTUALS ==========
answerSchema.virtual('isAnswerKeyAvailable').get(function() {
  return !!(this.answerKeyLink || this.answerKeyFile);
});

answerSchema.virtual('isResultDeclared').get(function() {
  if (!this.importantDates.resultDate) return false;
  return new Date() >= new Date(this.importantDates.resultDate);
});

answerSchema.virtual('totalUploadedFiles').get(function() {
  return this.uploadedFiles.length;
});

// ========== METHODS ==========
answerSchema.methods.canEdit = function(userId, userRole) {
  if (userRole === 'admin') return true;
  if (this.createdBy.userId.toString() !== userId.toString()) return false;
  return this.status === answerStatusEnum.PENDING || this.status === answerStatusEnum.ON_HOLD;
};

answerSchema.methods.incrementViews = async function() {
  this.views += 1;
  await this.save();
};

// ========== STATICS ==========
answerSchema.statics.findByStatus = function(status) {
  return this.find({ status });
};

answerSchema.statics.findLatest = function(limit = 10) {
  return this.find({
    status: answerStatusEnum.VERIFIED,
    showInPortal: true,
    isLatest: true
  })
  .sort({ createdAt: -1 })
  .limit(limit);
};

answerSchema.statics.getStatistics = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 }
      }
    }
  ]);

  const totalAnswers = await this.countDocuments();
  const totalViews = await this.aggregate([
    {
      $group: {
        _id: null,
        totalViews: { $sum: '$views' }
      }
    }
  ]);

  return {
    totalAnswers,
    totalViews: totalViews[0]?.totalViews || 0,
    statusWise: stats
  };
};

// Check if model already exists to prevent overwrite
const Answer = mongoose.models.Answer || mongoose.model('Answer', answerSchema);

module.exports = {
  Answer,
  answerStatusEnum,
  categoryEnum,
  examTypeEnum
};
