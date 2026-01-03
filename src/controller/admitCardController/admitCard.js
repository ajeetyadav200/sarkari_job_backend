const AdmitCard = require('../../models/admitCard/admitCard');
const { Job } = require('../../models/job/letestJob');
const {
  createAdmitCardValidation,
  updateAdmitCardValidation,
  updateStatusValidation,
  admitCardFilterValidation
} = require('../../utils/admitCardValidation');
const mongoose = require('mongoose');

// Import other models (if they exist, otherwise they will need to be created)
// For now, we'll define placeholder variables
let Admission, LatestNotice;
try {
  Admission = require('../../models/admission/admission');
} catch (err) {
  Admission = null;
}
try {
  LatestNotice = require('../../models/latestNotice/latestNotice');
} catch (err) {
  LatestNotice = null;
}

// Create Admit Card
const createAdmitCard = async (req, res) => {
  try {
    // Log incoming request body for debugging
    // Validate request body
    const { error, value } = createAdmitCardValidation.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }

    // Check if reference exists if referenceId is provided
    if (value.referenceId && value.referenceModel) {
      let referenceExists;
      switch (value.referenceModel) {
        case 'Job':
          referenceExists = await Job.findById(value.referenceId);
          if (!referenceExists) {
            return res.status(404).json({
              success: false,
              message: 'Referenced Job not found'
            });
          }
          break;
        case 'Admission':
          if (!Admission) {
            return res.status(400).json({
              success: false,
              message: 'Admission model is not available'
            });
          }
          referenceExists = await Admission.findById(value.referenceId);
          if (!referenceExists) {
            return res.status(404).json({
              success: false,
              message: 'Referenced Admission not found'
            });
          }
          break;
        case 'LatestNotice':
          if (!LatestNotice) {
            return res.status(400).json({
              success: false,
              message: 'LatestNotice model is not available'
            });
          }
          referenceExists = await LatestNotice.findById(value.referenceId);
          if (!referenceExists) {
            return res.status(404).json({
              success: false,
              message: 'Referenced LatestNotice not found'
            });
          }
          break;
        default:
          // Handle other models as needed
          break;
      }
    }

    // Create admit card with all dynamic content fields
    const admitCardData = {
      // Basic fields
      type: value.type,
      referenceId: value.referenceId || null,
      referenceModel: value.referenceModel || null,
      directWebURL: value.directWebURL || '',
      linkMenuField: value.linkMenuField || '',
      postTypeDetails: value.postTypeDetails || '',
      alsoShowLink: value.alsoShowLink || false,

      // Dynamic content fields
      description: value.description || '',
      dynamicContent: value.dynamicContent || [],
      contentSections: value.contentSections || [],
      importantInstructions: value.importantInstructions || [],
      documentsRequired: value.documentsRequired || [],

      // Dates
      publishDate: value.publishDate || new Date(),
      lastDate: value.lastDate || null,

      // Status
      status: req.user.role === 'admin' ? (value.status || 'pending') : 'pending',
      admitCardStatus: value.admitCardStatus || 'active',

      // Category and tags
      category: value.category || '',
      tags: value.tags || [],

      // User tracking
      createdBy: req.user._id,
      createdByDetails: {
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone || '',
        role: req.user.role,
        userId: req.user._id
      }
    };
    const admitCard = new AdmitCard(admitCardData);
    await admitCard.save();

    return res.status(201).json({
      success: true,
      message: 'Admit card created successfully',
      data: admitCard
    });
  } catch (error) {
    console.error('Create admit card error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create admit card',
      error: error.message
    });
  }
};

// Get All Admit Cards with Filters
const getAllAdmitCards = async (req, res) => {
  try {
    // Validate filter parameters
    const { error, value } = admitCardFilterValidation.validate(req.query);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.details.map(detail => detail.message)
      });
    }

    const {
      type,
      status,
      admitCardStatus,
      category,
      tags,
      createdBy,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 10,
      sortBy = 'publishDate',
      sortOrder = 'desc'
    } = value;

    // Build filter
    const filter = {};

    // Role-based filtering
    if (req.user.role === 'publisher' || req.user.role === 'assistant') {
      filter.createdBy = req.user._id;
    } else if (req.user.role === 'admin') {
      // Admin can see all
    } else {
      // For other roles, only show verified admit cards
      filter.status = 'verified';
      filter.admitCardStatus = 'active';
    }

    if (type) filter.type = type;
    if (status) filter.status = status;
    if (admitCardStatus) filter.admitCardStatus = admitCardStatus;
    if (category) filter.category = category;
    if (createdBy) filter.createdBy = createdBy;

    // Date filtering
    if (startDate || endDate) {
      filter.publishDate = {};
      if (startDate) filter.publishDate.$gte = new Date(startDate);
      if (endDate) filter.publishDate.$lte = new Date(endDate);
    }

    // Tags filtering
    if (tags && tags.length > 0) {
      filter.tags = { $in: tags };
    }

    // Search functionality
    if (search) {
      filter.$or = [
        { postDetails: { $regex: search, $options: 'i' } },
        { linkMenuField: { $regex: search, $options: 'i' } },
        { postTypeDetails: { $regex: search, $options: 'i' } },
        { 'createdByDetails.name': { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }

    // Sorting
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Pagination
    const skip = (page - 1) * limit;

    // Fetch admit cards
    const [admitCards, total] = await Promise.all([
      AdmitCard.find(filter)
        .populate('referenceId')
        .populate('createdBy', 'name email role')
        .populate('verifiedBy', 'name email role')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      AdmitCard.countDocuments(filter)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return res.status(200).json({
      success: true,
      data: admitCards,
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
    console.error('Get all admit cards error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch admit cards',
      error: error.message
    });
  }
};

// Get Admit Card by ID
const getAdmitCardById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid admit card ID format'
      });
    }

    const admitCard = await AdmitCard.findById(id)
      .populate('referenceId')
      .populate('createdBy', 'name email role')
      .populate('verifiedBy', 'name email role')
      .lean();

    if (!admitCard) {
      return res.status(404).json({
        success: false,
        message: 'Admit card not found'
      });
    }

    // Check permissions
    if (req.user.role !== 'admin' && admitCard.createdBy.toString() !== req.user._id.toString()) {
      if (admitCard.status !== 'verified') {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to view this admit card'
        });
      }
    }

    return res.status(200).json({
      success: true,
      data: admitCard
    });
  } catch (error) {
    console.error('Get admit card by ID error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch admit card',
      error: error.message
    });
  }
};

// Update Admit Card
const updateAdmitCard = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid admit card ID format'
      });
    }

    // Find admit card
    const admitCard = await AdmitCard.findById(id);
    if (!admitCard) {
      return res.status(404).json({
        success: false,
        message: 'Admit card not found'
      });
    }

    // Check permissions
    if (admitCard.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this admit card'
      });
    }
    // Validate update data
    const { error, value } = updateAdmitCardValidation.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }

    // Non-admin cannot update status (except maybe to 'pending')
    if (req.user.role !== 'admin' && value.status && value.status !== 'pending') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can change status'
      });
    }

    // Check if reference exists if updating referenceId
    if (value.referenceId && value.referenceModel) {
      let referenceExists;
      switch (value.referenceModel) {
        case 'Job':
          referenceExists = await Job.findById(value.referenceId);
          if (!referenceExists) {
            return res.status(404).json({
              success: false,
              message: 'Referenced Job not found'
            });
          }
          break;
        case 'Admission':
          if (!Admission) {
            return res.status(400).json({
              success: false,
              message: 'Admission model is not available'
            });
          }
          referenceExists = await Admission.findById(value.referenceId);
          if (!referenceExists) {
            return res.status(404).json({
              success: false,
              message: 'Referenced Admission not found'
            });
          }
          break;
        case 'LatestNotice':
          if (!LatestNotice) {
            return res.status(400).json({
              success: false,
              message: 'LatestNotice model is not available'
            });
          }
          referenceExists = await LatestNotice.findById(value.referenceId);
          if (!referenceExists) {
            return res.status(404).json({
              success: false,
              message: 'Referenced LatestNotice not found'
            });
          }
          break;
        default:
          break;
      }
    }

    // Update admit card with dynamic content support
    const updatedAdmitCard = await AdmitCard.findByIdAndUpdate(
      id,
      { ...value },
      { new: true, runValidators: true }
    )
      .populate('referenceId')
      .populate('createdBy', 'name email role')
      .populate('verifiedBy', 'name email role');
    return res.status(200).json({
      success: true,
      message: 'Admit card updated successfully',
      data: updatedAdmitCard
    });
  } catch (error) {
    console.error('Update admit card error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update admit card',
      error: error.message
    });
  }
};

// Update Status (Admin only)
const updateStatus = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid admit card ID format'
      });
    }

    // Find admit card
    const admitCard = await AdmitCard.findById(id);
    if (!admitCard) {
      return res.status(404).json({
        success: false,
        message: 'Admit card not found'
      });
    }

    // Check admin permission
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can update admit card status'
      });
    }

    // Validate status update data
    const { error, value } = updateStatusValidation.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.details.map(detail => detail.message)
      });
    }

    // Prepare update data
    const updateData = {
      status: value.status,
      verifiedBy: req.user._id,
      verifiedByDetails: {
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone || '',
        role: req.user.role,
        userId: req.user._id
      },
      verifiedAt: new Date()
    };

    // Add rejection reason if status is rejected
    if (value.status === 'rejected' && value.rejectionReason) {
      updateData.rejectionReason = value.rejectionReason;
    } else if (value.status !== 'rejected') {
      updateData.rejectionReason = null;
    }

    // Update admit card status
    const updatedAdmitCard = await AdmitCard.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('referenceId')
      .populate('createdBy', 'name email role')
      .populate('verifiedBy', 'name email role');

    return res.status(200).json({
      success: true,
      message: `Admit card status updated to ${value.status}`,
      data: updatedAdmitCard
    });
  } catch (error) {
    console.error('Update status error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update status',
      error: error.message
    });
  }
};

// Delete Admit Card
const deleteAdmitCard = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid admit card ID format'
      });
    }

    // Find admit card
    const admitCard = await AdmitCard.findById(id);
    if (!admitCard) {
      return res.status(404).json({
        success: false,
        message: 'Admit card not found'
      });
    }

    // Check permissions
    if (admitCard.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this admit card'
      });
    }

    // Delete admit card
    await AdmitCard.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Admit card deleted successfully'
    });
  } catch (error) {
    console.error('Delete admit card error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete admit card',
      error: error.message
    });
  }
};

// Get Admit Cards by Job ID
const getAdmitCardsByJobId = async (req, res) => {
  try {
    const { jobId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid job ID format'
      });
    }

    const admitCards = await AdmitCard.find({
      referenceId: jobId,
      referenceModel: 'Job',
      status: 'verified',
      admitCardStatus: 'active'
    })
      .populate('referenceId', 'title departmentName postName')
      .populate('createdBy', 'name email role')
      .sort({ publishDate: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: admitCards
    });
  } catch (error) {
    console.error('Get admit cards by job ID error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch admit cards',
      error: error.message
    });
  }
};

// Get Public Admit Cards
const getPublicAdmitCards = async (req, res) => {
  try {
    // Validate filter parameters
    const { error, value } = admitCardFilterValidation.validate(req.query);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.details.map(detail => detail.message)
      });
    }

    const {
      type,
      category,
      tags,
      search,
      page = 1,
      limit = 10,
      sortBy = 'publishDate',
      sortOrder = 'desc'
    } = value;

    // Build filter for public access
    const filter = {
      status: 'verified',
      admitCardStatus: 'active'
    };

    if (type) filter.type = type;
    if (category) filter.category = category;

    // Tags filtering
    if (tags && tags.length > 0) {
      filter.tags = { $in: tags };
    }

    // Search functionality
    if (search) {
      filter.$or = [
        { postDetails: { $regex: search, $options: 'i' } },
        { linkMenuField: { $regex: search, $options: 'i' } },
        { postTypeDetails: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }

    // Sorting
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Pagination
    const skip = (page - 1) * limit;

    // Fetch public admit cards
    const [admitCards, total] = await Promise.all([
      AdmitCard.find(filter)
        .populate('referenceId', 'title departmentName postName')
        .select('-createdByDetails -verifiedByDetails -rejectionReason -__v')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      AdmitCard.countDocuments(filter)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return res.status(200).json({
      success: true,
      data: admitCards,
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
    console.error('Get public admit cards error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch admit cards',
      error: error.message
    });
  }
};

// Get Available References
const getAvailableReferences = async (req, res) => {
  try {
    const { type, search } = req.query;

    let references = [];

    switch (type) {
      case 'job':
        const jobFilter = {};
        if (search) {
          jobFilter.$or = [
            { departmentName: { $regex: search, $options: 'i' } },
            { postName: { $regex: search, $options: 'i' } }
          ];
        }
        references = await Job.find(jobFilter)
          .select('_id departmentName postName importantDates.startDate importantDates.registrationLastDate status')
          .sort({ 'importantDates.startDate': -1 })
          .limit(50)
          .lean();
        
        // Format response
        references = references.map(job => ({
          ...job,
          referenceModel: 'Job'
        }));
        break;

      case 'admission':
        if (!Admission) {
          return res.status(400).json({
            success: false,
            message: 'Admission model is not available'
          });
        }
        const admissionFilter = {};
        if (search) {
          admissionFilter.title = { $regex: search, $options: 'i' };
        }
        references = await Admission.find(admissionFilter)
          .select('_id title description publishDate lastDate')
          .sort({ publishDate: -1 })
          .limit(50)
          .lean();

        references = references.map(adm => ({
          ...adm,
          referenceModel: 'Admission'
        }));
        break;

      case 'latestNotice':
        if (!LatestNotice) {
          return res.status(400).json({
            success: false,
            message: 'LatestNotice model is not available'
          });
        }
        const noticeFilter = {};
        if (search) {
          noticeFilter.title = { $regex: search, $options: 'i' };
        }
        references = await LatestNotice.find(noticeFilter)
          .select('_id title description publishDate')
          .sort({ publishDate: -1 })
          .limit(50)
          .lean();

        references = references.map(notice => ({
          ...notice,
          referenceModel: 'LatestNotice'
        }));
        break;

      default:
        // Return all types
        const queries = [
          Job.find({ status: 'verified' })
            .select('_id departmentName postName type publishDate')
            .sort({ publishDate: -1 })
            .limit(20)
            .lean()
        ];

        if (Admission) {
          queries.push(
            Admission.find({})
              .select('_id title type publishDate')
              .sort({ publishDate: -1 })
              .limit(20)
              .lean()
          );
        }

        if (LatestNotice) {
          queries.push(
            LatestNotice.find({})
              .select('_id title type publishDate')
              .sort({ publishDate: -1 })
              .limit(20)
              .lean()
          );
        }

        const results = await Promise.all(queries);
        const jobs = results[0];
        const admissions = Admission ? results[1] : [];
        const notices = LatestNotice ? (Admission ? results[2] : results[1]) : [];

        references = {
          jobs: jobs.map(job => ({ ...job, referenceModel: 'Job' })),
          admissions: admissions.map(adm => ({ ...adm, referenceModel: 'Admission' })),
          notices: notices.map(notice => ({ ...notice, referenceModel: 'LatestNotice' }))
        };
        break;
    }

    return res.status(200).json({
      success: true,
      data: references
    });
  } catch (error) {
    console.error('Get available references error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch references',
      error: error.message
    });
  }
};

module.exports = {
  createAdmitCard,
  getAllAdmitCards,
  getAdmitCardById,
  updateAdmitCard,
  deleteAdmitCard,
  updateStatus,
  getAdmitCardsByJobId,
  getPublicAdmitCards,
  getAvailableReferences
};