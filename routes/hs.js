const express = require('express')
const router = express.Router()
const verifyOAuth = require('../helpers').verifyOAuth
const openSession = require('../helpers').openSession
const config = require('../config')
const fs = require('fs')
const processCsv = require('../helpers/processCsv')
const agenda = require('../agendaJobs/lib/agenda')
const taskHistory = require('../models/task_history')
let shop

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

router.get('/', (req, res) => {
	const uploadDir = `${__basedir}/uploads/${shop.shopify_domain}/`
	if(!fs.existsSync(uploadDir)) {
		fs.mkdirSync(uploadDir)
	}
	fs.readdir(uploadDir, (err, files) => {
		if(err) {
			throw err
		}
		for(file of files) {
			fs.unlinkSync(`${uploadDir}${file}`)
		}
	})
	res.render('app/hs_index', { layout: 'app/layout', title: 'HS Code Import', apiKey: config.SHOPIFY_API_KEY, appName: config.APP_NAME, shop })
})

router.get('/download', (req, res) => {
	res.redirect('/hs')
})

router.get('/download/:fileName', (req, res) => {
	filePath = `${__basedir}/uploads/${shop.shopify_domain}/${req.params.fileName}`
	try {
	  if (fs.existsSync(filePath)) {
	    return res.download(filePath)
	  } else {
	  	return res.send('Invalid params or file does not exist!')
	  }
	} catch(err) {
	  console.log(err)
	}
})

router.post('/processFile', async (req, res) => {
	fileName = req.session.uploadFileName
	if (typeof fileName !== 'undefined') {
		delete req.session.uploadFileName
		Shopify = openSession(shop)
		data = await processCsv._testFile(fileName, Shopify)
		res.send(data)
	} else {
		res.status(400).send('Required params missing!')
	}

	// async function processFile(fileName, Shopify) {
	// 	data = await processCsv._testFile(fileName, Shopify)
	// 	res.send(data)
	// }
})

router.post('/upload', (req, res) => {
	if (req.files === null) {
		return res.status(400).send('Error: No files were uploaded.')
	}
	let fileToUpload = req.files.fileUpload
	
	if(typeof fileToUpload !== 'undefined' && (fileToUpload.mimetype === 'text/csv') || fileToUpload.mimetype ==='application/vnd.ms-excel') {
		let uploadDir = `${__basedir}/uploads/${shop.shopify_domain}`
		if (!fs.existsSync(uploadDir)) {
			fs.mkdirSync(uploadDir)
		}
		let uploadPath =  `${uploadDir}/${fileToUpload.name}`

		fileToUpload.mv(uploadPath, (err) => {
			if(err) {
				return res.status(400).send('Error: Failed to upload due to an unknown error.')
			}
			req.session.uploadFileName = fileToUpload.name
			return res.send({ message: `File ${fileToUpload.name} uploaded successfully.` })
		})
	} else {
		return res.status(400).send('Error: Failed to upload due to an unknown error.')
	}
})

router.get('/sync_products', (req, res) => {
	let job_name = 'sync products'
	function processJob() {
		job = agenda.create(job_name, { store_name: shop.shopify_domain })
		job.schedule('in 1 minutes')
		job.save()
	}

	if(req.xhr) {
		taskHistory.findOne({ job_name: job_name, store_name: shop.shopify_domain }).exec()
		.then(data => {
			if(data == null) {
				taskHistory({ job_name: job_name, store_name: shop.shopify_domain, is_active: true })
				.save(() => {
					processJob()
				})
			} else if(!data.is_active) {
				taskHistory.updateOne(data, { is_active: true })
				.exec(() => {
					processJob()
				})
			}	
			return res.send({ displayAction: false })
		})
		.catch(err => {
			console.log(err)
		})
	} else {
		return res.send('Invalid request!')
	}
})

router.get('/check_sync', (req, res) => {
	let job_name = 'sync products'
	if(req.xhr) {
		taskHistory.findOne({ job_name: job_name, store_name: shop.shopify_domain }).exec()
		.then(data => {
			return data === null || data.is_active === false ? res.send({ displayAction: true }) : res.send({ displayAction: false })
		})
	} else {
		return res.send('Not a valid request')
	}
})

function shopifyReq(limit, chunk) {
	return new Promise((resolve, reject) => {
		try {
			Shopify.get(`/admin/variants.json?limit=${limit}&&page=${chunk}`, function(err, data, headers) {
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

router.get('/testsync', async (req, res) => {
	Shopify = openSession(shop)
	let output
	console.log(shop)
	await taskHistory.find({ is_active: 's' })
	.then(data => {
		console.log(data)
		if(data.length) console.log('here')
		output = data
	})
	.catch(err => {
		//console.error(err)
	})
	console.log('Another text')
	console.log(output)
	res.send('OK')
	let limit = 7, chunk = 1, total = 0, all_products = [];
	// (async function() {
	// 	while (true) {
	// 		var { products, count } = await shopifyReq(limit, chunk)
	// 		total += count
	// 		if (count != 0) all_products.push(products)
	// 		if(count == 0) {
	// 			merged_products = [].concat.apply([], all_products) // merged array of arrays; as push just adds arrays not concat
	// 			break
	// 		}
	// 		chunk ++
	// 	}
	// 	res.send(`${total}`)
	// })()

	// taskHistory.deleteMany({ user_id: shop._id })
	// .then(() => {
	// 	taskHistory.insertMany([{job_name: 'test', user_id: 'asdsfdasd23231'}, {job_name: 'test1', user_id: 'asdasddsf23231'}, {job_name: 'test2', user_id: 'qqe1asdsf23231'}])
	// 	.then(async data => {
	// 		await data.forEach( async product => {
	// 			await taskHistory.updateOne(product, { is_active: true })
	// 		})
	// 		console.log('done')
	// 		res.send('Ok')
	// 	})
	// })
})

module.exports = router