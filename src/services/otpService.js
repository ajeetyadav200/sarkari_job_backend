const axios = require('axios');

class OTPService {
    constructor() {
        this.authKey = process.env.MSG91_AUTH_KEY;
        this.senderId = process.env.MSG91_SENDER_ID || 'VERIFY';
        this.templateId = process.env.MSG91_TEMPLATE_ID;
        this.baseURL = 'https://control.msg91.com/api/v5';
    }

    /**
     * Send OTP via MSG91 SMS using Template
     * @param {string} phone - Mobile number with country code (e.g., 919876543210)
     * @param {string} otp - 6-digit OTP
     */
    async sendOTP(phone, otp) {
        try {
            if (!this.authKey) {
                throw new Error('MSG91_AUTH_KEY not configured in environment variables');
            }

            if (!this.templateId) {
                throw new Error('MSG91_TEMPLATE_ID not configured in environment variables');
            }

            // Ensure phone number is in correct format (remove +, spaces, etc.)
            const formattedPhone = phone.replace(/\D/g, '');

            // Add country code if not present (default to India +91)
            const phoneWithCountryCode = formattedPhone.startsWith('91')
                ? formattedPhone
                : `91${formattedPhone}`;

            // MSG91 Flow API endpoint with template
            const url = `${this.baseURL}/flow/`;

            const payload = {
                template_id: this.templateId,
                sender: this.senderId,
                short_url: "0",
                mobiles: phoneWithCountryCode,
                var: otp // OTP variable matching your template ##var##
            };

            const response = await axios.post(url, payload, {
                headers: {
                    'authkey': this.authKey,
                    'content-type': 'application/json'
                }
            });

            console.log(`OTP sent successfully to ${phoneWithCountryCode}`);
            return {
                success: true,
                message: 'OTP sent successfully',
                requestId: response.data.request_id || response.data.type
            };

        } catch (error) {
            console.error('MSG91 OTP Service Error:', error.response?.data || error.message);

            // Return more specific error messages
            if (error.response) {
                throw new Error(`SMS Service Error: ${error.response.data.message || 'Failed to send OTP'}`);
            } else if (error.request) {
                throw new Error('SMS Service Error: No response from SMS provider');
            } else {
                throw new Error(`SMS Service Error: ${error.message}`);
            }
        }
    }

    /**
     * Alternative method using MSG91 OTP flow
     * This uses MSG91's template-based OTP system
     */
    async sendOTPViaFlow(phone, otp, templateId = null) {
        try {
            if (!this.authKey) {
                throw new Error('MSG91_AUTH_KEY not configured');
            }

            const formattedPhone = phone.replace(/\D/g, '');
            const phoneWithCountryCode = formattedPhone.startsWith('91')
                ? formattedPhone
                : `91${formattedPhone}`;

            // If you have a MSG91 template, use this method
            const url = templateId
                ? `https://api.msg91.com/api/v5/otp`
                : `${this.baseURL}/flow/`;

            const payload = templateId ? {
                template_id: templateId,
                mobile: phoneWithCountryCode,
                authkey: this.authKey,
                otp: otp,
                otp_expiry: 10 // minutes
            } : {
                sender: this.senderId,
                route: '4',
                country: '91',
                sms: [{
                    message: `Your OTP is ${otp}. Valid for 10 minutes. - Naukari Store`,
                    to: [phoneWithCountryCode]
                }]
            };

            const config = {
                headers: {
                    'authkey': this.authKey,
                    'content-type': 'application/json'
                }
            };

            const response = await axios.post(url, payload, config);

            return {
                success: true,
                message: 'OTP sent successfully',
                requestId: response.data.request_id || response.data.type
            };

        } catch (error) {
            console.error('MSG91 Flow Error:', error.response?.data || error.message);
            throw new Error(`Failed to send OTP: ${error.message}`);
        }
    }

    /**
     * Verify phone number format
     * @param {string} phone - Phone number to verify
     */
    isValidIndianPhone(phone) {
        const phoneRegex = /^[6-9]\d{9}$/;
        const cleanPhone = phone.replace(/\D/g, '');
        const localNumber = cleanPhone.startsWith('91')
            ? cleanPhone.substring(2)
            : cleanPhone;

        return phoneRegex.test(localNumber);
    }
}

module.exports = new OTPService();
