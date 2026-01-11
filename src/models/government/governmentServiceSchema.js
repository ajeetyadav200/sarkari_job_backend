const mongoose = require('mongoose');
const validator = require('validator');
const { dynamicContentItemSchema, contentSectionSchema } = require('../common/dynamicContentSchema');

// ==================== ENUMS ====================

const serviceStatusEnum = {
  PENDING: 'pending',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
  ON_HOLD: 'onHold'
};

const activeStatusEnum = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  EXPIRED: 'expired',
  COMING_SOON: 'comingSoon'
};

// Service Type - What kind of government service is this
const serviceTypeEnum = {
  SCHOLARSHIP: 'scholarship',
  CERTIFICATE: 'certificate',
  REGISTRATION: 'registration',
  VERIFICATION: 'verification',
  GOVERNMENT_SCHEME: 'governmentScheme',
  DOCUMENT_SERVICE: 'documentService',
  WELFARE_SCHEME: 'welfareScheme',
  FINANCIAL_SERVICE: 'financialService',
  OTHER: 'other'
};

// Service Category - More specific categorization
const serviceCategoryEnum = {
  // Scholarship Categories
  PRE_MATRIC: 'preMatric',
  POST_MATRIC: 'postMatric',
  HIGHER_EDUCATION: 'higherEducation',
  PROFESSIONAL: 'professional',
  MINORITY: 'minority',
  MERIT_BASED: 'meritBased',
  NEED_BASED: 'needBased',

  // Certificate Categories
  INCOME_CERTIFICATE: 'incomeCertificate',
  CASTE_CERTIFICATE: 'casteCertificate',
  DOMICILE_CERTIFICATE: 'domicileCertificate',
  BIRTH_CERTIFICATE: 'birthCertificate',
  DEATH_CERTIFICATE: 'deathCertificate',
  MARRIAGE_CERTIFICATE: 'marriageCertificate',
  CHARACTER_CERTIFICATE: 'characterCertificate',

  // Registration Categories
  PAN_CARD: 'panCard',
  AADHAAR: 'aadhaar',
  VOTER_ID: 'voterId',
  PASSPORT: 'passport',
  DRIVING_LICENSE: 'drivingLicense',
  RATION_CARD: 'rationCard',

  // Verification Categories
  DOCUMENT_VERIFICATION: 'documentVerification',
  CERTIFICATE_VERIFICATION: 'certificateVerification',
  STATUS_CHECK: 'statusCheck',

  // Welfare Schemes
  PENSION_SCHEME: 'pensionScheme',
  HEALTH_SCHEME: 'healthScheme',
  HOUSING_SCHEME: 'housingScheme',
  EMPLOYMENT_SCHEME: 'employmentScheme',
  AGRICULTURAL_SCHEME: 'agriculturalScheme',

  // Other
  OTHER: 'other'
};

// Applicable For - Who can apply
const applicableForEnum = {
  INDIAN_CITIZEN: 'indianCitizen',
  FOREIGN_CITIZEN: 'foreignCitizen',
  NRI: 'nri',
  STUDENT: 'student',
  SENIOR_CITIZEN: 'seniorCitizen',
  WOMEN: 'women',
  FARMER: 'farmer',
  BPL: 'bpl',
  MINORITY: 'minority',
  DIFFERENTLY_ABLED: 'differentlyAbled',
  ALL: 'all'
};

// State - Indian states
const stateEnum = {
  ALL_INDIA: 'allIndia',
  ANDHRA_PRADESH: 'andhraPradesh',
  ARUNACHAL_PRADESH: 'arunachalPradesh',
  ASSAM: 'assam',
  BIHAR: 'bihar',
  CHHATTISGARH: 'chhattisgarh',
  GOA: 'goa',
  GUJARAT: 'gujarat',
  HARYANA: 'haryana',
  HIMACHAL_PRADESH: 'himachalPradesh',
  JHARKHAND: 'jharkhand',
  KARNATAKA: 'karnataka',
  KERALA: 'kerala',
  MADHYA_PRADESH: 'madhyaPradesh',
  MAHARASHTRA: 'maharashtra',
  MANIPUR: 'manipur',
  MEGHALAYA: 'meghalaya',
  MIZORAM: 'mizoram',
  NAGALAND: 'nagaland',
  ODISHA: 'odisha',
  PUNJAB: 'punjab',
  RAJASTHAN: 'rajasthan',
  SIKKIM: 'sikkim',
  TAMIL_NADU: 'tamilNadu',
  TELANGANA: 'telangana',
  TRIPURA: 'tripura',
  UTTAR_PRADESH: 'uttarPradesh',
  UTTARAKHAND: 'uttarakhand',
  WEST_BENGAL: 'westBengal',
  DELHI: 'delhi',
  JAMMU_KASHMIR: 'jammuKashmir',
  LADAKH: 'ladakh',
  PUDUCHERRY: 'puducherry',
  CHANDIGARH: 'chandigarh',
  OTHER: 'other'
};

// ==================== SUB-SCHEMAS ====================

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

// Sub-schema for user snapshot
const userSnapshotSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    trim: true
  },
  email: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  role: {
    type: String,
    enum: ['admin', 'assistant', 'publisher'],
    required: true
  }
}, { _id: false });

// Sub-schema for important dates
const importantDatesSchema = new mongoose.Schema({
  applicationStartDate: Date,
  applicationLastDate: Date,
  lastDateForFreshApply: Date,
  lastDateForRenewal: Date,
  feePaymentLastDate: Date,
  correctionStartDate: Date,
  correctionLastDate: Date,
  hardCopySubmissionLastDate: Date,
  verificationDate: Date,
  disbursementDate: Date,
  documentUploadLastDate: Date,
  formCompleteLastDate: Date,
  // For custom dates
  customDate1: { label: String, date: Date },
  customDate2: { label: String, date: Date },
  customDate3: { label: String, date: Date }
}, { _id: false });

// Sub-schema for category-wise fees (like PAN card)
const categoryFeeSchema = new mongoose.Schema({
  general: { type: Number, default: 0, min: 0 },
  obc: { type: Number, default: 0, min: 0 },
  sc: { type: Number, default: 0, min: 0 },
  st: { type: Number, default: 0, min: 0 },
  ews: { type: Number, default: 0, min: 0 },
  ph: { type: Number, default: 0, min: 0 },
  female: { type: Number, default: 0, min: 0 },
  indianCitizen: { type: Number, default: 0, min: 0 },
  foreignCitizen: { type: Number, default: 0, min: 0 },
  nri: { type: Number, default: 0, min: 0 }
}, { _id: false });

// Sub-schema for scholarship specific details
const scholarshipDetailsSchema = new mongoose.Schema({
  scholarshipName: { type: String, trim: true },
  organizationName: { type: String, trim: true },
  scholarshipAmount: { type: String, trim: true },
  scholarshipType: {
    type: String,
    enum: ['fullTuition', 'partialTuition', 'stipend', 'oneTime', 'recurring', 'other'],
    default: 'other'
  },
  renewalAvailable: { type: Boolean, default: false },
  renewalCriteria: { type: String, trim: true },
  numberOfBeneficiaries: { type: Number, min: 0 },
  academicYear: { type: String, trim: true },
  classesEligible: [{ type: String, trim: true }], // e.g., ['9th', '10th', '11th', '12th', 'UG', 'PG']
  incomeLimit: { type: Number, min: 0 },
  incomeLimitDescription: { type: String, trim: true },
  percentageRequired: { type: Number, min: 0, max: 100 },
  attendanceRequired: { type: Number, min: 0, max: 100 }
}, { _id: false });

// Sub-schema for certificate/document service details
const certificateDetailsSchema = new mongoose.Schema({
  certificateType: { type: String, trim: true },
  issuingAuthority: { type: String, trim: true },
  validityPeriod: { type: String, trim: true },
  deliveryMode: {
    type: String,
    enum: ['online', 'offline', 'both', 'courier', 'downloadable'],
    default: 'online'
  },
  processingTime: { type: String, trim: true },
  verificationRequired: { type: Boolean, default: false },
  verificationProcess: { type: String, trim: true },
  trackingAvailable: { type: Boolean, default: true },
  printingAvailable: { type: Boolean, default: true },
  correctionAvailable: { type: Boolean, default: true }
}, { _id: false });

// Sub-schema for important links
const importantLinkSchema = new mongoose.Schema({
  linkTitle: {
    type: String,
    required: true,
    trim: true
  },
  linkUrl: {
    type: String,
    required: true,
    trim: true
  },
  linkCategory: {
    type: String,
    enum: ['apply', 'login', 'status', 'download', 'notification', 'correction', 'payment', 'verification', 'official', 'helpdesk', 'other'],
    default: 'other'
  },
  isForIndianCitizen: { type: Boolean, default: true },
  isForForeignCitizen: { type: Boolean, default: false },
  description: { type: String, trim: true },
  order: { type: Number, default: 0 }
}, { _id: false });

// ==================== MAIN SCHEMA ====================

const governmentServiceSchema = new mongoose.Schema({
  // ========== BASIC INFORMATION ==========
  serviceName: {
    type: String,
    required: [true, 'Service name is required'],
    trim: true,
    maxlength: [300, 'Service name cannot exceed 300 characters']
  },

  serviceNameHindi: {
    type: String,
    trim: true,
    maxlength: [300, 'Hindi service name cannot exceed 300 characters']
  },

  shortTitle: {
    type: String,
    trim: true,
    maxlength: [150, 'Short title cannot exceed 150 characters']
  },

  slug: {
    type: String,
    trim: true,
    lowercase: true,
    unique: true,
    sparse: true
  },

  serviceType: {
    type: String,
    enum: Object.values(serviceTypeEnum),
    required: [true, 'Service type is required']
  },

  serviceCategory: {
    type: String,
    enum: Object.values(serviceCategoryEnum),
    default: serviceCategoryEnum.OTHER
  },

  organizationName: {
    type: String,
    trim: true,
    maxlength: [200, 'Organization name cannot exceed 200 characters']
  },

  departmentName: {
    type: String,
    trim: true,
    maxlength: [200, 'Department name cannot exceed 200 characters']
  },

  state: {
    type: String,
    enum: Object.values(stateEnum),
    default: stateEnum.ALL_INDIA
  },

  // ========== DESCRIPTION & CONTENT ==========
  shortDescription: {
    type: String,
    trim: true,
    maxlength: [500, 'Short description cannot exceed 500 characters']
  },

  fullDescription: {
    type: String,
    trim: true
  },

  // What is this service
  aboutService: {
    type: String,
    trim: true
  },

  // How to apply
  howToApply: {
    type: String,
    trim: true
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

  // ========== ELIGIBILITY ==========
  applicableFor: [{
    type: String,
    enum: Object.values(applicableForEnum)
  }],

  eligibilityCriteria: {
    type: String,
    trim: true
  },

  eligibilityPoints: [{
    type: String,
    trim: true
  }],

  ageLimit: {
    minimumAge: { type: Number, min: 0 },
    maximumAge: { type: Number, min: 0 },
    ageAsOn: Date,
    ageRelaxation: { type: String, trim: true }
  },

  // ========== DATES ==========
  importantDates: {
    type: importantDatesSchema,
    default: () => ({})
  },

  postDate: {
    type: Date,
    default: Date.now
  },

  // ========== FEES ==========
  applicationFee: {
    type: String,
    trim: true
  },

  categoryFees: {
    type: categoryFeeSchema,
    default: () => ({})
  },

  feePaymentModes: [{
    type: String,
    enum: ['debitCard', 'creditCard', 'netBanking', 'upi', 'challan', 'demandDraft', 'cash', 'free', 'other'],
    default: 'netBanking'
  }],

  isFreeService: {
    type: Boolean,
    default: false
  },

  // ========== DOCUMENTS REQUIRED ==========
  documentsRequired: [{
    type: String,
    trim: true
  }],

  documentsRequiredDetails: [{
    documentName: { type: String, trim: true },
    isMandatory: { type: Boolean, default: true },
    description: { type: String, trim: true },
    acceptedFormats: [{ type: String, trim: true }],
    maxSize: { type: String, trim: true }
  }],

  // ========== IMPORTANT LINKS ==========
  importantLinks: {
    type: [importantLinkSchema],
    default: []
  },

  officialWebsite: {
    type: String,
    trim: true
  },

  applyOnlineLink: {
    type: String,
    trim: true
  },

  loginLink: {
    type: String,
    trim: true
  },

  statusCheckLink: {
    type: String,
    trim: true
  },

  // ========== IMPORTANT INSTRUCTIONS ==========
  importantInstructions: [{
    type: String,
    trim: true
  }],

  howToSteps: [{
    stepNumber: { type: Number, required: true },
    stepTitle: { type: String, trim: true },
    stepDescription: { type: String, trim: true, required: true }
  }],

  // ========== FILE UPLOADS ==========
  officialNotification: uploadedFileSchema,
  applicationForm: uploadedFileSchema,
  instructionSheet: uploadedFileSchema,
  guidelinesFile: uploadedFileSchema,
  sampleForm: uploadedFileSchema,
  otherFile1: uploadedFileSchema,
  otherFile2: uploadedFileSchema,

  // ========== SCHOLARSHIP SPECIFIC ==========
  scholarshipDetails: {
    type: scholarshipDetailsSchema,
    default: null
  },

  // ========== CERTIFICATE/DOCUMENT SERVICE SPECIFIC ==========
  certificateDetails: {
    type: certificateDetailsSchema,
    default: null
  },

  // ========== CONTACT & HELP ==========
  helplineNumber: {
    type: String,
    trim: true
  },

  helpEmail: {
    type: String,
    trim: true,
    lowercase: true
  },

  helpAddress: {
    type: String,
    trim: true
  },

  // ========== SEO & DISPLAY ==========
  tags: [{
    type: String,
    trim: true
  }],

  metaTitle: {
    type: String,
    trim: true,
    maxlength: [70, 'Meta title cannot exceed 70 characters']
  },

  metaDescription: {
    type: String,
    trim: true,
    maxlength: [160, 'Meta description cannot exceed 160 characters']
  },

  keywords: [{
    type: String,
    trim: true
  }],

  showInPortal: {
    type: Boolean,
    default: true
  },

  isFeatured: {
    type: Boolean,
    default: false
  },

  priority: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },

  // ========== STATUS & APPROVAL ==========
  status: {
    type: String,
    enum: Object.values(serviceStatusEnum),
    default: serviceStatusEnum.PENDING
  },

  activeStatus: {
    type: String,
    enum: Object.values(activeStatusEnum),
    default: activeStatusEnum.ACTIVE
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

  // ========== USER TRACKING ==========
  createdBy: {
    type: userSnapshotSchema,
    required: true
  },

  verifiedBy: {
    type: userSnapshotSchema,
    default: null
  },

  verifiedAt: {
    type: Date
  },

  lastUpdatedBy: {
    type: userSnapshotSchema,
    default: null
  },

  // ========== ANALYTICS ==========
  viewCount: {
    type: Number,
    default: 0,
    min: 0
  },

  applyClickCount: {
    type: Number,
    default: 0,
    min: 0
  }

}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// ==================== INDEXES ====================
// governmentServiceSchema.index({ serviceName: 'text', shortTitle: 'text', organizationName: 'text', tags: 'text' });
// governmentServiceSchema.index({ serviceType: 1, status: 1, activeStatus: 1 });
// governmentServiceSchema.index({ state: 1, serviceCategory: 1 });
// governmentServiceSchema.index({ 'importantDates.applicationLastDate': 1 });
// governmentServiceSchema.index({ postDate: -1 });
// governmentServiceSchema.index({ slug: 1 });

// ==================== VIRTUALS ====================

governmentServiceSchema.virtual('isApplicationOpen').get(function() {
  if (!this.importantDates?.applicationStartDate) {
    return true; // If no start date, consider it always open
  }

  const now = new Date();
  const startDate = new Date(this.importantDates.applicationStartDate);
  const lastDate = this.importantDates.applicationLastDate
    ? new Date(this.importantDates.applicationLastDate)
    : null;

  if (now < startDate) return false;
  if (lastDate && now > lastDate) return false;

  return true;
});

governmentServiceSchema.virtual('remainingDays').get(function() {
  if (!this.importantDates?.applicationLastDate) return null;

  const now = new Date();
  const lastDate = new Date(this.importantDates.applicationLastDate);
  const diffTime = lastDate - now;
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
});

governmentServiceSchema.virtual('applicationStatus').get(function() {
  if (!this.importantDates?.applicationStartDate) return 'ongoing';

  const now = new Date();
  const startDate = new Date(this.importantDates.applicationStartDate);
  const lastDate = this.importantDates.applicationLastDate
    ? new Date(this.importantDates.applicationLastDate)
    : null;

  if (now < startDate) return 'upcoming';
  if (lastDate && now > lastDate) return 'closed';
  return 'ongoing';
});

// ==================== PRE-SAVE MIDDLEWARE ====================

governmentServiceSchema.pre('save', function(next) {
  // Auto-generate slug if not provided
  if (!this.slug && this.serviceName) {
    this.slug = this.serviceName
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 100) + '-' + Date.now();
  }
  next();
});

// ==================== METHODS ====================

governmentServiceSchema.methods.canEdit = function(userId, userRole) {
  if (userRole === 'admin') return true;
  if (this.createdBy.userId.toString() !== userId.toString()) return false;
  return this.status === serviceStatusEnum.PENDING || this.status === serviceStatusEnum.ON_HOLD;
};

governmentServiceSchema.methods.incrementViewCount = async function() {
  this.viewCount += 1;
  await this.save();
};

// ==================== STATICS ====================

governmentServiceSchema.statics.findByStatus = function(status) {
  return this.find({ status });
};

governmentServiceSchema.statics.findByServiceType = function(serviceType) {
  return this.find({
    serviceType,
    status: serviceStatusEnum.VERIFIED,
    activeStatus: activeStatusEnum.ACTIVE
  });
};

governmentServiceSchema.statics.getStatistics = async function() {
  const stats = await this.aggregate([
    {
      $group: {
        _id: { status: '$status', serviceType: '$serviceType' },
        count: { $sum: 1 }
      }
    }
  ]);

  const totalServices = await this.countDocuments();
  const byType = await this.aggregate([
    { $group: { _id: '$serviceType', count: { $sum: 1 } } }
  ]);

  return {
    totalServices,
    statusWise: stats,
    byType
  };
};

governmentServiceSchema.statics.searchServices = async function(query, options = {}) {
  const {
    serviceType,
    serviceCategory,
    state,
    status = 'verified',
    activeStatus = 'active',
    page = 1,
    limit = 10,
    sortBy = 'postDate',
    sortOrder = 'desc'
  } = options;

  const filter = {
    status,
    activeStatus
  };

  if (serviceType) filter.serviceType = serviceType;
  if (serviceCategory) filter.serviceCategory = serviceCategory;
  if (state) filter.state = state;

  if (query) {
    filter.$or = [
      { serviceName: { $regex: query, $options: 'i' } },
      { shortTitle: { $regex: query, $options: 'i' } },
      { organizationName: { $regex: query, $options: 'i' } },
      { departmentName: { $regex: query, $options: 'i' } },
      { tags: { $in: [new RegExp(query, 'i')] } }
    ];
  }

  const sort = {};
  sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

  const skip = (page - 1) * limit;

  const [services, total] = await Promise.all([
    this.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    this.countDocuments(filter)
  ]);

  return {
    services,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      totalPages: Math.ceil(total / limit),
      hasMore: skip + services.length < total
    }
  };
};

// ==================== MODEL EXPORT ====================

const GovernmentService = mongoose.models.GovernmentService || mongoose.model('GovernmentService', governmentServiceSchema);

module.exports = {
  GovernmentService,
  serviceStatusEnum,
  activeStatusEnum,
  serviceTypeEnum,
  serviceCategoryEnum,
  applicableForEnum,
  stateEnum
};
