var URL = require('url').URL;
var restBaseRegex = new RegExp(/^\/?([a-zA-Z0-9]+)\/([a-zA-Z0-9]+)\/?$/);

function parse(urlStr){
    if(urlStr[0] === "/") {
        urlStr = "http://nohost"+urlStr;
    }
    var urlObj = new URL(urlStr);
    var pathname = urlObj.pathname;
    var m = pathname.match(restBaseRegex);
    var restBase = m[1];
    var restEndpoint = m[2];

    var urlResult = {
        host: urlObj.host,
        restBase: restBase,
        restEndpoint: restEndpoint,
        urlObj: urlObj
    }

    return urlResult;
}

module.exports = parse;