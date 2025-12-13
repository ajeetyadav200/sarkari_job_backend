// controller/admitCardController/admitCard.js
const AdmitCard = require('../../models/admitCard/admitCard');
const Job = require('../../models/job/letestJob'); 
// const Admission = require('../../models/Admission'); // Assuming you have Admission model
// const LatestNotice = require('../../models/LatestNotice'); // Assuming you have LatestNotice model
const {
  createAdmitCardValidation,
  updateAdmitCardValidation,
  updateStatusValidation,
  admitCardFilterValidation
} = require('../../utils/admitCardValidation');
const mongoose = require('mongoose');

// Create Admit Card
const createAdmitCard = async (req, res) => {
  try {
    // Validate request body
    const { error, value } = createAdmitCardValidation.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => detail.message)
      });
    }

    // Check if reference exists if referenceId is provided
    if (value.referenceId && value.referenceModel) {
      let referenceExists;
      switch (value.referenceModel) {
        case 'Job':
          referenceExists = await Job.findById(value.referenceId);
          break;
        case 'Admission':
          referenceExists = await Admission.findById(value.referenceId);
          break;
        case 'LatestNotice':
          referenceExists = await LatestNotice.findById(value.referenceId);
          break;
        default:
          // Handle other models as needed
          break;
      }

      if (!referenceExists) {
        return res.status(404).json({
          success: false,
          message: `Referenced ${value.referenceModel} not found`
        });
      }
    }

    // Add createdBy from authenticated user
    const createdByDetails = {
      name: req.user.name,
      email: req.user.email,
      phone: req.user.phone || '',
      role: req.user.role,
      userId: req.user._id
    };

    // Create admit card
    const admitCard = new AdmitCard({
      ...value,
      createdBy: req.user._id,
      createdByDetails: createdByDetails,
      // Only admin can set status to verified initially
      status: req.user.role === 'admin' ? value.status || 'pending' : 'pending'
    });

    await admitCard.save();

    res.status(201).json({
      success: true,
      message: 'Admit card created successfully',
      data: admitCard
    });
  } catch (error) {
    console.error('Create admit card error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating admit card',
      error: error.message
    });
  }
};

// Get All Admit Cards with Filters (for admin/assistant/publisher)
const getAllAdmitCards = async (req, res) => {
  try {
    // Validate query params
    const { error, value } = admitCardFilterValidation.validate(req.query);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
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
      page,
      limit,
      sortBy,
      sortOrder
    } = value;

    // Build filter
    const filter = {};

    // Role-based filtering
    if (req.user.role === 'publisher' || req.user.role === 'assistant') {
      filter.createdBy = req.user._id;
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

    // Fetch admit cards with population
    const [admitCards, total] = await Promise.all([
      AdmitCard.find(filter)
        .populate('referenceId')
        .populate('createdBy', 'name email role')
        .populate('verifiedBy', 'name email role')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      AdmitCard.countDocuments(filter)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    res.json({
      success: true,
      data: admitCards,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage,
        hasPreviousPage
      }
    });
  } catch (error) {
    console.error('Get all admit cards error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching admit cards',
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
        message: 'Invalid admit card ID'
      });
    }

    const admitCard = await AdmitCard.findById(id)
      .populate('referenceId')
      .populate('createdBy', 'name email role')
      .populate('verifiedBy', 'name email role');

    if (!admitCard) {
      return res.status(404).json({
        success: false,
        message: 'Admit card not found'
      });
    }

    // Check permissions (creator or admin can view all, others only verified)
    if (req.user.role !== 'admin' && admitCard.createdBy.toString() !== req.user._id.toString()) {
      if (admitCard.status !== 'verified') {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to view this admit card'
        });
      }
    }

    res.json({
      success: true,
      data: admitCard
    });
  } catch (error) {
    console.error('Get admit card by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching admit card',
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
        message: 'Invalid admit card ID'
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

    // Check permissions (only creator or admin can update)
    if (admitCard.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this admit card'
      });
    }

    // Validate update data
    const { error, value } = updateAdmitCardValidation.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => detail.message)
      });
    }

    // Non-admin cannot update status (except maybe to 'pending' if they're retracting changes)
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
          break;
        case 'Admission':
          referenceExists = await Admission.findById(value.referenceId);
          break;
        case 'LatestNotice':
          referenceExists = await LatestNotice.findById(value.referenceId);
          break;
        default:
          // Handle other models as needed
          break;
      }

      if (!referenceExists) {
        return res.status(404).json({
          success: false,
          message: `Referenced ${value.referenceModel} not found`
        });
      }
    }

    // Update admit card
    const updatedAdmitCard = await AdmitCard.findByIdAndUpdate(
      id,
      { ...value, $inc: { __v: 1 } },
      { new: true, runValidators: true }
    )
      .populate('referenceId')
      .populate('createdBy', 'name email role')
      .populate('verifiedBy', 'name email role');

    res.json({
      success: true,
      message: 'Admit card updated successfully',
      data: updatedAdmitCard
    });
  } catch (error) {
    console.error('Update admit card error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating admit card',
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
        message: 'Invalid admit card ID'
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

    // Validate status update data
    const { error, value } = updateStatusValidation.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
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

    res.json({
      success: true,
      message: `Admit card status updated to ${value.status}`,
      data: updatedAdmitCard
    });
  } catch (error) {
    console.error('Update status error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating status',
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
        message: 'Invalid admit card ID'
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

    // Check permissions (only creator or admin can delete)
    if (admitCard.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this admit card'
      });
    }

    // Delete admit card
    await AdmitCard.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Admit card deleted successfully'
    });
  } catch (error) {
    console.error('Delete admit card error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting admit card',
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
        message: 'Invalid job ID'
      });
    }

    const admitCards = await AdmitCard.find({
      referenceId: jobId,
      referenceModel: 'Job',
      status: 'verified',
      admitCardStatus: 'active'
    })
      .populate('referenceId')
      .populate('createdBy', 'name email role')
      .sort({ publishDate: -1 });

    res.json({
      success: true,
      data: admitCards
    });
  } catch (error) {
    console.error('Get admit cards by job ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching admit cards',
      error: error.message
    });
  }
};

// Get Public Admit Cards (verified and active only)
const getPublicAdmitCards = async (req, res) => {
  try {
    const { error, value } = admitCardFilterValidation.validate(req.query);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => detail.message)
      });
    }

    const {
      type,
      category,
      tags,
      search,
      page,
      limit,
      sortBy,
      sortOrder
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
        .populate('referenceId', 'title description') // Only populate needed fields
        .select('-createdByDetails -verifiedByDetails -rejectionReason -__v')
        .sort(sort)
        .skip(skip)
        .limit(limit),
      AdmitCard.countDocuments(filter)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    res.json({
      success: true,
      data: admitCards,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage,
        hasPreviousPage
      }
    });
  } catch (error) {
    console.error('Get public admit cards error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching admit cards',
      error: error.message
    });
  }
};

// Get Available References for Admit Card (Jobs, Admissions, etc.)
const getAvailableReferences = async (req, res) => {
  try {
    const { type, search } = req.query;

    let references = [];

    switch (type) {
      case 'job':
        const jobFilter = {};
        if (search) {
          jobFilter.title = { $regex: search, $options: 'i' };
        }
        references = await Job.find(jobFilter)
          .select('_id title description publishDate lastDate')
          .sort({ publishDate: -1 })
          .limit(50);
        break;

      case 'admission':
        const admissionFilter = {};
        if (search) {
          admissionFilter.title = { $regex: search, $options: 'i' };
        }
        references = await Admission.find(admissionFilter)
          .select('_id title description publishDate lastDate')
          .sort({ publishDate: -1 })
          .limit(50);
        break;

      case 'latestNotice':
        const noticeFilter = {};
        if (search) {
          noticeFilter.title = { $regex: search, $options: 'i' };
        }
        references = await LatestNotice.find(noticeFilter)
          .select('_id title description publishDate')
          .sort({ publishDate: -1 })
          .limit(50);
        break;

      default:
        // Return all types
        const [jobs, admissions, notices] = await Promise.all([
          Job.find({})
            .select('_id title type publishDate')
            .sort({ publishDate: -1 })
            .limit(20),
          Admission.find({})
            .select('_id title type publishDate')
            .sort({ publishDate: -1 })
            .limit(20),
          LatestNotice.find({})
            .select('_id title type publishDate')
            .sort({ publishDate: -1 })
            .limit(20)
        ]);

        references = {
          jobs: jobs.map(job => ({ ...job.toObject(), referenceModel: 'Job' })),
          admissions: admissions.map(adm => ({ ...adm.toObject(), referenceModel: 'Admission' })),
          notices: notices.map(notice => ({ ...notice.toObject(), referenceModel: 'LatestNotice' }))
        };
        break;
    }

    res.json({
      success: true,
      data: references
    });
  } catch (error) {
    console.error('Get available references error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching references',
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