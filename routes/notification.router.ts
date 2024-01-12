import express from 'express';
import { IsAuthenticated, authorizeRoles } from '../middleware/auth';
import { getNotifications, updateNotification } from '../controllers/notification.controller';
const notificationRouter=express.Router();
notificationRouter.get(
  '/get-all-notifications',
  IsAuthenticated,
  authorizeRoles('admin')
,getNotifications);


notificationRouter.put(
  '/update-notification/:id',
  IsAuthenticated,
  authorizeRoles('admin')
,updateNotification);
export default notificationRouter;