// controller/admissionController/admissionController.js
const { Admission, admissionStatusEnum } = require('../../models/admission');

// Create Admission
const createAdmission = async (req, res) => {
  try {
    // Create creator snapshot
    const creatorSnapshot = {
      userId: req.user._id,
      firstName: req.user.firstName || req.user.name || '',
      lastName: req.user.lastName || '',
      email: req.user.email,
      phone: req.user.phone || '',
      role: req.user.role
    };

    // Prepare admission data
    const admissionData = {
      // Basic required fields
      departmentName: req.body.departmentName,
      postName: req.body.postName,
      title: req.body.title,

      // Category & Type
      category: req.body.category || 'entrance-exam',
      programType: req.body.programType,
      modeOfApplication: req.body.modeOfApplication || 'online',
      showInPortal: req.body.showInPortal !== undefined ? req.body.showInPortal : true,

      // Contact Information
      helpEmailId: req.body.helpEmailId || '',
      helpCareNo: req.body.helpCareNo || '',
      officialWebsite: req.body.officialWebsite || '',

      // Important Dates
      importantDates: req.body.importantDates || {},

      // Age Limit
      ageLimit: req.body.ageLimit || {},

      // Seats/Vacancies
      totalSeats: req.body.totalSeats || null,
      categorySeats: req.body.categorySeats || null,

      // Application Fee
      applicationFee: req.body.applicationFee || {},
      additionalFeeDetails: req.body.additionalFeeDetails || null,
      paymentModes: req.body.paymentModes || ['debit-card', 'credit-card', 'net-banking', 'upi'],

      // Eligibility
      eligibilityEducational: req.body.eligibilityEducational || '',

      // Selection Process
      selectionMode: req.body.selectionMode || [],

      // Participating Institutions
      participatingInstitutions: req.body.participatingInstitutions || [],
      totalParticipatingInstitutions: req.body.totalParticipatingInstitutions || 0,

      // Dynamic Content
      description: req.body.description || '',
      dynamicContent: req.body.dynamicContent || [],
      sections: req.body.sections || [],
      importantInstructions: req.body.importantInstructions || [],
      documentsRequired: req.body.documentsRequired || [],
      importantLinks: req.body.importantLinks || {},

      // Media & Files
      notificationPDF: req.body.notificationPDF || '',
      syllabusPDF: req.body.syllabusPDF || '',
      informationBrochure: req.body.informationBrochure || '',

      // SEO & Metadata
      postDate: req.body.postDate || Date.now(),
      tags: req.body.tags || [],
      state: req.body.state || 'all-india',
      metaTitle: req.body.metaTitle || '',
      metaDescription: req.body.metaDescription || '',
      metaKeywords: req.body.metaKeywords || [],

      // Status & Visibility
      isLatest: req.body.isLatest !== undefined ? req.body.isLatest : true,
      isFeatured: req.body.isFeatured || false,
      isVisible: req.body.isVisible !== undefined ? req.body.isVisible : true,

      // Creator
      createdBy: creatorSnapshot,
      status: admissionStatusEnum.PENDING
    };

    const admission = new Admission(admissionData);
    await admission.save();

    return res.status(201).json({
      success: true,
      message: 'Admission created successfully',
      data: admission
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to create admission',
      error: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
};

// Get All Admissions
const getAllAdmissions = async (req, res) => {
  try {
    const {
      status,
      departmentName,
      postName,
      category,
      programType,
      state,
      page = 1,
      limit = 20,
      sortBy = 'createdAt',
      order = 'desc',
      applicationOpen
    } = req.query;

    // Build filter
    const filter = {};

    // Apply status filter
    if (status && status !== '') {
      filter.status = status;
    } else if (!req.user || req.user.role !== 'admin') {
      // For non-admin users, show only verified admissions
      filter.status = admissionStatusEnum.VERIFIED;
      filter.showInPortal = true;
    }

    // Text search filters
    if (departmentName && departmentName !== '') {
      filter.departmentName = { $regex: departmentName, $options: 'i' };
    }

    if (postName && postName !== '') {
      filter.postName = { $regex: postName, $options: 'i' };
    }

    // Enum filters
    if (category && category !== '') {
      filter.category = category;
    }

    if (programType && programType !== '') {
      filter.programType = programType;
    }

    if (state && state !== '') {
      filter.state = state;
    }

    // Application open filter
    if (applicationOpen === 'true') {
      const now = new Date();
      filter['importantDates.applicationStartDate'] = { $lte: now };
      filter['importantDates.applicationEndDate'] = { $gte: now };
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOrder = order === 'asc' ? 1 : -1;
    const sortField = sortBy || 'createdAt';

    // Execute query
    const [admissions, total] = await Promise.all([
      Admission.find(filter)
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Admission.countDocuments(filter)
    ]);

    // Add virtuals
    admissions.forEach(admission => {
      const now = new Date();
      admission.isApplicationOpen = admission.importantDates.applicationStartDate &&
                                    admission.importantDates.applicationEndDate &&
                                    new Date(admission.importantDates.applicationStartDate) <= now &&
                                    now <= new Date(admission.importantDates.applicationEndDate) &&
                                    admission.status === admissionStatusEnum.VERIFIED;
      admission.remainingDays = admission.importantDates.applicationEndDate ?
        Math.ceil((new Date(admission.importantDates.applicationEndDate) - now) / (1000 * 60 * 60 * 24)) :
        null;
    });

    return res.status(200).json({
      success: true,
      data: admissions,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalAdmissions: total,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch admissions',
      error: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
};

// Get Admission by ID
const getAdmissionById = async (req, res) => {
  try {
    const { id } = req.params;

    const admission = await Admission.findById(id).lean();

    if (!admission) {
      return res.status(404).json({
        success: false,
        message: 'Admission not found'
      });
    }

    // Check permissions
    if (admission.status !== admissionStatusEnum.VERIFIED && (!req.user || req.user.role !== 'admin')) {
      if (!req.user || admission.createdBy.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to view this admission'
        });
      }
    }

    // Add virtuals
    const now = new Date();
    admission.isApplicationOpen = admission.importantDates.applicationStartDate &&
                                  admission.importantDates.applicationEndDate &&
                                  new Date(admission.importantDates.applicationStartDate) <= now &&
                                  now <= new Date(admission.importantDates.applicationEndDate) &&
                                  admission.status === admissionStatusEnum.VERIFIED;
    admission.remainingDays = admission.importantDates.applicationEndDate ?
      Math.ceil((new Date(admission.importantDates.applicationEndDate) - now) / (1000 * 60 * 60 * 24)) :
      null;

    return res.status(200).json({
      success: true,
      data: admission
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch admission',
      error: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
};

// Update Admission
const updateAdmission = async (req, res) => {
  try {
    const { id } = req.params;

    const admission = await Admission.findById(id);

    if (!admission) {
      return res.status(404).json({
        success: false,
        message: 'Admission not found'
      });
    }

    // Check edit permissions
    if (req.user.role !== 'admin' && admission.createdBy.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to edit this admission'
      });
    }

    // Update admission fields
    const updateFields = [
      'departmentName', 'postName', 'title', 'category', 'programType', 'modeOfApplication',
      'showInPortal', 'helpEmailId', 'helpCareNo', 'officialWebsite', 'importantDates',
      'ageLimit', 'totalSeats', 'categorySeats', 'applicationFee', 'additionalFeeDetails',
      'paymentModes', 'eligibilityEducational', 'selectionMode', 'participatingInstitutions',
      'totalParticipatingInstitutions', 'description', 'dynamicContent', 'sections',
      'importantInstructions', 'documentsRequired', 'importantLinks', 'notificationPDF',
      'syllabusPDF', 'informationBrochure', 'postDate', 'tags', 'state', 'metaTitle',
      'metaDescription', 'metaKeywords', 'isLatest', 'isFeatured', 'isVisible'
    ];

    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        admission[field] = req.body[field];
      }
    });

    // Update updatedBy snapshot
    admission.updatedBy = {
      userId: req.user._id,
      firstName: req.user.firstName || req.user.name || '',
      lastName: req.user.lastName || '',
      email: req.user.email,
      phone: req.user.phone || '',
      role: req.user.role
    };

    await admission.save();

    return res.status(200).json({
      success: true,
      message: 'Admission updated successfully',
      data: admission
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update admission',
      error: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
};

// Change Admission Status (Admin only)
const changeAdmissionStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, remark, rejectionReason } = req.body;

    // Check admin permission
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can change admission status'
      });
    }

    // Validate status
    if (!Object.values(admissionStatusEnum).includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Invalid status. Must be one of: ${Object.values(admissionStatusEnum).join(', ')}`
      });
    }

    const admission = await Admission.findById(id);

    if (!admission) {
      return res.status(404).json({
        success: false,
        message: 'Admission not found'
      });
    }

    // Update status
    admission.status = status;
    admission.statusRemark = remark || '';
    admission.statusChangedAt = new Date();

    // Add rejection reason if status is rejected
    if (status === admissionStatusEnum.REJECTED) {
      admission.rejectionReason = rejectionReason || '';
    } else {
      admission.rejectionReason = '';
    }

    // Add approver snapshot if verified
    if (status === admissionStatusEnum.VERIFIED) {
      admission.approvedBy = {
        userId: req.user._id,
        firstName: req.user.firstName || req.user.name || '',
        lastName: req.user.lastName || '',
        email: req.user.email,
        phone: req.user.phone || '',
        role: req.user.role
      };
    }

    await admission.save();

    return res.status(200).json({
      success: true,
      message: `Admission status updated to ${status}`,
      data: admission
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to change admission status',
      error: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
};

// Delete Admission
const deleteAdmission = async (req, res) => {
  try {
    const { id } = req.params;

    const admission = await Admission.findById(id);

    if (!admission) {
      return res.status(404).json({
        success: false,
        message: 'Admission not found'
      });
    }

    // Check delete permissions
    if (req.user.role !== 'admin' && admission.createdBy.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this admission'
      });
    }

    await admission.deleteOne();

    return res.status(200).json({
      success: true,
      message: 'Admission deleted successfully'
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete admission',
      error: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
};

// Get My Admissions
const getMyAdmissions = async (req, res) => {
  try {
    const {
      status,
      page = 1,
      limit = 20
    } = req.query;

    const filter = {
      'createdBy.userId': req.user._id
    };

    if (status && status !== '') {
      filter.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [admissions, total] = await Promise.all([
      Admission.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Admission.countDocuments(filter)
    ]);

    // Add virtuals
    admissions.forEach(admission => {
      const now = new Date();
      admission.isApplicationOpen = admission.importantDates.applicationStartDate &&
                                    admission.importantDates.applicationEndDate &&
                                    new Date(admission.importantDates.applicationStartDate) <= now &&
                                    now <= new Date(admission.importantDates.applicationEndDate) &&
                                    admission.status === admissionStatusEnum.VERIFIED;
      admission.remainingDays = admission.importantDates.applicationEndDate ?
        Math.ceil((new Date(admission.importantDates.applicationEndDate) - now) / (1000 * 60 * 60 * 24)) :
        null;
    });

    return res.status(200).json({
      success: true,
      data: admissions,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalAdmissions: total,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch your admissions',
      error: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
};

// Get Admission Statistics (Admin only)
const getAdmissionStats = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can view statistics'
      });
    }

    // Use static method from model
    const stats = await Admission.getStatistics();

    // Get recent admissions
    const recentAdmissions = await Admission.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .select('departmentName postName status createdAt createdBy.firstName createdBy.lastName')
      .lean();

    return res.status(200).json({
      success: true,
      data: {
        ...stats,
        recentAdmissions
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch statistics',
      error: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
};

// Get Open Admissions
const getOpenAdmissions = async (req, res) => {
  try {
    const admissions = await Admission.findOpenAdmissions();

    // Add virtuals
    const now = new Date();
    const admissionsData = admissions.map(admission => {
      const obj = admission.toObject();
      obj.isApplicationOpen = true;
      obj.remainingDays = obj.importantDates.applicationEndDate ?
        Math.ceil((new Date(obj.importantDates.applicationEndDate) - now) / (1000 * 60 * 60 * 24)) :
        null;
      return obj;
    });

    return res.status(200).json({
      success: true,
      data: admissionsData
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch open admissions',
      error: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
};

// Search Admissions (Public endpoint)
const searchAdmissions = async (req, res) => {
  try {
    const {
      keyword,
      category,
      programType,
      state,
      page = 1,
      limit = 20
    } = req.query;

    const filter = {
      status: admissionStatusEnum.VERIFIED,
      showInPortal: true
    };

    // Text search
    if (keyword && keyword !== '') {
      filter.$or = [
        { departmentName: { $regex: keyword, $options: 'i' } },
        { postName: { $regex: keyword, $options: 'i' } },
        { title: { $regex: keyword, $options: 'i' } },
        { eligibilityEducational: { $regex: keyword, $options: 'i' } }
      ];
    }

    // Specific filters
    if (category && category !== '') {
      filter.category = category;
    }

    if (programType && programType !== '') {
      filter.programType = programType;
    }

    if (state && state !== '') {
      filter.state = state;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [admissions, total] = await Promise.all([
      Admission.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Admission.countDocuments(filter)
    ]);

    // Add virtuals
    admissions.forEach(admission => {
      const now = new Date();
      admission.isApplicationOpen = admission.importantDates.applicationStartDate &&
                                    admission.importantDates.applicationEndDate &&
                                    new Date(admission.importantDates.applicationStartDate) <= now &&
                                    now <= new Date(admission.importantDates.applicationEndDate) &&
                                    admission.status === admissionStatusEnum.VERIFIED;
      admission.remainingDays = admission.importantDates.applicationEndDate ?
        Math.ceil((new Date(admission.importantDates.applicationEndDate) - now) / (1000 * 60 * 60 * 24)) :
        null;
    });

    return res.status(200).json({
      success: true,
      data: admissions,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalAdmissions: total,
        limit: parseInt(limit)
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to search admissions',
      error: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
};

// Get All Admissions List with Infinite Scrolling and Date Search
const getAllAdmissionsList = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      year,
      month,
      date,
      keyword,
      isLatest,
      sortBy = 'createdAt',
      order = 'desc'
    } = req.query;

    const filter = {
      status: admissionStatusEnum.VERIFIED,
      showInPortal: true
    };

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
        const monthNum = parseInt(month) - 1; // month is 0-indexed
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
        filter['importantDates.applicationStartDate'] = dateFilter;
      }
    }

    // Search by keyword
    if (keyword && keyword !== '') {
      filter.$or = [
        { departmentName: { $regex: keyword, $options: 'i' } },
        { postName: { $regex: keyword, $options: 'i' } },
        { title: { $regex: keyword, $options: 'i' } },
        { eligibilityEducational: { $regex: keyword, $options: 'i' } }
      ];
    }

    // Filter by latest admissions
    if (isLatest === 'true') {
      filter.isLatest = true;
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOrder = order === 'asc' ? 1 : -1;
    const sortField = sortBy || 'createdAt';

    // Execute query
    const [admissions, total] = await Promise.all([
      Admission.find(filter)
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Admission.countDocuments(filter)
    ]);

    // Add virtuals
    admissions.forEach(admission => {
      const now = new Date();
      admission.isApplicationOpen = admission.importantDates.applicationStartDate &&
                                    admission.importantDates.applicationEndDate &&
                                    new Date(admission.importantDates.applicationStartDate) <= now &&
                                    now <= new Date(admission.importantDates.applicationEndDate) &&
                                    admission.status === admissionStatusEnum.VERIFIED;
      admission.remainingDays = admission.importantDates.applicationEndDate ?
        Math.ceil((new Date(admission.importantDates.applicationEndDate) - now) / (1000 * 60 * 60 * 24)) :
        null;
    });

    const hasMore = skip + admissions.length < total;

    return res.status(200).json({
      success: true,
      data: admissions,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalAdmissions: total,
        limit: parseInt(limit),
        hasMore
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch admissions list',
      error: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
};

// Get Latest Admissions
const getLatestAdmissions = async (req, res) => {
  try {
    const { limit = 10 } = req.query;

    const admissions = await Admission.findLatest(parseInt(limit));

    // Add virtuals
    const now = new Date();
    const admissionsData = admissions.map(admission => {
      const obj = admission.toObject();
      obj.isApplicationOpen = obj.importantDates.applicationStartDate &&
                              obj.importantDates.applicationEndDate &&
                              new Date(obj.importantDates.applicationStartDate) <= now &&
                              now <= new Date(obj.importantDates.applicationEndDate) &&
                              obj.status === admissionStatusEnum.VERIFIED;
      obj.remainingDays = obj.importantDates.applicationEndDate ?
        Math.ceil((new Date(obj.importantDates.applicationEndDate) - now) / (1000 * 60 * 60 * 24)) :
        null;
      return obj;
    });

    return res.status(200).json({
      success: true,
      data: admissionsData
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch latest admissions',
      error: process.env.NODE_ENV !== 'production' ? error.message : undefined
    });
  }
};

module.exports = {
  createAdmission,
  getAllAdmissions,
  getAdmissionById,
  updateAdmission,
  deleteAdmission,
  changeAdmissionStatus,
  getMyAdmissions,
  getAdmissionStats,
  getOpenAdmissions,
  searchAdmissions,
  getAllAdmissionsList,
  getLatestAdmissions
};
