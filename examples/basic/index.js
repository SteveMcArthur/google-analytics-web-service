var GAwebservice = require('../../index.js').GAwebservice;
var analytics = new GAwebservice();

analytics.setLoggingOn();
analytics.initServer(3002);
/* analytics.getAnalytics(function (err, data) {
    if (err) {
        console.log(err);
    } else {
        console.log(data);
    }
}); */
analytics.makeRequest(function (err, data, body) {
    if (err) {
        console.log(err);
    } else {
        console.log(body);
    }
});