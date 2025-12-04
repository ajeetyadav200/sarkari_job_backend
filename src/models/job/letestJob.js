// // const mongoose = require('mongoose');
// // const validator = require('validator');

// // // Enums
// // const jobStatusEnum = {
// //   PENDING: 'pending',
// //   VERIFIED: 'verified',
// //   REJECTED: 'rejected',
// //   ON_HOLD: 'onHold'
// // };

// // const formModeEnum = {
// //   ONLINE: 'online',
// //   OFFLINE: 'offline',
// //   BOTH: 'both'
// // };

// // const formTypeEnum = {
// //   GOVERNMENT: 'government',
// //   PRIVATE: 'private',
// //   SEMI_GOVERNMENT: 'semi-government'
// // };

// // const paymentModeEnum = {
// //   FREE: 'free',
// //   PAID: 'paid',
// //   CONDITIONAL: 'conditional'
// // };

// // const categoryEnum = {
// //   GENERAL: 'general',
// //   OBC: 'obc',
// //   SC: 'sc',
// //   ST: 'st',
// //   EWS: 'ews',
// //   PH: 'ph'
// // };

// // // Sub-schema for category-wise posts
// // const categoryPostSchema = new mongoose.Schema({
// //   category: {
// //     type: String,
// //     enum: Object.values(categoryEnum),
// //     required: true
// //   },
// //   count: {
// //     type: Number,
// //     min: 0,
// //     default: 0
// //   }
// // }, { _id: false });

// // // Sub-schema for category-wise fees
// // const categoryFeeSchema = new mongoose.Schema({
// //   category: {
// //     type: String,
// //     enum: Object.values(categoryEnum),
// //     required: true
// //   },
// //   amount: {
// //     type: Number,
// //     min: 0,
// //     default: 0
// //   }
// // }, { _id: false });

// // // Sub-schema for important dates
// // const importantDateSchema = new mongoose.Schema({
// //   startDate: Date,
// //   registrationLastDate: Date,
// //   feeLastDate: Date,
// //   challanFeeLastDate: Date,
// //   finalLastDate: Date,
// //   correctionDate: Date,
// //   admitCardDate: Date,
// //   examDate: Date,
// //   answerKeyDate: Date,
// //   resultDate: Date
// // }, { _id: false });

// // // Sub-schema for age details
// // const ageDetailsSchema = new mongoose.Schema({
// //   ageOnDate: Date,
// //   minimumAge: {
// //     type: Number,
// //     min: 0
// //   },
// //   maximumAge: {
// //     type: Number,
// //     min: 0
// //   },
// //   ageRelaxation: String
// // }, { _id: false });

// // // Sub-schema for user snapshot
// // const userSnapshotSchema = new mongoose.Schema({
// //   userId: {
// //     type: mongoose.Schema.Types.ObjectId,
// //     ref: 'User',
// //     required: true
// //   },
// //   name: {
// //     type: String,
// //     required: true
// //   },
// //   email: {
// //     type: String,
// //     required: true,
// //     validate: [validator.isEmail, 'Please provide a valid email']
// //   },
// //   phone: String,
// //   role: {
// //     type: String,
// //     enum: ['admin', 'assistance', 'publicer'],
// //     required: true
// //   }
// // }, { _id: false });

// // // Main Job Schema
// // const jobSchema = new mongoose.Schema({
// //   // Job Department Details
// //   departmentName: {
// //     type: String,
// //     required: [true, 'Department name is required'],
// //     trim: true,
// //     maxlength: [200, 'Department name cannot exceed 200 characters']
// //   },
  
// //   postName: {
// //     type: String,
// //     required: [true, 'Post name is required'],
// //     trim: true,
// //     maxlength: [200, 'Post name cannot exceed 200 characters']
// //   },
  
// //   helpEmailId: {
// //     type: String,
// //     required: [true, 'Help email is required'],
// //     trim: true,
// //     lowercase: true,
// //     validate: [validator.isEmail, 'Please provide a valid email']
// //   },
  
// //   helpCareNo: {
// //     type: String,
// //     required: [true, 'Help care number is required'],
// //     trim: true
// //   },
  
// //   officialWebsite: {
// //     type: String,
// //     required: [true, 'Official website is required'],
// //     trim: true,
// //     validate: [validator.isURL, 'Please provide a valid URL']
// //   },
  
// //   modeOfForm: {
// //     type: String,
// //     enum: Object.values(formModeEnum),
// //     required: true,
// //     lowercase: true
// //   },
  
// //   showInPortal: {
// //     type: Boolean,
// //     default: true
// //   },
  
// //   typeOfForm: {
// //     type: String,
// //     enum: Object.values(formTypeEnum),
// //     required: true,
// //     lowercase: true
// //   },
  
// //   paymentMode: {
// //     type: String,
// //     enum: Object.values(paymentModeEnum),
// //     required: true,
// //     lowercase: true
// //   },
  
// //   totalPost: {
// //     type: Number,
// //     required: [true, 'Total post is required'],
// //     min: [1, 'Total post must be at least 1']
// //   },
  
// //   // Category-wise Posts
// //   categoryPosts: [categoryPostSchema],
  
// //   // Category-wise Fees
// //   categoryFees: [categoryFeeSchema],
  
// //   // Eligibility
// //   eligibilityEducational1: {
// //     type: String,
// //     required: [true, 'Primary educational qualification is required'],
// //     trim: true,
// //     maxlength: [500, 'Educational qualification cannot exceed 500 characters']
// //   },
  
// //   eligibilityEducational2: {
// //     type: String,
// //     trim: true,
// //     maxlength: [500, 'Educational qualification cannot exceed 500 characters'],
// //     default: ''
// //   },
  
// //   // Important Dates
// //   importantDates: {
// //     type: importantDateSchema,
// //     required: true
// //   },
  
// //   // Age Details
// //   ageDetails: {
// //     type: ageDetailsSchema,
// //     required: true
// //   },
  
// //   pageName: {
// //     type: String,
// //     trim: true,
// //     maxlength: [200, 'Page name cannot exceed 200 characters'],
// //     default: ''
// //   },
  
// //   otherDetails: {
// //     type: String,
// //     trim: true,
// //     default: ''
// //   },
  
// //   // Status and Approval
// //   status: {
// //     type: String,
// //     enum: Object.values(jobStatusEnum),
// //     default: jobStatusEnum.PENDING
// //   },
  
// //   statusRemark: {
// //     type: String,
// //     trim: true,
// //     default: ''
// //   },
  
// //   // Creator Information (Snapshot)
// //   createdBy: {
// //     type: userSnapshotSchema,
// //     required: true
// //   },
  
// //   // Approver Information (Snapshot)
// //   approvedBy: {
// //     type: userSnapshotSchema,
// //     default: null
// //   },
  
// //   // Timestamps
// //   statusChangedAt: {
// //     type: Date,
// //     default: null
// //   }
// // }, {
// //   timestamps: true,
// //   toJSON: { virtuals: true },
// //   toObject: { virtuals: true }
// // });

// // // Indexes
// // // jobSchema.index({ status: 1 });
// // // jobSchema.index({ departmentName: 1, postName: 1 });
// // // jobSchema.index({ 'createdBy.userId': 1 });
// // // jobSchema.index({ 'importantDates.registrationLastDate': 1 });
// // // jobSchema.index({ status: 1, 'importantDates.registrationLastDate': 1 });

// // // Virtuals
// // jobSchema.virtual('isRegistrationOpen').get(function() {
// //   if (!this.importantDates.startDate || !this.importantDates.registrationLastDate) {
// //     return false;
// //   }
  
// //   const now = new Date();
// //   const startDate = new Date(this.importantDates.startDate);
// //   const lastDate = new Date(this.importantDates.registrationLastDate);
  
// //   return now >= startDate && now <= lastDate;
// // });

// // jobSchema.virtual('remainingDays').get(function() {
// //   if (!this.importantDates.registrationLastDate) return null;
  
// //   const now = new Date();
// //   const lastDate = new Date(this.importantDates.registrationLastDate);
// //   const diffTime = lastDate - now;
// //   return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
// // });

// // // Methods
// // jobSchema.methods.canEdit = function(userId, userRole) {
// //   if (userRole === 'admin') return true;
// //   if (this.createdBy.userId.toString() !== userId.toString()) return false;
// //   return this.status === jobStatusEnum.PENDING || this.status === jobStatusEnum.ON_HOLD;
// // };

// // // Statics
// // jobSchema.statics.findByStatus = function(status) {
// //   return this.find({ status });
// // };

// // jobSchema.statics.getStatistics = async function() {
// //   const stats = await this.aggregate([
// //     {
// //       $group: {
// //         _id: '$status',
// //         count: { $sum: 1 },
// //         totalPosts: { $sum: '$totalPost' }
// //       }
// //     }
// //   ]);
  
// //   const totalJobs = await this.countDocuments();
  
// //   return {
// //     totalJobs,
// //     statusWise: stats
// //   };
// // };

// // const Job = mongoose.model('Job', jobSchema);

// // module.exports = {
// //   Job,
// //   jobStatusEnum,
// //   formModeEnum,
// //   formTypeEnum,
// //   paymentModeEnum,
// //   categoryEnum
// // };




// const mongoose = require('mongoose');
// const validator = require('validator');

// // Enums
// const jobStatusEnum = {
//   PENDING: 'pending',
//   VERIFIED: 'verified',
//   REJECTED: 'rejected',
//   ON_HOLD: 'onHold'
// };

// const formModeEnum = {
//   ONLINE: 'online',
//   OFFLINE: 'offline',
//   BOTH: 'both'
// };

// const formTypeEnum = {
//   GOVERNMENT: 'government',
//   PRIVATE: 'private',
//   SEMI_GOVERNMENT: 'semi-government'
// };

// const paymentModeEnum = {
//   FREE: 'free',
//   PAID: 'paid',
//   CONDITIONAL: 'conditional'
// };

// const categoryEnum = {
//   GENERAL: 'general',
//   OBC: 'obc',
//   SC: 'sc',
//   ST: 'st',
//   EWS: 'ews',
//   PH: 'ph'
// };

// // Sub-schema for category-wise posts
// const categoryPostSchema = new mongoose.Schema({
//   category: {
//     type: String,
//     enum: Object.values(categoryEnum),
//     required: true
//   },
//   count: {
//     type: Number,
//     min: 0,
//     default: 0
//   }
// }, { _id: false });

// // Sub-schema for category-wise fees
// const categoryFeeSchema = new mongoose.Schema({
//   category: {
//     type: String,
//     enum: Object.values(categoryEnum),
//     required: true
//   },
//   amount: {
//     type: Number,
//     min: 0,
//     default: 0
//   }
// }, { _id: false });

// // Sub-schema for important dates
// const importantDateSchema = new mongoose.Schema({
//   startDate: Date,
//   registrationLastDate: Date,
//   feeLastDate: Date,
//   challanFeeLastDate: Date,
//   finalLastDate: Date,
//   correctionDate: Date,
//   admitCardDate: Date,
//   examDate: Date,
//   answerKeyDate: Date,
//   resultDate: Date
// }, { _id: false });

// // Sub-schema for age details
// const ageDetailsSchema = new mongoose.Schema({
//   ageOnDate: Date,
//   minimumAge: {
//     type: Number,
//     min: 0
//   },
//   maximumAge: {
//     type: Number,
//     min: 0
//   },
//   ageRelaxation: String
// }, { _id: false });

// // Sub-schema for user snapshot
// const userSnapshotSchema = new mongoose.Schema({
//   userId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User',
//     required: true
//   },
//   name: {
//     type: String,
//     required: true
//   },
//   email: {
//     type: String,
//     required: true,
//     validate: [validator.isEmail, 'Please provide a valid email']
//   },
//   phone: String,
//   role: {
//     type: String,
//     enum: ['admin', 'assistance', 'publicer'],
//     required: true
//   }
// }, { _id: false });

// // Main Job Schema
// const jobSchema = new mongoose.Schema({
//   // Job Department Details
//   departmentName: {
//     type: String,
//     required: [true, 'Department name is required'],
//     trim: true,
//     maxlength: [200, 'Department name cannot exceed 200 characters']
//   },
  
//   postName: {
//     type: String,
//     required: [true, 'Post name is required'],
//     trim: true,
//     maxlength: [200, 'Post name cannot exceed 200 characters']
//   },
  
//   helpEmailId: {
//     type: String,
//     required: [true, 'Help email is required'],
//     trim: true,
//     lowercase: true,
//     validate: [validator.isEmail, 'Please provide a valid email']
//   },
  
//   helpCareNo: {
//     type: String,
//     required: [true, 'Help care number is required'],
//     trim: true
//   },
  
//   officialWebsite: {
//     type: String,
//     required: [true, 'Official website is required'],
//     trim: true,
//     validate: [validator.isURL, 'Please provide a valid URL']
//   },
  
//   modeOfForm: {
//     type: String,
//     enum: Object.values(formModeEnum),
//     required: true,
//     lowercase: true
//   },
  
//   showInPortal: {
//     type: Boolean,
//     default: true
//   },
  
//   typeOfForm: {
//     type: String,
//     enum: Object.values(formTypeEnum),
//     required: true,
//     lowercase: true
//   },
  
//   paymentMode: {
//     type: String,
//     enum: Object.values(paymentModeEnum),
//     required: true,
//     lowercase: true
//   },
  
//   totalPost: {
//     type: Number,
//     required: [true, 'Total post is required'],
//     min: [1, 'Total post must be at least 1']
//   },
  
//   // Category-wise Posts
//   categoryPosts: [categoryPostSchema],
  
//   // Category-wise Fees
//   categoryFees: [categoryFeeSchema],
  
//   // Eligibility
//   eligibilityEducational1: {
//     type: String,
//     required: [true, 'Primary educational qualification is required'],
//     trim: true,
//     maxlength: [500, 'Educational qualification cannot exceed 500 characters']
//   },
  
//   eligibilityEducational2: {
//     type: String,
//     trim: true,
//     maxlength: [500, 'Educational qualification cannot exceed 500 characters'],
//     default: ''
//   },
  
//   // Important Dates
//   importantDates: {
//     type: importantDateSchema,
//     required: true
//   },
  
//   // Age Details
//   ageDetails: {
//     type: ageDetailsSchema,
//     required: true
//   },
  
//   pageName: {
//     type: String,
//     trim: true,
//     maxlength: [200, 'Page name cannot exceed 200 characters'],
//     default: ''
//   },
  
//   otherDetails: {
//     type: String,
//     trim: true,
//     default: ''
//   },
  
//   // Status and Approval
//   status: {
//     type: String,
//     enum: Object.values(jobStatusEnum),
//     default: jobStatusEnum.PENDING
//   },
  
//   statusRemark: {
//     type: String,
//     trim: true,
//     default: ''
//   },
  
//   // Creator Information (Snapshot)
//   createdBy: {
//     type: userSnapshotSchema,
//     required: true
//   },
  
//   // Approver Information (Snapshot)
//   approvedBy: {
//     type: userSnapshotSchema,
//     default: null
//   },
  
//   // Timestamps
//   statusChangedAt: {
//     type: Date,
//     default: null
//   }
// }, {
//   timestamps: true,
//   toJSON: { virtuals: true },
//   toObject: { virtuals: true }
// });

// // Indexes
// jobSchema.index({ status: 1 });
// jobSchema.index({ departmentName: 1, postName: 1 });
// jobSchema.index({ 'createdBy.userId': 1 });
// jobSchema.index({ 'importantDates.registrationLastDate': 1 });
// jobSchema.index({ status: 1, 'importantDates.registrationLastDate': 1 });

// // Virtuals
// jobSchema.virtual('isRegistrationOpen').get(function() {
//   if (!this.importantDates.startDate || !this.importantDates.registrationLastDate) {
//     return false;
//   }
  
//   const now = new Date();
//   const startDate = new Date(this.importantDates.startDate);
//   const lastDate = new Date(this.importantDates.registrationLastDate);
  
//   return now >= startDate && now <= lastDate;
// });

// jobSchema.virtual('remainingDays').get(function() {
//   if (!this.importantDates.registrationLastDate) return null;
  
//   const now = new Date();
//   const lastDate = new Date(this.importantDates.registrationLastDate);
//   const diffTime = lastDate - now;
//   return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
// });

// // Methods
// jobSchema.methods.canEdit = function(userId, userRole) {
//   if (userRole === 'admin') return true;
//   if (this.createdBy.userId.toString() !== userId.toString()) return false;
//   return this.status === jobStatusEnum.PENDING || this.status === jobStatusEnum.ON_HOLD;
// };

// // Statics
// jobSchema.statics.findByStatus = function(status) {
//   return this.find({ status });
// };

// jobSchema.statics.getStatistics = async function() {
//   const stats = await this.aggregate([
//     {
//       $group: {
//         _id: '$status',
//         count: { $sum: 1 },
//         totalPosts: { $sum: '$totalPost' }
//       }
//     }
//   ]);
  
//   const totalJobs = await this.countDocuments();
  
//   return {
//     totalJobs,
//     statusWise: stats
//   };
// };

// // Check if model already exists to prevent overwrite
// const Job = mongoose.models.Job || mongoose.model('Job', jobSchema);

// module.exports = {
//   Job,
//   jobStatusEnum,
//   formModeEnum,
//   formTypeEnum,
//   paymentModeEnum,
//   categoryEnum
// };


const mongoose = require('mongoose');
const validator = require('validator');

// Enums based on images
const jobStatusEnum = {
  PENDING: 'pending',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
  ON_HOLD: 'onHold'
};

const formModeEnum = {
  ONLINE: 'online',
  OFFLINE: 'offline',
  BOTH: 'both'
};

const formTypeEnum = {
  GOVERNMENT: 'government',
  PRIVATE: 'private',
  SEMI_GOVERNMENT: 'semi-government'
};

const paymentModeEnum = {
  FREE: 'free',
  PAID: 'paid',
  CONDITIONAL: 'conditional'
};

const categoryEnum = {
  GENERAL: 'general',
  OBC: 'obc',
  SC: 'sc',
  ST: 'st',
  EWS: 'ews',
  PH: 'ph'
};

// Sub-schema for important dates (from image 2.png)
const importantDateSchema = new mongoose.Schema({
  // From image 2.png fields
  startDate: Date,
  registrationLastDate: Date,
  feeLastDate: Date,
  challanFeeLastDate: Date,
  finalLastDate: Date,
  admitCardDate: Date,
  examDate: Date,
  answerKeyDate: Date,
  resultDate: Date,
  
  // Additional fields from image
  formulationDate: Date, // Appears multiple times
  ageOnDate: Date,
  minimumAge: Number,
  maximumAge: Number,
  ageRelaxation: String,
  pageName: String,
  selectAdvertiseDate: Date,
  correctionDate: Date // For form correction
}, { _id: false });

// Sub-schema for user snapshot
const userSnapshotSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
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

// Sub-schema for category posts (from image 11.png)
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

// Sub-schema for category fees (from image 11.png)
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

// Main Job Schema
const jobSchema = new mongoose.Schema({
  // ========== Job Department Details (from image 11.png) ==========
  departmentName: {
    type: String,
    required: [true, 'Department name is required'],
    trim: true,
    maxlength: [200, 'Department name cannot exceed 200 characters']
  },
  
  postName: {
    type: String,
    required: [true, 'Post name is required'],
    trim: true,
    maxlength: [200, 'Post name cannot exceed 200 characters']
  },
  
  modeOfForm: {
    type: String,
    enum: Object.values(formModeEnum),
    required: true,
    lowercase: true
  },
  
  showInPortal: {
    type: Boolean,
    default: true
  },
  
  helpEmailId: {
    type: String,
    required: [true, 'Help email is required'],
    trim: true,
    lowercase: true,
    validate: [validator.isEmail, 'Please provide a valid email']
  },
  
  typeOfForm: {
    type: String,
    enum: Object.values(formTypeEnum),
    required: true,
    lowercase: true
  },
  
  helpCareNo: {
    type: String,
    required: [true, 'Help care number is required'],
    trim: true
  },
  
  paymentMode: {
    type: String,
    enum: Object.values(paymentModeEnum),
    required: true,
    lowercase: true
  },
  
  officialWebsite: {
    type: String,
    required: [true, 'Official website is required'],
    trim: true,
    validate: [validator.isURL, 'Please provide a valid URL']
  },
  
  totalPost: {
    type: Number,
    required: [true, 'Total post is required'],
    min: [1, 'Total post must be at least 1']
  },
  
  // ========== Post & Eligibility Details (from image 11.png) ==========
  categoryPosts: {
    type: categoryPostSchema,
    default: () => ({})
  },
  
  categoryFees: {
    type: categoryFeeSchema,
    default: () => ({})
  },
  
  // Eligibility from image 11.png
  eligibilityEducational1: {
    type: String,
    required: [true, 'Primary educational qualification is required'],
    trim: true,
    maxlength: [500, 'Educational qualification cannot exceed 500 characters']
  },
  
  eligibilityEducational2: {
    type: String,
    trim: true,
    maxlength: [500, 'Educational qualification cannot exceed 500 characters'],
    default: ''
  },
  
  // ========== Important Dates (from image 2.png) ==========
  importantDates: {
    type: importantDateSchema,
    default: () => ({})
  },
  
  // ========== Other Details (from image 3.png) ==========
  otherDetails: {
    bisixf1: {
      type: String,
      trim: true,
      default: ''
    },
    format: {
      type: String,
      trim: true,
      default: ''
    },
    captchaCode: {
      type: String,
      trim: true,
      default: ''
    },
    // For "6 Digit Code" from image 3.png
    digitCode: {
      type: String,
      trim: true,
      default: ''
    }
  },
  
  // ========== Status and Approval ==========
  status: {
    type: String,
    enum: Object.values(jobStatusEnum),
    default: jobStatusEnum.PENDING
  },
  
  statusRemark: {
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


// Virtuals
jobSchema.virtual('isRegistrationOpen').get(function() {
  if (!this.importantDates.startDate || !this.importantDates.registrationLastDate) {
    return false;
  }
  
  const now = new Date();
  const startDate = new Date(this.importantDates.startDate);
  const lastDate = new Date(this.importantDates.registrationLastDate);
  
  return now >= startDate && now <= lastDate;
});

jobSchema.virtual('remainingDays').get(function() {
  if (!this.importantDates.registrationLastDate) return null;
  
  const now = new Date();
  const lastDate = new Date(this.importantDates.registrationLastDate);
  const diffTime = lastDate - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

// Methods
jobSchema.methods.canEdit = function(userId, userRole) {
  if (userRole === 'admin') return true;
  if (this.createdBy.userId.toString() !== userId.toString()) return false;
  return this.status === jobStatusEnum.PENDING || this.status === jobStatusEnum.ON_HOLD;
};

// Statics
jobSchema.statics.findByStatus = function(status) {
  return this.find({ status });
};

jobSchema.statics.getStatistics = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalPosts: { $sum: '$totalPost' }
      }
    }
  ]);
  
  const totalJobs = await this.countDocuments();
  
  return {
    totalJobs,
    statusWise: stats
  };
};

// Check if model already exists to prevent overwrite
const Job = mongoose.models.Job || mongoose.model('Job', jobSchema);

module.exports = {
  Job,
  jobStatusEnum,
  formModeEnum,
  formTypeEnum,
  paymentModeEnum,
  categoryEnum
};