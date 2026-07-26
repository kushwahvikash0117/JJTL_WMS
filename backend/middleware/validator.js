/**
 * @file validationMiddleware.js
 * @description Middleware functions to validate incoming request payloads for items and user registration.
 */

/**
 * Validates that all required fields are present when creating or handling items.
 */
export const validateItem = (req, res, next) => {
  const { barcode, poNo, customer, qty, location } = req.body;

  if (!barcode || !poNo || !customer || !qty || !location) {
    return res.status(400).json({ 
      error: "Missing required fields: barcode, poNo, customer, qty, and location are mandatory." 
    });
  }
  
  next();
};

/**
 * Validates user registration details including required fields and password length.
 */
export const validateRegister = (req, res, next) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: "Please provide all registration fields." });
  }
  
  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters long." });
  }

  next();
};