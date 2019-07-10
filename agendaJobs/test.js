const agenda = require('./lib/agenda')
agenda.on('ready', () => {
	agenda.now('sync products', {userId: 'shop'})
})

