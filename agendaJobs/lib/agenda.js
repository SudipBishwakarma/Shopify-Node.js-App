const mongoose = require('mongoose')
const Agenda = require('agenda')

const mongoConnectionString = process.env.MONGODB_URI
mongoose.connect(mongoConnectionString, { useNewUrlParser: true })
const agenda = new Agenda({db: {address: mongoConnectionString, options: { useNewUrlParser: true }}})
const jobTypes = process.env.JOB_TYPES ? process.env.JOB_TYPES.split(',') : []

jobTypes.forEach( type => {
	require(`./jobs/${type}`)(agenda)
})

if (jobTypes.length) {
	agenda.start()
	console.log('Agenda backround process started..')
}

//This section is to unlock currently running jobs when this node process is stopped manually else the job will be left locked in the db
async function graceful() {
	await agenda.stop()
	process.exit(0)
}

process.on('SIGTERM', graceful) // kill process
process.on('SIGINT' , graceful) // Ctrl + C pressed to exit this process

module.exports = agenda