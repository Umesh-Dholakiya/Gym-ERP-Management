const axios = require('axios');
const GymProfile = require('../models/GymProfile');

/**
 * WhatsApp Cloud API Service (Meta)
 */
class WhatsAppCloudService {
    /**
     * Get API configuration from database
     */
    static async getConfig() {
        const profile = await GymProfile.findOne();
        if (!profile || !profile.integrations || !profile.integrations.whatsapp) {
            throw new Error('WhatsApp configuration missing');
        }

        const { apiKey, phoneNumberId, provider } = profile.integrations.whatsapp;
        
        if (provider !== 'Meta Cloud') {
            return null; // Don't use this service if provider is not Meta
        }

        if (!apiKey || !phoneNumberId) {
            throw new Error('Meta WhatsApp API Key or Phone Number ID missing');
        }

        return {
            accessToken: apiKey,
            phoneNumberId: phoneNumberId,
            version: 'v18.0'
        };
    }

    /**
     * Send a text message via WhatsApp Cloud API
     * @param {string} to - Destination phone number with country code (e.g., 919876543210)
     * @param {string} message - Text message content
     */
    static async sendMessage(to, message) {
        try {
            const config = await this.getConfig();
            if (!config) return { success: false, error: 'Meta Cloud provider not selected' };

            const { accessToken, phoneNumberId, version } = config;
            
            // Format phone number: remove any non-digit characters
            const formattedTo = to.replace(/\D/g, '');

            const url = `https://graph.facebook.com/${version}/${phoneNumberId}/messages`;
            
            const response = await axios.post(url, {
                messaging_product: "whatsapp",
                recipient_type: "individual",
                to: formattedTo,
                type: "text",
                text: {
                    body: message
                }
            }, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            return { 
                success: true, 
                data: response.data 
            };
        } catch (error) {
            console.error('WhatsApp Cloud API Error:', error.response ? error.response.data : error.message);
            return { 
                success: false, 
                error: error.response ? error.response.data : error.message 
            };
        }
    }

    /**
     * Send a template message (Required for non-24h window or first contact)
     * @param {string} to - Destination phone number
     * @param {string} templateName - Name of the template
     * @param {string} languageCode - Language code (e.g., 'en_US')
     * @param {Array} components - Template components (parameters)
     */
    static async sendTemplate(to, templateName, languageCode = 'en_US', components = []) {
        try {
            const config = await this.getConfig();
            if (!config) return { success: false, error: 'Meta Cloud provider not selected' };

            const { accessToken, phoneNumberId, version } = config;
            const formattedTo = to.replace(/\D/g, '');

            const url = `https://graph.facebook.com/${version}/${phoneNumberId}/messages`;

            const response = await axios.post(url, {
                messaging_product: "whatsapp",
                to: formattedTo,
                type: "template",
                template: {
                    name: templateName,
                    language: {
                        code: languageCode
                    },
                    components: components
                }
            }, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                }
            });

            return { 
                success: true, 
                data: response.data 
            };
        } catch (error) {
            console.error('WhatsApp Template Error:', error.response ? error.response.data : error.message);
            return { 
                success: false, 
                error: error.response ? error.response.data : error.message 
            };
        }
    }
}

module.exports = WhatsAppCloudService;
