const {
  GovernmentService,
  serviceStatusEnum,
  activeStatusEnum,
  serviceTypeEnum,
  serviceCategoryEnum
} = require('../../models/government/governmentServiceSchema');
const { cloudinary } = require('../../config/cloudinary');
const mongoose = require('mongoose');

/**
 * Delete file from Cloudinary
 */
const deleteFromCloudinary = async (cloudinaryId) => {
  try {
    if (!cloudinaryId) return null;
    const result = await cloudinary.uploader.destroy(cloudinaryId);
    return result;
  } catch (error) {
    throw new Error(`Failed to delete file: ${error.message}`);
  }
};

/**
 * Map file types to valid enum values
 */
const mapFileType = (type) => {
  if (!type) return 'other';
  const lowerType = type.toLowerCase();
  if (['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'].includes(lowerType)) {
    return lowerType;
  }
  if (lowerType === 'image' || lowerType === 'gif' || lowerType === 'webp') return 'png';
  if (lowerType === 'document') return 'pdf';
  return 'other';
};

/**
 * Parse JSON string or return array
 */
const parseArrayField = (field) => {
  if (!field) return [];
  if (Array.isArray(field)) return field;
  if (typeof field === 'string') {
    try {
      return JSON.parse(field);
    } catch (e) {
      return [];
    }
  }
  return [];
};

/**
 * Parse JSON string or return object
 */
const parseObjectField = (field) => {
  if (!field) return null;
  if (typeof field === 'object' && !Array.isArray(field)) return field;
  if (typeof field === 'string') {
    try {
      return JSON.parse(field);
    } catch (e) {
      return null;
    }
  }
  return null;
};

// ==================== CREATE ====================

/**
 * Create Government Service
 * POST /api/government-services
 */
const createGovernmentService = async (req, res) => {
  try {
    const {
      // Basic Info
      serviceName,
      serviceNameHindi,
      shortTitle,
      slug,
      serviceType,
      serviceCategory,
      organizationName,
      departmentName,
      state,

      // Description & Content
      shortDescription,
      fullDescription,
      aboutService,
      howToApply,
      dynamicContent,
      contentSections,

      // Eligibility
      applicableFor,
      eligibilityCriteria,
      eligibilityPoints,
      ageLimit,

      // Dates
      importantDates,
      postDate,

      // Fees
      applicationFee,
      categoryFees,
      feePaymentModes,
      isFreeService,

      // Documents
      documentsRequired,
      documentsRequiredDetails,

      // Links
      importantLinks,
      officialWebsite,
      applyOnlineLink,
      loginLink,
      statusCheckLink,

      // Instructions
      importantInstructions,
      howToSteps,

      // Specific Details
      scholarshipDetails,
      certificateDetails,

      // Contact
      helplineNumber,
      helpEmail,
      helpAddress,

      // SEO
      tags,
      metaTitle,
      metaDescription,
      keywords,
      showInPortal,
      isFeatured,
      priority,

      // Status
      status,
      activeStatus,

      // Files (already uploaded via /api/upload/single)
      officialNotification,
      applicationForm,
      instructionSheet,
      guidelinesFile,
      sampleForm,
      otherFile1,
      otherFile2
    } = req.body;

    // Prepare service data
    const serviceData = {
      serviceName,
      serviceNameHindi: serviceNameHindi || '',
      shortTitle: shortTitle || '',
      slug: slug || '',
      serviceType,
      serviceCategory: serviceCategory || 'other',
      organizationName: organizationName || '',
      departmentName: departmentName || '',
      state: state || 'allIndia',

      shortDescription: shortDescription || '',
      fullDescription: fullDescription || '',
      aboutService: aboutService || '',
      howToApply: howToApply || '',
      dynamicContent: parseArrayField(dynamicContent),
      contentSections: parseArrayField(contentSections),

      applicableFor: parseArrayField(applicableFor),
      eligibilityCriteria: eligibilityCriteria || '',
      eligibilityPoints: parseArrayField(eligibilityPoints),
      ageLimit: parseObjectField(ageLimit),

      importantDates: parseObjectField(importantDates) || {},
      postDate: postDate || new Date(),

      applicationFee: applicationFee || '',
      categoryFees: parseObjectField(categoryFees) || {},
      feePaymentModes: parseArrayField(feePaymentModes),
      isFreeService: isFreeService === 'true' || isFreeService === true,

      documentsRequired: parseArrayField(documentsRequired),
      documentsRequiredDetails: parseArrayField(documentsRequiredDetails),

      importantLinks: parseArrayField(importantLinks),
      officialWebsite: officialWebsite || '',
      applyOnlineLink: applyOnlineLink || '',
      loginLink: loginLink || '',
      statusCheckLink: statusCheckLink || '',

      importantInstructions: parseArrayField(importantInstructions),
      howToSteps: parseArrayField(howToSteps),

      scholarshipDetails: parseObjectField(scholarshipDetails),
      certificateDetails: parseObjectField(certificateDetails),

      helplineNumber: helplineNumber || '',
      helpEmail: helpEmail || '',
      helpAddress: helpAddress || '',

      tags: parseArrayField(tags),
      metaTitle: metaTitle || '',
      metaDescription: metaDescription || '',
      keywords: parseArrayField(keywords),
      showInPortal: showInPortal !== 'false' && showInPortal !== false,
      isFeatured: isFeatured === 'true' || isFeatured === true,
      priority: parseInt(priority) || 0,

      status: req.user.role === 'admin' ? (status || 'pending') : 'pending',
      activeStatus: activeStatus || 'active',

      createdBy: {
        userId: req.user._id,
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone || '',
        role: req.user.role
      }
    };

    // Handle file uploads
    const fileFields = ['officialNotification', 'applicationForm', 'instructionSheet', 'guidelinesFile', 'sampleForm', 'otherFile1', 'otherFile2'];
    const fileData = { officialNotification, applicationForm, instructionSheet, guidelinesFile, sampleForm, otherFile1, otherFile2 };

    for (const fieldName of fileFields) {
      if (fileData[fieldName] && fileData[fieldName].fileUrl) {
        serviceData[fieldName] = {
          fileName: fileData[fieldName].fileName || '',
          fileUrl: fileData[fieldName].fileUrl,
          cloudinaryId: fileData[fieldName].cloudinaryId || '',
          fileType: mapFileType(fileData[fieldName].fileType),
          uploadedAt: fileData[fieldName].uploadedAt || new Date()
        };
      }
    }

    const service = new GovernmentService(serviceData);
    await service.save();

    return res.status(201).json({
      success: true,
      message: 'Government service created successfully',
      data: service
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A service with this slug already exists',
        error: 'Duplicate slug'
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Failed to create government service',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// ==================== READ ====================

/**
 * Get All Government Services with Filters
 * GET /api/government-services
 */
const getAllGovernmentServices = async (req, res) => {
  try {
    const {
      serviceType,
      serviceCategory,
      state,
      status,
      activeStatus,
      tags,
      createdBy,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 10,
      sortBy = 'postDate',
      sortOrder = 'desc'
    } = req.query;

    // Build filter
    const filter = {};

    // Role-based filtering
    if (req.user && (req.user.role === 'publisher' || req.user.role === 'assistant')) {
      filter['createdBy.userId'] = req.user._id;
    } else if (req.user && req.user.role === 'admin') {
      // Admin can see all
    } else {
      // For other roles, only show verified and active services
      filter.status = 'verified';
      filter.activeStatus = 'active';
    }

    if (serviceType) filter.serviceType = serviceType;
    if (serviceCategory) filter.serviceCategory = serviceCategory;
    if (state) filter.state = state;
    if (status) filter.status = status;
    if (activeStatus) filter.activeStatus = activeStatus;
    if (createdBy) filter['createdBy.userId'] = createdBy;

    // Date filtering
    if (startDate || endDate) {
      filter.postDate = {};
      if (startDate) filter.postDate.$gte = new Date(startDate);
      if (endDate) filter.postDate.$lte = new Date(endDate);
    }

    // Tags filtering
    if (tags) {
      const tagsArray = Array.isArray(tags) ? tags : [tags];
      filter.tags = { $in: tagsArray };
    }

    // Search functionality
    if (search) {
      filter.$or = [
        { serviceName: { $regex: search, $options: 'i' } },
        { shortTitle: { $regex: search, $options: 'i' } },
        { organizationName: { $regex: search, $options: 'i' } },
        { departmentName: { $regex: search, $options: 'i' } },
        { 'createdBy.name': { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Sorting
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Pagination
    const skip = (page - 1) * limit;

    // Fetch services
    const [services, total] = await Promise.all([
      GovernmentService.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      GovernmentService.countDocuments(filter)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return res.status(200).json({
      success: true,
      data: services,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages,
        hasNextPage,
        hasPreviousPage
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch government services',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get Government Service by ID
 * GET /api/government-services/:id
 */
const getGovernmentServiceById = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if id is valid ObjectId or slug
    let service;
    if (mongoose.Types.ObjectId.isValid(id)) {
      service = await GovernmentService.findById(id).lean();
    } else {
      service = await GovernmentService.findOne({ slug: id }).lean();
    }

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Government service not found'
      });
    }

    // Check permissions
    if (service.status !== 'verified' || service.activeStatus !== 'active') {
      if (!req.user) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to view this service'
        });
      }

      const createdById = service.createdBy?.userId;
      if (req.user.role !== 'admin' && createdById?.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to view this service'
        });
      }
    }

    // Increment view count
    await GovernmentService.findByIdAndUpdate(service._id, { $inc: { viewCount: 1 } });

    return res.status(200).json({
      success: true,
      data: service
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch government service',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get Public Government Services
 * GET /api/government-services/public
 */
const getPublicGovernmentServices = async (req, res) => {
  try {
    const {
      serviceType,
      serviceCategory,
      state,
      tags,
      search,
      page = 1,
      limit = 10,
      sortBy = 'postDate',
      sortOrder = 'desc'
    } = req.query;

    // Build filter for public access
    const filter = {
      status: 'verified',
      activeStatus: 'active',
      showInPortal: true
    };

    if (serviceType) filter.serviceType = serviceType;
    if (serviceCategory) filter.serviceCategory = serviceCategory;
    if (state) filter.state = state;

    // Tags filtering
    if (tags) {
      const tagsArray = Array.isArray(tags) ? tags : [tags];
      filter.tags = { $in: tagsArray };
    }

    // Search functionality
    if (search) {
      filter.$or = [
        { serviceName: { $regex: search, $options: 'i' } },
        { shortTitle: { $regex: search, $options: 'i' } },
        { organizationName: { $regex: search, $options: 'i' } },
        { departmentName: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Sorting
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Pagination
    const skip = (page - 1) * limit;

    // Fetch public services
    const [services, total] = await Promise.all([
      GovernmentService.find(filter)
        .select('-createdBy -verifiedBy -lastUpdatedBy -statusRemark -rejectionReason -__v')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      GovernmentService.countDocuments(filter)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return res.status(200).json({
      success: true,
      data: services,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages,
        hasNextPage,
        hasPreviousPage
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch government services',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get Government Services List with Infinite Scrolling
 * GET /api/government-services/list
 */
const getGovernmentServicesList = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      year,
      month,
      date,
      keyword,
      serviceType,
      serviceCategory,
      state,
      sortBy = 'postDate',
      order = 'desc'
    } = req.query;

    const filter = {
      status: 'verified',
      activeStatus: 'active'
    };

    // Type filters
    if (serviceType) filter.serviceType = serviceType;
    if (serviceCategory) filter.serviceCategory = serviceCategory;
    if (state) filter.state = state;

    // Search by year, month, date
    if (year || month || date) {
      const dateFilter = {};

      if (year) {
        const yearNum = parseInt(year);
        dateFilter.$gte = new Date(yearNum, 0, 1);
        dateFilter.$lt = new Date(yearNum + 1, 0, 1);
      }

      if (month && year) {
        const yearNum = parseInt(year);
        const monthNum = parseInt(month) - 1;
        dateFilter.$gte = new Date(yearNum, monthNum, 1);
        dateFilter.$lt = new Date(yearNum, monthNum + 1, 1);
      }

      if (date && month && year) {
        const yearNum = parseInt(year);
        const monthNum = parseInt(month) - 1;
        const dateNum = parseInt(date);
        dateFilter.$gte = new Date(yearNum, monthNum, dateNum);
        dateFilter.$lt = new Date(yearNum, monthNum, dateNum + 1);
      }

      if (Object.keys(dateFilter).length > 0) {
        filter['postDate'] = dateFilter;
      }
    }

    // Search by keyword
    if (keyword && keyword !== '') {
      filter.$or = [
        { serviceName: { $regex: keyword, $options: 'i' } },
        { shortTitle: { $regex: keyword, $options: 'i' } },
        { organizationName: { $regex: keyword, $options: 'i' } },
        { departmentName: { $regex: keyword, $options: 'i' } }
      ];
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOrder = order === 'asc' ? 1 : -1;
    const sortField = sortBy || 'postDate';

    // Execute query
    const [services, total] = await Promise.all([
      GovernmentService.find(filter)
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      GovernmentService.countDocuments(filter)
    ]);

    const hasMore = skip + services.length < total;

    return res.status(200).json({
      success: true,
      data: services,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        total: total,
        limit: parseInt(limit),
        hasMore
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch government services list',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get Services by Type
 * GET /api/government-services/by-type/:serviceType
 */
const getServicesByType = async (req, res) => {
  try {
    const { serviceType } = req.params;
    const { page = 1, limit = 10, sortBy = 'postDate', sortOrder = 'desc' } = req.query;

    const filter = {
      serviceType,
      status: 'verified',
      activeStatus: 'active'
    };

    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (page - 1) * limit;

    const [services, total] = await Promise.all([
      GovernmentService.find(filter)
        .select('serviceName shortTitle organizationName state postDate importantDates tags slug')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      GovernmentService.countDocuments(filter)
    ]);

    return res.status(200).json({
      success: true,
      data: services,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit),
        hasMore: skip + services.length < total
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch services by type',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// ==================== UPDATE ====================

/**
 * Update Government Service
 * PUT /api/government-services/:id
 */
const updateGovernmentService = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid service ID format'
      });
    }

    const service = await GovernmentService.findById(id);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Government service not found'
      });
    }

    // Check permissions
    if (service.createdBy.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this service'
      });
    }

    // Non-admin cannot update status
    if (req.user.role !== 'admin' && req.body.status && req.body.status !== 'pending') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can change status'
      });
    }

    // Handle file data
    const fileFields = ['officialNotification', 'applicationForm', 'instructionSheet', 'guidelinesFile', 'sampleForm', 'syllabusFile', 'admitCardFile', 'resultFile', 'examDateNotice', 'otherFile1', 'otherFile2', 'otherFile3'];

    for (const fieldName of fileFields) {
      if (req.body[fieldName] !== undefined) {
        if (req.body[fieldName] && req.body[fieldName].fileUrl) {
          // New file uploaded - delete old file if different
          if (service[fieldName] && service[fieldName].cloudinaryId &&
              service[fieldName].cloudinaryId !== req.body[fieldName].cloudinaryId) {
            try {
              await deleteFromCloudinary(service[fieldName].cloudinaryId);
            } catch (err) {
              // Silent fail
            }
          }
          service[fieldName] = {
            fileName: req.body[fieldName].fileName || '',
            fileUrl: req.body[fieldName].fileUrl,
            cloudinaryId: req.body[fieldName].cloudinaryId || '',
            fileType: mapFileType(req.body[fieldName].fileType),
            uploadedAt: req.body[fieldName].uploadedAt || new Date()
          };
        } else if (req.body[fieldName] === null) {
          // File removed
          if (service[fieldName] && service[fieldName].cloudinaryId) {
            try {
              await deleteFromCloudinary(service[fieldName].cloudinaryId);
            } catch (err) {
              // Silent fail
            }
          }
          service[fieldName] = null;
        }
      }
    }

    // Update fields
    const updateFields = [
      'serviceName', 'serviceNameHindi', 'shortTitle', 'slug', 'serviceType', 'serviceCategory',
      'organizationName', 'departmentName', 'state', 'shortDescription', 'fullDescription',
      'aboutService', 'howToApply', 'eligibilityCriteria', 'applicationFee', 'isFreeService',
      'officialWebsite', 'applyOnlineLink', 'loginLink', 'statusCheckLink', 'helplineNumber',
      'helpEmail', 'helpAddress', 'metaTitle', 'metaDescription', 'showInPortal', 'isFeatured',
      'priority', 'activeStatus'
    ];

    const arrayFields = [
      'dynamicContent', 'contentSections', 'applicableFor', 'eligibilityPoints',
      'feePaymentModes', 'documentsRequired', 'documentsRequiredDetails', 'importantLinks',
      'importantInstructions', 'howToSteps', 'tags', 'keywords'
    ];

    const objectFields = ['ageLimit', 'importantDates', 'categoryFees', 'scholarshipDetails', 'certificateDetails'];

    // Update simple fields
    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'isFreeService' || field === 'showInPortal' || field === 'isFeatured') {
          service[field] = req.body[field] === 'true' || req.body[field] === true;
        } else if (field === 'priority') {
          service[field] = parseInt(req.body[field]) || 0;
        } else {
          service[field] = req.body[field];
        }
      }
    });

    // Update array fields
    arrayFields.forEach(field => {
      if (req.body[field] !== undefined) {
        service[field] = parseArrayField(req.body[field]);
      }
    });

    // Update object fields
    objectFields.forEach(field => {
      if (req.body[field] !== undefined) {
        service[field] = parseObjectField(req.body[field]);
      }
    });

    // Update lastUpdatedBy
    service.lastUpdatedBy = {
      userId: req.user._id,
      name: req.user.name,
      email: req.user.email,
      phone: req.user.phone || '',
      role: req.user.role
    };

    await service.save();

    return res.status(200).json({
      success: true,
      message: 'Government service updated successfully',
      data: service
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'A service with this slug already exists',
        error: 'Duplicate slug'
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Failed to update government service',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Update Status (Admin only)
 * PATCH /api/government-services/:id/status
 */
const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid service ID format'
      });
    }

    const service = await GovernmentService.findById(id);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Government service not found'
      });
    }

    // Check admin permission
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can update service status'
      });
    }

    // Prepare update data
    const updateData = {
      status: req.body.status,
      verifiedBy: {
        userId: req.user._id,
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone || '',
        role: req.user.role
      },
      verifiedAt: new Date()
    };

    // Add rejection reason if status is rejected
    if (req.body.status === 'rejected' && req.body.rejectionReason) {
      updateData.rejectionReason = req.body.rejectionReason;
    } else if (req.body.status !== 'rejected') {
      updateData.rejectionReason = '';
    }

    if (req.body.statusRemark) {
      updateData.statusRemark = req.body.statusRemark;
    }

    // Update service status
    const updatedService = await GovernmentService.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).lean();

    return res.status(200).json({
      success: true,
      message: `Service status updated to ${req.body.status}`,
      data: updatedService
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update status',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// ==================== DELETE ====================

/**
 * Delete Government Service
 * DELETE /api/government-services/:id
 */
const deleteGovernmentService = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid service ID format'
      });
    }

    const service = await GovernmentService.findById(id);
    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Government service not found'
      });
    }

    // Check permissions
    if (service.createdBy.userId.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this service'
      });
    }

    // Delete all uploaded files from Cloudinary
    const fileFields = ['officialNotification', 'applicationForm', 'instructionSheet', 'guidelinesFile', 'sampleForm', 'syllabusFile', 'admitCardFile', 'resultFile', 'examDateNotice', 'otherFile1', 'otherFile2', 'otherFile3'];

    for (const fieldName of fileFields) {
      if (service[fieldName] && service[fieldName].cloudinaryId) {
        try {
          await deleteFromCloudinary(service[fieldName].cloudinaryId);
        } catch (error) {
          // Silent fail
        }
      }
    }

    await GovernmentService.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Government service deleted successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete government service',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// ==================== STATISTICS ====================

/**
 * Get Statistics
 * GET /api/government-services/statistics
 */
const getStatistics = async (req, res) => {
  try {
    const stats = await GovernmentService.getStatistics();

    return res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to get statistics',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Get Available Service Types
 * GET /api/government-services/types
 */
const getServiceTypes = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      data: {
        serviceTypes: Object.values(serviceTypeEnum),
        serviceCategories: Object.values(serviceCategoryEnum)
      }
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to get service types',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

/**
 * Increment Apply Click Count
 * POST /api/government-services/:id/apply-click
 */
const incrementApplyClick = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid service ID format'
      });
    }

    await GovernmentService.findByIdAndUpdate(id, { $inc: { applyClickCount: 1 } });

    return res.status(200).json({
      success: true,
      message: 'Apply click recorded'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to record apply click',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = {
  createGovernmentService,
  getAllGovernmentServices,
  getGovernmentServiceById,
  updateGovernmentService,
  deleteGovernmentService,
  updateStatus,
  getPublicGovernmentServices,
  getGovernmentServicesList,
  getServicesByType,
  getStatistics,
  getServiceTypes,
  incrementApplyClick
};
