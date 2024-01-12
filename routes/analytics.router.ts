import express from 'express';
import { getCoursesAnalytics, getOrdersAnalytics, getUserAnalytics } from '../controllers/analytics.controllers';
import { IsAuthenticated, authorizeRoles } from '../middleware/auth';

const analyticsRouter=express.Router();
analyticsRouter.get('/users-analytics',IsAuthenticated,authorizeRoles('admin'),getUserAnalytics)
analyticsRouter.get('/courses-analytics',IsAuthenticated,authorizeRoles('admin'), getCoursesAnalytics)
analyticsRouter.get('/orders-analytics',IsAuthenticated,authorizeRoles('admin'),getOrdersAnalytics)
export default  analyticsRouter;