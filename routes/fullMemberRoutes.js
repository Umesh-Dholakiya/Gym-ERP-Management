const express = require('express');
const router  = express.Router();
const multer  = require('multer');
const path    = require('path');
const fs      = require('fs');
const fullMemberController = require('../controllers/fullMemberController');

// ── Multer Storage Config ─────────────────────────────────────────────────────
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename:    (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, unique + path.extname(file.originalname));
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|gif|pdf/;
    const ok = allowed.test(file.mimetype) || allowed.test(path.extname(file.originalname).toLowerCase());
    cb(ok ? null : new Error('Only images and PDFs allowed'), ok);
  },
});
const cpUpload = upload.fields([
  { name: 'profilePhoto',   maxCount: 1 },
  { name: 'receiptFile',    maxCount: 1 },
  { name: 'progressPhotos', maxCount: 5 },
]);

const authMiddleware = require('../middleware/authMiddleware');

// ── Routes ───────────────────────────────────────────────────────────────────

router.use(authMiddleware);

// GET /api/full-members (list all with pagination/search)
router.get('/', fullMemberController.getAllMembers);

// POST /api/full-members (add member)
router.post('/', cpUpload, fullMemberController.addMember);

// GET /api/full-members/:id
router.get('/:id', fullMemberController.getMemberById);

// PUT /api/full-members/:id
router.put('/:id', cpUpload, fullMemberController.updateMember);

// POST /api/full-members/quick-attendance/:id
router.post('/quick-attendance/:id', fullMemberController.quickAttendance);

// POST /api/full-members/renew-plan/:id
router.post('/renew-plan/:id', fullMemberController.renewPlan);

// POST /api/full-members/update-plan/:id
router.post('/update-plan/:id', fullMemberController.updatePlan);

// DELETE /api/full-members/:id
router.delete('/:id', fullMemberController.deleteMember);

module.exports = router;
