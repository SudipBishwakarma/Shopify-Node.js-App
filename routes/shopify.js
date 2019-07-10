const express = require('express')
const Shop = require('../models/Shop');
const passport = require('passport')
const ShopifyStrategy = require('passport-shopify').Strategy
const config = require('../config')
const router = express.Router()

router.get('/', (req, res) => {
	res.redirect('/auth/shopify')
})

router.get('/shopify', (req, res, next) => {
	if (typeof req.query.shop !== 'string') {
		const url = req.protocol + '://' + req.get('host') + req.originalUrl
		return res.send(`Please enter a 'shop' query string, e.g. <a href='${url}?shop=test-store47'>Click Me</a>`)
	}

	passport.use(`shopify`, new ShopifyStrategy({
		clientID: process.env.SHOPIFY_API_KEY,
		clientSecret: process.env.SHOPIFY_SHARED_SECRET,
		callbackURL: `${config.APP_URI}/auth/shopify/callback`,
		shop: req.query.shop
	}, (accessToken, refreshToken, profile, done) => {
			Shop.findOne({ shopify_domain: profile._json.shop.myshopify_domain }).exec()
			.then(user => {
				if(user) {
					if(accessToken !== user.accessToken) { //When you delete app then accessToken is changed.
						user.accessToken = accessToken
						return user.save()
						.then(user => {
							done(null, user)
						})
						.catch(err => done(err))
					} else {
						return done(null, user)
					}
				} else {
					return Shop({ shopify_domain: profile._json.shop.myshopify_domain, accessToken: accessToken, isActive: true }).save()
					.then(user => {
						done(null, user)
					})
					.catch(err => done(err))
				}
			})
			.catch(err => done(err))
		}
	))
	passport.authenticate(`shopify`, {
		scope: config.APP_SCOPE,
		shop: req.query.shop
	})(req, res, next)
})

router.get('/shopify/callback', (req, res, next) => {
	passport.authenticate(`shopify`, {
		failureRedirect: '/error'
	})(req, res, next)
}, (req, res) => {
	passport.unuse(`shopify`)

	if(req.session.dynamicRedirect) {
		delete req.session.dynamicRedirect
		return res.redirect('/')
	}

	if (config.APP_STORE_NAME) {
		return res.redirect(`https://${req.user.shopify_domain}/admin/apps/${config.APP_STORE_NAME}`);
	} else {
		return res.redirect(`https://${req.user.shopify_domain}/admin/apps`);
	}
})

module.exports = router