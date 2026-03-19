import { Router } from 'express'
import multer from 'multer'
import { requireAuth } from '../middleware/auth.js'
import {
  listSubmissions,
  getSubmission,
  createSubmission,
  uploadPhoto,
  updateStatus,
  bulkUpdateStatus,
  deleteSubmission,
  getStats,
} from '../controllers/submissions.controller.js'

const router  = Router()
const upload  = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 5 * 1024 * 1024 },           // 5 MB max
  fileFilter: (_, file, cb) => {
    if (['image/jpeg','image/png','image/webp'].includes(file.mimetype)) cb(null, true)
    else cb(new Error('Only JPEG, PNG and WEBP images are allowed'))
  }
})

/* Public */
router.post('/',                  createSubmission)     // POST   /api/submissions
router.post('/:id/photo', upload.single('photo'), uploadPhoto) // POST /api/submissions/:id/photo

/* Admin only */
router.use(requireAuth)
router.get('/stats',              getStats)             // GET    /api/submissions/stats
router.get('/',                   listSubmissions)      // GET    /api/submissions
router.get('/:id',                getSubmission)        // GET    /api/submissions/:id
router.patch('/bulk-status',      bulkUpdateStatus)     // PATCH  /api/submissions/bulk-status
router.patch('/:id/status',       updateStatus)         // PATCH  /api/submissions/:id/status
router.delete('/:id',             deleteSubmission)     // DELETE /api/submissions/:id

export default router
