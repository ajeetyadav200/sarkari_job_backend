const Joi = require('joi');

const createResultValidation = Joi.object({
  type: Joi.string().valid('Job', 'Admission', 'LatestNotice', 'Other').required()
    .messages({
      'any.only': 'Type must be one of: Job, Admission, LatestNotice, Other',
      'any.required': 'Type is required',
      'string.empty': 'Type cannot be empty'
    }),
  referenceId: Joi.string().hex().length(24).optional().allow('', null)
    .messages({
      'string.hex': 'Reference ID must be a valid hex string',
      'string.length': 'Reference ID must be 24 characters'
    }),
  referenceModel: Joi.string().valid('Job', 'Admission', 'LatestNotice', 'OtherModel')
    .when('referenceId', {
      is: Joi.string().hex().length(24),
      then: Joi.required(),
      otherwise: Joi.optional().allow('', null)
    })
    .messages({
      'any.only': 'Reference model must be one of: Job, Admission, LatestNotice, OtherModel'
    }),
  directWebURL: Joi.string().trim().allow('', null).optional()
    .messages({
      'string.base': 'Direct web URL must be a string'
    }),
  linkMenuField: Joi.string().trim().optional().allow('', null)
    .messages({
      'string.base': 'Link menu field must be a string'
    }),
  postTypeDetails: Joi.string().trim().optional().allow('', null)
    .messages({
      'string.base': 'Post type details must be a string'
    }),
  alsoShowLink: Joi.boolean().default(false)
    .messages({
      'boolean.base': 'Also show link must be a boolean'
    }),

  publishDate: Joi.date().optional().allow(null)
    .messages({
      'date.base': 'Publish date must be a valid date'
    }),
  resultDate: Joi.date().optional().allow(null)
    .messages({
      'date.base': 'Result date must be a valid date'
    }),
  category: Joi.string().trim().max(100).optional().allow('', null)
    .messages({
      'string.max': 'Category cannot exceed 100 characters'
    }),
  status: Joi.string().valid('pending', 'verified', 'rejected', 'onHold').optional().default('pending')
    .messages({
      'any.only': 'Status must be one of: pending, verified, rejected, onHold'
    }),
  resultStatus: Joi.string().valid('active', 'inactive').optional().default('active')
    .messages({
      'any.only': 'Result status must be either active or inactive'
    }),
  createdByDetails: Joi.object({
    name: Joi.string().required(),
    email: Joi.string().email().required(),
    phone: Joi.string().allow(''),
    role: Joi.string().required(),
    userId: Joi.string().hex().length(24).required()
  }).optional()
    .messages({
      'object.base': 'Created by details must be an object'
    }),
  tags: Joi.array().items(Joi.string().trim()).optional().default([])
    .messages({
      'array.base': 'Tags must be an array'
    }),

  // Dynamic content fields
  description: Joi.string().trim().allow('', null).optional(),

  dynamicContent: Joi.array().items(Joi.object({
    type: Joi.string().required(),
    value: Joi.any(),
    values: Joi.array().items(Joi.any()),
    label: Joi.string().allow(''),
    description: Joi.string().allow(''),
    metadata: Joi.object(),
    required: Joi.boolean(),
    order: Joi.number(),
    isVisible: Joi.boolean(),
    section: Joi.string()
  })).optional(),

  contentSections: Joi.array().items(Joi.object({
    sectionId: Joi.string().required(),
    sectionTitle: Joi.string().required(),
    sectionDescription: Joi.string().allow(''),
    order: Joi.number(),
    isCollapsible: Joi.boolean(),
    isExpandedByDefault: Joi.boolean(),
    icon: Joi.string().allow(''),
    content: Joi.array()
  })).optional(),

  importantInstructions: Joi.array().items(Joi.string()).optional(),
  documentsRequired: Joi.array().items(Joi.string()).optional(),

  // Result specific fields
  resultType: Joi.string().valid('Final', 'Provisional', 'MeritList', 'CutOff', 'AnswerKey', 'ScoreCard', 'Other').optional().default('Final')
    .messages({
      'any.only': 'Result type must be one of: Final, Provisional, MeritList, CutOff, AnswerKey, ScoreCard, Other'
    }),

  examName: Joi.string().trim().optional().allow('', null)
    .messages({
      'string.base': 'Exam name must be a string'
    })

}).unknown(true);

const updateResultValidation = Joi.object({
  type: Joi.string().valid('Job', 'Admission', 'LatestNotice', 'Other')
    .messages({
      'any.only': 'Type must be one of: Job, Admission, LatestNotice, Other'
    }),
  referenceId: Joi.string().hex().length(24)
    .messages({
      'string.hex': 'Reference ID must be a valid hex string',
      'string.length': 'Reference ID must be 24 characters'
    }),
  referenceModel: Joi.string().valid('Job', 'Admission', 'LatestNotice', 'OtherModel')
    .messages({
      'any.only': 'Reference model must be one of: Job, Admission, LatestNotice, OtherModel'
    }),
  directWebURL: Joi.string().uri().allow('').trim()
    .messages({
      'string.uri': 'Direct web URL must be a valid URL'
    }),
  linkMenuField: Joi.string().trim()
    .messages({
      'string.base': 'Link menu field must be a string'
    }),
  postTypeDetails: Joi.string().trim()
    .messages({
      'string.base': 'Post type details must be a string'
    }),
  alsoShowLink: Joi.boolean()
    .messages({
      'boolean.base': 'Also show link must be a boolean'
    }),
  description: Joi.string().trim().allow('', null).optional(),

  dynamicContent: Joi.array().items(Joi.object({
    type: Joi.string().required(),
    value: Joi.any(),
    values: Joi.array().items(Joi.any()),
    label: Joi.string().allow(''),
    description: Joi.string().allow(''),
    metadata: Joi.object(),
    required: Joi.boolean(),
    order: Joi.number(),
    isVisible: Joi.boolean(),
    section: Joi.string()
  })).optional(),

  contentSections: Joi.array().items(Joi.object({
    sectionId: Joi.string().required(),
    sectionTitle: Joi.string().required(),
    sectionDescription: Joi.string().allow(''),
    order: Joi.number(),
    isCollapsible: Joi.boolean(),
    isExpandedByDefault: Joi.boolean(),
    icon: Joi.string().allow(''),
    content: Joi.array()
  })).optional(),

  importantInstructions: Joi.array().items(Joi.string()).optional(),
  documentsRequired: Joi.array().items(Joi.string()).optional(),

  resultType: Joi.string().valid('Final', 'Provisional', 'MeritList', 'CutOff', 'AnswerKey', 'ScoreCard', 'Other')
    .messages({
      'any.only': 'Result type must be one of: Final, Provisional, MeritList, CutOff, AnswerKey, ScoreCard, Other'
    }),
  examName: Joi.string().trim()
    .messages({
      'string.base': 'Exam name must be a string'
    }),
  resultDate: Joi.date()
    .messages({
      'date.base': 'Result date must be a valid date'
    }),
  status: Joi.string().valid('pending', 'verified', 'rejected', 'onHold')
    .messages({
      'any.only': 'Status must be one of: pending, verified, rejected, onHold'
    }),
  resultStatus: Joi.string().valid('active', 'inactive')
    .messages({
      'any.only': 'Result status must be either active or inactive'
    }),
  tags: Joi.array().items(Joi.string().trim())
    .messages({
      'array.base': 'Tags must be an array'
    }),
  category: Joi.string().trim().max(100)
    .messages({
      'string.max': 'Category cannot exceed 100 characters'
    }),
  publishDate: Joi.date()
    .messages({
      'date.base': 'Publish date must be a valid date'
    })
});

const updateStatusValidation = Joi.object({
  status: Joi.string().valid('pending', 'verified', 'rejected', 'onHold').required()
    .messages({
      'any.only': 'Status must be one of: pending, verified, rejected, onHold',
      'any.required': 'Status is required'
    }),
  rejectionReason: Joi.when('status', {
    is: 'rejected',
    then: Joi.string().trim().min(5).max(500).required()
      .messages({
        'any.required': 'Rejection reason is required when status is rejected',
        'string.min': 'Rejection reason must be at least 5 characters',
        'string.max': 'Rejection reason cannot exceed 500 characters',
        'string.empty': 'Rejection reason cannot be empty'
      }),
    otherwise: Joi.string().trim().max(500).allow('', null)
  })
});

const resultFilterValidation = Joi.object({
  type: Joi.string().valid('Job', 'Admission', 'LatestNotice', 'Other'),
  status: Joi.string().valid('pending', 'verified', 'rejected', 'onHold'),
  resultStatus: Joi.string().valid('active', 'inactive'),
  resultType: Joi.string().valid('Final', 'Provisional', 'MeritList', 'CutOff', 'AnswerKey', 'ScoreCard', 'Other'),
  category: Joi.string().max(100),
  tags: Joi.array().items(Joi.string()),
  createdBy: Joi.string().hex().length(24)
    .messages({
      'string.hex': 'Created By must be a valid hex string',
      'string.length': 'Created By must be 24 characters'
    }),
  startDate: Joi.date(),
  endDate: Joi.date(),
  search: Joi.string().max(200),
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sortBy: Joi.string().valid('publishDate', 'resultDate', 'createdAt', 'updatedAt').default('publishDate'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc')
});

module.exports = {
  createResultValidation,
  updateResultValidation,
  updateStatusValidation,
  resultFilterValidation
};
