const express = require('express');
const verifyOAuth = require('../helpers').verifyOAuth;
const mongoose = require('mongoose');
const config = require('../config');

const router = express.Router();

/* GET home page. */
router.get('/', (req, res, next) => {
  if(req.isAuthenticated()) {
    const shop = req.user
    res.render('app/app', { layout: 'app/layout', title: 'Home', apiKey: config.SHOPIFY_API_KEY, appName: config.APP_NAME, shop })
  }  else {
    if(verifyOAuth(req.query)) {
      req.session.dynamicRedirect = true
      return res.redirect(`/auth/shopify?shop=${req.query.shop}`)
    }
    return res.render('index', { title: 'Please visit this app within Shopify Admin' })
  }
})

router.get('/error', (req, res) => res.render('error', { message: 'Something went wrong!' }));

module.exports = router;
