const csvsync = require('csvsync')
const fs = require('fs')
const Products = require('../models/Products')

function asyncVar(varId) {
	return new Promise((resolve, reject) => {
		Shopify.get(`/admin/variants/${varId}.json`, function(err, data, headers) {
			if(typeof err != 'undefined') {
				resolve(err)
			} else {
				resolve(data.variant)
			}
		})
	})
}

function asyncInv(invId, hs_code) {
	return new Promise((resolve, reject) => {
		put_data = {
			"inventory_item": {
				"harmonized_system_code": hs_code
			}
		}
		Shopify.put(`/admin/inventory_items/${invId.inventory_item_id}.json`, put_data, function(err, data, headers) {
			if(typeof err != 'undefined') {
				resolve(err)
			} else {
				resolve(data)
			}
		})
	})
}

function _asyncInv(product, hs_code) {
	return new Promise((resolve, reject) => {
		put_data = {
			"inventory_item": {
				"harmonized_system_code": hs_code
			}
		}
		Shopify.put(`/admin/inventory_items/${product.inventory_item_id}.json`, put_data, function(err, data, headers) {
			if(typeof err != 'undefined') {
				resolve(err)
			} else {
				resolve(data)
			}
		})
	})
}

module.exports = {
	async _testFile(inputFile, Shopify) {
		readPath = `${__basedir}/uploads/${Shopify.config.shop}/`

		let inputRead = fs.readFileSync(`${readPath}${inputFile}`)

		let processedData = [['variant_id', 'sku', 'hs_code', 'status']]
		let notFoundData = [['sku']]

		inputReadData = csvsync.parse(inputRead, {skipHeader: true})

		let processedRows = skippedRows = 0

		for (iValue in inputReadData) {
			let iSku = inputReadData[iValue][0]
			let iHs_code = inputReadData[iValue][1]
			iHs_code = iHs_code == '' ? null : iHs_code
			let found = false
			data = await Products.find({ store_name: Shopify.config.shop, sku: iSku })
			if(data.length) {
				for (index in data) {
					++processedRows
					finalProcess = await _asyncInv(data[index], iHs_code)
					processStatus = 'Processed'
					if(finalProcess.error) {
						processStatus = typeof finalProcess.error === 'string' ? finalProcess.error : 'Failed due to an unknown error.'
					}
					processedData.push([data[index].id, iSku, iHs_code, processStatus])
				}
			} else {
				++skippedRows
				notFoundData.push([iSku])
			}
		}

		let processedLog = csvsync.stringify(processedData)
		let processFileName = 'processed.csv'
		fs.writeFileSync(`${readPath}${processFileName}`, processedLog)

		let notFoundLog = csvsync.stringify(notFoundData)
		let notFoundFileName = 'not_found.csv'
		fs.writeFileSync(`${readPath}${notFoundFileName}`, notFoundLog)

		return {'processed' : processFileName, 'notFound': notFoundFileName, 'processedRows': processedRows, 'skippedRows': skippedRows}
	},
	async testFile(inputFile, Shopify) {
		readPath = `${__basedir}/uploads/${Shopify.config.shop}/`

		let inputRead = fs.readFileSync(`${readPath}${inputFile}`)
		let refFile = 'ref.csv'

		if(Shopify.config.shop !== 'test-store47.myshopify.com') {
			refFile = 'all_variants_template.csv'
		}

		let referenceRead = fs.readFileSync(`${__basedir}/uploads/${refFile}`)

		let processedData = [['variant_id', 'sku', 'hs_code', 'status']]
		let notFoundData = [['sku']]

		inputReadData = csvsync.parse(inputRead, {skipHeader: true})
		referenceReadData = csvsync.parse(referenceRead, {skipHeader: true})

		let processedRows = skippedRows = 0

		for (iValue in inputReadData) {
			let iSku = inputReadData[iValue][0]
			let iHs_code = inputReadData[iValue][1]
			let found = false
			for (rValue in referenceReadData) {
				let rVariantId = referenceReadData[rValue][0].substr(2)
				let rSku = referenceReadData[rValue][1]

				if(iSku === rSku) {
					++processedRows
					finalProcess = await asyncInv(await asyncVar(rVariantId), iHs_code)
					processStatus = 'Processed'
					
					if(finalProcess.error) {
						processStatus = typeof finalProcess.error === 'string' ? finalProcess.error : 'Failed due to an unknown error.'
					}

					processedData.push([rVariantId, iSku, iHs_code, processStatus])
					found = true
				}
			}
			if(!found) {
				++skippedRows
				notFoundData.push([iSku])
			}
		}

		let processedLog = csvsync.stringify(processedData)
		let processFileName = 'processed.csv'
		fs.writeFileSync(`${readPath}${processFileName}`, processedLog)

		let notFoundLog = csvsync.stringify(notFoundData)
		let notFoundFileName = 'not_found.csv'
		fs.writeFileSync(`${readPath}${notFoundFileName}`, notFoundLog)

		return {'processed' : processFileName, 'notFound': notFoundFileName, 'processedRows': processedRows, 'skippedRows': skippedRows}
	}
}