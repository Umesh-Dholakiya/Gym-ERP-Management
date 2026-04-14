const nodemailer = require('nodemailer');
const axios = require('axios');
const GymProfile = require('../models/GymProfile');
const WhatsAppCloudService = require('./whatsappCloudService');

/**
 * Returns instantiated clients based on GymProfile configurations.
 */
async function getCommunicationClients() {
  const profile = await GymProfile.findOne();
  if (!profile || !profile.integrations) {
    throw new Error('Integrations not configured in Gym Settings.');
  }

  // 1. Email Transporter (SMTP)
  let transporter = null;
  const smtpConf = profile.integrations.smtp;
  if (smtpConf && smtpConf.user && smtpConf.password) {
    transporter = nodemailer.createTransport({
      host: smtpConf.host || 'smtp.gmail.com',
      port: smtpConf.port || 587,
      auth: {
        user: smtpConf.user,
        pass: smtpConf.password,
      }
    });
  }

  // MSG91 replaces Twilio. Configuration comes from process.env directly.
  return { transporter, profile };
}

exports.sendEmail = async (to, subject, text, html) => {
  try {
    const { transporter, profile } = await getCommunicationClients();
    if (!transporter) throw new Error('SMTP not configured');

    const mailOptions = {
      from: `"${profile.gymName}" <${profile.integrations.smtp.user}>`,
      to,
      subject,
      text,
      html: html || `<p>${text}</p>`,
    };
    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email send error:', error.message);
    return { success: false, error: error.message };
  }
};

exports.sendSMS = async (to, body) => {
  try {
    const authKey = process.env.MSG91_AUTH_KEY;
    const templateId = process.env.MSG91_TEMPLATE_ID;
    
    if (!authKey || !templateId) {
      throw new Error('MSG91_AUTH_KEY or MSG91_TEMPLATE_ID missing in .env');
    }

    // MSG91 expects mobile numbers ideally with country code, without '+'
    // Format if necessary (assuming Indian numbers usually 91 format)
    let formattedMobile = to.replace(/\+/g, '');
    if (formattedMobile.length === 10) formattedMobile = `91${formattedMobile}`;

    const options = {
      method: 'POST',
      url: 'https://control.msg91.com/api/v5/flow/',
      headers: {
        'authkey': authKey,
        'content-type': 'application/JSON'
      },
      data: {
        template_id: templateId,
        short_url: "0",
        recipients: [
          {
            mobiles: formattedMobile,
            message: body // Make sure your MSG91 template expects a 'message' variable
          }
        ]
      }
    };

    const response = await axios.request(options);
    return { success: true, messageId: response.data };
  } catch (error) {
    console.error('MSG91 SMS send error:', error.response ? error.response.data : error.message);
    return { success: false, error: error.message };
  }
};

exports.sendWhatsApp = async (to, body) => {
  try {
    const profile = await GymProfile.findOne();
    const token = process.env.WHATSAPP_CLOUD_TOKEN;
    
    if (!token) {
      throw new Error('WHATSAPP_CLOUD_TOKEN missing in .env');
    }

    // Always use Meta WhatsApp Cloud API directly
    return await WhatsAppCloudService.sendMessage(to, body);
  } catch (error) {
    console.error('WhatsApp send error:', error.message);
    return { success: false, error: error.message };
  }
};

