import { Router } from 'express'
import multer from 'multer'
import { requireAuth } from '../middleware/auth.js'
import {
  listOrganizations,
  listOrganizationsPublic,  // ← add this
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
  limits:  { fileSize: 2 * 1024 * 1024 },  // 2MB
  fileFilter: (_, file, cb) => {
    if (['image/jpeg','image/png','image/webp'].includes(file.mimetype)) cb(null, true)
    else cb(new Error('Only JPEG, PNG and WebP images allowed'))
  }
})

router.use(requireAuth)
router.get('/public', listOrganizationsPublic)
router.get('/',         listOrganizations)                        // GET    /api/organizations
router.get('/:id',      getOrganization)                          // GET    /api/organizations/:id
router.post('/',        createOrganization)                       // POST   /api/organizations
router.post('/:id/logo',   upload.single('logo'), uploadLogo)    // POST   /api/organizations/:id/logo
router.delete('/:id/logo', removeLogo)                           // DELETE /api/organizations/:id/logo  ← FIX: new route
router.patch('/:id',    updateOrganization)                       // PATCH  /api/organizations/:id
router.delete('/:id',   deleteOrganization)                       // DELETE /api/organizations/:id

export default router