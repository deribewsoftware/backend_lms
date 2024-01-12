import express from 'express';
import { IsAuthenticated, authorizeRoles } from '../middleware/auth';
import { createOrder, getAllOrders } from '../controllers/order.controllers';
const orderRouter=express.Router();

orderRouter.post('/create-order',IsAuthenticated,createOrder);
orderRouter.get('/get-orders',IsAuthenticated,authorizeRoles("admin"),getAllOrders);
export default orderRouter;