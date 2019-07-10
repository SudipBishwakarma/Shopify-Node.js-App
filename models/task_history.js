const mongoose = require('mongoose')

const taskHistorySchema = new mongoose.Schema({
	job_name: String,
	store_name: String,
	is_active: {type: Boolean, default: false}
}, {collection: 'taskHistories'})

module.exports = mongoose.model('taskHistory', taskHistorySchema)