const Answer = require('../../models/answer/answerSchema');
const { Job } = require('../../models/job/letestJob');
const { cloudinary } = require('../../config/cloudinary');
const mongoose = require('mongoose');
const streamifier = require('streamifier');

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

/**
 * Upload buffer to Cloudinary using stream (no temp files)
 */
const uploadBufferToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder || 'answer-keys',
        resource_type: options.resourceType || 'auto',
        use_filename: true,
        unique_filename: true
      },
      (error, result) => {
        if (error) {
          reject(error);
        } else {
          resolve({
            url: result.secure_url,
            cloudinaryId: result.public_id,
            format: result.format,
            bytes: result.bytes
          });
        }
      }
    );

    streamifier.createReadStream(buffer).pipe(uploadStream);
  });
};

/**
 * Delete file from Cloudinary
 */
const deleteFromCloudinary = async (cloudinaryId) => {
  try {
    const result = await cloudinary.uploader.destroy(cloudinaryId);
    return result;
  } catch (error) {
    throw new Error(`Failed to delete file: ${error.message}`);
  }
};

// Create Answer
// Now accepts file data as JSON (URLs from upload service) instead of file uploads
const createAnswer = async (req, res) => {
  try {
    // Check if reference exists if referenceId is provided
    if (req.body.referenceId && req.body.referenceModel) {
      let referenceExists;
      switch (req.body.referenceModel) {
        case 'Job':
          referenceExists = await Job.findById(req.body.referenceId);
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
          referenceExists = await Admission.findById(req.body.referenceId);
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
          referenceExists = await LatestNotice.findById(req.body.referenceId);
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

    // Parse arrays if they come as JSON strings
    let tags = req.body.tags || [];
    let dynamicContent = req.body.dynamicContent || [];
    let contentSections = req.body.contentSections || [];
    let importantInstructions = req.body.importantInstructions || [];
    let documentsRequired = req.body.documentsRequired || [];

    if (typeof tags === 'string') {
      try { tags = JSON.parse(tags); } catch (e) { tags = []; }
    }
    if (typeof dynamicContent === 'string') {
      try { dynamicContent = JSON.parse(dynamicContent); } catch (e) { dynamicContent = []; }
    }
    if (typeof contentSections === 'string') {
      try { contentSections = JSON.parse(contentSections); } catch (e) { contentSections = []; }
    }
    if (typeof importantInstructions === 'string') {
      try { importantInstructions = JSON.parse(importantInstructions); } catch (e) { importantInstructions = []; }
    }
    if (typeof documentsRequired === 'string') {
      try { documentsRequired = JSON.parse(documentsRequired); } catch (e) { documentsRequired = []; }
    }

    // Create answer with all dynamic content fields
    const answerData = {
      type: req.body.type,
      referenceId: req.body.referenceId || null,
      referenceModel: req.body.referenceModel || null,
      directWebURL: req.body.directWebURL || '',
      linkMenuField: req.body.linkMenuField || '',
      postTypeDetails: req.body.postTypeDetails || '',
      alsoShowLink: req.body.alsoShowLink === 'true' || req.body.alsoShowLink === true,
      description: req.body.description || '',
      dynamicContent: dynamicContent,
      contentSections: contentSections,
      importantInstructions: importantInstructions,
      documentsRequired: documentsRequired,
      examName: req.body.examName || '',
      publishDate: req.body.publishDate || new Date(),
      lastDate: req.body.lastDate || null,
      status: req.user.role === 'admin' ? (req.body.status || 'pending') : 'pending',
      answerStatus: req.body.answerStatus || 'active',
      category: req.body.category || '',
      tags: tags,
      createdBy: req.user._id,
      createdByDetails: {
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone || '',
        role: req.user.role,
        userId: req.user._id
      }
    };

    // Handle file data from JSON body (files already uploaded via /api/upload/single)
    const fileFields = ['officialNotification', 'examDateNotice', 'syllabusFile', 'admitCardFile', 'answerKeyFile', 'resultFile', 'otherFile'];

    // Map file types to valid enum values
    const mapFileType = (type) => {
      if (!type) return 'other';
      const lowerType = type.toLowerCase();
      // Valid enum: ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx', 'other']
      if (['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'].includes(lowerType)) {
        return lowerType;
      }
      // Map common types
      if (lowerType === 'image' || lowerType === 'gif' || lowerType === 'webp') return 'png';
      if (lowerType === 'document') return 'pdf';
      return 'other';
    };

    for (const fieldName of fileFields) {
      if (req.body[fieldName] && req.body[fieldName].fileUrl) {
        // File data comes as JSON with fileUrl, fileName, cloudinaryId, fileType
        answerData[fieldName] = {
          fileName: req.body[fieldName].fileName || '',
          fileUrl: req.body[fieldName].fileUrl,
          cloudinaryId: req.body[fieldName].cloudinaryId || '',
          fileType: mapFileType(req.body[fieldName].fileType),
          uploadedAt: req.body[fieldName].uploadedAt || new Date()
        };
      }
    }

    const answer = new Answer(answerData);
    await answer.save();

    return res.status(201).json({
      success: true,
      message: 'Answer created successfully',
      data: answer
    });
  } catch (error) {
    console.error('Create answer error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create answer',
      error: error.message || 'Internal server error'
    });
  }
};

// Get All Answers with Filters
const getAllAnswers = async (req, res) => {
  try {
    const {
      type,
      status,
      answerStatus,
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
    } = req.query;

    // Build filter
    const filter = {};

    // Role-based filtering
    if (req.user && (req.user.role === 'publisher' || req.user.role === 'assistant')) {
      filter.createdBy = req.user._id;
    } else if (req.user && req.user.role === 'admin') {
      // Admin can see all
    } else {
      // For other roles, only show verified answers
      filter.status = 'verified';
      filter.answerStatus = 'active';
    }

    if (type) filter.type = type;
    if (status) filter.status = status;
    if (answerStatus) filter.answerStatus = answerStatus;
    if (category) filter.category = category;
    if (createdBy) filter.createdBy = createdBy;

    // Date filtering
    if (startDate || endDate) {
      filter.publishDate = {};
      if (startDate) filter.publishDate.$gte = new Date(startDate);
      if (endDate) filter.publishDate.$lte = new Date(endDate);
    }

    // Tags filtering
    if (tags) {
      const tagsArray = Array.isArray(tags) ? tags : [tags];
      filter.tags = { $in: tagsArray };
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

    // Fetch answers
    const [answers, total] = await Promise.all([
      Answer.find(filter)
        .populate('referenceId')
        .populate('createdBy', 'name email role')
        .populate('verifiedBy', 'name email role')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Answer.countDocuments(filter)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return res.status(200).json({
      success: true,
      data: answers,
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
      message: 'Failed to fetch answers',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get Answer by ID
const getAnswerById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid answer ID format'
      });
    }

    const answer = await Answer.findById(id)
      .populate('referenceId')
      .populate('createdBy', 'name email role')
      .populate('verifiedBy', 'name email role')
      .lean();

    if (!answer) {
      return res.status(404).json({
        success: false,
        message: 'Answer not found'
      });
    }

    // Check permissions - handle populated createdBy
    if (answer.status !== 'verified') {
      if (!req.user) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to view this answer'
        });
      }

      const createdById = answer.createdBy?._id || answer.createdBy;
      if (req.user.role !== 'admin' && createdById?.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to view this answer'
        });
      }
    }

    return res.status(200).json({
      success: true,
      data: answer
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch answer',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Update Answer
const updateAnswer = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid answer ID format'
      });
    }

    const answer = await Answer.findById(id);
    if (!answer) {
      return res.status(404).json({
        success: false,
        message: 'Answer not found'
      });
    }

    // Check permissions
    if (answer.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this answer'
      });
    }

    // Non-admin cannot update status
    if (req.user.role !== 'admin' && req.body.status && req.body.status !== 'pending') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can change status'
      });
    }

    // Check if reference exists if updating referenceId
    if (req.body.referenceId && req.body.referenceModel) {
      let referenceExists;
      switch (req.body.referenceModel) {
        case 'Job':
          referenceExists = await Job.findById(req.body.referenceId);
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
          referenceExists = await Admission.findById(req.body.referenceId);
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
          referenceExists = await LatestNotice.findById(req.body.referenceId);
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

    // Handle file data from JSON body (files already uploaded via /api/upload/single)
    const fileFields = ['officialNotification', 'examDateNotice', 'syllabusFile', 'admitCardFile', 'answerKeyFile', 'resultFile', 'otherFile'];

    // Map file types to valid enum values
    const mapFileType = (type) => {
      if (!type) return 'other';
      const lowerType = type.toLowerCase();
      // Valid enum: ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx', 'other']
      if (['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'].includes(lowerType)) {
        return lowerType;
      }
      // Map common types
      if (lowerType === 'image' || lowerType === 'gif' || lowerType === 'webp') return 'png';
      if (lowerType === 'document') return 'pdf';
      return 'other';
    };

    for (const fieldName of fileFields) {
      if (req.body[fieldName] !== undefined) {
        if (req.body[fieldName] && req.body[fieldName].fileUrl) {
          // New file uploaded - check if we need to delete old file
          if (answer[fieldName] && answer[fieldName].cloudinaryId &&
              answer[fieldName].cloudinaryId !== req.body[fieldName].cloudinaryId) {
            try {
              await deleteFromCloudinary(answer[fieldName].cloudinaryId);
            } catch (err) {
              // Silent fail for file deletion
            }
          }
          // Set new file data
          answer[fieldName] = {
            fileName: req.body[fieldName].fileName || '',
            fileUrl: req.body[fieldName].fileUrl,
            cloudinaryId: req.body[fieldName].cloudinaryId || '',
            fileType: mapFileType(req.body[fieldName].fileType),
            uploadedAt: req.body[fieldName].uploadedAt || new Date()
          };
        } else if (req.body[fieldName] === null) {
          // File removed - delete from Cloudinary
          if (answer[fieldName] && answer[fieldName].cloudinaryId) {
            try {
              await deleteFromCloudinary(answer[fieldName].cloudinaryId);
            } catch (err) {
              // Silent fail for file deletion
            }
          }
          answer[fieldName] = null;
        }
      }
    }

    // Parse arrays if they come as JSON strings
    if (req.body.tags) {
      if (typeof req.body.tags === 'string') {
        try { req.body.tags = JSON.parse(req.body.tags); } catch (e) { req.body.tags = []; }
      }
    }
    if (req.body.dynamicContent) {
      if (typeof req.body.dynamicContent === 'string') {
        try { req.body.dynamicContent = JSON.parse(req.body.dynamicContent); } catch (e) { req.body.dynamicContent = []; }
      }
    }
    if (req.body.contentSections) {
      if (typeof req.body.contentSections === 'string') {
        try { req.body.contentSections = JSON.parse(req.body.contentSections); } catch (e) { req.body.contentSections = []; }
      }
    }
    if (req.body.importantInstructions) {
      if (typeof req.body.importantInstructions === 'string') {
        try { req.body.importantInstructions = JSON.parse(req.body.importantInstructions); } catch (e) { req.body.importantInstructions = []; }
      }
    }
    if (req.body.documentsRequired) {
      if (typeof req.body.documentsRequired === 'string') {
        try { req.body.documentsRequired = JSON.parse(req.body.documentsRequired); } catch (e) { req.body.documentsRequired = []; }
      }
    }

    // Update other fields
    const updateFields = ['type', 'referenceId', 'referenceModel', 'directWebURL', 'linkMenuField',
                          'postTypeDetails', 'alsoShowLink', 'description', 'dynamicContent',
                          'contentSections', 'importantInstructions', 'documentsRequired', 'examName',
                          'publishDate', 'lastDate', 'answerStatus', 'category', 'tags'];

    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        if (field === 'alsoShowLink') {
          answer[field] = req.body[field] === 'true' || req.body[field] === true;
        } else {
          answer[field] = req.body[field];
        }
      }
    });

    await answer.save();

    return res.status(200).json({
      success: true,
      message: 'Answer updated successfully',
      data: answer
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update answer',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
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
        message: 'Invalid answer ID format'
      });
    }

    const answer = await Answer.findById(id);
    if (!answer) {
      return res.status(404).json({
        success: false,
        message: 'Answer not found'
      });
    }

    // Check admin permission
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admin can update answer status'
      });
    }

    // Prepare update data
    const updateData = {
      status: req.body.status,
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
    if (req.body.status === 'rejected' && req.body.rejectionReason) {
      updateData.rejectionReason = req.body.rejectionReason;
    } else if (req.body.status !== 'rejected') {
      updateData.rejectionReason = null;
    }

    // Update answer status
    const updatedAnswer = await Answer.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('referenceId')
      .populate('createdBy', 'name email role')
      .populate('verifiedBy', 'name email role');

    return res.status(200).json({
      success: true,
      message: `Answer status updated to ${req.body.status}`,
      data: updatedAnswer
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to update status',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Delete Answer
const deleteAnswer = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid answer ID format'
      });
    }

    const answer = await Answer.findById(id);
    if (!answer) {
      return res.status(404).json({
        success: false,
        message: 'Answer not found'
      });
    }

    // Check permissions
    if (answer.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this answer'
      });
    }

    // Delete all uploaded files from Cloudinary
    const fileFields = ['officialNotification', 'examDateNotice', 'syllabusFile', 'admitCardFile', 'answerKeyFile', 'resultFile', 'otherFile'];

    for (const fieldName of fileFields) {
      if (answer[fieldName] && answer[fieldName].cloudinaryId) {
        try {
          await deleteFromCloudinary(answer[fieldName].cloudinaryId);
        } catch (error) {
          // Silent fail for file deletion
        }
      }
    }

    await Answer.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: 'Answer deleted successfully'
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to delete answer',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get Answers by Job ID
const getAnswersByJobId = async (req, res) => {
  try {
    const { jobId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid job ID format'
      });
    }

    const answers = await Answer.find({
      referenceId: jobId,
      referenceModel: 'Job',
      status: 'verified',
      answerStatus: 'active'
    })
      .populate('referenceId', 'title departmentName postName')
      .populate('createdBy', 'name email role')
      .sort({ publishDate: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      data: answers
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch answers',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get Public Answers
const getPublicAnswers = async (req, res) => {
  try {
    const {
      type,
      category,
      tags,
      search,
      page = 1,
      limit = 10,
      sortBy = 'publishDate',
      sortOrder = 'desc'
    } = req.query;

    // Build filter for public access
    const filter = {
      status: 'verified',
      answerStatus: 'active'
    };

    if (type) filter.type = type;
    if (category) filter.category = category;

    // Tags filtering
    if (tags) {
      const tagsArray = Array.isArray(tags) ? tags : [tags];
      filter.tags = { $in: tagsArray };
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

    // Fetch public answers
    const [answers, total] = await Promise.all([
      Answer.find(filter)
        .populate('referenceId', 'title departmentName postName')
        .select('-createdByDetails -verifiedByDetails -rejectionReason -__v')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Answer.countDocuments(filter)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    return res.status(200).json({
      success: true,
      data: answers,
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
      message: 'Failed to fetch answers',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

// Get All Answers List with Infinite Scrolling and Date Search
const getAllAnswersList = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      year,
      month,
      date,
      keyword,
      type,
      sortBy = 'publishDate',
      order = 'desc'
    } = req.query;

    const filter = {
      status: 'verified',
      answerStatus: 'active'
    };

    // Type filter
    if (type) filter.type = type;

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
        filter['publishDate'] = dateFilter;
      }
    }

    // Search by keyword
    if (keyword && keyword !== '') {
      filter.$or = [
        { linkMenuField: { $regex: keyword, $options: 'i' } },
        { postTypeDetails: { $regex: keyword, $options: 'i' } },
        { examName: { $regex: keyword, $options: 'i' } },
        { category: { $regex: keyword, $options: 'i' } }
      ];
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOrder = order === 'asc' ? 1 : -1;
    const sortField = sortBy || 'publishDate';

    // Execute query
    const [answers, total] = await Promise.all([
      Answer.find(filter)
        .populate('referenceId')
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Answer.countDocuments(filter)
    ]);

    const hasMore = skip + answers.length < total;

    return res.status(200).json({
      success: true,
      data: answers,
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
      message: 'Failed to fetch answers list',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
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
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch references',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
};

module.exports = {
  createAnswer,
  getAllAnswers,
  getAnswerById,
  updateAnswer,
  deleteAnswer,
  updateStatus,
  getAnswersByJobId,
  getPublicAnswers,
  getAllAnswersList,
  getAvailableReferences
};
