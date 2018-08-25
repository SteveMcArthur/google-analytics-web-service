/*global require*/
require('dotenv').config();

function logFn(msg) {
    console.log(msg);
}
var log = function () {};

var http = require('http');
var request = require('request');
var google = require('googleapis').google;
var path = require('path');
var fs = require('fs');
var path = require('path');

var defaultQueries = require('./lib/default-queries');
var urlParser = require('./lib/url-parser');
var cachePath = path.join(__dirname, "/output/cachedData.json");


var preCachedEndPoints = [];
defaultQueries.forEach(function (item) {
    if ((item.endPoint.indexOf("Pageviews") > -1) || (item.endPoint.indexOf("Sessions") > -1)) {
        preCachedEndPoints.push(item.endPoint);
    }
});
/**
 * Internal function for formatting the data returned from google
 * into a more compact object more suitable for consumption by a
 * web page ajax application
 * @private
 * @function formatData
 * @param {object} rawData
 * @param {boolean} minimiseData
 * @returns {object} - the data object
 */
function formatData(rawData,minimiseData) {
    var data = rawData;
    if (minimiseData) {
        data = {
            rows: rawData.rows,
            columnHeaders: rawData.columnHeaders,
            totalResults: rawData.totalResults,
            totalsForAllResults: rawData.totalsForAllResults
        };
    }
    return data;
}
/**
 * Internal function that returns the cached
 * data associated with an endPoint if it already
 * exists
 * @private
 * @function hasCachedData
 * @param {string} endPoint
 * @param {object} cachedData
 * @returns {object | boolean}
 */
function hasCachedData(endPoint,cachedData,cacheExpires) {
    if (cachedData) {
        if (cachedData[endPoint]) {
            if (((new Date()).getTime() - cachedData[endPoint].cachedTime) < cacheExpires) {
                return cachedData[endPoint]
            }
            return false;
        }
        return false;
    }
    return false;
}
/**
 * Internal function that retrieves the query
 * associated with an end point
 * @private
 * @function findQuery
 * @param {string} endPoint - the end point identifying the analytic query
 * @param {string} qryId - the query id to add to the query that will be sent to google
 * @returns {object} - the query to pass to google, including the qryId
 */
function findQuery(endPoint,qryId) {
    var theQry;
    for (var i = 0; i < defaultQueries.length; i++) {
        var q = defaultQueries[i];
        if (q.endPoint instanceof Array) {
            if (q.endPoint.indexOf(endPoint) > -1) {
                theQry = q.query
                theQry.ids = qryId;
            }
        } else if (q.endPoint == endPoint) {
            theQry = q.query
            theQry.ids = qryId;
        }
    }
    return theQry
}

/**
 * Internal function that builds a cache associated 
 * with the pre cached end points, a list of end points
 * for data that we want to cache immediately the application has
 * started.
 * @private
 * @function findQuery
 * @param {string} endPoint - the end point identifying the analytic query
 * @param {string} qryId - the query id to add to the query that will be sent to google
 */
function buildCache(self) {

    for (var i = 0; i < preCachedEndPoints.length; i++) {
        var endPoint = preCachedEndPoints[i];
        var qry = findQuery(endPoint,self.qryId);
        log(endPoint);
        if (qry) {
            self.retrieveData(qry, endPoint, function (err, data) {
                var msg = err ? err.message : "Build cache success, total results: " + data.totalResults;
                log(msg);
            });
        } else {
            log("unable to find query: " + endPoint)
        }
    }

}

/**
 * GAwebservice constructor. Pass the google analytics query id
 * to the constructor or allow it to be loaded via a .env file (recommended in live system).
 * Likewise, a path to the credentials.json file can be passed to the
 * constructor or loaded in the .env file or from the root of the application.
 * @class
 * @constructor
 * @param {string} [qryId=process.env.gaQryId] - the google analytics query id
 * @param {string} [credPath=process.env.gaCredentialFile || "./credentials.json"] - the file path to the credential.json file downloaded from google
 */
function GAwebservice(qryId,credPath){
    this.cacheExpires = 1000 * 60 * 60; //1 hour
    this.cachedData = {};
    this.minimiseData = true; //simplify the returned data

    this.qryId = qryId || process.env.gaQryId;
    if(!this.qryId){
        throw "google qryId not present. Please supply the ga query id to identify what analytical data you are querying"
    }

    this.credPath = credPath || process.env.gaCredentialFile || "./credentials.json";
    this.credPath = path.resolve(this.credPath); //credential file is relative to process.cwd
    this.creds = null;
    try {
        this.creds = require(this.credPath);
    } catch (err) {
        throw "credentials.json file is not present. Download the credentials.json file from google and place it in the root of your application";
    }
   

    this.jwtClient = new google.auth.JWT(this.creds.client_email, null, this.creds.private_key, ['https://www.googleapis.com/auth/analytics.readonly'], null);

    this.restBase = "getAnalytics"; //default baseUrl for the rest service ie http://localhost/gatAnalytics/endpoint
}

/**
 *
 * This method returns the google analytics data linked to the passed
 * endpoint. This data will either come from the cache or google directly.
 * The passed callback will return the retrieved data. This data will be a reformatted
 * version of the data originally returned by google.
 * @method
 * @memberof GAwebservice
 * @param {string} query - the query object to send to google
 * @param {string} endPoint - the rest endPoint used to retrieve the query
 * @callback callback - returns the formatted data object based on that returned from google
 */
GAwebservice.prototype.retrieveData = function(query, endPoint, callback) {

    var data = hasCachedData(endPoint,this.cachedData,this.cacheExpires);
    if (data) {
        data = formatData(data,this.minimiseData);
        return callback(null, data);
    } else {
        this.cachedData[endPoint] = undefined;
        var self = this;
        self.jwtClient.authorize(function (err, tokens) {
            if (err) {
                callback(err);
            }

            var analytics = google.analytics('v3');
            query.auth = self.jwtClient;
            analytics.data.ga.get(query, function (err, rawData) {
                if (err) {
                    callback(err)
                } else {
                    self.cachedData[endPoint] = rawData.data;
                    self.cachedData[endPoint].cachedTime = (new Date()).getTime();
                    fs.writeFile(cachePath, JSON.stringify(self.cachedData), 'utf-8', function (err) {
                        if (err) {
                            log("Error writing cache...");
                            log(err);
                        }
                    });
                    data = formatData(rawData.data);
                    callback(null, data);
                }
            });
        });
    }

};

/**
 * Test method that simply returns the data associated with the first
 * of pre cached endPoints. Does not make any http requests to the application
 * webservice - just goes straight to getting the data
 * @method getAnalytics
 * @memberof GAwebservice
 * @callback callback - returns the formatted data object based on that returned from google
 */
GAwebservice.prototype.getAnalytics = function(callback) {
    var endPoint = preCachedEndPoints[0];
    var qry = findQuery(endPoint,this.qryId);
    this.retrieveData(qry, endPoint, function (err, data) {
        callback(err, data);
    });
}

/**
 * Test method. Makes a http request to the configured application webservice and returns the
 * google analytics data from the webservice
 * @method makeRequest
 * @memberof GAwebservice
 * @callback callback - returns the formatted data object based on that returned from google
 * @param {string} [endPoint] - optional parameter. If not included then the first default endPoint will be used
 */
GAwebservice.prototype.makeRequest = function(callback, endPoint) {
    endPoint = endPoint || defaultQueries[0].endPoint;
    request('http://localhost:' + this.webservicePort + '/' + this.restBase + '/' + endPoint, function (error, response, body) {
        callback(error, response, body);
    });
}

/**
 * Empties the application cache
 * @method clearCache
 * @memberof GAwebservice
 */
GAwebservice.prototype.clearCache = function() {
    this.cachedData = {};
}

/**
 * Starts up the http server for the webservice and listens on
 * the configured port
 * @method initServer
 * @memberof GAwebservice
 * @param {string} [port=3001] - port the webservice should be listening on
 */
GAwebservice.prototype.initServer = function(port) {
    this.webservicePort = port || 3001;
    var self = this;
    http.createServer(function (req, res) {
        res.writeHead(200, {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        }); // http header
        var urlStr = req.url;
        var urlObj = urlParser(urlStr);


        if (urlObj.restBase === self.restBase) {
            var endPoint = urlObj.restEndpoint;
            var qry = findQuery(endPoint,self.qryId);
            self.retrieveData(qry, endPoint, function (err, data) {
                var result = JSON.stringify(data);
                res.write(result); //write a response
                res.end(); //end the response
            });
        } else {
            res.write('Undefined endpoint'); //write a response
            res.end();
        }
    }).listen(self.webservicePort, function () {
        console.log("server start at port " + self.webservicePort);
        buildCache(self);
    });
};

/**
 * Turn on logging. For testing purposes
 * @method setLoggingOn
 * @memberof GAwebservice
 */
GAwebservice.prototype.setLoggingOn = function () {
    log = logFn;
};

module.exports.GAwebservice = GAwebservice;