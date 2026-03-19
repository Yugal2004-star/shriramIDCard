import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import {
  listFormConfigs,
  getFormConfigByUrlId,
  createFormConfig,
  updateFormConfig,
  deleteFormConfig,
} from '../controllers/formConfigs.controller.js'

const router = Router()

/* Public */
router.get('/public/:urlId', getFormConfigByUrlId)      // GET /api/form-configs/public/:urlId

/* Admin only */
router.use(requireAuth)
router.get('/',          listFormConfigs)                // GET    /api/form-configs
router.post('/',         createFormConfig)               // POST   /api/form-configs
router.patch('/:id',     updateFormConfig)               // PATCH  /api/form-configs/:id
router.delete('/:id',    deleteFormConfig)               // DELETE /api/form-configs/:id

export default router
