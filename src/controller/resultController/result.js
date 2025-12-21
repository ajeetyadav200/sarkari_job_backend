const Result = require('../../models/result/result');
const { Job } = require('../../models/job/letestJob');
const {
  createResultValidation,
  updateResultValidation,
  updateStatusValidation,
  resultFilterValidation
} = require('../../utils/resultValidation');
const mongoose = require('mongoose');

// Import other models (if they exist)
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

// Create Result
const createResult = async (req, res) => {
  try {
    console.log('Incoming result data:', JSON.stringify(req.body, null, 2));

    // Validate request body
    const { error, value } = createResultValidation.validate(req.body, { abortEarly: false });
    if (error) {
      console.log('Validation errors:', error.details);
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
          break;
      }
    }

    // Create result with all dynamic content fields
    const resultData = {
      type: value.type,
      referenceId: value.referenceId || null,
      referenceModel: value.referenceModel || null,
      directWebURL: value.directWebURL || '',
      linkMenuField: value.linkMenuField || '',
      postTypeDetails: value.postTypeDetails || '',
      alsoShowLink: value.alsoShowLink || false,
      description: value.description || '',
      dynamicContent: value.dynamicContent || [],
      contentSections: value.contentSections || [],
      importantInstructions: value.importantInstructions || [],
      documentsRequired: value.documentsRequired || [],
      resultType: value.resultType || 'Final',
      examName: value.examName || '',
      publishDate: value.publishDate || new Date(),
      resultDate: value.resultDate || null,
      status: req.user.role === 'admin' ? (value.status || 'pending') : 'pending',
      resultStatus: value.resultStatus || 'active',
      category: value.category || '',
      tags: value.tags || [],
      createdBy: req.user._id,
      createdByDetails: {
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone || '',
        role: req.user.role,
        userId: req.user._id
      }
    };

    console.log('Creating result with data:', JSON.stringify(resultData, null, 2));

    const result = new Result(resultData);
    await result.save();

    return res.status(201).json({
      success: true,
      message: 'Result created successfully',
      data: result
    });
  } catch (error) {
    console.error('Create result error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create result',
      error: error.message
    });
  }
};

// Get All Results with Filters
const getAllResults = async (req, res) => {
  try {
    const { error, value } = resultFilterValidation.validate(req.query);
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
      resultStatus,
      resultType,
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
      // For other roles, only show verified results
      filter.status = 'verified';
      filter.resultStatus = 'active';
    }

    if (type) filter.type = type;
    if (status) filter.status = status;
    if (resultStatus) filter.resultStatus = resultStatus;
    if (resultType) filter.resultType = resultType;
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
        { linkMenuField: { $regex: search, $options: 'i' } },
        { postTypeDetails: { $regex: search, $options: 'i' } },
        { examName: { $regex: search, $options: 'i' } },
        { 'createdByDetails.name': { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }

    // Sorting
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Pagination
    const skip = (page - 1) * limit;

    // Fetch results
    const [results, total] = await Promise.all([
      Result.find(filter)
        .populate('referenceId')
        .populate('createdBy', 'name email role')
        .populate('verifiedBy', 'name email role')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Result.countDocuments(filter)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return res.status(200).json({
      success: true,
      data: results,
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
    console.error('Get all results error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch results',
      error: error.message
    });
  }
};

// Get Result by ID
const getResultById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid result ID format'
      });
    }

    const result = await Result.findById(id)
      .populate('referenceId')
      .populate('createdBy', 'name email role')
      .populate('verifiedBy', 'name email role')
      .lean();

    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Result not found'
      });
    }

    // Check permissions
    if (req.user.role !== 'admin' && result.createdBy.toString() !== req.user._id.toString()) {
      if (result.status !== 'verified') {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to view this result'
        });
      }
    }

    return res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Get result by ID error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch result',
      error: error.message
    });
  }
};

// Update Result
const updateResult = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid result ID format'
      });
    }

    const result = await Result.findById(id);
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Result not found'
      });
    }

    // Check permissions
    if (result.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this result'
      });
    }

    console.log('Updating result with data:', JSON.stringify(req.body, null, 2));

    // Validate update data
    const { error, value } = updateResultValidation.validate(req.body, { abortEarly: false });
    if (error) {
      console.log('Validation errors:', error.details);
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }

    // Non-admin cannot update status
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

    // Update result
    const updatedResult = await Result.findByIdAndUpdate(
      id,
      { ...value },
      { new: true, runValidators: true }
    )
      .populate('referenceId')
      .populate('createdBy', 'name email role')
      .populate('verifiedBy', 'name email role');

    console.log('Result updated with dynamic content:', {
      hasDynamicContent: updatedResult.dynamicContent?.length > 0,
      hasContentSections: updatedResult.contentSections?.length > 0
    });

    return res.status(200).json({
      success: true,
      message: 'Result updated successfully',
      data: updatedResult
    });
  } catch (error) {
    console.error('Update result error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update result',
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
        message: 'Invalid result ID format'
      });
    }

    const result = await Result.findById(id);
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Result not found'
      });
    }

    // Check admin permission
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can update result status'
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

    // Update result status
    const updatedResult = await Result.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('referenceId')
      .populate('createdBy', 'name email role')
      .populate('verifiedBy', 'name email role');

    return res.status(200).json({
      success: true,
      message: `Result status updated to ${value.status}`,
      data: updatedResult
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

// Delete Result
const deleteResult = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid result ID format'
      });
    }

    const result = await Result.findById(id);
    if (!result) {
      return res.status(404).json({
        success: false,
        message: 'Result not found'
      });
    }

    // Check permissions
    if (result.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this result'
      });
    }

    await Result.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Result deleted successfully'
    });
  } catch (error) {
    console.error('Delete result error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete result',
      error: error.message
    });
  }
};

// Get Results by Job ID
const getResultsByJobId = async (req, res) => {
  try {
    const { jobId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid job ID format'
      });
    }

    const results = await Result.find({
      referenceId: jobId,
      referenceModel: 'Job',
      status: 'verified',
      resultStatus: 'active'
    })
      .populate('referenceId', 'title departmentName postName')
      .populate('createdBy', 'name email role')
      .sort({ publishDate: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Get results by job ID error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch results',
      error: error.message
    });
  }
};

// Get Public Results
const getPublicResults = async (req, res) => {
  try {
    const { error, value } = resultFilterValidation.validate(req.query);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: error.details.map(detail => detail.message)
      });
    }

    const {
      type,
      resultType,
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
      resultStatus: 'active'
    };

    if (type) filter.type = type;
    if (resultType) filter.resultType = resultType;
    if (category) filter.category = category;

    // Tags filtering
    if (tags && tags.length > 0) {
      filter.tags = { $in: tags };
    }

    // Search functionality
    if (search) {
      filter.$or = [
        { linkMenuField: { $regex: search, $options: 'i' } },
        { postTypeDetails: { $regex: search, $options: 'i' } },
        { examName: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } }
      ];
    }

    // Sorting
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Pagination
    const skip = (page - 1) * limit;

    // Fetch public results
    const [results, total] = await Promise.all([
      Result.find(filter)
        .populate('referenceId', 'title departmentName postName')
        .select('-createdByDetails -verifiedByDetails -rejectionReason -__v')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Result.countDocuments(filter)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return res.status(200).json({
      success: true,
      data: results,
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
    console.error('Get public results error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch results',
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
  createResult,
  getAllResults,
  getResultById,
  updateResult,
  deleteResult,
  updateStatus,
  getResultsByJobId,
  getPublicResults,
  getAvailableReferences
};
