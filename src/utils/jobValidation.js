const validator = require('validator');
const { 
  formModeEnum, 
  formTypeEnum, 
  paymentModeEnum, 
  categoryEnum 
} = require('../models/job/letestJob');

class JobValidator {
  static validateString(value, fieldName, min = 1, max = 500) {
    if (!value || typeof value !== 'string') {
      throw new Error(`${fieldName} is required`);
    }
    
    const trimmed = value.trim();
    
    if (trimmed.length < min) {
      throw new Error(`${fieldName} must be at least ${min} characters`);
    }
    
    if (trimmed.length > max) {
      throw new Error(`${fieldName} cannot exceed ${max} characters`);
    }
    
    return trimmed;
  }

  static validateEmail(email) {
    if (!email || !validator.isEmail(email)) {
      throw new Error('Please provide a valid email address');
    }
    return validator.normalizeEmail(email);
  }

  static validateURL(url) {
    if (!url || !validator.isURL(url, { 
      protocols: ['http', 'https'], 
      require_protocol: true 
    })) {
      throw new Error('Please provide a valid URL');
    }
    return url;
  }

  static validatePhone(phone) {
    if (!phone) {
      throw new Error('Phone number is required');
    }
    
    // Basic phone validation for India
    const cleaned = phone.replace(/[\s-]/g, '');
    
    if (!/^[+]?[0-9]{10,15}$/.test(cleaned)) {
      throw new Error('Phone number must be 10-15 digits');
    }
    
    return cleaned;
  }

  static validateNumber(value, fieldName, min = 0, max = Infinity) {
    const num = Number(value);
    
    if (isNaN(num)) {
      throw new Error(`${fieldName} must be a valid number`);
    }
    
    if (num < min) {
      throw new Error(`${fieldName} must be at least ${min}`);
    }
    
    if (num > max) {
      throw new Error(`${fieldName} cannot exceed ${max}`);
    }
    
    return num;
  }

  static validateDate(dateStr, fieldName, required = false) {
    if (!dateStr) {
      if (required) {
        throw new Error(`${fieldName} is required`);
      }
      return null;
    }
    
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      throw new Error(`${fieldName} must be a valid date`);
    }
    
    return date;
  }

  static validateEnum(value, enumObj, fieldName) {
    const values = Object.values(enumObj);
    if (!values.includes(value)) {
      throw new Error(`${fieldName} must be one of: ${values.join(', ')}`);
    }
    return value;
  }

  static validateCategoryPosts(categoryPosts, totalPost) {
    const validated = {};
    let sum = 0;
    
    // Validate each category post
    Object.entries(categoryPosts).forEach(([category, count]) => {
      if (!Object.values(categoryEnum).includes(category)) {
        throw new Error(`Invalid category: ${category}`);
      }
      
      const validatedCount = this.validateNumber(count, `${category.toUpperCase()} posts`, 0);
      sum += validatedCount;
      
      validated[category] = validatedCount;
    });
    
    // Check if sum exceeds total posts
    if (sum > totalPost) {
      throw new Error(`Sum of category posts (${sum}) exceeds total posts (${totalPost})`);
    }
    
    return validated;
  }

  static validateCategoryFees(categoryFees) {
    const validated = {};
    
    Object.entries(categoryFees).forEach(([category, amount]) => {
      if (!Object.values(categoryEnum).includes(category)) {
        throw new Error(`Invalid category: ${category}`);
      }
      
      validated[category] = this.validateNumber(amount, `${category.toUpperCase()} fee`, 0);
    });
    
    return validated;
  }

  static validateImportantDates(dates) {
    const validated = {};
    
    // All date fields from image 2.png
    const dateFields = [
      'startDate', 'registrationLastDate', 'formulationDate',
      'admitCardDate', 'ageOnDate', 'selectAdvertiseDate',
      'feeLastDate', 'chalanFeeLastDate', 'finalLastDate',
      'correctionDate', 'examDate', 'answerKeyDate', 'resultDate'
    ];
    
    dateFields.forEach(field => {
      validated[field] = this.validateDate(dates[field], field, false);
    });
    
    // Validate numeric age fields
    if (dates.minimumAge !== undefined) {
      validated.minimumAge = this.validateNumber(dates.minimumAge, 'Minimum age', 0, 100);
    }
    
    if (dates.maximumAge !== undefined) {
      validated.maximumAge = this.validateNumber(dates.maximumAge, 'Maximum age', 0, 100);
    }
    
    // Validate age range
    if (validated.minimumAge && validated.maximumAge) {
      if (validated.minimumAge > validated.maximumAge) {
        throw new Error('Minimum age cannot be greater than maximum age');
      }
    }
    
    // Validate text fields
    if (dates.ageRelaxation) {
      validated.ageRelaxation = this.validateString(dates.ageRelaxation, 'Age relaxation', 0, 200);
    }
    
    if (dates.pageName) {
      validated.pageName = this.validateString(dates.pageName, 'Page name', 0, 200);
    }
    
    // Validate date consistency
    if (validated.startDate && validated.registrationLastDate) {
      if (validated.startDate > validated.registrationLastDate) {
        throw new Error('Start date cannot be after registration last date');
      }
    }
    
    return validated;
  }

  static validateOtherDetails(otherDetails) {
    const validated = {};
    
    if (otherDetails?.bisixf1) {
      validated.bisixf1 = this.validateString(otherDetails.bisixf1, 'B I S I X F 1', 0, 100);
    }
    
    if (otherDetails?.format) {
      validated.format = this.validateString(otherDetails.format, 'Format', 0, 100);
    }
    
    if (otherDetails?.captchaCode) {
      validated.captchaCode = this.validateString(otherDetails.captchaCode, 'Captcha code', 0, 100);
    }
    
    if (otherDetails?.digitCode) {
      validated.digitCode = this.validateString(otherDetails.digitCode, '6 Digit code', 0, 10);
    }
    
    return validated;
  }

  static validateJobData(data) {
    const errors = [];
    const validated = {};
    
    try {
      // ========== Basic Info from image 11.png ==========
      validated.departmentName = this.validateString(data.departmentName, 'Department name', 2, 200);
      validated.postName = this.validateString(data.postName, 'Post name', 2, 200);
      validated.helpEmailId = this.validateEmail(data.helpEmailId);
      validated.helpCareNo = this.validatePhone(data.helpCareNo);
      validated.officialWebsite = this.validateURL(data.officialWebsite);
      
      // ========== Enums ==========
      validated.modeOfForm = this.validateEnum(data.modeOfForm, formModeEnum, 'Mode of form');
      validated.typeOfForm = this.validateEnum(data.typeOfForm, formTypeEnum, 'Type of form');
      validated.paymentMode = this.validateEnum(data.paymentMode, paymentModeEnum, 'Payment mode');
      
      // ========== Numbers and Booleans ==========
      validated.totalPost = this.validateNumber(data.totalPost, 'Total post', 1);
      validated.showInPortal = Boolean(data.showInPortal !== false);
      
      // ========== Category Data ==========
      if (data.categoryPosts) {
        validated.categoryPosts = this.validateCategoryPosts(data.categoryPosts, validated.totalPost);
      } else {
        validated.categoryPosts = {};
      }
      
      if (data.categoryFees) {
        validated.categoryFees = this.validateCategoryFees(data.categoryFees);
      } else {
        validated.categoryFees = {};
      }
      
      // ========== Eligibility ==========
      validated.eligibilityEducational1 = this.validateString(
        data.eligibilityEducational1, 
        'Primary educational qualification', 
        2, 
        500
      );
      
      if (data.eligibilityEducational2) {
        validated.eligibilityEducational2 = this.validateString(
          data.eligibilityEducational2, 
          'Secondary educational qualification', 
          0, 
          500
        );
      } else {
        validated.eligibilityEducational2 = '';
      }
      
      // ========== Dates ==========
      validated.importantDates = this.validateImportantDates(data.importantDates || {});
      
      // ========== Other Details ==========
      validated.otherDetails = this.validateOtherDetails(data.otherDetails || {});

      // ========== DYNAMIC CONTENT FIELDS ==========
      // Description (optional)
      if (data.description) {
        validated.description = typeof data.description === 'string' ? data.description.trim() : '';
      } else {
        validated.description = '';
      }

      // Selection Process (array of strings)
      if (Array.isArray(data.selectionProcess)) {
        validated.selectionProcess = data.selectionProcess.filter(item =>
          typeof item === 'string' && item.trim().length > 0
        );
      } else {
        validated.selectionProcess = [];
      }

      // Documents Required (array of strings)
      if (Array.isArray(data.documentsRequired)) {
        validated.documentsRequired = data.documentsRequired.filter(item =>
          typeof item === 'string' && item.trim().length > 0
        );
      } else {
        validated.documentsRequired = [];
      }

      // Important Instructions (array of strings)
      if (Array.isArray(data.importantInstructions)) {
        validated.importantInstructions = data.importantInstructions.filter(item =>
          typeof item === 'string' && item.trim().length > 0
        );
      } else {
        validated.importantInstructions = [];
      }

      // Dynamic Content (array of objects)
      if (Array.isArray(data.dynamicContent)) {
        validated.dynamicContent = data.dynamicContent;
      } else {
        validated.dynamicContent = [];
      }

      // Content Sections (array of objects)
      if (Array.isArray(data.contentSections)) {
        validated.contentSections = data.contentSections;
      } else {
        validated.contentSections = [];
      }

      return { isValid: true, data: validated, errors: null };

    } catch (error) {
      errors.push(error.message);
      return { isValid: false, data: null, errors };
    }
  }
}

module.exports = JobValidator;