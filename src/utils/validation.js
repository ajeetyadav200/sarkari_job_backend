


const validator = require("validator");

// Email validation
const validateEmail = (email) => {
    return validator.isEmail(email);
};

// Password validation
const validatePassword = (password) => {
    return validator.isStrongPassword(password, {
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 0,
    });
};

// Phone validation
const validatePhone = (phone) => {
    return validator.isMobilePhone(phone, "en-IN");
};

// Name validation
const validateName = (name) => {
    return /^[A-Za-z\s]{2,30}$/.test(name) && name.trim().length >= 2;
};

// Assistant creation validation
const validateAssistantData = (data) => {
    const { firstName, lastName, email, password } = data;
    const errors = [];

    if (!firstName || !validateName(firstName)) {
        errors.push("First name must be 2-30 letters only");
    }

    if (!lastName || !validateName(lastName)) {
        errors.push("Last name must be 2-30 letters only");
    }

    if (!email || !validateEmail(email)) {
        errors.push("Please provide a valid email address");
    }

    if (!password || !validatePassword(password)) {
        errors.push("Password must be at least 8 characters with uppercase, lowercase and number");
    }

    return errors;
};

// Assistant update validation
const validateAssistantUpdateData = (data) => {
    const { firstName, lastName, email } = data;
    const errors = [];

    if (firstName && !validateName(firstName)) {
        errors.push("First name must be 2-30 letters only");
    }

    if (lastName && !validateName(lastName)) {
        errors.push("Last name must be 2-30 letters only");
    }

    if (email && !validateEmail(email)) {
        errors.push("Please provide a valid email address");
    }

    

    return errors;
};



// Publisher creation validation
const validatePublisherData = (data) => {
    const { firstName, lastName, email, password, phone } = data;
    const errors = [];

    if (!firstName || !validateName(firstName)) {
        errors.push("First name must be 2-30 letters only");
    }

    if (!lastName || !validateName(lastName)) {
        errors.push("Last name must be 2-30 letters only");
    }

    if (!email || !validateEmail(email)) {
        errors.push("Please provide a valid email address");
    }

    if (!password || !validatePassword(password)) {
        errors.push("Password must be at least 8 characters with uppercase, lowercase and number");
    }

    if (phone && !validatePhone(phone)) {
        errors.push("Please provide a valid Indian phone number");
    }

    return errors;
};

// Publisher update validation
const validatePublisherUpdateData = (data) => {
    const { firstName, lastName, email, phone } = data;
    const errors = [];

    if (firstName && !validateName(firstName)) {
        errors.push("First name must be 2-30 letters only");
    }

    if (lastName && !validateName(lastName)) {
        errors.push("Last name must be 2-30 letters only");
    }

    if (email && !validateEmail(email)) {
        errors.push("Please provide a valid email address");
    }

    if (phone && !validatePhone(phone)) {
        errors.push("Please provide a valid Indian phone number");
    }

    return errors;
};


module.exports = {
    validateEmail,
    validatePassword,
    validatePhone,
    validateName,
    validateAssistantData,
    validateAssistantUpdateData,
    validatePublisherData,
    validatePublisherUpdateData
};