var fs = require('fs');

var queries = [];

var startDates = ['yesterday', '7daysAgo', '30daysAgo', '60daysAgo'];

var baseQueries = [{
    'endPoint': 'Pageviews',
    'query': {
        'ids': '', //replace this with your own ID
        'metrics': 'ga:uniquePageviews',
        'dimensions': 'ga:pageTitle',
        'start-date': '',
        'end-date': 'yesterday',
        'sort': '-ga:uniquePageviews',
        'max-results': 60
    }
}, {

    'endPoint': 'Sessions',
    'query': {
        'ids': '',
        'metrics': 'ga:sessions',
        'dimensions': 'ga:date',
        'start-date': '',
        'end-date': 'yesterday',
        'sort': '-ga:date',
        'max-results': 60
    }
}, {
    'endPoint': 'Country',
    'query': {
        'ids': '',
        'metrics': 'ga:sessions',
        'dimensions': 'ga:country,ga:countryIsoCode',
        'start-date': '',
        'end-date': 'yesterday',
        'sort': '-ga:sessions',
        'max-results': 60
    }
}, {
    'endPoint': 'BrowserAndOS',
    'query': {
        'ids': '',
        'metrics': 'ga:sessions',
        'dimensions': 'ga:browser,ga:browserVersion,ga:operatingSystem,ga:operatingSystemVersion',
        'start-date': '',
        'end-date': 'yesterday',
        'sort': '-ga:sessions',
        'max-results': 60
    }
}, {
    'endPoint': 'TimeOnSite',
    'query': {
        'ids': '',
        'metrics': 'ga:sessions,ga:sessionDuration',
        'start-date': '',
        'end-date': 'yesterday',
        'max-results': 60
    }
}, {
    'endPoint': 'TrafficSources',
    'query': {
        'ids': '',
        'metrics': 'ga:sessions,ga:pageviews,ga:sessionDuration,ga:exits',
        'dimensions': 'ga:source,ga:medium',
        'start-date': '',
        'end-date': 'yesterday',
        'max-results': 60
    }
}, {
    'endPoint': 'Keywords',
    'query': {
        'ids': '',
        'metrics': 'ga:sessions',
        'dimensions': 'ga:keyword',
        'start-date': '',
        'end-date': 'yesterday',
        'sort': '-ga:sessions',
        'max-results': 60
    }


}];

baseQueries.forEach(function (item) {

    var query = Object.assign({},item.query);
    var endPoint = item.endPoint;
    startDates.forEach(function (dt) {
        var qry = {};
        qry.endPoint = dt + endPoint;
        qry.query = Object.assign({},query);
        qry.query['start-date'] = dt;
        queries.push(qry);
    })

});


module.exports = queries;