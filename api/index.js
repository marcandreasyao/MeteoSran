// api/index.js — Vercel Serverless Function entry point
// This file wraps the Express server.js for Vercel deployment.
// Vercel will call this file for all /api/* requests.

import app from '../server/server.js';

export default app;
