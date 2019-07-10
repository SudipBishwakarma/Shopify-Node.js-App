const hbs = require('hbs');
const fs = require('fs');
const path = require('path');
hbs.registerHelper('toJSON', function(object){
	return JSON.stringify(object);
})
const partials_dir = '../views/app/partials/';
const shopify_head = hbs.compile(fs.readFileSync(path.join(__dirname, partials_dir + 'shopify_head.hbs')).toString('utf-8'));
hbs.registerPartial('shopifyHead', shopify_head);

const nav_bar = hbs.compile(fs.readFileSync(path.join(__dirname, partials_dir + 'nav_bar.hbs')).toString('utf-8'));
hbs.registerPartial('nav', nav_bar);