
    /* Controllers */

    angular.module('cttvControllers')

    /**
     * GeneDiseaseCtrl
     * Controller for the Gene <-> Disease page
     * It loads the evidence for the given target <-> disease pair
     */
    .controller('TargetDiseaseCtrl', ['$scope', '$location', '$log', 'cttvAPIservice', 'cttvUtils', 'cttvDictionary', 'cttvConsts', 'cttvConfig', 'clearUnderscoresFilter', 'upperCaseFirstFilter', '$uibModal', '$compile', '$http', '$q', '$timeout', '$analytics', 'cttvLocationState', '$anchorScroll', '$rootScope', function ($scope, $location, $log, cttvAPIservice, cttvUtils, cttvDictionary, cttvConsts, cttvConfig, clearUnderscores, upperCaseFirst, $uibModal, $compile, $http, $q, $timeout, $analytics, cttvLocationState, $anchorScroll, $rootScope) {
        'use strict';
        $log.log('TargetDiseaseCtrl()');

		cttvLocationState.init();   // does nothing, but ensures the cttvLocationState service is instantiated and ready
        cttvUtils.clearErrors();

        var checkPath = cttvUtils.checkPath;

        var searchObj = cttvUtils.search.translateKeys($location.search());

        // var dbs = cttvConsts.dbs;
        var datatypes = cttvConsts.datatypes;

        //
        var accessLevelPrivate = "<span class='cttv-access-private' title='private data'></span>"; //"<span class='fa fa-users' title='private data'>G</span>";
        var accessLevelPublic = "<span class='cttv-access-public' title='public data'></span>"; //"<span class='fa fa-users' title='public data'>P</span>";
        
        
        $scope.displayAbstracts = [];
        $scope.cluster = "All";
        $scope.allData = [];

        // Specifically for foamtree tab
        $scope.setLoaded = function() {
        	$scope.loaded = true;
        }

		$scope.slider = {
				  min: getMinYear(),
				  max: getMaxYear(),
				  options: {
					floor: getMinYear(),
					ceil: getMaxYear(),
					onChange: function(sliderId, modelValue, highValue, pointerType) {
						filterAbstracts(modelValue, highValue);
					} 
				  }
		};
		
		function filterAbstracts(min, max) {

            $scope.displayAbstracts = $scope.allData;
			
			var acceptedAbstracts = [];
			
			$scope.displayAbstracts.forEach(function(item) {
				
				if(item.literature.year >= min && item.literature.year <= max) {
					acceptedAbstracts.push(item);
				}
			});
			
			$scope.displayAbstracts = acceptedAbstracts;
		}
		
		function getMinYear() {
			
			var min = 9999999;

			$scope.allData.forEach(function(item) {
			
				if(item.literature.year < min) {
					min = item.literature.year;
				}

			});
			
			return min;
		}

		function getMaxYear() {
			
			var max = 0;

			$scope.allData.forEach(function(item) {
			
				if(item.literature.year > max) {
					max = item.literature.year;
				}
			});
			
			return max;
		}

        $scope.search = {
            info : {
                data : {},
                efo_path : [],
                efo : {},
                gene : {},
                title : ""
            },

            flower_data : [], // processFlowerData([]), // so we initialize the flower to something
            test:[],
            categories:[],   // use this for sections of the accordion and flower petals
            association_scores : {},

            // tables data:
            tables : {
                genetic_associations : {
                    is_open : false,
                    is_loading: false,
                    heading : cttvDictionary.GENETIC_ASSOCIATION,
                    common_diseases : {
                        data : [],
                        is_open : false,
                        is_loading: false,
                        heading : cttvDictionary.COMMON_DISEASES,
                        source : cttvConfig.evidence_sources.genetic_association.common,
                        source_label : cttvConfig.evidence_sources.genetic_association.common.map(function(s){return {label:cttvDictionary[ cttvConsts.invert(s) ], url:cttvConsts.dbs_info_url[cttvConsts.invert(s)]}; }),
                        has_errors: false,
                    },
                    rare_diseases : {
                        data : [],
                        is_open : false,
                        is_loading: false,
                        heading : cttvDictionary.RARE_DISEASES,
                        source : cttvConfig.evidence_sources.genetic_association.rare,
                        source_label : cttvConfig.evidence_sources.genetic_association.rare.map(function(s){return {label:cttvDictionary[ cttvConsts.invert(s) ], url:cttvConsts.dbs_info_url[cttvConsts.invert(s)]}; }),
                        has_errors: false,
                    }
                },
                rna_expression : {
                    data : [],
                    is_open : false,
                    is_loading: false,
                    heading : cttvDictionary.RNA_EXPRESSION,
                    source : cttvConfig.evidence_sources.rna_expression,
                    source_label : cttvConfig.evidence_sources.rna_expression.map(function(s){return {label:cttvDictionary[ cttvConsts.invert(s) ], url:cttvConsts.dbs_info_url[cttvConsts.invert(s)]}; }),
                    has_errors: false,
                },
                affected_pathways : {
                    data : [],
                    is_open : false,
                    is_loading: false,
                    heading : cttvDictionary.AFFECTED_PATHWAY,
                    source : cttvConfig.evidence_sources.pathway,
                    source_label : cttvConfig.evidence_sources.pathway.map(function(s){return {label:cttvDictionary[ cttvConsts.invert(s) ], url:cttvConsts.dbs_info_url[cttvConsts.invert(s)]}; }),
                    has_errors: false,
                },
                known_drugs : {
                    data : [],
                    is_open : false,
                    is_loading: false,
                    heading : cttvDictionary.KNOWN_DRUG,
                    source : cttvConfig.evidence_sources.known_drug,
                    source_label : cttvConfig.evidence_sources.known_drug.map(function(s){return {label:cttvDictionary[ cttvConsts.invert(s) ], url:cttvConsts.dbs_info_url[cttvConsts.invert(s)]}; }),
                    has_errors: false,
                },
                somatic_mutations : {
                    data : [],
                    is_open : false,
                    is_loading: false,
                    heading : cttvDictionary.SOMATIC_MUTATION,
                    source : cttvConfig.evidence_sources.somatic_mutation,
                    source_label : cttvConfig.evidence_sources.somatic_mutation.map(function(s){return {label:cttvDictionary[ cttvConsts.invert(s) ], url:cttvConsts.dbs_info_url[cttvConsts.invert(s)]}; }),
                    has_errors: false,
                },
                literature : {
                    data : [],
                    is_open : false,
                    is_loading: false,
                    heading : cttvDictionary.LITERATURE,
                    source : cttvConfig.evidence_sources.literature,
                    source_label : cttvConfig.evidence_sources.literature.map(function(s){return {label:cttvDictionary[ cttvConsts.invert(s) ], url:cttvConsts.dbs_info_url[cttvConsts.invert(s)]}; }),
                    has_errors: false,
                },
                animal_models : {
                    data : [],
                    is_open : false,
                    is_loading: false,
                    heading : cttvDictionary.ANIMAL_MODEL,
                    source : cttvConfig.evidence_sources.animal_model,
                    source_label : cttvConfig.evidence_sources.animal_model.map(function(s){return {label:cttvDictionary[ cttvConsts.invert(s) ], url:cttvConsts.dbs_info_url[cttvConsts.invert(s)]}; }),
                    has_errors: false,
                }
            }
        };

        $scope.datatypes = datatypes;

        var arrayToList = function(arr, oneToString){
            if(oneToString && arr.length==1){
                return arr[0];
            }
            return "<ul><li>" + arr.join("</li><li>") + "</li></ul>";
        }

        // =================================================
        //  I N F O
        // =================================================


        /**
         * Get the information for target and disease,
         * i.e. to fill the two boxes at the top of the page
         */
        var getInfo = function(){
            // get gene specific info
            cttvAPIservice.getTarget( {
                    target_id:$scope.search.target
                } ).
                then(
                    function(resp) {
                        $scope.search.info.gene = resp.body;
                        //updateTitle();
                    },
                    cttvAPIservice.defaultErrorHandler
                );


            // get disease specific info with the efo() method
            cttvAPIservice.getDisease( {
                    code:$scope.search.disease
                } ).
                then(
                    function(resp) {
                        $scope.search.info.efo = resp.body;
                        // TODO: This is not returned by the api yet. Maybe we need to remove it later
                        $scope.search.info.efo.efo_code = $scope.search.disease;
                        //updateTitle();
                    },
                    cttvAPIservice.defaultErrorHandler
                );

        };



        var updateTitle = function(t, d){
            $scope.search.info.title = (t+"-"+d).split(" ").join("_");
        };



        // =================================================
        //  F L O W E R
        // =================================================


        /*
         * takes a datasources array and returns an array of objects {value: number, label:string}
         */
        function processFlowerData(data){
            var fd = [];

            for (var i=0; i<cttvConsts.datatypesOrder.length; i++) {
                var dkey = cttvConsts.datatypes[cttvConsts.datatypesOrder[i]];
                var key = cttvConsts.datatypesOrder[i];
                fd.push({
                    // "value": lookDatasource(data, cttvConsts.datatypes[key]).score,
                    "value": data[dkey],
                    "label": cttvConsts.datatypesLabels[key],
                    "active": true,
                });
            }

            return fd;
        }



        var getFlowerData = function(){
            var opts = {
                target:$scope.search.target,
                disease:$scope.search.disease,
                facets: false
            };
            _.extend(opts, searchObj);

            return cttvAPIservice.getAssociation(opts).
                then(
                    function(resp) {
                        $scope.search.flower_data = processFlowerData(resp.body.data[0].association_score.datatypes);
                        updateTitle( resp.body.data[0].target.gene_info.symbol, resp.body.data[0].disease.efo_info.label );
                    },
                    cttvAPIservice.defaultErrorHandler
                );
        };



        // =================================================
        //  G E N E T I C   A S S O C I A T I O N S
        // =================================================



        /*
        Here we need to pull data for two tables via two separte, distinct calls to the API
         - common disease table
         - related rare disease
        */


        // -------------------------------------------------



        var updateGeneticAssociationsSetting = function(){
            //$scope.search.tables.genetic_associations.is_open = $scope.search.tables.genetic_associations.common_diseases.is_open || $scope.search.tables.genetic_associations.rare_diseases.is_open;
            $scope.search.tables.genetic_associations.is_loading = $scope.search.tables.genetic_associations.common_diseases.is_loading || $scope.search.tables.genetic_associations.rare_diseases.is_loading;
        };



        /*
         * Search for given eco_code id in the specified evidence_codes_info array
         * and returns corresponding label, or eco_code id if not found
         */
        var getEcoLabel = function(arr, eco){
            var label = eco;
            for(var i=0; i<arr.length; i++){
                if(arr[i][0].eco_id===eco){
                    label = arr[i][0].label;
                    break;
                }
            }
            return label;
        };


        var getCommonDiseaseData = function(){
            $scope.search.tables.genetic_associations.common_diseases.is_loading = true;
            var opts = {
                target:$scope.search.target,
                disease:$scope.search.disease,
                size: 1000,
                datasource: cttvConfig.evidence_sources.genetic_association.common,
                fields:[
                    "disease",
                    "evidence",
                    "variant",
                    "target",
                    "sourceID",
                    "access_level"
                ]
            };
            _.extend(opts, searchObj);
            return cttvAPIservice.getFilterBy( opts ).
                then(
                    function(resp) {
                        if( resp.body.data ){
                            $scope.search.tables.genetic_associations.common_diseases.data = resp.body.data;
                            initCommonDiseasesTable();
                        } else {
                            $log.warn("Empty response : common disease");
                        }
                    },
                    cttvAPIservice.defaultErrorHandler
                ).
                finally(function(){
                    //$scope.search.tables.genetic_associations.common_diseases.is_open = $scope.search.tables.genetic_associations.common_diseases.data.length>0 || false;
                    $scope.search.tables.genetic_associations.common_diseases.is_loading = false;

                    // update for parent
                    updateGeneticAssociationsSetting();
                });
        };



        /*
         *
         */
        var formatCommonDiseaseDataToArray = function(data){
            var newdata = [];

            data.forEach(function(item){

                // create rows:
                var row = [];

                try{

                    // data origin: public / private
                    row.push( (item.access_level==cttvConsts.ACCESS_LEVEL_PUBLIC) ? accessLevelPublic : accessLevelPrivate );

                    // disease name
                    row.push( item.disease.efo_info.label );

                    // Variant
                    row.push( "<a class='cttv-external-link' href='http://www.ensembl.org/Homo_sapiens/Variation/Explore?v="+item.variant.id[0].split('/').pop()+"' target='_blank'>"+item.variant.id[0].split('/').pop()+"</a>" );

                    // variant type
                    row.push( clearUnderscores( getEcoLabel(item.evidence.evidence_codes_info, item.evidence.gene2variant.functional_consequence.split('/').pop() ) ) );

                    // evidence source
                    row.push( cttvDictionary.CTTV_PIPELINE );

                    // evidence source
                    row.push( "<a class='cttv-external-link' href='https://www.ebi.ac.uk/gwas/search?query="+item.variant.id[0].split('/').pop()+"' target='_blank'>"
                            + clearUnderscores(item.sourceID)
                            + "</a>");

                    // p-value
                    row.push( item.evidence.variant2disease.resource_score.value.toPrecision(1) );
                    //row.push( item.evidence.variant2disease.resource_score.value.toExponential(1) );

                    // publications
                    var refs = [];
                    if ( checkPath(item, "evidence.variant2disease.provenance_type.literature.references") ) {
                        refs = item.evidence.variant2disease.provenance_type.literature.references;
                    }

                    var pmidsList = cttvUtils.getPmidsList( refs );
                    row.push( cttvUtils.getPublicationsString( pmidsList ) );

                    // Publication ids (hidden)
                    row.push(pmidsList.join(", "));


                    newdata.push(row);

                }catch(e){
                    $scope.search.tables.genetic_associations.common_diseases.has_errors = true;
                    $log.error("Error parsing common disease data:");
                    $log.error(e);
                }
            });

            return newdata;
        };



        var initCommonDiseasesTable = function(){

            $('#common-diseases-table').DataTable( cttvUtils.setTableToolsParams({
                "data": formatCommonDiseaseDataToArray($scope.search.tables.genetic_associations.common_diseases.data),
                "ordering" : true,
                "order": [[1, 'asc']],
                "autoWidth": false,
                "paging" : true,
                "columnDefs" : [
                    {
                        "targets" : [0],    // the access-level (public/private icon)
                        "visible" : cttvConfig.show_access_level,
                        "width" : "3%"
                    },
                    {
                        "targets": [8],
                        "visible": false
                    },
                    {
                        "targets": [3,4,5,7],
                        "width": "14%"
                    },
                    {
                        "targets": [2,6],
                        "width": "10%"
                    }

                ]

            }, $scope.search.info.title+"-common_diseases") );
        };



        // -------------------------------------------------



        var getRareDiseaseData = function(){
            $scope.search.tables.genetic_associations.rare_diseases.is_loading = true;
            var opts = {
                target:$scope.search.target,
                disease:$scope.search.disease,
                size: 1000,
                datasource: cttvConfig.evidence_sources.genetic_association.rare,
                fields: [
                    "disease.efo_info",
                    "evidence",
                    "variant",
                    "type",
                    "access_level"
                ]
            };

            _.extend(opts, searchObj);

            return cttvAPIservice.getFilterBy( opts ).
                then(
                    function(resp) {
                        if( resp.body.data ){
                            $scope.search.tables.genetic_associations.rare_diseases.data = resp.body.data;
                            initRareDiseasesTable();
                        } else {
                            $log.warn("Empty response : rare disease");
                        }
                    },
                    cttvAPIservice.defaultErrorHandler
                ).
                finally(function(){
                    //$scope.search.tables.genetic_associations.rare_diseases.is_open = $scope.search.tables.genetic_associations.rare_diseases.data.length>0 || false;
                    $scope.search.tables.genetic_associations.rare_diseases.is_loading = false;
                    // update for parent
                    updateGeneticAssociationsSetting();
                });
        };



        var formatRareDiseaseDataToArray = function(data){
            var newdata = [];
            data.forEach(function(item){
                // create rows:
                var row = [];

                try{

                    var db = "";
                    if( item.evidence.variant2disease ){
                        db = item.evidence.variant2disease.provenance_type.database.id.toLowerCase();   // or gene2variant
                    }else if ( item.evidence.provenance_type.database ){
                        db = item.evidence.provenance_type.database.id.toLowerCase();
                    }



                    // data origin: public / private
                    row.push( (item.access_level==cttvConsts.ACCESS_LEVEL_PUBLIC) ? accessLevelPublic : accessLevelPrivate );


                    // disease
                    row.push( item.disease.efo_info.label );


                    // mutation
                    var mut = cttvDictionary.NA;
                    if( checkPath(item, "variant.id") && item.variant.id[0]){
                        var rsId = item.variant.id[0].split('/').pop();
                        mut = "<a class='cttv-external-link' href=http://www.ensembl.org/Homo_sapiens/Variation/Explore?v=" + rsId + " target=_blank>" + rsId + "</a>";
                    }
                    row.push(mut);


                    // mutation consequence
                    if( item.type === 'genetic_association' && checkPath(item, "evidence.gene2variant") ){
                        row.push( clearUnderscores( getEcoLabel(item.evidence.evidence_codes_info, item.evidence.gene2variant.functional_consequence.split('/').pop() ) ) );
                    } else if( item.type === 'somatic_mutation' ){
                        row.push( clearUnderscores(item.type) );
                    } else {
                        row.push( "Curated evidence" );
                    }


                    // evidence source
                    if( item.type === 'genetic_association' && checkPath(item, "evidence.variant2disease") ){
                        row.push( "<a class='cttv-external-link' href='" + item.evidence.variant2disease.urls[0].url + "' target=_blank>" + item.evidence.variant2disease.urls[0].nice_name + "</a>" );

                    } else {
                        // Do some cleaning up for gene2Phenotype:
                        // TODO: this will probably be removed once we reprocess the data and put the nicely formatted text and URL in the data;
                        // I leave the hard coded strings in on purpose, so hopefully I'll remember to remove this in the future.
                        // I'm setting manually:
                        //  1) URL
                        //  2) the text of the link
                        if( db == cttvConsts.dbs.GENE_2_PHENOTYPE ){
                            row.push( "<a class='cttv-external-link' href='http://www.ebi.ac.uk/gene2phenotype/search?panel=ALL&search_term=" + ($scope.search.info.gene.approved_symbol || $scope.search.info.gene.ensembl_external_name) + "' target=_blank>Further details in Gene2Phenotype database</a>" );
                        } else {
                            row.push( "<a class='cttv-external-link' href='" + item.evidence.urls[0].url + "' target=_blank>" + item.evidence.urls[0].nice_name + "</a>" );
                        }

                    }



                    // publications
                    var refs = [];

                    if( item.type === 'genetic_association'){
                        if ( checkPath(item, "evidence.variant2disease.provenance_type.literature") ) {
                            refs = item.evidence.variant2disease.provenance_type.literature.references;
                        } else if( checkPath(item, "evidence.provenance_type.literature.references") ){
                            // this code might be redundant here:
                            // perhaps we don't need to check against genetic_association,
                            // but just check whether there is variant2disease field etc...
                            refs = item.evidence.provenance_type.literature.references;
                        }
                    } else {
                        if( checkPath(item, "evidence.provenance_type.literature.references") ){
                            refs = item.evidence.provenance_type.literature.references;
                        }
                    }

                    var pmidsList = cttvUtils.getPmidsList( refs );
                    row.push( cttvUtils.getPublicationsString( pmidsList ) );

                    // Publication ids (hidden)
                    row.push(pmidsList.join(", "));


                    // add the row to data
                    newdata.push(row);


                }catch(e){
                    $scope.search.tables.genetic_associations.rare_diseases.has_errors = true;
                    $log.warn("Error parsing rare disease data:");
                    $log.warn(e);
                }
            });

            return newdata;
        };


        var initRareDiseasesTable = function(){
            $('#rare-diseases-table').DataTable( cttvUtils.setTableToolsParams({
                "data": formatRareDiseaseDataToArray($scope.search.tables.genetic_associations.rare_diseases.data),
                "ordering" : true,
                "order": [[1, 'asc']],
                "autoWidth": false,
                "paging" : true,
                "columnDefs" : [
                    {
                        "targets" : [0],    // the access-level (public/private icon)
                        "visible" : cttvConfig.show_access_level,
                        "width" : "3%"
                    },
                    {
                        "targets": [6],
                        "visible": false
                    },
                    {
                        "targets": [2,5],
                        "width": "14%"
                    },
                    {
                        "targets": [3,4],
                        "width": "22%"
                    }
                ],
            }, $scope.search.info.title+"-rare_diseases") );
        };



        // =================================================
        //  D R U G S
        // =================================================


        // DRUGS
        var getDrugData = function () {
            $scope.target = $scope.search.target;
            $scope.disease = $scope.search.disease;
        };


        // =================================================
        //  PATHWAYS
        // =================================================

            /*
            pathway 1   Target context  .biological_subject.properties.target_type
            pathway 2   Protein complex members .biological_subject.about
            pathway 3   Activity    .biological_subject.properties.activity
            pathway 4   Additional context  .evidence.properties.experiment_specific.additional_properties
            pathway 5   Provenance - SourceDB   .evidence.urls.linkouts
            pathway 6   Provenance - References .evidence.provenance_type.literature.pubmed_refs
            pathway 7   Date asserted   .evidence.date_asserted
            pathway 8   Evidence codes  .evidence.evidence_codes
            */



        var getPathwaysData = function(){
            $scope.search.tables.affected_pathways.is_loading = true;
            var opts = {
                target:$scope.search.target,
                disease:$scope.search.disease,
                size: 1000,
                datasource: $scope.search.tables.affected_pathways.source, //cttvConfig.evidence_sources.pathway,
                fields: [
                    "target",
                    "disease",
                    "evidence",
                    "access_level"
                ]
            };
            _.extend(opts, searchObj);
            return cttvAPIservice.getFilterBy( opts ).
                then(
                    function(resp) {
                        if( resp.body.data ){
                            $scope.search.tables.affected_pathways.data = resp.body.data;
                            initTablePathways();
                        } else {
                            $log.warn("Empty response : pathway data");
                        }
                    },
                    cttvAPIservice.defaultErrorHandler
                ).
                finally(function(){
                    //$scope.search.pathways.is_open = $scope.search.pathways.data.length>0 || false; // might trigger an error...
                    $scope.search.tables.affected_pathways.is_loading = false;
                });
        };


        /*
         *
         */
        var formatPathwaysDataToArray = function(data){
            var newdata = [];
            data.forEach(function(item){
                // create rows:
                var row = [];

                try{

                    // data origin: public / private
                    row.push( (item.access_level==cttvConsts.ACCESS_LEVEL_PUBLIC) ? accessLevelPublic : accessLevelPrivate );

                    // disease
                    row.push(item.disease.efo_info.label);

                    // overview
                    row.push("<a class='cttv-external-link' href='" + item.evidence.urls[0].url+"' target='_blank'>" + item.evidence.urls[0].nice_name + "</a>");

                    // activity
                    row.push( cttvDictionary[item.target.activity.toUpperCase()] || clearUnderscores(item.target.activity) ); // "up_or_down"->"unclassified" via dictionary

                    // mutations
                    var mut = cttvDictionary.NA
                    if(item.evidence.known_mutations && item.evidence.known_mutations.length>0){
                        mut = arrayToList( item.evidence.known_mutations.map(function(i){return i.preferred_name || cttvDictionary.NA;}) , true );
                    }
                    row.push(mut);

                    // evidence codes
                    row.push("Curated in " + item.evidence.provenance_type.database.id );

                    // publications
                    var refs = [];
                    if( checkPath(item, "evidence.provenance_type.literature.references") ){
                        refs = item.evidence.provenance_type.literature.references;
                    }
                    var pmidsList = cttvUtils.getPmidsList( refs );
                    row.push( cttvUtils.getPublicationsString( pmidsList ) );

                    // Publication ids (hidden)
                    row.push(pmidsList.join(", "));



                    newdata.push(row); // use push() so we don't end up with empty rows

                }catch(e){
                    $scope.search.tables.affected_pathways.has_errors = true;
                    $log.error("Error parsing pathways data:");
                    $log.error(e);
                }
            });
            return newdata;
        };



        var initTablePathways = function(){
            $('#pathways-table').DataTable( cttvUtils.setTableToolsParams({
                "data" : formatPathwaysDataToArray($scope.search.tables.affected_pathways.data),
                "ordering" : true,
                "order": [[1, 'asc']],
                "autoWidth": false,
                "paging" : true,
                "columnDefs" : [
                    {
                        "targets" : [0],    // the access-level (public/private icon)
                        "visible" : cttvConfig.show_access_level,
                        "width" : "3%"
                    },
                    {
                        "targets" : [7],
                        "visible" : false
                    },
                    {
                        "targets" : [3,4,5,6],
                        "width" : "14%"
                    },
                    {
                        "targets" : [1],
                        "width" : "18%"
                    }
                ],
            }, $scope.search.info.title+"-disrupted_pathways") );
        };



        // =================================================
        //  RNA expression
        // =================================================



        var getRnaExpressionData = function(){
            $scope.search.tables.rna_expression.is_loading = true;
            var opts = {
                target:$scope.search.target,
                disease:$scope.search.disease,
                size: 1000,
                datasource: $scope.search.tables.rna_expression.source, //cttvConfig.evidence_sources.rna_expression,
                fields: [
                    "disease",
                    "evidence",
                    "target",
                    "access_level"
                ]
            };
            _.extend(opts, searchObj);
            return cttvAPIservice.getFilterBy( opts ).
                then(
                    function(resp) {
                        if( resp.body.data ){
                            $scope.search.tables.rna_expression.data = resp.body.data;
                            initTableRNA();
                        } else {
                            $log.warn("Empty response : RNA expression");
                        }
                    },
                    cttvAPIservice.defaultErrorHandler
                ).
                finally(function(){
                    //$scope.search.tables.rna_expression.is_open = $scope.search.tables.rna_expression.data.length>0 || false;
                    $scope.search.tables.rna_expression.is_loading = false;
                });
        };



        /*
         * Takes the data object returned by the API and formats it to an array of arrays
         * to be displayed by the RNA-expression dataTable widget.
         */
        var formatRnaDataToArray = function(data){
            var newdata = [];
            data.forEach(function(item){
                // create rows:
                var row = [];

                try{

                    // data origin: public / private
                    row.push( (item.access_level==cttvConsts.ACCESS_LEVEL_PUBLIC) ? accessLevelPublic : accessLevelPrivate );

                    // disease
                    row.push( item.disease.efo_info.label );

                    // comparison
                    row.push( item.evidence.comparison_name );

                    // activity
                    var activityUrl = item.evidence.urls[0].url;
                    var activity = item.target.activity.split("_").shift();
                    row.push( "<a class='cttv-external-link' href='"+ activityUrl +"' target='_blank'>" + activity +"</a>" );

                    // tissue / cell
                    row.push( item.disease.biosample.name );
                    // row.push( checkPath(data[i], "biological_object.properties.biosamples") ? data[i].biological_object.properties.biosamples : cttvDictionary.NA );

                    // evidence source
                    row.push( getEcoLabel( item.evidence.evidence_codes_info, item.evidence.evidence_codes[0]) );

                    // fold change
                    row.push( item.evidence.log2_fold_change.value );

                    // p-value
                    row.push( (item.evidence.resource_score.value).toExponential(2) );

                    // percentile rank
                    row.push( item.evidence.log2_fold_change.percentile_rank );

                    // experiment overview
                    var expOverview = (item.evidence.urls[2] || item.evidence.urls[0]).url || cttvDictionary.NA;
                    row.push( "<a class='cttv-external-link' href='"+expOverview+"' target='_blank'>" + (item.evidence.experiment_overview || "Experiment overview and raw data") + "</a>" );


                    // publications
                    var refs = [];
                    if( checkPath(item, "evidence.provenance_type.literature.references") ){
                        refs = item.evidence.provenance_type.literature.references;
                    }
                    var pmidsList = cttvUtils.getPmidsList( refs );
                    row.push( cttvUtils.getPublicationsString( pmidsList ) );

                    // Publication ids (hidden)
                    row.push(pmidsList.join(", "));


                    newdata.push(row); // push, so we don't end up with empty rows

                }catch(e){
                    $scope.search.tables.rna_expression.has_errors = true;
                    $log.log("Error parsing RNA-expression data:");
                    $log.log(e);
                }
            });
            //}

            return newdata;
        };



        var initTableRNA = function(){

            $('#rna-expression-table').DataTable( cttvUtils.setTableToolsParams({
                "data": formatRnaDataToArray($scope.search.tables.rna_expression.data),
                "order": [[1, 'asc']],
                "autoWidth": false,
                "paging" : true,
                "columnDefs" : [
                    {
                        "targets" : [0],    // the access-level (public/private icon)
                        "visible" : cttvConfig.show_access_level,
                        "width" : "3%"
                    },
                    {
                        "targets": [11],
                        "visible": false
                    },
                    {
                        "targets" : [6,7,8],
                        "width" : "6%"
                    },
                    {
                        "targets" : [9,10],
                        "width" : "12%"
                    },
                    {
                        "targets" : [2,5],
                        "width" : "13%"
                    },
                    {
                        "targets" : [3,4],
                        "width" : "10%"
                    }
                ],
            }, $scope.search.info.title+"-RNA_expression") );
        };



        // =================================================
        //  S O M A T I C   M U T A T I O N S
        // =================================================



        var getMutationData = function(){
            //$log.log("getMutationData()");
            var opts = {
                target:$scope.search.target,
                disease:$scope.search.disease,
                size: 1000,
                datasource: $scope.search.tables.somatic_mutations.source, //cttvConfig.evidence_sources.somatic_mutation ,
                fields: [
                    "disease.efo_info", // disease
                    "evidence.evidence_codes_info",  // evidence source
                    "evidence.urls",
                    "evidence.known_mutations",
                    "evidence.provenance_type",
                    "evidence.known_mutations",
                    "access_level",
                    "unique_association_fields.mutation_type",
                    "target.activity",
                    "sourceID"
                ]
            };
            _.extend(opts, searchObj);
            $scope.search.tables.somatic_mutations.is_loading = true;
            return cttvAPIservice.getFilterBy( opts ).
                then(
                    function(resp) {
                        if( resp.body.data ){
                            $scope.search.tables.somatic_mutations.data = resp.body.data;
                            initTableMutations();
                        } else {
                            $log.warn("Empty response : somatic mutations");
                        }
                    },
                    cttvAPIservice.defaultErrorHandler
                ).
                finally(function(){
                    //$scope.search.tables.somatic_mutations.is_open = $scope.search.tables.somatic_mutations.data.length>0 || false;
                    $scope.search.tables.somatic_mutations.is_loading = false;
                });
        };



        /*
         *
         */
        var formatMutationsDataToArray = function(data){
            var newdata = [];
            data.forEach(function(item){
                var row = [];
                try{

                    // col 0: data origin: public / private
                    row.push( (item.access_level==cttvConsts.ACCESS_LEVEL_PUBLIC) ? accessLevelPublic : accessLevelPrivate );

                    // col 1: disease
                    row.push(item.disease.efo_info.label);


                    var mut = cttvDictionary.NA;
                    var samp = cttvDictionary.NA;
                    var patt = cttvDictionary.NA;


                    if(item.evidence.known_mutations){

                        // col 2: mutation type
                        if(item.sourceID == cttvConsts.dbs.INTOGEN){
                            mut = item.target.activity || mut;
                        } else {
                            mut = item.evidence.known_mutations.preferred_name || mut;
                        }



                        // col 3: samples
                        if( item.evidence.known_mutations.number_samples_with_mutation_type ){
                            samp = item.evidence.known_mutations.number_samples_with_mutation_type+"/"+item.evidence.known_mutations.number_mutated_samples || samp;
                        }


                        // col 4: inheritance pattern
                        patt = item.evidence.known_mutations.inheritance_pattern || patt;
                    }


                    row.push( clearUnderscores( mut ) );
                    row.push( samp );
                    row.push( patt );


                    // col 5: evidence source
                    row.push("<a href='"+item.evidence.urls[0].url+"' target='_blank' class='cttv-external-link'>"+item.evidence.urls[0].nice_name+"</a>");

                    // cols 6: publications
                    var refs = [];
                    if( checkPath(item, "evidence.provenance_type.literature.references") ){
                        refs = item.evidence.provenance_type.literature.references;
                    }
                    var pmidsList = cttvUtils.getPmidsList( refs );
                    row.push( cttvUtils.getPublicationsString( pmidsList ) );

                    // col 7: pub ids (hidden)
                    row.push(pmidsList.join(", "));



                    newdata.push(row); // push, so we don't end up with empty rows
                }catch(e){
                    $scope.search.tables.somatic_mutations.has_errors = true;
                    $log.log("Error parsing somatic mutation data:");
                    $log.log(e);
                }
            });

            return newdata;
        };



        var initTableMutations = function(){

            $('#mutations-table').DataTable( cttvUtils.setTableToolsParams({
                "data": formatMutationsDataToArray($scope.search.tables.somatic_mutations.data),
                //"ordering" : true,
                "order": [[1, 'asc']],
                "autoWidth": false,
                "paging" : true,
                "columnDefs" : [
                    {
                        "targets" : [0],    // the access-level (public/private icon)
                        "visible" : cttvConfig.show_access_level,
                        "width" : "3%"
                    },
                    {
                        "targets" : [7],    // the access-level (public/private icon)
                        "visible" : false
                    },
                    // now set the widths
                    {
                        "targets" : [1,2,4,5],
                        "width" : "18%"
                    },
                    {
                        "targets" : [3],
                        "width" : "9%"
                    },
                    /*{
                        "targets" : [4],
                        "width" : "22%"
                    },
                    {
                        "targets" : [0],
                        "width" : "0%"
                    }*/
                ],
            }, $scope.search.info.title+"-somatic_mutations") );
        };



        // =================================================
        //  M O U S E   D A T A
        // =================================================

        /*
        Probability:
        evidence.association_scrore.probability.value

        Mouse phenotypes:
        show the values for each key (e.g. circling, imapired balance, deafness, etc)
        evidence.properties.evidence_chain[1].biological object.properties.experiment_specific

        Human phenotypes:
        same as for moouse phenotypes
        biological object.properties.experiment specific
        */

        var getMouseData = function(){
            $scope.search.tables.animal_models.is_loading = true;
            var opts = {
                target:$scope.search.target,
                disease:$scope.search.disease,
                size: 1000,
                datasource: $scope.search.tables.animal_models.source, //cttvConfig.evidence_sources.animal_model,
                fields: [
                    "disease",
                    "evidence",
                    "scores",
                    "access_level"
                ]
            };
            _.extend(opts, searchObj);
            return cttvAPIservice.getFilterBy( opts ).
                then(
                    function(resp) {
                        if( resp.body.data ){
                            $scope.search.tables.animal_models.data = resp.body.data;
                            initTableMouse();
                        } else {
                            $log.warn("Empty response : animal models data");
                        }
                    },
                    cttvAPIservice.defaultErrorHandler
                ).
                finally(function(){
                    //$scope.search.mouse.is_open = $scope.search.mouse.data.length>0 || false;
                    $scope.search.tables.animal_models.is_loading = false;
                });
        };



        /*
         *
         */
        var formatMouseDataToArray = function(data){
            var newdata = [];
            data.forEach(function(item){
                // create rows:
                var row = [];

                try{

                    // data origin: public / private
                    row.push( (item.access_level==cttvConsts.ACCESS_LEVEL_PUBLIC) ? accessLevelPublic : accessLevelPrivate );

                    // disease
                    row.push(item.disease.efo_info.label);    // or item.disease.efo_info.label ???

                    // human
                    row.push( "<ul>" + item.evidence.disease_model_association.human_phenotypes.map(function(hp){return "<li>"+hp.label+"</li>"}).join("") + "</ul>" );

                    // mouse
                    row.push( "<ul>" + item.evidence.disease_model_association.model_phenotypes.map(function(hp){return "<li>"+hp.label+"</li>"}).join("") + "</ul>" );

                    // mouse model
                    var mousemodel = processMouseModelLinks( item.evidence.biological_model.allelic_composition, item.evidence.biological_model.allele_ids )
                                     + "<br/ >"
                                     + "<span class='small text-lowlight'>"+item.evidence.biological_model.genetic_background+"</span>"
                    row.push(mousemodel);


                    // evidence source
                    row.push(cttvDictionary.PHENODIGM);

                    // score -- hidden column now
                    row.push((item.scores.association_score).toFixed(2));


                    newdata.push(row); // push, so we don't end up with empty rows
                }catch(e){
                    $scope.search.tables.animal_models.has_errors = true;
                    $log.error("Error parsing mouse data:");
                    $log.error(e);
                }
            });

            return newdata;
        };



        var initTableMouse = function(){

            $('#mouse-table').DataTable( cttvUtils.setTableToolsParams({
                "data": formatMouseDataToArray($scope.search.tables.animal_models.data),
                "autoWidth": false,
                "paging" : true,
                "ordering" : true,
                "order": [[6, 'des']],
                "columnDefs" : [
                    {
                        "targets" : [0],    // the access-level (public/private icon)
                        "visible" : cttvConfig.show_access_level,
                        "width" : "3%"
                    },
                    {
                        "targets" : [6],    // score
                        "visible" : false
                    },
                    {
                        "targets" : [2,3,4],
                        "width" : "20%"
                    },
                    {
                        "targets" : [5],
                        "width" : "10%"
                    }
                ],
            }, $scope.search.info.title+"-mouse_models") );
        };



        /*
         * Takes a string like "Casr<Nuf>/Casr<+>" and returns "Casr<sup>Nuf</sup>/Casr<sup>+</sup>"
         */
        var processMouseModelData = function(mmd){
            return mmd.replace(/<(.*?)>/g, function(match){return "<sup>"+match.substr(1,match.length-2)+"</sup>";});
        };



        /*
         * Takes a string like "Casr<Nuf>/Casr<+>" and a string of ids like "MGI:3054788|MGI:3054788"
         * returns the original string with <a href> tags around each part "Casr<Nuf>" and "Casr<+>"
         */
        var processMouseModelLinks = function(mmd, id){
            var mmds = mmd.split("/");
            var ids = id.split("|");
            for(var i=0; i<mmds.length; i++){
                if(ids[i]){
                    mmds[i] = "<a href='http://informatics.jax.org/accession/"+ids[i]+"' target='_blank'>" + processMouseModelData(mmds[i]) + "</a>";
                }
            }
            return mmds.join("/");
        };



        // =================================================
        //  L I T E R A T U R E
        // =================================================

        /*
        Literature data for the "Text mining" table. Table fields are:
          - Disease: disease name (string)
          - Publication: publication description (string, long text)
          - Year: number
        */

        function parseResponse (recs, dt) {
        	
            //$log.log("parseResponse():recs", recs);
            //$log.log("parseResponse():dt", dt);
            dt.rows().every( function ( rowIdx, tableLoop, rowLoop ) {
                var data = this.data(); //data is previously preformatted table data that we need to add abstract info that came from pm
                //$log.log("parseResponse():data", data);

                var pmdata = recs.filter(function(item){
                    return item.pmid == data[2];
                });
                //$log.log("parseResponse():pmdata",pmdata);
                if(pmdata.length>0){

                    data[3]="";
                    var pub = pmdata[0];
                    // format author names
                    var auth = pub.authorString;

                    var authArr = [];
                    if (auth) {
                        authArr = auth.split(",");
                        data[9]=pub.authorString;
                    }
                    else{
                    	data[9] = "";
                    }
                    if(auth && auth.length>1){
                        authArr[0] = authArr[0] + " <span class='cttv-author-et-al'>et al.</span>";
                    }

                    if(authArr[0]){
                    	auth = authArr[0];
                    }
                    else{
                    	auth = "";
                    }

                    var abstractSection = "Abstract";
                    var abstractText = pub.abstractText?pub.abstractText:"No abstract supplied.";
                    var abstract = "<div id='"+data[2]+ abstractSection +"'>"+  abstractText+"</div>";

                    var abstractString ="<p class='small'><span onclick='angular.element(this).scope().displaySentences(\""+data[2]+ abstractSection +"\")'style='cursor:pointer'><i class='fa fa-chevron-circle-down' aria-hidden='true'></i>&nbsp;<span class='bold'>Abstract</span></p>";
                    var matchedSentences = $('#literature-table').DataTable().row(rowIdx).data()[5]; //this is details

                    var title = pub.title;
                    var abstractSentences;

                    if ($scope.search.tables.literature.abstractSentences[data[2]][data[6]]) {
                        abstractSentences = $scope.search.tables.literature.abstractSentences[data[2]][data[6]][data[7]];
                    }
                    if (abstractSentences && abstract) {

                        abstractSentences.map (function (f) {
                            var pos = abstract.indexOf(f.raw);
                            // console.log("    POS: " + pos);
                            //abstract = abstract.replace(f.raw, f.formattedHighlighted);
                            abstract = abstract.replace(f.raw, f.formatted);
                            //console.log("f.raw=", f.raw);
                            //console.log("f.formatted=", f.formatted);

                            // If not in the abstract, try the title
                            if (pos === -1) {
                                pos = title.indexOf(f.raw);
                                title = title.replace(f.raw, f.formatted);
                            }
                        });

                    }
                    var journalVolume = pub.journalInfo.volume ? pub.journalInfo.volume:"";
                    var journalIssue = pub.journalInfo.issue  ? "(" + pub.journalInfo.issue + ")":"";
                    var pageInfo     = pub.pageInfo ? ":" + pub.pageInfo:"";
                    var journalInfo = (pub.journalInfo.journal.medlineAbbreviation || pub.journalInfo.journal.title)+ " " + journalVolume + journalIssue + pageInfo;
                    if(!journalInfo){
                    	journalInfo = "";
                    }
                    var titleAndSource = "<span class=large><a href='#' onClick='angular.element(this).scope().openEuropePmc("+pub.pmid+")'>"+title+"</a></span>"
                        + "<br />"
                        + "<span class=small>"+auth +" "+journalInfo+ "</span>";

                    data[3] += titleAndSource + "<br/><br/>" +abstractString +abstract+ " <p class=small>" + (matchedSentences || "no matches available") + "</p>"
                    data[4] = pub.journalInfo.yearOfPublication; //this is column 4

                    data[8]=title;

                    data[10]=journalInfo;
                    var URL = "http://europepmc.org/abstract/MED/"+pub.pmid;

                    if(pub.abstractText){
                    	data[11]= pub.abstractText;
                    }

                    data[13]=URL;
                    //console.log("dataAfter", data);

                }
                this.data(data);

            } );

            dt.draw();
        }



        var getLiteratureData = function(){
            $scope.search.tables.literature.is_loading = true;
            $scope.search.tables.literature.maxShow = 200;
            var opts = {
                target:$scope.search.target,
                disease:$scope.search.disease,
                size: $scope.search.tables.literature.maxShow,
                datasource: $scope.search.tables.literature.source //cttvConfig.evidence_sources.literature,
                // TODO: change to 'datatype: literature' once available in the API; for now disgenet will do the trick.
            };
            _.extend(opts, searchObj);
            return cttvAPIservice.getFilterBy( opts ).
                then(
                    function(resp) {

                        if( resp.body.data ){

                            $scope.search.tables.literature.total = resp.body.total;

                            var unicode_re = /u([\dABCDEF]{4})/gi;
                            var match;

                            var sortedByDate = resp.body.data.sort (function (a, b) {
                                return new Date(b.evidence.date_asserted) - new Date(a.evidence.date_asserted);
                            });

                            var abstractSentences = {};
                            sortedByDate.map (function (paper) {

                                // WARNING: Unicode characters are encoded in the response, we convert them to symbol

                                paper.evidence.literature_ref.mined_sentences.map (function (sentence) {
                                    sentence.breakpoints = [];
                                    var text = sentence.text;
                                    while ((match = unicode_re.exec(text)) !== null) {
                                        var pos = match.index;
                                        sentence.text = sentence.text.replace('u'+match[1], String.fromCharCode(parseInt(match[1], 16)));
                                        sentence.breakpoints.push({
                                            "type": "unicode",
                                            "pos": pos,
                                            "extra": "",
                                            "span": 1
                                        });

                                    }
                                });
                            });

                            // create breakpoints for each sentence (unicodeChars, targets and diseases)
                            // Order the breakpoints
                            sortedByDate.map (function (paper) {
                                var pubmedId = paper.evidence.literature_ref.lit_id.split("/").pop();
                                if (!abstractSentences[pubmedId]) {
                                    abstractSentences[pubmedId] = {};
                                }
                                paper.evidence.literature_ref.mined_sentences.map (function (sentence) {

                                     if (sentence.t_start !== sentence.t_end) {
                                         sentence.breakpoints.push({
                                            "type": "t_start",
                                            "pos": sentence.t_start,
                                            "extra": '<span class="highlight-primary text-content-highlight">'
                                        });
                                        sentence.breakpoints.push({
                                            "type": "t_end",
                                            "pos": sentence.t_end+1,
                                            "extra": "</span>"
                                        });
                                     }

                                    if (sentence.d_start !== sentence.d_end) {
                                        sentence.breakpoints.push({
                                            "type": "d_start",
                                            "pos": sentence.d_start,
                                            "extra": '<span class="highlight-warning text-content-highlight">'
                                        });
                                        sentence.breakpoints.push({
                                            "type": "d_end",
                                            "pos": sentence.d_end+1,
                                            "extra": "</span>"
                                        });
                                    }
                                    // Sort the breakpoints by pos
                                    sentence.breakpoints = sentence.breakpoints.sort(function (a, b) {
                                        return a.pos - b.pos;
                                    });

                                    // Calculate the acc of offsets
                                    sentence.breakpoints = _.reduce(sentence.breakpoints, function (bps, bp, i) {
                                        bp.acc = i? (bps[i-1].acc + bps[i-1].extra.length) : 0;
                                        bps.push (bp);
                                        return bps;
                                    }, []);

                                    var text = sentence.text;
                                    // console.log("ORIG: " + text);
                                    sentence.breakpoints.map (function (bp) {
                                        // console.log(bp);
                                        if (bp.extra) {
                                            text = text.slice(0, bp.pos+bp.acc) + bp.extra + text.slice(bp.pos+bp.acc);
                                        }
                                        // console.log("=> " + text);
                                    });


                                    if (sentence.section === "abstract" || sentence.section === "title") {
                                        var efo = paper.disease.id;
                                        if (!abstractSentences[pubmedId][formatSource(paper.sourceID)]) {
                                            abstractSentences[pubmedId][formatSource(paper.sourceID)] = {};
                                        }
                                        if (!abstractSentences[pubmedId][formatSource(paper.sourceID)][efo]) {
                                            abstractSentences[pubmedId][formatSource(paper.sourceID)][efo] = [];
                                        }

                                        var highlightedSentence = '<span class="highlight-info text-content-highlight">' + text + '</span>';
                                        if (sentence.section === "abstract") {

                                           	abstractSentences[pubmedId][formatSource(paper.sourceID)][efo].push({
                                                'raw': sentence.text.trim(),
                                                'formatted':text,
                                                'formattedHighlighted':highlightedSentence
                                            });
                                        }
                                        else {//title
                                            abstractSentences[pubmedId][formatSource(paper.sourceID)][efo].push({
                                                'raw': sentence.text.trim(),
                                                'formatted':text
                                            });
                                        }
                                    }
                                    if (sentence.section === "abstract"){
                                        sentence.formattedHighlightedText = '<span class="highlight-info text-content-highlight">' + text + '</span>';
                                    }

                                    sentence.formattedText = text;

                                });
                            });


                            $scope.search.tables.literature.data = sortedByDate;
                            $scope.search.tables.literature.abstractSentences = abstractSentences;

                            var dt = initTableLiterature();
                            getLiteratureAbstractsData(dt);
                        } else {
                            $log.warn("Empty response : literature");
                        }
                    },
                    cttvAPIservice.defaultErrorHandler
                ).
                finally(function(){
                    $scope.search.tables.literature.is_loading = false;
                });
        };


        var formatSource = function (id) {
            var formatted;
            switch (id) {
                case 'europepmc':
                    formatted = cttvDictionary.EPMC; //"Europe PMC"; // using the dictionary to avoid duplicate hardcoded content
                    break;
                case 'disgenet':
                    formatted = cttvDictionary.DISGENET; //"DisGeNET";
                    break;
            }
            return formatted;
        };

        var getLiteratureAbstractsData = function(dt){
            $scope.loading = true;
            $scope.loaded = 0;

            // The expans_efo option may be retrieving the same article multiple times
            // Filter unique entries:
            var uniq = {};
            $scope.search.tables.literature.data.map (function (rec) {
                uniq[rec.evidence.literature_ref.lit_id.split("/").pop()] = 1;
            });
            var uniqPMIDs = Object.keys(uniq);
            // Chunk!
            var chunkSize = 10;
            var chunks = Math.ceil(uniqPMIDs.length / chunkSize);

            for (var i=0; i<chunks; i++) {
                var done = 0;
                //var thisRecords = $scope.search.tables.literature.data.slice(i*chunkSize, (i+1)*chunkSize);
                var thisRecords = uniqPMIDs.slice(i*chunkSize, (i+1)*chunkSize);
                var thisPMIDs = thisRecords.map(function (id) {
                    return "EXT_ID:" + id;
                }).join(" OR ");
                var url = "/proxy/www.ebi.ac.uk/europepmc/webservices/rest/search?pagesize=" + thisRecords.length + "&query=" + thisPMIDs + "&format=json&resulttype=core";
                //Should not this be a service call?
                $http.get(url)
                    .then (function (res) {
                        done++;
                        parseResponse(res.data.resultList.result, dt);
                        $scope.loaded = ~~(done * 100 / chunks);
                        if ($scope.loaded === 100) {
                            $timeout (function () {
                                $scope.loading = false;
                            }, 2000);

                        }
                    });
            }
        };

        var formatLiteratureDataToArray = function(data){

            var newdata = [];
            var cat_list = ["title", "intro", "result", "discussion", "conclusion", "other"];   // preferred sorting order

            data.forEach(function(item){

                // create rows:
                var row = [];

                // count number of sentences in a section
                var sectionCount = {};
                // Map that groups all sentences by section
                var sectionSentences = {};
                var sectionSentencesSimple = {};
                try{
                    // 0 data origin: public / private
                    row.push( (item.access_level==cttvConsts.ACCESS_LEVEL_PUBLIC) ? accessLevelPublic : accessLevelPrivate );

                    // 1 disease
                    row.push(item.disease.efo_info.label);

                    // 2 publication ID (hidden)
                    var parts = item.evidence.literature_ref.lit_id.split('/');
                    var id = parts.pop();
                    row.push( id );

                    // 3 publication
                    row.push( "<i class='fa fa-spinner fa-spin'></i>" );

                    // 4 total # of matched sentences
                    //row.push( '<a onclick="angular.element(this).scope().open('+newdata.length+')"><span class=badge>' + item.evidence.literature_ref.mined_sentences.length + '</span> ' + (newdata.length==1 ? ('sentence') : ('sentences')) + '</a>' );
                    //row.push( '<a class="literature-matched-sentences" onclick="angular.element(this).scope().open('+newdata.length+')"><span class=badge>' + item.evidence.literature_ref.mined_sentences.length + '</span></a>' );

                    // 4 year
                    row.push("<i class='fa fa-spinner fa-spin'></i>");

                    //  details (hidden)
                    // first sort the matched sentences by category to preferred order
                    item.evidence.literature_ref.mined_sentences.sort(function(a,b){
                        var a = a.section.toLowerCase();
                        var b = b.section.toLowerCase();

                        var ai = cat_list.length;
                        var bi = cat_list.length;
                        cat_list.forEach(function(li, i){
                            if( a.substr(0, li.length) === li ){
                                ai = i;
                            }
                            if( b.substr(0, li.length) === li ){
                                bi = i;
                            }
                        })

                        return +(ai > bi) || +(ai === bi) - 1;
                    });

                    sectionCount = countSentences(item.evidence.literature_ref.mined_sentences);
                    sectionSentences = prepareSectionSentences(item.evidence.literature_ref.mined_sentences);
                    sectionSentencesSimple = prepareSectionSentencesSimple(item.evidence.literature_ref.mined_sentences);
                    var previousSection = null;

                    // 5 sentences grouped by section and sections are sorted already
                    row.push(
                        item.evidence.literature_ref.mined_sentences.map(function(sent){

                        	var section = upperCaseFirst( clearUnderscores(sent.section));
                        	var sentenceString = "";
                        	if(section != 'Title' && section != 'Abstract') {

								if(previousSection != sent.section) {
									if(previousSection != null){ //this is not the first section with matched sentences
										sentenceString = sentenceString +'</div>';
									}
									sentenceString +="<p class='small'><span onclick='angular.element(this).scope().displaySentences(\""+ id + sent.section +"\")'style='cursor:pointer'><i class='fa fa-chevron-circle-down' aria-hidden='true'></i>&nbsp;<span class='bold'>" + section + ": </span>" + sectionCount[sent.section];
									sentenceString += " matched sentences</span></p>";
									previousSection = sent.section;

								}

								sentenceString += "<div id='" + id + sent.section + "' style='display:none'><ul style='margin-left: 10px;'>" + sectionSentences[sent.section] + "</ul></div>";
                        	}

                        	return sentenceString;
                        }).join("") + "</div>"
                    );

                    // 6 source like EuropePMC
                    row.push(checkPath(item, "sourceID") ? formatSource(item.sourceID) : "");

                    // 7 EFO (hidden)
                    row.push (item.disease.id);

                    // 8 this is hidden, map of categories and their matching sentences
                    row.push("<i class='fa fa-spinner fa-spin'></i>");
                    //9
                    row.push("<i class='fa fa-spinner fa-spin'></i>");
                    //10
                    row.push("<i class='fa fa-spinner fa-spin'></i>");
                    //11
                    row.push("<i class='fa fa-spinner fa-spin'></i>");

                    //12 less formatted matched sentences grouped
                    var previousSection1 = null;
                    var matchString = item.evidence.literature_ref.mined_sentences.map(function(sent){

                    	var sectionTitle = upperCaseFirst( clearUnderscores(sent.section));
                    	var sentenceString = "";

						if(previousSection1 != sent.section) { //see new section

							sentenceString +=  sectionTitle.toUpperCase() +": " ;
							previousSection1 = sent.section;
							sentenceString +=  sectionSentencesSimple[sent.section];
						}

                    	return sentenceString;
                    }).join("") + "</div>";

                    row.push(matchString);

                    //13
                    row.push("<i class='fa fa-spinner fa-spin'></i>");
                    newdata.push(row); // push, so we don't end up with empty rows


                }catch(e){
                    $scope.search.tables.literature.has_errors = true;
                    $log.error("Error parsing literature data:");
                    $log.error(e);
                }
            });


            return newdata;
        };

        // count the number of sentences in each section
        var countSentences = function(sentences) {
        	var count = {};
        	sentences.map(function(sentence) {

        		if(count[sentence.section] === undefined) {
        			count[sentence.section] = 1;
        		}
        		else {
        			count[sentence.section]++;
        		}
        	});

        	return count;
        };

        // group sentences in each section into one sentence
        var prepareSectionSentences = function(sentences) {
        	var sectionSentenceMap = {};
        	sentences.map(function(sentence) {

        		if(sentence.section != "abstract"){
	        		if(sectionSentenceMap[sentence.section] === undefined) {
	        			sectionSentenceMap[sentence.section] = "";
	        			sectionSentenceMap[sentence.section] +=  "<li>"+sentence.formattedText+"</li>";
	        		}
	        		else {
	        			sectionSentenceMap[sentence.section] +=  "<li>"+sentence.formattedText+"</li>";
	        		}
        		}
        	});

        	return sectionSentenceMap;
        };

        // group sentences in each section into one sentence
        var prepareSectionSentencesSimple = function(sentences) {
        	var sectionSentenceMap = {};
        	sentences.map(function(sentence) {
        		if(sectionSentenceMap[sentence.section] === undefined) {
        			sectionSentenceMap[sentence.section] = "";
        			sectionSentenceMap[sentence.section] +=  " "+sentence.formattedText+" ";
        		}
        		else {
        			sectionSentenceMap[sentence.section] +=  " "+sentence.formattedText+" ";
        		}
        	});

        	return sectionSentenceMap;
        };

		$scope.openEuropePmc = function(pmid){
			var URL = "http://europepmc.org/abstract/MED/"+pmid;
			window.open(URL);
		};

		$scope.open = function(id){
            var modalInstance = $uibModal.open({
              animation: true,
              template: '<div onclick="angular.element(this).scope().$dismiss()">'
                       +'    <span class="fa fa-circle" style="position:absolute; top:-12px; right:-12px; color:#000; font-size:24px;"></span>'
                       +'    <span class="fa fa-times"  style="position:absolute; top:-8px; right:-8px; color:#FFF; font-size:16px"></span>'
                       +'</div>'
                       +'<div class="cttv-literature-modal">'
                       +'<h5>Abstract</h5>'
                       +'<div>'+$('#literature-table').DataTable().row(id).data()[9]+'</div>'
                       +'</div>',

              size: 'lg',
              resolve: {
                items: function () {
                    return $scope.search.info;
                }
              }
            });

        };

        $scope.displaySentences = function(id) {

      		//make the collapse content to be shown or hide
      		$('#'+id).toggle("fast");
        };
        
        /**
         * Get the abstracts associated with the cluster cell selected
         */
        $scope.selectedCell = function(event) {
            $scope.cluster = event.group["label"];
            cttvAPIservice.getAbstract( {
                    target:$scope.search.target,
                    disease: $scope.search.disease,
            		datasource:'europepmc',
            		facets:'True',
            		abstract: $scope.cluster
                } ).
                then(
                    function(resp) {
                    	$scope.displayAbstracts = [];
                    	$scope.allData = resp.body.data;
                    	
                    	filterAbstracts($scope.slider.min, $scope.slider.max);
                    },
                    cttvAPIservice.defaultErrorHandler
                );
        }

        
        /**
         * Format the cluster data into groups
         */
        var formatClusterData = function(data) {
        	
        	var groups = [];
        	
        	for(var i=0; i< data.facets.abstract.buckets.length; i++) {
        		
        		var cluster = [];
        		
        		var term = data.facets.abstract.buckets[i];
        		
        		for(var j=0; j< term.cluster_terms.buckets.length; j++) {
        			
        			if(term.cluster_terms.buckets[j].key != term.key) {
        				cluster.push({"label": term.cluster_terms.buckets[j].key, "weight": term.cluster_terms.buckets[j].score});
        			}
        		}
        		
        		groups.push({"label": term.key, "groups": cluster, "weight": term.doc_count});
        	}

        	return groups;
        }

        
        /**
         * Get the cluster information for the foamtree,
         */
        var getCluster = function(){
        	
            // get cluster specific info
            cttvAPIservice.getCluster( {
                    target:$scope.search.target,
                    disease: $scope.search.disease,
                    facets: "True",
                    datasource: "europepmc"
                } ).
                then(
                    function(resp) {

                    	$scope.clusterData = formatClusterData(resp.body);
                    	$scope.displayAbstracts = resp.body.data;
                    	$scope.allData = resp.body.data;
		
                    	$scope.slider.min = getMinYear();
                    	$scope.slider.max = getMaxYear();
                    	$scope.slider.options.floor = getMinYear();
                    	$scope.slider.options.ceil = getMaxYear();
                    },
                    cttvAPIservice.defaultErrorHandler
                );
        };
        

        var initTableLiterature = function(){
        	
        	console.log("table data: ", formatLiteratureDataToArray($scope.search.tables.literature.data));
            return $('#literature-table').DataTable( cttvUtils.setTableToolsParamsExportColumns({
                "data": formatLiteratureDataToArray($scope.search.tables.literature.data),
                "autoWidth": false,
                "paging" : true,
                "ordering" : true,
                "order": [ [4, 'desc']],   // order by year
                "columnDefs" : [
                    {
                        "targets" : [2,5,6,7,8,9,10,11,12,13],
                        "visible" : false,
                    },
                    {
                        "targets" : [0],    // the access-level (public/private icon)
                        "visible" : cttvConfig.show_access_level ,
                        "width" : "3%"
                    },
                    {
                        "targets" : [1], //disease?
                        "width" : "12%"
                    }
                ],
            }, $scope.search.info.title+"-text_mining") );
        };

        // =================================================
        //  H E L P E R   M E T H O D S
        // =================================================


        // =================================================
        //  S C O P E   M E T H O D S
        // =================================================

        $scope.sectionOpen=function(who) {
           $log.info("tdc:sectionOpen", who);
            // Fire a target associations tree event for piwik to track
            $analytics.eventTrack('evidence', {"category": "evidence", "label": who});
        };

        // =================================================
        //  M A I N   F L O W
        // =================================================

        $log.info("target-disease-controller");
        var path = $location.path().split("/");
        $log.info(path);
        // parse parameters
        $scope.search.target = path[2];
        $scope.search.disease = path[3];

        // and fire the info search
        getInfo();
        	
        getCluster();


        // get the data for the flower graph
        getFlowerData()
            .then(function(){
                // then get data for all then
                getCommonDiseaseData();
                getRareDiseaseData();
                getMutationData();
                getDrugData();
                getRnaExpressionData();
                getPathwaysData();
                getLiteratureData();
                getMouseData();
            });

        var render = function(new_state, old_state){
            var view = new_state["view"] || {};
            var sec = view.sec;
            if(sec && sec[0] && $scope.search.tables[ sec[0] ]){
                $scope.search.tables[ sec[0] ].is_open = true;

                // scrolling before we have the data is unlikely to work:
                // at best it will scroll a little bit, but not much, because there won't be any height to allow scolling
                // leaving this here for now.
                // TODO: will have to think of a more elegant way of managing this, for example load all data in sequence
                $anchorScroll( "tables" );
            }
        }

        $scope.$on(cttvLocationState.STATECHANGED, function (e, new_state, old_state) {
            // at the moment this shouldn't be trigger other than when rerouting from an old style link
            render( new_state, old_state );
        });

        // if old link, do a rerouting to new style links
        if( !cttvLocationState.getState()["view"] && cttvLocationState.getState()["sec"] ){
            $location.search( 'view=sec:' + cttvLocationState.getState()["sec"]);
        }

        render(cttvLocationState.getState(), cttvLocationState.getOldState());

    }]);
