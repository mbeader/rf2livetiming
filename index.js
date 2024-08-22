const log4js = require('log4js');
log4js.configure({
	appenders: { rf2lt: { type: 'file', filename: 'error.log' } },
	categories: { default: { appenders: ['rf2lt'], level: 'debug' } }
});
const log = log4js.getLogger('rf2lt');

try {
	require('./server/server');
} catch(e) {
	log.error(e);
	console.log('crashing this webapp, with no survivors');
	log4js.shutdown(function() { throw e; });
}
