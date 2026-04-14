const MarketingCampaign = require('../models/MarketingCampaign');
const NotificationLog = require('../models/NotificationLog');
const FullMember = require('../models/FullMember');
const { sendSMS, sendEmail, sendWhatsApp } = require('../services/communicationService');

exports.getCampaigns = async (req, res) => {
  try {
    const campaigns = await MarketingCampaign.find().sort({ createdAt: -1 });
    res.json({ success: true, count: campaigns.length, data: campaigns });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.getLogs = async (req, res) => {
  try {
    const logs = await NotificationLog.find().populate('memberId', 'personalInfo.fullName personalInfo.mobile').sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, count: logs.length, data: logs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.deleteCampaign = async (req, res) => {
  try {
    const campaign = await MarketingCampaign.findByIdAndDelete(req.params.id);
    if (!campaign) return res.status(404).json({ success: false, error: 'Not found' });
    // Also delete associated logs
    await NotificationLog.deleteMany({ campaignId: req.params.id });
    res.json({ success: true, data: {} });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.createAndRunCampaign = async (req, res) => {
  try {
    const { name, type, audience, message, scheduleTime, specificMemberIds } = req.body;

    // Build the query to find target members
    let query = {};
    if (audience === 'Active Members') query['membershipInfo.status'] = 'Active';
    else if (audience === 'Expired Members') query['membershipInfo.status'] = 'Expired';
    else if (audience === 'Specific Members' && specificMemberIds?.length) {
      query['_id'] = { $in: specificMemberIds };
    }
    // 'All Members' → {}, fetch all

    const targetMembers = await FullMember.find(query);

    const campaign = await MarketingCampaign.create({
      name,
      type,
      audience,
      message,
      scheduleTime,
      status: scheduleTime ? 'scheduled' : 'running',
      audienceCount: targetMembers.length
    });

    res.status(201).json({ success: true, data: campaign });

    // BACKGROUND PROCESSING (immediate dispatch if no schedule)
    if (!scheduleTime) {
      setTimeout(async () => {
        let successCount = 0;
        let failedCount = 0;

        for (const member of targetMembers) {
          let response;
          const { personalInfo } = member;

          try {
            if (type === 'Email') {
               if(!personalInfo.email) throw new Error('No email found');
               response = await sendEmail(personalInfo.email, campaign.name, message);
            } else if (type === 'SMS') {
               if(!personalInfo.mobile) throw new Error('No mobile found');
               response = await sendSMS(personalInfo.mobile, message);
            } else if (type === 'WhatsApp') {
               if(!personalInfo.mobile) throw new Error('No mobile found');
               response = await sendWhatsApp(personalInfo.mobile, message);
            }

            const status = response.success ? 'sent' : 'failed';
            if (response.success) successCount++;
            else failedCount++;

            await NotificationLog.create({
              memberId: member._id,
              type,
              message,
              campaignId: campaign._id,
              status,
              errorLogs: response.error || null
            });

            // Emit socket update if initialized (Accessible globally if we attach to req.app)
            if (req.app.get('io')) {
               req.app.get('io').emit('campaign-progress', {
                 campaignId: campaign._id,
                 successCount,
                 failedCount,
                 total: targetMembers.length
               });
            }

          } catch (e) {
            failedCount++;
            await NotificationLog.create({
              memberId: member._id,
              type,
              message,
              campaignId: campaign._id,
              status: 'failed',
              errorLogs: e.message
            });
          }
        }

        // Update campaign final status
        campaign.status = 'completed';
        campaign.successCount = successCount;
        campaign.failedCount = failedCount;
        await campaign.save();

        if (req.app.get('io')) {
           req.app.get('io').emit('campaign-completed', { campaign });
        }

      }, 100);
    }
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};
