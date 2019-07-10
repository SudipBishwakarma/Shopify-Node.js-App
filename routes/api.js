/**
 * ./routes/api.js
 * Test post.
 */
const express = require('express');
const verifyOAuth = require('../helpers').verifyOAuth;
const openSession = require('../helpers').openSession;
const mongoose = require('mongoose');
const config = require('../config');
const router = express.Router();
const hbs = require('../helpers/hbs');

var shop

router.use('/', (req, res, next) => {
	if (req.isAuthenticated()) {
		shop = req.user
	  	next()
	} else {
		if(verifyOAuth(req.query)) {
			req.session.dynamicRedirect = true
      		return res.redirect(`/auth/shopify?shop=${req.query.shop}`)
    	}
		return res.redirect('/')
	}
})

router.get('/', (req, res, next) => {
  	Shopify = openSession(shop)
	Shopify.get('/admin/shop.json', function(err, data, headers) {
		return res.render('app/api', { layout: 'app/layout', apiKey: config.SHOPIFY_API_KEY, title: 'Shop', data, shop })
	})
})

router.get('/products', (req, res, next) => {
  	Shopify = openSession(shop)
	Shopify.get('/admin/products.json?sku=12', function(err, data, headers) {
		return res.render('app/post', { layout: 'app/layout', apiKey: config.SHOPIFY_API_KEY, data, shop, title: 'Products' })
	})
})

router.post('/products', (req, res, next) => {
	Shopify = openSession(shop)
	var post_data = {
		"product": {
			"title": "Burton Custom Freestlye 151",
			"body_html": "<strong>Good snowboard!</strong>",
			"vendor": "Burton",
			"product_type": "Snowboard",
			"variants": [
				{
					"option1": "First",
					"price": "10.00",
					"sku": 123
				},
				{
					"option1": "Second",
					"price": "20.00",
					"sku": "123"
				}
			],
			"tags": 'test'
		}
	}
	Shopify.post('/admin/products.json', post_data, function(err, data, headers) {
		return res.render('app/post', { apiKey: config.SHOPIFY_API_KEY, shop, data })
	})
})

router.get('/error', (req, res) => res.render('error', { message: 'Something went wrong!' }))

module.exports = router
