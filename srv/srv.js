const cds = require('@sap/cds');
const express = require('express');
const multer  = require('multer');
const upload = multer();             // in memory

// Config CAP & Express
cds.on('bootstrap', app => {
  // Example path 4 odata post /uploadFile call action uploadFile
  app.post('/uploadFile', upload.single('file'), (req, res, next) => {
    // multer parse multipart/form-data and  req.file return to file object
    return next();
  });
});

// service bootstrapping 
module.exports = cds.server;