var GAwebservice = require('../../index.js').GAwebservice;
var analytics = new GAwebservice();

analytics.setLoggingOn();
analytics.initServer(3002);