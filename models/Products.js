const mongoose = require('mongoose')

const productSchema = new mongoose.Schema({
	id: Number,
	product_id: Number,
	title: String,
	price: String,
	sku: String,
	position: Number,
	inventory_policy: String,
	compare_at_price: String,
	fulfillment_service: String,
	inventory_management: String,
	option1: String,
	option2: {type: String, default: null},
	option3: {type: String, default: null},
	created_at: Date,
	updated_at: Date,
	taxable: Boolean,
	barcode: String,
	grams: String,
	image_id: String,
	weight: mongoose.Schema.Types.Decimal128,
	weight_unit: String,
	inventory_item_id: Number,
	inventory_quantity: Number,
	old_inventory_quantity: Number,
	requires_shipping: Boolean,
	admin_graphql_api_id: String,
	store_name: String
})

module.exports = mongoose.model('Products', productSchema)