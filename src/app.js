/**
 * @file app.js
 *
 * The entrypoint for this program.
 * Within this file is where the node.js Express server is configured
 */

const express = require("express");
const serverless = require("serverless-http");

const app = express();

app.get('/', (req, res) => {
    // Redirects all requests to https://api.walkspan.com/ to https://api.walkspan.com/docs
    return res.redirect(301, '/docs');
});

// Includes endpoints from the files in the route directory
app.use('/docs', require('./route/swagger'));
app.use('/score', require('./route/score'));
app.use('/essentials', require('./route/essentials'));

module.exports.handler = serverless(app);
