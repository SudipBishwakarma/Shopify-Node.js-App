const mongoose = require('mongoose')

const Shop = mongoose.Schema({
  shopify_domain: String, // Shopify domain without the .myshopify.com on the end.
  name: String,
  supportEmail: String,
  accessToken: String,
  isActive: { type: Boolean, default: false },
});

module.exports = mongoose.model('Shop', Shop);
