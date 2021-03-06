
/**
 * Controller for the little search box
 */
angular.module('cttvControllers')



    /**
     * SearchAppCtrl
     * Controller for the search/results page
     */
    .controller('SearchAppCtrl', ['$scope', '$location', '$log', 'cttvAppToAPIService', 'cttvAPIservice', 'cttvUtils', 'cttvLocationState', '$q', function ($scope, $location, $log, cttvAppToAPIService, cttvAPIservice, cttvUtils, cttvLocationState, $q) {

        'use strict';
        // $log.log('SearchCtrl()');
        cttvUtils.clearErrors();

        /*
        Search holds query data as well as results from call
        Something like:
            {
                query:{
                    q: APP_QUERY_Q, // ""
                    page: APP_QUERY_PAGE,   // 1
                    size: APP_QUERY_SIZE    // 10
                },

                results:{}
            }
        */
        $scope.search = cttvAppToAPIService.createSearchInitObject();

        // filters object used to render the fake facets
        $scope.filters = {
            target : {},
            disease : {}
        };

        var initScopeFilters = function(){
            Object.keys($scope.filters).forEach(function(k){
                $scope.filters[k].total= 0;
                $scope.filters[k].selected= false;
                $scope.filters[k].loading= false;
            });
        };

        initScopeFilters();

        //
        // STATE (internal)
        //

        // state we want to export to/from the URL
        var stateId = "src";
        var stateIdLegacy = "q";    // the old style query
        var state = {};
        cttvLocationState.resetStateFor(stateId);
        cttvLocationState.resetStateFor(stateIdLegacy); // reset state for old style queries, just in case

        /*
         * Check config and initialize from given object or default values
         * Note properties from the state service object are always arrays
         */
        var initState = function(obj){
            state.q = ( obj.q || [] )[0] ? obj.q : [""];
            state.p = ( obj.p || [] )[0] ? obj.p : [1];
            state.f = ( obj.f || [] )[0] ? obj.f : [];

            // ensure filters are only allowed terms
            state.f = state.f.filter(function(filter){return filter=="target" || filter=="disease";});
            return state;
        };



        /*
         * Takes object from locationStateService, initialize the page/component state and fire a query
         */
        var setStateFromURL = function(obj){
            initState(obj);
            updateQueryFromState();
        };



        /*
         * Update the query object based on state:
         * that is the object with the parameters for the API call
         */
        var updateQueryFromState = function(){
            // update query
            $scope.search.query.q = state.q[0];
            // update page
            $scope.search.query.page = state.p[0];
            // update filters
            initScopeFilters(); // reset the filters (or might carry previous settings)
            state.f.forEach(function(f){
                $scope.filters[f].selected = true;
            });
            // get the data
            getResults();
            getFiltersData();   // gets the count for the fake facets; will be replaced when we have real facets
        };



        $scope.state = state; // expose the state object



        $scope.update = function(){

            // query and page are taken care of directly via the model
            // so here just update the filters
            var f = Object.keys($scope.filters).filter(function(k){
                return $scope.filters[k].selected;
            });

            // if some filter changed, so reset the page number:
            if( state.f.length != f.length ){
                state.p[0]=1;
            }

            state.f = f;
            cttvLocationState.setStateFor(stateId, state);
        };



        /*
         get the count for targets and disease to mimic facets
         when we'll have real facets we'll remove this
         */
        var getFiltersData = function(){
            if( $scope.search.query.q.length > 0 ) {

                Object.keys($scope.filters).forEach(function(k){
                    $scope.filters[k].loading = true;
                    cttvAPIservice.getSearch({
                        method: 'GET',
                        params: {
                                q: $scope.search.query.q,
                                size : 0,
                                filter : k
                            }
                    }).
                        then(
                            function(resp) {
                                $scope.filters[k].total = resp.body.total;
                            },
                            cttvAPIservice.defaultErrorHandler
                        ).
                        finally(function(){
                            $scope.filters[k].loading = false;
                        });
                });
            }

        };



        var getTargetInfo = function(id){
            var queryObject = {
                 method: 'GET',
                 params: {
                    target_id: id,
                    fields: ["approved_symbol"]
                 }
             };
            return cttvAPIservice.getTarget(queryObject)
                .then(function(resp) {
                    try{
                        $scope.search.results.data[0].data.top_associations.parsed.find(function(p){
                            return p.id===id;
                        }).label = resp.body.approved_symbol;
                    }catch(e){
                        $log.log("Error getting Target information");
                    }
                },cttvAPIservice.defaultErrorHandler);
        }



        var getDiseaseInfo = function(id){
            var queryObject = {
                method: 'GET',
                params: {
                    code: id,
                    fields: ["label"]
                }
            };
            return cttvAPIservice.getDisease(queryObject)
                .then( function(resp) {
                    try{
                        $scope.search.results.data[0].data.top_associations.parsed.find(function(p){
                            return p.id===id;
                        }).label = resp.body.label;
                    }catch(e){
                        $log.log("Error getting disease information");
                    }
                }, cttvAPIservice.defaultErrorHandler );
        }



        var getDrugInfo = function(id, type){
            var queryObject = {
                method: 'GET',
                params: {
                    //target: id,
                    datasource: "chembl",
                    size: 1000,
                    fields:[
                        "drug.max_phase_for_all_diseases.numeric_index",
                        "drug.molecule_name"
                    ]
                }
            };

            queryObject.params[type] = id;


            return cttvAPIservice.getFilterBy(queryObject).then(function (resp) {
                    var d = resp.body.data.filter(function(i){
                        return i.drug.max_phase_for_all_diseases.numeric_index == 4;
                    });
                    d = _.uniqBy(d, 'drug.molecule_name');
                    return d.length;
                });

        }



        var getResults = function(){

            // before getting new results,
            // we make sure we clear any current results (like in the case
            // of applying a filter), which also causes the spinner to show...

            if( $scope.search.query.q.length > 0 ) {
                $scope.search.loading = true;

                var queryObject = {
                    method: 'GET'
                };
                queryObject.params = cttvAppToAPIService.getApiQueryObject(cttvAppToAPIService.SEARCH, $scope.search.query);
                // if one and only one of the filters is selected, apply the corresponding filter
                // cool way of mimicking a XOR operator ;)
                if( $scope.filters.target.selected != $scope.filters.disease.selected ){
                    queryObject.params.filter = $scope.filters.target.selected ? 'target' : 'disease';
                }

                cttvAPIservice.getSearch( queryObject )
                    .then(
                        function(resp) {

                            $scope.search.results = resp.body;

                            $scope.search.results.data.forEach(function(result, i){
                                cttvUtils.addMatchedBy(result);
                            });


                            return resp;
                        },
                        cttvAPIservice.defaultErrorHandler
                    )

                    .then(
                        function(resp) {

                            // Picasso panel:
                            // for the first result, parse a few info:
                            if( resp.body.from==0 ){

                                var result = $scope.search.results.data[0];


                                //
                                // the top associations
                                //
                                result.data.top_associations.parsed = result.data.top_associations.total.slice(0,5);
                                result.data.top_associations.parsed = result.data.top_associations.parsed.map(function(p){
                                    // split ID "ENSG00000073756-EFO_0007214"
                                    var id = p.id.split("-")[ +(result.data.type==="target") ]
                                    return {
                                        id : id,
                                        label: result.data.type==="target" ? getDiseaseInfo(id) : getTargetInfo(id)
                                    };
                                })


                                //
                                // phase IV drugs
                                //
                                result.data.drug_summary = {
                                    total : "..."
                                };
                                getDrugInfo(result.data.id, result.data.type)
                                        .then(
                                            function(d){
                                                result.data.drug_summary.total = d;
                                            }
                                        );


                                //
                                // DISEASE specific
                                //
                                if( result.data.type === 'disease' ){
                                    // parse therapeutic areas to unique entries
                                    var utas = {};
                                    result.data.unique_ta = [];
                                    result.data.efo_path_labels.forEach(function(ta, i){
                                        if(!utas[ta[0]]){
                                            utas[ta[0]]=true; // just to use has hashmap
                                            result.data.unique_ta.push({
                                                label: ta[0],
                                                efo: result.data.efo_path_codes[i][0]
                                            })
                                        }
                                    });

                                } // end disease specific stuff


                                //
                                // TARGETS specific
                                //
                                if( result.data.type === 'target' ){
                                    // get drugs phase 4 count

                                }

                            }
                        },
                        cttvAPIservice.defaultErrorHandler
                    )
                    .finally(function(){
                        $scope.search.loading = false;
                    });
            }
        };



        // on search change
        // $scope.$on(cttvLocationState.STATECHANGED, function (e, args) {
            // $log.log("[handler] onStateChanged");
            // setStateFromURL( (args[stateId] || {}) );
        // });


        // on page load

        // if old style query, do a rerouting to new style query
        if( !cttvLocationState.parseLocationSearch()[stateId] && cttvLocationState.parseLocationSearch()[stateIdLegacy] ){
            $location.search( 'src=q:' + cttvLocationState.parseLocationSearch()[stateIdLegacy]);
        }

        setStateFromURL( cttvLocationState.parseLocationSearch()[stateId] || {q:[cttvLocationState.parseLocationSearch()[stateIdLegacy]]} );

    }]);
