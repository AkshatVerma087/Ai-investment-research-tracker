export const requireInternalApiKey = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (!apiKey || apiKey !== process.env.INTERNAL_API_KEY) {
    req.log.warn('Unauthorized attempt to access internal AI Agent endpoint');
    return res.status(403).json({ success: false, error: 'Forbidden: Invalid Internal API Key' });
  }
  next();
};
