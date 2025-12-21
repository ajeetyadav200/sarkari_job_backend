


// controller/jobcontroller/jobController.js
const { Job, jobStatusEnum } = require('../../models/job/letestJob');
const JobValidator = require('../../utils/jobValidation');

class JobController {
  // Create Job
  static async createJob(req, res) {
    try {
      console.log('Incoming job data:', JSON.stringify(req.body, null, 2));

      const { isValid, data, errors } = JobValidator.validateJobData(req.body);

      if (!isValid) {
        console.log('Validation errors:', errors);
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors
        });
      }

      // Create creator snapshot
      const creatorSnapshot = {
        userId: req.user._id,
        firstName: req.user.firstName || req.user.name || '',
        lastName: req.user.lastName || '',
        email: req.user.email,
        phone: req.user.phone || '',
        role: req.user.role
      };

      // Prepare job data with dynamic content support
      const jobData = {
        // Basic required fields
        departmentName: data.departmentName,
        postName: data.postName,
        modeOfForm: data.modeOfForm,
        typeOfForm: data.typeOfForm,
        paymentMode: data.paymentMode,
        totalPost: data.totalPost,
        eligibilityEducational1: data.eligibilityEducational1,

        // Optional basic fields
        eligibilityEducational2: data.eligibilityEducational2 || '',
        helpEmailId: data.helpEmailId || '',
        helpCareNo: data.helpCareNo || '',
        officialWebsite: data.officialWebsite || '',
        showInPortal: data.showInPortal !== undefined ? data.showInPortal : true,

        // Category data
        categoryPosts: data.categoryPosts || {},
        categoryFees: data.categoryFees || {},

        // Important dates
        importantDates: data.importantDates || {},

        // Other details
        otherDetails: data.otherDetails || {},

        // ========== DYNAMIC CONTENT FIELDS ==========
        description: data.description || '',
        dynamicContent: data.dynamicContent || [],
        contentSections: data.contentSections || [],
        selectionProcess: data.selectionProcess || [],
        documentsRequired: data.documentsRequired || [],
        importantInstructions: data.importantInstructions || [],

        // Status
        createdBy: creatorSnapshot,
        status: jobStatusEnum.PENDING
      };

      console.log('Creating job with dynamic content:', {
        hasDynamicContent: jobData.dynamicContent.length > 0,
        hasContentSections: jobData.contentSections.length > 0,
        hasSelectionProcess: jobData.selectionProcess.length > 0
      });

      const job = new Job(jobData);
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
      
      console.log('Query params:', req.query);
      
      // Build filter
      const filter = {};
      
      // Apply status filter
      if (status && status !== '') {
        filter.status = status;
      } else if (!req.user || req.user.role !== 'admin') {
        // For non-admin users, show only verified jobs
        filter.status = jobStatusEnum.VERIFIED;
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
      if (typeOfForm && typeOfForm !== '') {
        filter.typeOfForm = typeOfForm;
      }
      
      if (modeOfForm && modeOfForm !== '') {
        filter.modeOfForm = modeOfForm;
      }
      
      if (paymentMode && paymentMode !== '') {
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
      const sortField = sortBy || 'createdAt';
      
      console.log('Filter:', filter);
      console.log('Skip:', skip, 'Limit:', limit);
      
      // Execute query
      const [jobs, total] = await Promise.all([
        Job.find(filter)
          .sort({ [sortField]: sortOrder })
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
      
      const response = {
        success: true,
        data: jobs,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalJobs: total,
          limit: parseInt(limit)
        }
      };
      
      console.log('Response count:', jobs.length, 'Total:', total);
      
      return res.status(200).json(response);
      
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
      if (req.user.role !== 'admin' && job.createdBy.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to edit this job'
        });
      }
      
      console.log('Updating job with data:', JSON.stringify(req.body, null, 2));

      // Validate update data
      const { isValid, data, errors } = JobValidator.validateJobData(req.body);

      if (!isValid) {
        console.log('Validation errors:', errors);
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors
        });
      }

      // Update job fields including dynamic content
      Object.keys(data).forEach(key => {
        if (key !== 'status') { // Prevent status update via regular update
          job[key] = data[key];
        }
      });

      console.log('Job updated with dynamic content:', {
        hasDynamicContent: job.dynamicContent?.length > 0,
        hasContentSections: job.contentSections?.length > 0
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
      
      if (status && status !== '') {
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
      
      // Get status-wise counts
      const statusWise = await Job.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);
      
      // Get total jobs count
      const totalJobs = await Job.countDocuments();
      
      // Get department-wise counts
      const departmentWise = await Job.aggregate([
        {
          $group: {
            _id: '$departmentName',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ]);
      
      // Recent jobs
      const recentJobs = await Job.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('departmentName postName status createdAt createdBy.name')
        .lean();
      
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
      
      const stats = {
        totalJobs,
        statusWise,
        departmentWise,
        recentJobs,
        typeStats,
        modeStats
      };
      
      return res.status(200).json({
        success: true,
        data: stats
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
      if (keyword && keyword !== '') {
        filter.$or = [
          { departmentName: { $regex: keyword, $options: 'i' } },
          { postName: { $regex: keyword, $options: 'i' } },
          { eligibilityEducational1: { $regex: keyword, $options: 'i' } }
        ];
      }
      
      // Specific filters
      if (department && department !== '') {
        filter.departmentName = { $regex: department, $options: 'i' };
      }
      
      if (type && type !== '') {
        filter.typeOfForm = type;
      }
      
      if (mode && mode !== '') {
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