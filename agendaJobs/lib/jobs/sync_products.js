const Products = require('../../../models/Products')
const taskHistory = require('../../../models/task_history')
const Shop = require('../../../models/Shop')
const openSession = require('../../../helpers').openSession

function getVariants(page) {
	return new Promise((resolve, reject) => {
		try {
			Shopify.get(`/admin/variants.json?limit=250&&page=${page}`, function(err, data, headers) {
				if(typeof err != 'undefined') {
					count = 0
					products = {}
				} else {
					var { products, count }  = data.variants == '' ? { products: {}, count: 0 } : { products: data.variants, count: data.variants.length }
				}
				resolve({ products: products, count: count })
			})
		}
		catch(error) {
			reject(error)
		}
	})
}

module.exports = agenda => {
	let job_name = 'sync products', page = 1, all_products = []
	agenda.define(job_name, (job, done) => {
		store_name = job.attrs.data.store_name
		console.log(`Started job '${job_name}' for store ${store_name}`)
		Shop.findOne({ shopify_domain: store_name })
		.then(async shop => {
			if(shop) {
				Shopify = openSession(shop)
				while (true) {
					var { products, count } = await getVariants(page)
					if (count != 0) all_products.push(products)
					if(count == 0) {
						merged_products = [].concat.apply([], all_products) // merged array of arrays; as push just adds arrays not concat
						break
					}
					page ++
				}
				Products.deleteMany({ store_name: store_name }) // delete old documents belonging to specific store before adding new one
				.then(() => {
					Products.insertMany(merged_products)
					.then(async data => {
						await data.forEach( async product => {
							await Products.updateOne(product, { store_name: store_name })
						})
						taskHistory.updateOne({ job_name: job_name, store_name: store_name }, { is_active: false })
						.exec(() => {
							console.log(`Processed job '${job_name}' for store ${store_name}`)
							return done
						})
					})
				})
			}
		})
	})
}
