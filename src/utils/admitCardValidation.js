// validation/admitCardValidation.js
const Joi = require('joi');

const createAdmitCardValidation = Joi.object({
  type: Joi.string().valid('job', 'admission', 'latestNotice', 'other').required().messages({
    'any.only': 'Type must be one of: job, admission, latestNotice, other',
    'string.empty': 'Type is required'
  }),
  referenceId: Joi.string().hex().length(24).optional(),
  referenceModel: Joi.string().valid('Job', 'Admission', 'LatestNotice', 'OtherModel').when('referenceId', {
    is: Joi.exist(),
    then: Joi.required(),
    otherwise: Joi.optional()
  }),
  directWebURL: Joi.string().uri().allow('').trim(),
  linkMenuField: Joi.string().trim(),
  postTypeDetails: Joi.string().trim(),
  alsoShowLink: Joi.boolean().default(false),
  postDetails: Joi.string().required().min(20).messages({
    'string.empty': 'Post details are required',
    'string.min': 'Post details must be at least 20 characters'
  }),
  lastDate: Joi.date(),
  status: Joi.string().valid('pending', 'verified', 'rejected', 'onHold').default('pending'),
  admitCardStatus: Joi.string().valid('active', 'inactive').default('active'),
  tags: Joi.array().items(Joi.string().trim()),
  category: Joi.string().trim(),
  createdByDetails: Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    phone: Joi.string().allow(''),
    role: Joi.string().required(),
    userId: Joi.string().hex().length(24).required()
  }).optional()
});

const updateAdmitCardValidation = Joi.object({
  type: Joi.string().valid('job', 'admission', 'latestNotice', 'other'),
  referenceId: Joi.string().hex().length(24),
  referenceModel: Joi.string().valid('Job', 'Admission', 'LatestNotice', 'OtherModel'),
  directWebURL: Joi.string().uri().allow('').trim(),
  linkMenuField: Joi.string().trim(),
  postTypeDetails: Joi.string().trim(),
  alsoShowLink: Joi.boolean(),
  postDetails: Joi.string().min(20),
  lastDate: Joi.date(),
  status: Joi.string().valid('pending', 'verified', 'rejected', 'onHold'),
  admitCardStatus: Joi.string().valid('active', 'inactive'),
  tags: Joi.array().items(Joi.string().trim()),
  category: Joi.string().trim()
});

const updateStatusValidation = Joi.object({
  status: Joi.string().valid('pending', 'verified', 'rejected', 'onHold').required(),
  rejectionReason: Joi.string().allow('').trim().max(500).when('status', {
    is: 'rejected',
    then: Joi.string().required().messages({
      'string.empty': 'Rejection reason is required when rejecting'
    })
  }),
  verifiedByDetails: Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    phone: Joi.string().allow(''),
    role: Joi.string().required(),
    userId: Joi.string().hex().length(24).required()
  }).optional()
});

const admitCardFilterValidation = Joi.object({
  type: Joi.string().valid('job', 'admission', 'latestNotice', 'other'),
  status: Joi.string().valid('pending', 'verified', 'rejected', 'onHold'),
  admitCardStatus: Joi.string().valid('active', 'inactive'),
  category: Joi.string(),
  tags: Joi.array().items(Joi.string()),
  createdBy: Joi.string().hex().length(24),
  startDate: Joi.date(),
  endDate: Joi.date(),
  search: Joi.string(),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sortBy: Joi.string().valid('publishDate', 'lastDate', 'createdAt', 'updatedAt').default('publishDate'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc')
});

module.exports = {
  createAdmitCardValidation,
  updateAdmitCardValidation,
  updateStatusValidation,
  admitCardFilterValidation
};