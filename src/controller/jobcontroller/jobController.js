const { Job, jobStatusEnum } = require('../../models/job/letestJob');
const JobValidator = require('../../utils/jobValidation');

class JobController {
  // Create Job
  static async createJob(req, res) {
    try {
      const { isValid, data, errors } = JobValidator.validateJobData(req.body);
      
      if (!isValid) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors
        });
      }
      
      // Create creator snapshot
      const creatorSnapshot = {
        userId: req.user._id,
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone || '',
        role: req.user.role
      };
      
      const job = new Job({
        ...data,
        createdBy: creatorSnapshot,
        status: jobStatusEnum.PENDING
      });
      
      await job.save();
      
      return res.status(201).json({
        success: true,
        message: 'Job created successfully',
        data: job
      });
      
    } catch (error) {
      console.error('Create job error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to create job',
        error: error.message
      });
    }
  }

  // Get All Jobs
  static async getAllJobs(req, res) {
    try {
      const {
        status,
        departmentName,
        postName,
        typeOfForm,
        modeOfForm,
        paymentMode,
        page = 1,
        limit = 10,
        sortBy = 'createdAt',
        order = 'desc',
        registrationOpen
      } = req.query;
      
      // Build filter
      const filter = {};
      
      // Apply status filter
      if (status) {
        filter.status = status;
      } else if (req.user.role !== 'admin') {
        // For non-admin users, show only verified jobs
        filter.status = jobStatusEnum.VERIFIED;
        filter.showInPortal = true;
      }
      
      // Text search filters
      if (departmentName) {
        filter.departmentName = { $regex: departmentName, $options: 'i' };
      }
      
      if (postName) {
        filter.postName = { $regex: postName, $options: 'i' };
      }
      
      // Enum filters
      if (typeOfForm) {
        filter.typeOfForm = typeOfForm;
      }
      
      if (modeOfForm) {
        filter.modeOfForm = modeOfForm;
      }
      
      if (paymentMode) {
        filter.paymentMode = paymentMode;
      }
      
      // Registration open filter
      if (registrationOpen === 'true') {
        const now = new Date();
        filter['importantDates.startDate'] = { $lte: now };
        filter['importantDates.registrationLastDate'] = { $gte: now };
      }
      
      // Pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const sortOrder = order === 'asc' ? 1 : -1;
      
      // Execute query
      const [jobs, total] = await Promise.all([
        Job.find(filter)
          .sort({ [sortBy]: sortOrder })
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        Job.countDocuments(filter)
      ]);
      
      // Add virtuals
      jobs.forEach(job => {
        job.isRegistrationOpen = new Date(job.importantDates.startDate) <= new Date() && 
                                new Date() <= new Date(job.importantDates.registrationLastDate);
        job.remainingDays = job.importantDates.registrationLastDate ? 
          Math.ceil((new Date(job.importantDates.registrationLastDate) - new Date()) / (1000 * 60 * 60 * 24)) : 
          null;
      });
      
      return res.status(200).json({
        success: true,
        data: jobs,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalJobs: total,
          limit: parseInt(limit)
        }
      });
      
    } catch (error) {
      console.error('Get all jobs error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch jobs',
        error: error.message
      });
    }
  }

  // Get Job by ID
  static async getJobById(req, res) {
    try {
      const { id } = req.params;
      
      const job = await Job.findById(id).lean();
      
      if (!job) {
        return res.status(404).json({
          success: false,
          message: 'Job not found'
        });
      }
      
      // Check permissions
      if (job.status !== jobStatusEnum.VERIFIED && req.user.role !== 'admin') {
        if (!req.user || job.createdBy.userId.toString() !== req.user._id.toString()) {
          return res.status(403).json({
            success: false,
            message: 'You do not have permission to view this job'
          });
        }
      }
      
      // Add virtuals
      job.isRegistrationOpen = new Date(job.importantDates.startDate) <= new Date() && 
                              new Date() <= new Date(job.importantDates.registrationLastDate);
      job.remainingDays = job.importantDates.registrationLastDate ? 
        Math.ceil((new Date(job.importantDates.registrationLastDate) - new Date()) / (1000 * 60 * 60 * 24)) : 
        null;
      
      return res.status(200).json({
        success: true,
        data: job
      });
      
    } catch (error) {
      console.error('Get job by ID error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch job',
        error: error.message
      });
    }
  }

  // Update Job
  static async updateJob(req, res) {
    try {
      const { id } = req.params;
      
      const job = await Job.findById(id);
      
      if (!job) {
        return res.status(404).json({
          success: false,
          message: 'Job not found'
        });
      }
      
      // Check edit permissions
      if (!job.canEdit(req.user._id, req.user.role)) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to edit this job'
        });
      }
      
      // Validate update data
      const { isValid, data, errors } = JobValidator.validateJobData(req.body);
      
      if (!isValid) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors
        });
      }
      
      // Update job fields
      Object.keys(data).forEach(key => {
        if (key !== 'status') { // Prevent status update via regular update
          job[key] = data[key];
        }
      });
      
      await job.save();
      
      return res.status(200).json({
        success: true,
        message: 'Job updated successfully',
        data: job
      });
      
    } catch (error) {
      console.error('Update job error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to update job',
        error: error.message
      });
    }
  }

  // Change Job Status (Admin only)
  static async changeJobStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, remark } = req.body;
      
      // Check admin permission
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Only admin can change job status'
        });
      }
      
      // Validate status
      if (!Object.values(jobStatusEnum).includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Must be one of: ${Object.values(jobStatusEnum).join(', ')}`
        });
      }
      
      const job = await Job.findById(id);
      
      if (!job) {
        return res.status(404).json({
          success: false,
          message: 'Job not found'
        });
      }
      
      // Update status
      job.status = status;
      job.statusRemark = remark || '';
      job.statusChangedAt = new Date();
      
      // Add approver snapshot if verified
      if (status === jobStatusEnum.VERIFIED) {
        job.approvedBy = {
          userId: req.user._id,
          name: req.user.name,
          email: req.user.email,
          phone: req.user.phone || '',
          role: req.user.role
        };
      }
      
      await job.save();
      
      return res.status(200).json({
        success: true,
        message: `Job status updated to ${status}`,
        data: job
      });
      
    } catch (error) {
      console.error('Change job status error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to change job status',
        error: error.message
      });
    }
  }

  // Delete Job
  static async deleteJob(req, res) {
    try {
      const { id } = req.params;
      
      const job = await Job.findById(id);
      
      if (!job) {
        return res.status(404).json({
          success: false,
          message: 'Job not found'
        });
      }
      
      // Check delete permissions
      if (req.user.role !== 'admin' && job.createdBy.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to delete this job'
        });
      }
      
      await job.deleteOne();
      
      return res.status(200).json({
        success: true,
        message: 'Job deleted successfully'
      });
      
    } catch (error) {
      console.error('Delete job error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete job',
        error: error.message
      });
    }
  }

  // Get My Jobs
  static async getMyJobs(req, res) {
    try {
      const { 
        status, 
        page = 1, 
        limit = 10 
      } = req.query;
      
      const filter = {
        'createdBy.userId': req.user._id
      };
      
      if (status) {
        filter.status = status;
      }
      
      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      const [jobs, total] = await Promise.all([
        Job.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        Job.countDocuments(filter)
      ]);
      
      // Add virtuals
      jobs.forEach(job => {
        job.isRegistrationOpen = new Date(job.importantDates.startDate) <= new Date() && 
                                new Date() <= new Date(job.importantDates.registrationLastDate);
        job.remainingDays = job.importantDates.registrationLastDate ? 
          Math.ceil((new Date(job.importantDates.registrationLastDate) - new Date()) / (1000 * 60 * 60 * 24)) : 
          null;
      });
      
      return res.status(200).json({
        success: true,
        data: jobs,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalJobs: total,
          limit: parseInt(limit)
        }
      });
      
    } catch (error) {
      console.error('Get my jobs error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch your jobs',
        error: error.message
      });
    }
  }

  // Get Job Statistics (Admin only)
  static async getJobStats(req, res) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Only admin can view statistics'
        });
      }
      
      const stats = await Job.getStatistics();
      
      // Additional statistics
      const recentJobs = await Job.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('departmentName postName status createdAt');
      
      // Count by type of form
      const typeStats = await Job.aggregate([
        {
          $group: {
            _id: '$typeOfForm',
            count: { $sum: 1 }
          }
        }
      ]);
      
      // Count by mode of form
      const modeStats = await Job.aggregate([
        {
          $group: {
            _id: '$modeOfForm',
            count: { $sum: 1 }
          }
        }
      ]);
      
      return res.status(200).json({
        success: true,
        data: {
          ...stats,
          recentJobs,
          typeStats,
          modeStats
        }
      });
      
    } catch (error) {
      console.error('Get job stats error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch statistics',
        error: error.message
      });
    }
  }

  // Get Open Registration Jobs
  static async getOpenJobs(req, res) {
    try {
      const now = new Date();
      
      const jobs = await Job.find({
        status: jobStatusEnum.VERIFIED,
        showInPortal: true,
        'importantDates.startDate': { $lte: now },
        'importantDates.registrationLastDate': { $gte: now }
      })
      .sort({ 'importantDates.registrationLastDate': 1 })
      .limit(50)
      .lean();
      
      // Add virtuals
      jobs.forEach(job => {
        job.isRegistrationOpen = true;
        job.remainingDays = Math.ceil((new Date(job.importantDates.registrationLastDate) - now) / (1000 * 60 * 60 * 24));
      });
      
      return res.status(200).json({
        success: true,
        data: jobs
      });
      
    } catch (error) {
      console.error('Get open jobs error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch open jobs',
        error: error.message
      });
    }
  }

  // Search Jobs (Public endpoint)
  static async searchJobs(req, res) {
    try {
      const { 
        keyword, 
        department, 
        type, 
        mode,
        page = 1, 
        limit = 10 
      } = req.query;
      
      const filter = {
        status: jobStatusEnum.VERIFIED,
        showInPortal: true
      };
      
      // Text search
      if (keyword) {
        filter.$or = [
          { departmentName: { $regex: keyword, $options: 'i' } },
          { postName: { $regex: keyword, $options: 'i' } },
          { eligibilityEducational1: { $regex: keyword, $options: 'i' } }
        ];
      }
      
      // Specific filters
      if (department) {
        filter.departmentName = { $regex: department, $options: 'i' };
      }
      
      if (type) {
        filter.typeOfForm = type;
      }
      
      if (mode) {
        filter.modeOfForm = mode;
      }
      
      const skip = (parseInt(page) - 1) * parseInt(limit);
      
      const [jobs, total] = await Promise.all([
        Job.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        Job.countDocuments(filter)
      ]);
      
      // Add virtuals
      jobs.forEach(job => {
        job.isRegistrationOpen = new Date(job.importantDates.startDate) <= new Date() && 
                                new Date() <= new Date(job.importantDates.registrationLastDate);
        job.remainingDays = job.importantDates.registrationLastDate ? 
          Math.ceil((new Date(job.importantDates.registrationLastDate) - new Date()) / (1000 * 60 * 60 * 24)) : 
          null;
      });
      
      return res.status(200).json({
        success: true,
        data: jobs,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalJobs: total,
          limit: parseInt(limit)
        }
      });
      
    } catch (error) {
      console.error('Search jobs error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to search jobs',
        error: error.message
      });
    }
  }
}

module.exports = JobController;