const { Answer, answerStatusEnum } = require('../../models/answer/answerSchema');
const { uploadToCloudinary, deleteFromCloudinary } = require('../../config/cloudinary');
const { cleanupFiles, cleanupFileFields } = require('../../middleware/uploadMiddleware');
const fs = require('fs');

class AnswerController {
  // ========== CREATE ANSWER ==========
  static async createAnswer(req, res) {
    try {
      console.log('Creating answer with data:', JSON.stringify(req.body, null, 2));

      // Create creator snapshot
      const creatorSnapshot = {
        userId: req.user._id,
        firstName: req.user.firstName || req.user.name || '',
        lastName: req.user.lastName || '',
        email: req.user.email,
        phone: req.user.phone || '',
        role: req.user.role
      };

      // Prepare answer data
      const answerData = {
        ...req.body,
        createdBy: creatorSnapshot,
        status: answerStatusEnum.PENDING
      };

      // Handle file uploads if present
      if (req.files) {
        const uploadedFiles = [];

        // Process each file field
        for (const fieldName in req.files) {
          const files = req.files[fieldName];

          for (const file of files) {
            try {
              // Upload to Cloudinary
              const uploadResult = await uploadToCloudinary(file.path, 'answer-keys');

              // Get file type from extension
              const fileType = file.mimetype.split('/')[1] || 'other';

              const fileData = {
                fileName: req.body[`${fieldName}_name`] || file.originalname,
                fileUrl: uploadResult.url,
                cloudinaryId: uploadResult.cloudinaryId,
                fileType: fileType,
                uploadedAt: new Date()
              };

              // Add to specific field if it matches known fields
              if (['officialNotification', 'examDateNotice', 'syllabusFile', 'admitCardFile', 'answerKeyFile', 'resultFile'].includes(fieldName)) {
                answerData[fieldName] = fileData;
              }

              // Also add to uploadedFiles array
              uploadedFiles.push(fileData);

              // Delete temporary file
              fs.unlinkSync(file.path);
            } catch (uploadError) {
              console.error(`Error uploading file ${file.originalname}:`, uploadError);
              // Continue with other files
            }
          }
        }

        if (uploadedFiles.length > 0) {
          answerData.uploadedFiles = uploadedFiles;
        }
      }

      // Create answer
      const answer = new Answer(answerData);
      await answer.save();

      return res.status(201).json({
        success: true,
        message: 'Answer created successfully',
        data: answer
      });

    } catch (error) {
      console.error('Create answer error:', error);

      // Cleanup uploaded files on error
      if (req.files) {
        cleanupFileFields(req.files);
      }

      return res.status(500).json({
        success: false,
        message: 'Failed to create answer',
        error: error.message
      });
    }
  }

  // ========== GET ALL ANSWERS (PUBLIC) ==========
  static async getAllAnswers(req, res) {
    try {
      const {
        status,
        examType,
        category,
        keyword,
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        order = 'desc'
      } = req.query;

      // Build filter
      const filter = {};

      // Apply status filter
      if (status && status !== '') {
        filter.status = status;
      } else if (!req.user || req.user.role !== 'admin') {
        // For non-admin users, show only verified answers
        filter.status = answerStatusEnum.VERIFIED;
        filter.showInPortal = true;
      }

      // Exam type filter
      if (examType && examType !== '') {
        filter.examType = examType;
      }

      // Category filter
      if (category && category !== '') {
        filter.category = category;
      }

      // Keyword search
      if (keyword && keyword !== '') {
        filter.$or = [
          { title: { $regex: keyword, $options: 'i' } },
          { organizationName: { $regex: keyword, $options: 'i' } },
          { postName: { $regex: keyword, $options: 'i' } },
          { examName: { $regex: keyword, $options: 'i' } }
        ];
      }

      // Pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const sortOrder = order === 'asc' ? 1 : -1;
      const sortField = sortBy || 'createdAt';

      // Execute query
      const [answers, total] = await Promise.all([
        Answer.find(filter)
          .sort({ [sortField]: sortOrder })
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        Answer.countDocuments(filter)
      ]);

      return res.status(200).json({
        success: true,
        data: answers,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalAnswers: total,
          limit: parseInt(limit)
        }
      });

    } catch (error) {
      console.error('Get all answers error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch answers',
        error: error.message
      });
    }
  }

  // ========== GET ALL ANSWERS LIST (WITH DATE FILTERS & INFINITE SCROLL) ==========
  static async getAllAnswersList(req, res) {
    try {
      const {
        page = 1,
        limit = 20,
        year,
        month,
        date,
        keyword,
        isLatest,
        examType,
        sortBy = 'createdAt',
        order = 'desc'
      } = req.query;

      const filter = {
        status: answerStatusEnum.VERIFIED,
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
          filter['importantDates.answerKeyDate'] = dateFilter;
        }
      }

      // Search by keyword
      if (keyword && keyword !== '') {
        filter.$or = [
          { title: { $regex: keyword, $options: 'i' } },
          { organizationName: { $regex: keyword, $options: 'i' } },
          { postName: { $regex: keyword, $options: 'i' } },
          { examName: { $regex: keyword, $options: 'i' } }
        ];
      }

      // Filter by latest
      if (isLatest === 'true') {
        filter.isLatest = true;
      }

      // Filter by exam type
      if (examType && examType !== '') {
        filter.examType = examType;
      }

      // Pagination
      const skip = (parseInt(page) - 1) * parseInt(limit);
      const sortOrder = order === 'asc' ? 1 : -1;
      const sortField = sortBy || 'createdAt';

      // Execute query
      const [answers, total] = await Promise.all([
        Answer.find(filter)
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
          totalAnswers: total,
          limit: parseInt(limit),
          hasMore
        }
      });

    } catch (error) {
      console.error('Get all answers list error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch answers list',
        error: error.message
      });
    }
  }

  // ========== GET ANSWER BY ID ==========
  static async getAnswerById(req, res) {
    try {
      const { id } = req.params;

      const answer = await Answer.findById(id).lean();

      if (!answer) {
        return res.status(404).json({
          success: false,
          message: 'Answer not found'
        });
      }

      // Check permissions
      if (answer.status !== answerStatusEnum.VERIFIED && (!req.user || req.user.role !== 'admin')) {
        if (!req.user || answer.createdBy.userId.toString() !== req.user._id.toString()) {
          return res.status(403).json({
            success: false,
            message: 'You do not have permission to view this answer'
          });
        }
      }

      // Increment views (in background, don't wait)
      Answer.findByIdAndUpdate(id, { $inc: { views: 1 } }).exec();

      return res.status(200).json({
        success: true,
        data: answer
      });

    } catch (error) {
      console.error('Get answer by ID error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch answer',
        error: error.message
      });
    }
  }

  // ========== UPDATE ANSWER ==========
  static async updateAnswer(req, res) {
    try {
      const { id } = req.params;

      const answer = await Answer.findById(id);

      if (!answer) {
        return res.status(404).json({
          success: false,
          message: 'Answer not found'
        });
      }

      // Check edit permissions
      if (req.user.role !== 'admin' && answer.createdBy.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to edit this answer'
        });
      }

      console.log('Updating answer with data:', JSON.stringify(req.body, null, 2));

      // Handle file uploads if present
      if (req.files) {
        const uploadedFiles = answer.uploadedFiles || [];

        for (const fieldName in req.files) {
          const files = req.files[fieldName];

          for (const file of files) {
            try {
              // Delete old file from Cloudinary if exists
              if (answer[fieldName] && answer[fieldName].cloudinaryId) {
                await deleteFromCloudinary(answer[fieldName].cloudinaryId);
              }

              // Upload new file to Cloudinary
              const uploadResult = await uploadToCloudinary(file.path, 'answer-keys');

              const fileType = file.mimetype.split('/')[1] || 'other';

              const fileData = {
                fileName: req.body[`${fieldName}_name`] || file.originalname,
                fileUrl: uploadResult.url,
                cloudinaryId: uploadResult.cloudinaryId,
                fileType: fileType,
                uploadedAt: new Date()
              };

              // Update specific field
              if (['officialNotification', 'examDateNotice', 'syllabusFile', 'admitCardFile', 'answerKeyFile', 'resultFile'].includes(fieldName)) {
                answer[fieldName] = fileData;
              }

              // Add to uploadedFiles array
              uploadedFiles.push(fileData);

              // Delete temporary file
              fs.unlinkSync(file.path);
            } catch (uploadError) {
              console.error(`Error uploading file ${file.originalname}:`, uploadError);
            }
          }
        }

        answer.uploadedFiles = uploadedFiles;
      }

      // Update other fields
      Object.keys(req.body).forEach(key => {
        if (key !== 'status' && key !== 'createdBy' && !key.endsWith('_name')) {
          answer[key] = req.body[key];
        }
      });

      await answer.save();

      return res.status(200).json({
        success: true,
        message: 'Answer updated successfully',
        data: answer
      });

    } catch (error) {
      console.error('Update answer error:', error);

      // Cleanup uploaded files on error
      if (req.files) {
        cleanupFileFields(req.files);
      }

      return res.status(500).json({
        success: false,
        message: 'Failed to update answer',
        error: error.message
      });
    }
  }

  // ========== CHANGE ANSWER STATUS (ADMIN ONLY) ==========
  static async changeAnswerStatus(req, res) {
    try {
      const { id } = req.params;
      const { status, remark, rejectionReason } = req.body;

      // Check admin permission
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Only admin can change answer status'
        });
      }

      // Validate status
      if (!Object.values(answerStatusEnum).includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Must be one of: ${Object.values(answerStatusEnum).join(', ')}`
        });
      }

      const answer = await Answer.findById(id);

      if (!answer) {
        return res.status(404).json({
          success: false,
          message: 'Answer not found'
        });
      }

      // Update status
      answer.status = status;
      answer.statusRemark = remark || '';
      answer.statusChangedAt = new Date();

      // Add rejection reason if status is rejected
      if (status === answerStatusEnum.REJECTED) {
        answer.rejectionReason = rejectionReason || '';
      } else {
        answer.rejectionReason = '';
      }

      // Add approver snapshot if verified
      if (status === answerStatusEnum.VERIFIED) {
        answer.approvedBy = {
          userId: req.user._id,
          firstName: req.user.firstName || req.user.name || '',
          lastName: req.user.lastName || '',
          email: req.user.email,
          phone: req.user.phone || '',
          role: req.user.role
        };
      }

      await answer.save();

      return res.status(200).json({
        success: true,
        message: `Answer status updated to ${status}`,
        data: answer
      });

    } catch (error) {
      console.error('Change answer status error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to change answer status',
        error: error.message
      });
    }
  }

  // ========== DELETE ANSWER ==========
  static async deleteAnswer(req, res) {
    try {
      const { id } = req.params;

      const answer = await Answer.findById(id);

      if (!answer) {
        return res.status(404).json({
          success: false,
          message: 'Answer not found'
        });
      }

      // Check delete permissions
      if (req.user.role !== 'admin' && answer.createdBy.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to delete this answer'
        });
      }

      // Delete all uploaded files from Cloudinary
      if (answer.uploadedFiles && answer.uploadedFiles.length > 0) {
        for (const file of answer.uploadedFiles) {
          if (file.cloudinaryId) {
            try {
              await deleteFromCloudinary(file.cloudinaryId);
            } catch (error) {
              console.error(`Error deleting file ${file.cloudinaryId}:`, error);
            }
          }
        }
      }

      await answer.deleteOne();

      return res.status(200).json({
        success: true,
        message: 'Answer deleted successfully'
      });

    } catch (error) {
      console.error('Delete answer error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete answer',
        error: error.message
      });
    }
  }

  // ========== GET MY ANSWERS ==========
  static async getMyAnswers(req, res) {
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

      const [answers, total] = await Promise.all([
        Answer.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        Answer.countDocuments(filter)
      ]);

      return res.status(200).json({
        success: true,
        data: answers,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalAnswers: total,
          limit: parseInt(limit)
        }
      });

    } catch (error) {
      console.error('Get my answers error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch your answers',
        error: error.message
      });
    }
  }

  // ========== GET LATEST ANSWERS ==========
  static async getLatestAnswers(req, res) {
    try {
      const { limit = 10 } = req.query;

      const answers = await Answer.findLatest(parseInt(limit));

      return res.status(200).json({
        success: true,
        data: answers
      });

    } catch (error) {
      console.error('Get latest answers error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch latest answers',
        error: error.message
      });
    }
  }

  // ========== SEARCH ANSWERS ==========
  static async searchAnswers(req, res) {
    try {
      const {
        keyword,
        examType,
        category,
        page = 1,
        limit = 20
      } = req.query;

      const filter = {
        status: answerStatusEnum.VERIFIED,
        showInPortal: true
      };

      // Text search
      if (keyword && keyword !== '') {
        filter.$or = [
          { title: { $regex: keyword, $options: 'i' } },
          { organizationName: { $regex: keyword, $options: 'i' } },
          { postName: { $regex: keyword, $options: 'i' } },
          { examName: { $regex: keyword, $options: 'i' } }
        ];
      }

      // Exam type filter
      if (examType && examType !== '') {
        filter.examType = examType;
      }

      // Category filter
      if (category && category !== '') {
        filter.category = category;
      }

      const skip = (parseInt(page) - 1) * parseInt(limit);

      const [answers, total] = await Promise.all([
        Answer.find(filter)
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(parseInt(limit))
          .lean(),
        Answer.countDocuments(filter)
      ]);

      return res.status(200).json({
        success: true,
        data: answers,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalAnswers: total,
          limit: parseInt(limit)
        }
      });

    } catch (error) {
      console.error('Search answers error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to search answers',
        error: error.message
      });
    }
  }

  // ========== GET ANSWER STATISTICS (ADMIN ONLY) ==========
  static async getAnswerStats(req, res) {
    try {
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Only admin can view statistics'
        });
      }

      // Get basic statistics
      const stats = await Answer.getStatistics();

      // Get exam type-wise counts
      const examTypeStats = await Answer.aggregate([
        {
          $group: {
            _id: '$examType',
            count: { $sum: 1 }
          }
        }
      ]);

      // Get category-wise counts
      const categoryStats = await Answer.aggregate([
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 }
          }
        }
      ]);

      // Recent answers
      const recentAnswers = await Answer.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('title organizationName status createdAt createdBy.firstName createdBy.lastName')
        .lean();

      return res.status(200).json({
        success: true,
        data: {
          ...stats,
          examTypeStats,
          categoryStats,
          recentAnswers
        }
      });

    } catch (error) {
      console.error('Get answer stats error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch statistics',
        error: error.message
      });
    }
  }

  // ========== UPLOAD FILE TO EXISTING ANSWER ==========
  static async uploadFileToAnswer(req, res) {
    try {
      const { id } = req.params;
      const { fileFieldName } = req.body;

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: 'No file uploaded'
        });
      }

      const answer = await Answer.findById(id);

      if (!answer) {
        cleanupFiles(req.file);
        return res.status(404).json({
          success: false,
          message: 'Answer not found'
        });
      }

      // Check permissions
      if (req.user.role !== 'admin' && answer.createdBy.userId.toString() !== req.user._id.toString()) {
        cleanupFiles(req.file);
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to upload files to this answer'
        });
      }

      try {
        // Upload to Cloudinary
        const uploadResult = await uploadToCloudinary(req.file.path, 'answer-keys');

        const fileType = req.file.mimetype.split('/')[1] || 'other';

        const fileData = {
          fileName: req.body.fileName || req.file.originalname,
          fileUrl: uploadResult.url,
          cloudinaryId: uploadResult.cloudinaryId,
          fileType: fileType,
          uploadedAt: new Date()
        };

        // If specific field name provided, update that field
        if (fileFieldName && ['officialNotification', 'examDateNotice', 'syllabusFile', 'admitCardFile', 'answerKeyFile', 'resultFile'].includes(fileFieldName)) {
          // Delete old file if exists
          if (answer[fileFieldName] && answer[fileFieldName].cloudinaryId) {
            await deleteFromCloudinary(answer[fileFieldName].cloudinaryId);
          }
          answer[fileFieldName] = fileData;
        }

        // Add to uploadedFiles array
        if (!answer.uploadedFiles) {
          answer.uploadedFiles = [];
        }
        answer.uploadedFiles.push(fileData);

        await answer.save();

        // Delete temporary file
        fs.unlinkSync(req.file.path);

        return res.status(200).json({
          success: true,
          message: 'File uploaded successfully',
          data: {
            file: fileData,
            answer: answer
          }
        });

      } catch (uploadError) {
        cleanupFiles(req.file);
        throw uploadError;
      }

    } catch (error) {
      console.error('Upload file to answer error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to upload file',
        error: error.message
      });
    }
  }

  // ========== DELETE FILE FROM ANSWER ==========
  static async deleteFileFromAnswer(req, res) {
    try {
      const { id, fileId } = req.params;

      const answer = await Answer.findById(id);

      if (!answer) {
        return res.status(404).json({
          success: false,
          message: 'Answer not found'
        });
      }

      // Check permissions
      if (req.user.role !== 'admin' && answer.createdBy.userId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to delete files from this answer'
        });
      }

      // Find file in uploadedFiles array
      const fileIndex = answer.uploadedFiles.findIndex(
        file => file._id && file._id.toString() === fileId
      );

      if (fileIndex === -1) {
        return res.status(404).json({
          success: false,
          message: 'File not found'
        });
      }

      const file = answer.uploadedFiles[fileIndex];

      // Delete from Cloudinary
      if (file.cloudinaryId) {
        await deleteFromCloudinary(file.cloudinaryId);
      }

      // Remove from array
      answer.uploadedFiles.splice(fileIndex, 1);

      await answer.save();

      return res.status(200).json({
        success: true,
        message: 'File deleted successfully'
      });

    } catch (error) {
      console.error('Delete file from answer error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to delete file',
        error: error.message
      });
    }
  }

  // ========== UPLOAD MULTIPLE FILES (STANDALONE) ==========
  static async uploadMultipleFiles(req, res) {
    try {
      if (!req.files || Object.keys(req.files).length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No files uploaded'
        });
      }

      const uploadedFiles = [];
      const errors = [];

      // Process all uploaded files
      for (const fieldName in req.files) {
        const files = req.files[fieldName];

        for (const file of files) {
          try {
            // Upload to Cloudinary
            const uploadResult = await uploadToCloudinary(file.path, 'answer-keys');

            const fileType = file.mimetype.split('/')[1] || 'other';

            const fileData = {
              fileName: file.originalname,
              url: uploadResult.url,
              cloudinaryId: uploadResult.cloudinaryId,
              fileType: fileType,
              uploadedAt: new Date()
            };

            uploadedFiles.push(fileData);

            // Delete temporary file
            fs.unlinkSync(file.path);
          } catch (uploadError) {
            console.error(`Error uploading file ${file.originalname}:`, uploadError);
            errors.push({
              fileName: file.originalname,
              error: uploadError.message
            });

            // Cleanup failed file
            try {
              if (fs.existsSync(file.path)) {
                fs.unlinkSync(file.path);
              }
            } catch (cleanupError) {
              console.error('Cleanup error:', cleanupError);
            }
          }
        }
      }

      if (uploadedFiles.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'All file uploads failed',
          errors
        });
      }

      return res.status(200).json({
        success: true,
        message: `${uploadedFiles.length} file(s) uploaded successfully`,
        files: uploadedFiles,
        errors: errors.length > 0 ? errors : undefined
      });

    } catch (error) {
      console.error('Upload multiple files error:', error);

      // Cleanup all files on error
      if (req.files) {
        cleanupFileFields(req.files);
      }

      return res.status(500).json({
        success: false,
        message: 'Failed to upload files',
        error: error.message
      });
    }
  }
}

module.exports = AnswerController;
