


/* Services */

angular.module('cttvServices')




/**
* The API services, with methods to call the ElasticSearch API
*/
    .factory('cttvAPIservice', ['$http', '$log', '$location', '$rootScope', '$q', '$timeout', function($http, $log, $location, $rootScope, $q, $timeout) {
        'use strict';


        /*
        * Initial configuration of the service, with API's URLs
        */
        var cttvAPI = {
            API_DEFAULT_METHOD : "GET",
            //API_URL : "http://beta.targetvalidation.org/api/latest/",
            // API_URL : "http://193.62.52.228/api/latest/",
            API_SEARCH_URL : "search",
            API_EVIDENCE_URL : "evidences",
            API_AUTOCOMPLETE_URL : "autocomplete",
            API_FILTERBY_URL : 'filterby',
            API_EFO_URL : 'disease',
            API_ASSOCIATION_URL : 'associations', // note: these are no longer URLs, but actual API method names
            API_GENE_URL : 'gene',
            API_QUICK_SEARCH_URL : 'quickSearch',
            API_DISEASE_URL: 'disease',
            API_EXPRESSION_URL: 'expression',
            API_CLUSTER_URL : 'cluster',
            API_ABSTRACT_URL : 'abstract',
            API_TARGET_URL : 'target',
            API_TARGET_RELATION_URL : 'targetRelation',
            API_DISEASE_RELATION_URL : 'diseaseRelation',
            API_LOG_SESSION_URL : "logSession",
            facets: {
                DATATYPE: 'datatype', // 'filterbydatatype',
                PATHWAY: 'pathway', //filterbypathway',
                DATASOURCES: 'datasource', //filterbydatasource',
                SCORE_MIN : 'scorevalue_min', //filterbyscorevalue_min',
                SCORE_MAX : 'scorevalue_max', //filterbyscorevalue_max',
                SCORE_STR : 'stringency',
                THERAPEUTIC_AREA: 'therapeutic_area', //
            },
        };

        var api = cttvApi()
            .prefix("/api/")
            .version("latest")
            // .prefix("https://www.targetvalidation.org/api/")
            .appname("cttv-web-app")
            .secret("2J23T20O31UyepRj7754pEA2osMOYfFK")
            .verbose(true);
            //.expiry(1);
            // .onError(cttvAPI.defaultErrorHandler);


        // var token = {
        //
        //     set : function(tkn){
        //         clearTimeout(token._int);
        //         token._int = setTimeout(token._clear, 10000); // 1 min = 60000, 10 mins = 600000
        //         token._id = tkn;
        //     },
        //
        //     get : function(){
        //         return token._id;
        //     },
        //
        //     _id : "",
        //
        //     _int : -1,
        //
        //     _clear : function(){
        //         $log.log("clear "+token._id);
        //         token._id = "";
        //         $log.log("  '"+token._id+"'");
        //     }
        //
        // };



        /**/
        cttvAPI.activeRequests = 0;
        function countRequest(b){
            if(b===false){
                cttvAPI.activeRequests--;
            } else if (b===true){
                cttvAPI.activeRequests++;
            }
        }

        //cttvAPI.activeRequests = function(){
        //    return activeRequests;
        //}

        function isSuccess(status) {
            return 200 <= status && status < 300;
        }



        /*
        * Private function to actually call the API
        * queryObject:
        *  - method: ['GET' | 'POST']
        *  - operation: 'search' | 'evidence' | ...
        *  - params: Object with:
        *              - q: query string
        *              - from: number to start from
        *              - size: number of results
        */
        var callAPI = function(queryObject){
            var params = queryObject.params;

            var deferred = $q.defer();
            var promise = deferred.promise;
            var url = api.url[queryObject.operation](params);
            console.warn("URL : " + url);

            countRequest( params.trackCall===false ? undefined : true );
            //countRequest( true );

            // Params for api.call are: url, data (for POST) and return format
            var resp = api.call(url, undefined, (params.format || "json"))
                .then (done)
                .catch(function (err) {
                    cttvAPI.defaultErrorHandler (err, params.trackCall);
                });

            return promise;
            //return resp.then(handleSuccess, handleError);


            function done(response) {
                resolvePromise(response);
                if (!$rootScope.$$phase) $rootScope.$apply();
            }

            function resolvePromise(response){
                // normalize internal statuses to 0
                var status = Math.max(response.status, 0);

                countRequest( params.trackCall===false ? undefined : false );

                // we resolve the the promise on the whole response object,
                // so essentially we pass back the un-processed response object:
                // that means the data we're interested is in response.body.
                (isSuccess(status) ? deferred.resolve : deferred.reject)(response);

                // an alternative approach is to resolve the promise on a custom object
                // so that we don't pass back the whole raw response, but rather we make up the object
                // and choose what we want.
                // In this example, we go for a more angular/jquery approach and send back data and status.
                // This means that we have to handle things differently in our success handler...

                // (isSuccess(status) ? deferred.resolve : deferred.reject)({
                //   data : response.body,
                //   status: response.status
                // });
            }
        };

        /**
         * Default error handler function.
         * It simply logs the error to the console. Can be used in then(succ, err) calls.
         */
        cttvAPI.defaultErrorHandler = function(error, trackCall){
            $log.warn("CTTV API ERROR");
            countRequest(trackCall===false ? undefined : false);
            if (error.status === 403) {
                //$rootScope.$emit('cttvApiError', error);
                $rootScope.showApiErrorMsg = true;
            }
            if (error.status >= 500) {
                // alert("Error retrieving data from the API. Please try to reload the page");
                $rootScope.showApiError500 = true;
            }
            if (!$rootScope.$$phase) $rootScope.$apply();
        };

        var optionsToString = function(obj){
            var s="";
            for(var i in obj){
                s+="&"+i+"="+obj[i];
            }
            // remove the leading '&' and returns
            return s.substring(1);
        };



        /**
        * Get a full search.
        * Returns a promise object with methods then(), success(), error()
        *
        * Examples:
        *
        * cttvAPI.getSearch({q:'braf'}).success(function(data) {
        *      $scope.search.results = data;
        *      console.log(data);
        *  });
        *
        *
        * cttvAPIservice.getSearch({q:val}).then(function(response){
        *      return response.data.data;
        *  });
        *
        */
        cttvAPI.getSearch = function(queryObject){
            $log.log("cttvAPI.getSearch()");

            return callAPI({
                operation : cttvAPI.API_SEARCH_URL,
                params : queryObject
            });
        };


        cttvAPI.flat2tree = function (flat) {
            return api.utils.flat2tree(flat);
        };


        /**
        * Get the api object to be used outside of angular
        */
        cttvAPI.getSelf = function () {
            return api;
        };



        /**
        * Search for evidence using the evidence() API function.
        * Returns a promise object with methods then(), success(), error()
        */
        cttvAPI.getEvidence = function(queryObject){
            $log.log("cttvAPI.getEvidence()");

            return callAPI({
                operation : cttvAPI.API_EVIDENCE_URL,
                params : queryObject
            });
        };



        /**
        * TODO:
        * this needs to be consolidated with the getAssociation() method as they are the exact same thing...
        */
        cttvAPI.getAssociations = function(queryObject){
            $log.log("cttvAPI.getAssociations()");
            $log.log(queryObject);
            // queryObject[ cttvAPI.facets.SCORE_STR ] = queryObject[ cttvAPI.facets.SCORE_STR ] || [1] ; // No need for stringency for now
            queryObject[ cttvAPI.facets.SCORE_MIN ] = queryObject[ cttvAPI.facets.SCORE_MIN ] || [0.0] ;

            return callAPI({
                operation : cttvAPI.API_ASSOCIATION_URL,
                params : queryObject
            });
        };



        /**
        * Gets the info to be displayed in the serach suggestions box
        * via call to the autocomplete() API method
        */
        cttvAPI.getAutocomplete = function(queryObject){
            $log.log("cttvAPI.getAutocomplete()");

            return callAPI({
                operation : cttvAPI.API_AUTOCOMPLETE_URL,
                params : queryObject
            });
        };



        /**
        * Get disease details via API efo() method based on EFO code
        * queryObject params:
        *  - efo: the EFO code in format "EFO_xxxxxxx"
        */
        cttvAPI.getEfo = function(queryObject){
            $log.log("cttvAPI.getEfo");

            return callAPI({
                operation: cttvAPI.API_EFO_URL, // + "/" + queryObject.efo,
                params: queryObject
            });
        };



        /**
        * D E P R E C A T E D
        * Get gene details via API gene() method based on ENSG code
        * queryObject params:
        *  - gene: the ENSG code, e.g. "ENSG00000005339"
        */
        cttvAPI.getGene = function(queryObject){
            $log.log("cttvAPI.getGene");

            return callAPI({
                operation: cttvAPI.API_GENE_URL, // + "/" + queryObject.gene,
                params: queryObject
            });
        };

        /**
        * Get gene details via API gene() method based on ENSG code
        * queryObject params:
        *  - target_id: the ENSG code, e.g. "ENSG00000005339"
        */
        cttvAPI.getTarget = function(queryObject){
            $log.log("cttvAPI.getTarget "+queryObject.target_id);

            return callAPI({
                operation: cttvAPI.API_TARGET_URL, // + "/" + queryObject.gene,
                params: queryObject
            });
        };

        /**
        * Get disease details via API disease() method based on EFO ids
        * queryObject params:
        *  - code: the (EFO) code
        */
        cttvAPI.getDisease = function (queryObject) {
            $log.log ("cttvAPI.getDisease "+queryObject.code);

            return callAPI ({
                operation: cttvAPI.API_DISEASE_URL,
                params: queryObject
            });
        };


        /**
        * Careful not to confuse this with the other above (which btw should be renamed for clarity)
        * This returns the association scores.
        *
        * queryObject params:
        *  - gene: ENSG id, e.g. ENSG00000107562
        *  - efo: EFO code, e.g. EFO_0002917
        */
        cttvAPI.getAssociation = function(queryObject){
            $log.log("cttvAPI.getAssociation");

            // queryObject[ cttvAPI.facets.SCORE_STR ] = queryObject[ cttvAPI.facets.SCORE_STR ] || [1] ;
            queryObject[ cttvAPI.facets.SCORE_MIN ] = queryObject[ cttvAPI.facets.SCORE_MIN ] || [0.0] ;

            return callAPI({
                operation: cttvAPI.API_ASSOCIATION_URL,
                params: queryObject
            });
        };

        /**
        * Get cluster details via API method based on ENSG code and EFO id
        * queryObject params:
        *  - target: the ENSG code, e.g. "ENSG00000005339"
        *  - disease: the (EFO) code
        *  - datasource: europepmc
        *  - facets: True
        */
        cttvAPI.getCluster = function(queryObject){
            $log.log("cttvAPI.getCluster " + queryObject.target + " " + queryObject.disease);

            return callAPI({
                operation: cttvAPI.API_FILTERBY_URL,
                params: queryObject
            });
        };

        /**
        * Get abstract details for a particular cluster term 
        * queryObject params:
        *  - target: the code, e.g ENSG00000066468 
        *  - disease: the code, e.g EFO_0000311
        *  - datasource: europepmc
        *  - facets: True
        *  - abstract: cancer
        */
        cttvAPI.getAbstract = function(queryObject){
            $log.log("cttvAPI.getAbstract: " + queryObject.abstract);

            return callAPI({
                operation: cttvAPI.API_FILTERBY_URL,
                params: queryObject
            });
        };



        cttvAPI.getFilterBy = function(queryObject){
            $log.log("cttvAPI.getFilterBy");
            queryObject.expandefo = queryObject.expandefo || true;

            return callAPI({
                operation: cttvAPI.API_FILTERBY_URL, // + "/" + queryObject.gene,
                params: queryObject
            });
        };



        cttvAPI.getQuickSearch = function(queryObject){
            $log.log("cttvAPI.getQuickSearch()");

            return callAPI({
                operation : cttvAPI.API_QUICK_SEARCH_URL,
                params : queryObject
            });
        };



        cttvAPI.getExpression = function(queryObject){
            $log.log("cttvAPI.getExpression()");

            return callAPI({
                operation : cttvAPI.API_EXPRESSION_URL,
                params : queryObject
            });
        };

        /**
         * Decorates a given object with the API options for the given facets and returns the original object.
         * This can then be used to configure an API call.
         * If no object is supplied to the function, a new object is created and returned.
         */
        cttvAPI.addFacetsOptions = function(facets, obj){
            obj = obj || {};
            for(var i in facets){
                if( facets.hasOwnProperty(i)){
                    obj[cttvAPI.facets[i.toUpperCase()]] = facets[i];
                }
            }
            return obj;
        };



        /**
         * Get relations for specified gene or targer
         */
        cttvAPI.getTargetRelation = function(queryObject){
            $log.log("cttvAPI.getTargetRelation");

            return callAPI({
                operation : cttvAPI.API_TARGET_RELATION_URL,
                params : queryObject
            });
        }



        /**
         * Get relations for specified gene or targer
         */
        cttvAPI.getDiseaseRelation = function(queryObject){
            $log.log("cttvAPI.getTargetRelation");

            return callAPI({
                operation : cttvAPI.API_DISEASE_RELATION_URL,
                params : queryObject
            });
        }

        /**
        * Logs a session event in the API
        * This call is 1-off and it doesn't
        */
        cttvAPI.logSession = function () {
            $log.log("cttvAPI.logSession");

            return callAPI({
                operation : cttvAPI.API_LOG_SESSION_URL,
                params: {
                    event: "appload"
                }
            });
        };

        return cttvAPI;
    }])



    /**
    * A service to handle search in the app.
    * This talks to the API service
    */
    .factory('cttvAppToAPIService', ['$http', '$log', function($http, $log) {
        'use strict';

        var APP_QUERY_Q = "",
        APP_QUERY_PAGE = 1,
        APP_QUERY_SIZE = 10;


        var cttvSearchService = {
            SEARCH: "search",
            EVIDENCE: 'evidence'
        };



        cttvSearchService.createSearchInitObject = function(){
            return {
                query:{
                    q: APP_QUERY_Q,
                    page: APP_QUERY_PAGE,
                    size: APP_QUERY_SIZE
                },

                results:{}
            };
        };



        cttvSearchService.getApiQueryObject = function(type, queryObject){
            var qo = {
                size: queryObject.size,
                from: (queryObject.page - 1) * queryObject.size
            };

            switch (type){
                case this.SEARCH:
                qo.q = queryObject.q.title || queryObject.q;
                break;

                case this.EVIDENCE:
                qo.gene = queryObject.q.title || queryObject.q;
                qo.datastructure = 'simple';
                break;


            }

            return qo;
        };



        cttvSearchService.getSearch = function(){

        };


        /*
        var parseQueryParameters = function(qry){
        // set the query text
        $scope.search.query.q = qry.q || "";

        // set the query size (i.e. results per page)
        //$scope.search.query.size = APP_QUERY_SIZE;
        //if(qry.size){
        //    $scope.search.query.size = parseInt(qry.size);
        //}

        // set the query page
        //$scope.search.query.page = APP_QUERY_PAGE;
        //if(qry.page){
        //    $scope.search.query.page = parseInt(qry.page);
        //}
    }
    */



        /*
        var queryToUrlString = function(){
        return 'q=' + ($scope.search.query.q.title || $scope.search.query.q);
        // for now we don't want to set pagination via full URL
        // as this is causing some scope problems. If needed, we'll think about it
        //+ '&size=' + $scope.search.query.size
        //+ '&page=' + $scope.search.query.page;
        }
        */


        return cttvSearchService;
}]);
