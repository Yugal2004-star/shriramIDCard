import { Router } from 'express'
import multer from 'multer'
import { requireAuth } from '../middleware/auth.js'
import {
  listOrganizations,
  listOrganizationsPublic,
  getOrganization,
  createOrganization,
  uploadLogo,
  removeLogo,
  updateOrganization,
  deleteOrganization,
} from '../controllers/Organizations.controller.js'

const router = Router()
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_, file, cb) => {
    if (['image/jpeg','image/png','image/webp'].includes(file.mimetype)) cb(null, true)
    else cb(new Error('Only JPEG, PNG and WebP images allowed'))
  }
})

// ✅ Public route — MUST be before requireAuth
router.get('/public', listOrganizationsPublic)

// All routes below require authentication
router.use(requireAuth)
router.get('/',            listOrganizations)
router.get('/:id',         getOrganization)
router.post('/',           createOrganization)
router.post('/:id/logo',   upload.single('logo'), uploadLogo)
router.delete('/:id/logo', removeLogo)
router.patch('/:id',       updateOrganization)
router.delete('/:id',      deleteOrganization)

export default router