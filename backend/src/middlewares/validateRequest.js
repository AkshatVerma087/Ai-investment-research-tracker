// Middleware for validating incoming request data against a Zod schema.
// It checks req.body, req.query, and req.params.
// If validation fails, it immediately returns a 400 Bad Request response with the validation details.

// Returns an Express middleware function that validates the request using the provided Zod schema.
export const validateRequest = (schema) => async (req, res, next) => {
  try {
    // Attempt to parse and validate the incoming request parts
    await schema.parseAsync({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    
    // Validation successful, proceed to the next middleware or controller
    return next();
  } catch (error) {
    // Validation failed, send a 400 response containing the error details from Zod
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation Error',
        details: error.errors,
      },
    });
  }
};
