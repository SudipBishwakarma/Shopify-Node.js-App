const env = process.env.NODE_ENV;

// You should put any global variables in here.
const config = {
  APP_URI: process.env.APP_URI,
  SHOPIFY_API_KEY: process.env.SHOPIFY_API_KEY || '',
  SHOPIFY_SHARED_SECRET: process.env.SHOPIFY_SHARED_SECRET || '',
  APP_NAME: process.env.APP_NAME || 'Your App',
  APP_STORE_NAME: process.env.APP_STORE_NAME || '',
  APP_SCOPE: 'read_products, write_products, read_inventory, write_inventory'
};

module.exports = Object.assign({}, config);
