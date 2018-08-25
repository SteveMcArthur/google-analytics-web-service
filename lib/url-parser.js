var URL = require('url').URL;
var restBaseRegex = new RegExp(/^\/?([a-zA-Z0-9]+)\/([a-zA-Z0-9]+)\/?$/);
var log = function () {};
log = console.log;

function parse(urlStr) {
    if (urlStr[0] === "/") {
        urlStr = "http://nohost" + urlStr;
    }
    log(urlStr);
    var urlObj = new URL(urlStr);
    var pathname = urlObj.pathname;
    log(pathname);
    var m = pathname.match(restBaseRegex);
    var restBase = "";
    var restEndpoint = "";
    if (m && m.length > 1) {
        restBase = m[1];
        restEndpoint = m[2];
    }

    var urlResult = {
        host: urlObj.host,
        restBase: restBase,
        restEndpoint: restEndpoint,
        urlObj: urlObj
    }

    return urlResult;
}

module.exports = parse;