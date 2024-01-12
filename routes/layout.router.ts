import express from 'express'
import { IsAuthenticated, authorizeRoles } from '../middleware/auth';
import { createLayout, getLayoutByType, updateLayout } from '../controllers/layout.controller';
const layoutRouter=express.Router();
layoutRouter.post('/create-layout', IsAuthenticated,authorizeRoles('admin'),createLayout);
layoutRouter.put('/update-layout', IsAuthenticated,authorizeRoles('admin'),updateLayout);
layoutRouter.get('/get-layout',getLayoutByType);
export default layoutRouter;