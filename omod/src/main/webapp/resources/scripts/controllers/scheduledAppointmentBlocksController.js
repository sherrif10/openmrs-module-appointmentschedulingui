angular.module('appointmentscheduling.scheduledAppointmentBlocks')
    .controller('ScheduledAppointmentBlockController', ['$scope','AppointmentService',
    'LocationService', 'ngGridPaginationFactory',
    function ($scope, AppointmentService, LocationService, ngGridPaginationFactory) {

        var locationSearchParams = {};
        if (supportsAppointmentsTagUuid) {
            locationSearchParams['tag'] = supportsAppointmentsTagUuid;
        };

        LocationService.getLocations(locationSearchParams).then(function (result){
                $scope.locations = result;
                scheduledAppointmentBlocksHelper.setUpLocationFilter($scope);
        });

        $scope.filterDate = Date.now();
        $scope.datePicker = scheduledAppointmentBlocksHelper.setupDatePicker($scope);
        $scope.services = [{name: emr.message("appointmentschedulingui.dailyScheduledAppointments.allServiceTypes"), uuid: null}];
        $scope.serviceFilter = $scope.services[0];
        $scope.serviceFilterChange = false;
        $scope.showNoScheduledAppointmentBlocks = false;
        $scope.showLoadingMessage = false;
        $scope.filterOptions = {
          filterText: ''  ,
          useExternalFilter: false
        };

        $scope.filterObjects = { provider: "", serviceType: "", appointmentBlock: ""};

        $scope.scheduledAppointmentBlocksGrid = scheduledAppointmentBlocksHelper.setUpGrid($scope);
        $scope.scheduledAppointmentBlocks = [];
        $scope.totalScheduledAppointmentBlocks = [];

        $scope.updatePagingData = function(){

            $scope.scheduledAppointmentBlocks =  $scope.setPagingData($scope.totalScheduledAppointmentBlocks);
            $scope.totalServerItems = $scope.totalScheduledAppointmentBlocks.length;
            if (!$scope.$$phase) {
                $scope.$apply();
            }
        };

        ngGridPaginationFactory.includePagination($scope, $scope.scheduledAppointmentBlocksGrid, $scope.updatePagingData);

        $scope.getScheduledAppointmentBlocks = function(){
            var date = new Date($scope.filterDate);
                var location = $scope.locationFilter;
            var serviceType = $scope.serviceFilter;
            var params = { 'date' : moment(date).format('YYYY-MM-DD'),
                           'location' : location.uuid,
                           'appointmentType' : serviceType.uuid};

            scheduledAppointmentBlocksHelper.initializeMessages($scope);

            AppointmentService.getScheduledAppointmentBlocks(params).then( function(results){
                parsedScheduledAppointmentBlocks = appointmentParser.parseScheduledAppointmentBlocks(results);
                $scope.scheduledAppointmentBlocks = parsedScheduledAppointmentBlocks;
                $scope.totalScheduledAppointmentBlocks = parsedScheduledAppointmentBlocks;
                scheduledAppointmentBlocksHelper.findProvidersFromGrid($scope);
                scheduledAppointmentBlocksHelper.findAppointmentBlockFromGrid($scope);

                if(!$scope.serviceFilterChange)
                scheduledAppointmentBlocksHelper.findServiceTypesFromGrid($scope);

                scheduledAppointmentBlocksHelper.manageMessages($scope);
                $scope.updatePagingData();
            });
        };

        $scope.newSelectedProvider = function(provider){
            if(provider == emr.message("appointmentschedulingui.dailyScheduledAppointments.allProviders"))
                $scope.filterObjects.provider = '';
            else $scope.filterObjects.provider = emr.message("appointmentschedulingui.dailyScheduledAppointments.provider") + ':' + provider + ';';
            $scope.updateFilters();
        };

        $scope.newSelectedServiceType = function(){
            $scope.serviceFilterChange =true;
        };

        $scope.newSelectedAppointmentBlock = function(appointmentBlock){
            if(appointmentBlock == emr.message("appointmentschedulingui.dailyScheduledAppointments.allAppointmentBlocks"))
                $scope.filterObjects.appointmentBlock = '';
            else {
                var filterTextAppointmentBlock =  appointmentBlock.replace(/:/g, "\\x3a");
                $scope.filterObjects.appointmentBlock = emr.message("appointmentschedulingui.dailyScheduledAppointments.timeBlock") + ':' + filterTextAppointmentBlock + ';';
            }
            $scope.updateFilters();
        };

        $scope.updateFilters = function () {
            $scope.filterOptions.filterText = $scope.filterObjects.provider + $scope.filterObjects.serviceType + $scope.filterObjects.appointmentBlock;
        }
        $scope.$watch('serviceFilter', $scope.getScheduledAppointmentBlocks, true);
        $scope.$watch('filterDate', $scope.getScheduledAppointmentBlocks, true);
        $scope.$watch('locationFilter', function(newValue, oldValue) {
                if (newValue!= oldValue) {
                    $scope.getScheduledAppointmentBlocks();
                }
        });
    }]);
