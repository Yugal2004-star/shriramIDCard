import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { listCardTemplates, createCardTemplate, updateCardTemplate, deleteCardTemplate } from '../controllers/cardTemplates.controller.js'

const router = Router()
router.use(requireAuth)
router.get('/',      listCardTemplates)
router.post('/',     createCardTemplate)
router.patch('/:id', updateCardTemplate)
router.delete('/:id',deleteCardTemplate)
export default router