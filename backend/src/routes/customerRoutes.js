import { Router } from "express";
import { listCustomers, addCustomer } from "../controllers/customerController.js";
import { authenticateAny } from "../middleware/authenticate.js";
import { requireScope } from "../middleware/apiKeyAuth.js";
import { validateRequest } from "../middleware/validateRequest.js";
import { listCustomersSchema, createCustomerSchema } from "../validators/customerValidators.js";

const router = Router();
router.get("/", authenticateAny, requireScope("customers:read"), validateRequest({ query: listCustomersSchema }), listCustomers);
router.post("/", authenticateAny, requireScope("customers:write"), validateRequest({ body: createCustomerSchema }), addCustomer);
export default router;
