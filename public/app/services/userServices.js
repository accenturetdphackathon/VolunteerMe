angular.module('userServices', [])

  .factory('User', function($http) {
    var userFactory = {};

    // CREATE/REGISTER USERS
    userFactory.create = function(regData) {
      return $http.post('/api/users', regData);
    };

    // CREATE EVENT CODES
    userFactory.createCode = function(eventData) {
      return $http.post('api/codes/', eventData);
    };

    // FORGOT USERNAME
    userFactory.sendUsername = function(userData) {
      return $http.get('/api/forgetusername/' + userData);
    };

    // SEND PASSWORD RESET EMAIL
    userFactory.sendPassword = function(resetData) {
      return $http.put('/api/resetpassword', resetData);
    };

    // PASSWORD RESET
    userFactory.resetPassword = function(token) {
      return $http.get('/api/resetpassword/' + token);
    };

    // SAVE PASSWORD
    userFactory.savePassword = function(regData) {
      return $http.put('/api/savepassword/', regData);
    };

    // RENEW USER TOKEN
    userFactory.renewSession = function(username) {
      return $http.get('/api/renewtoken/' + username);
    };

    // DETERMINE USER PERMISSION
    userFactory.getPermission = function() {
      return $http.get('/api/permission/');
    };

    // RETRIEVE ALL USERS
    userFactory.getUsers = function() {
      return $http.get('api/admin/');
    };

    // RETRIEVE ALL EVENT CODES
    userFactory.getCodes = function() {
      return $http.get('api/getcodes/');
    };

    // ADD A NEW REQUEST TO THE USER
    userFactory.addRequest = function(requestData) {
      return $http.put('api/addrequest/', requestData);
    };

    // GRAB EVENT CODE INFORMATION FOR INDIVIDUAL USERS
    userFactory.getCodeInfo = function(codeData) {
      return $http.get('api/getcodeinfo/' + codeData);
    };

    // GRAB ALL THE REQUESTS
    userFactory.getRequests = function() {
      return $http.get('api/getrequests/');
    };

    // APPROVE REQUESTS
    userFactory.approveRequest = function(approveData) {
      return $http.put('api/approverequest/', approveData);
    };

    // DENY REQUESTS
    userFactory.denyRequest = function(denyData) {
      return $http.put('api/denyrequest/', denyData);
    };

    // GET TOTAL USER PERCENTILE
    userFactory.getPercentile = function(userData) {
      return $http.get('api/getpercentile/' + userData);
    };

    // GET ATTENDANCE FOR A SPECIFIC EVENT
    userFactory.getAttendance = function(eventId) {
      return $http.get('api/getattendance/' + eventId);
    };

    // MANUALLY GIVE A USER POINTS FOR AN EVENT
    userFactory.manualInput = function(manualInputData) {
      return $http.put('api/manualinput/', manualInputData);
    };

    // GET STATISTIC INFORMATION FOR MAJOR
    userFactory.getMemberMajorStat = function() {
      return $http.get('api/getmembermajorstat/');
    };

    // GET STATISTIC INFORMATION FOR YEAR
    userFactory.getMemberYearStat = function() {
      return $http.get('api/getmemberyearstat/');
    };

    // GET STATISTIC INFORMATION FOR NATIONALITY
    userFactory.getMemberNationalityStat = function() {
      return $http.get('api/getmembernationalitystat/');
    };

    // GET STATISTIC INFORMATION FOR SEX
    userFactory.getMemberSexStat = function() {
      return $http.get('api/getmembersexstat/');
    };

    // GET STATISTIC INFORMATION FOR ETHNICITY
    userFactory.getMemberEthnicityStat = function() {
      return $http.get('api/getmemberethnicitystat/');
    };

    // GET STATISTIC FOR POINT DISTRIBUTION FOR THE SEMESTER
    userFactory.getTotalPointDistribution = function() {
      return $http.get('api/gettotalpointdistribution/');
    };

    // GET STATISTIC FOR POINT DISTRIBUTION FOR FALL SEMESTER
    userFactory.getFallPointDistribution = function() {
      return $http.get('api/getfallpointdistribution/');
    };

    // GET STATISTIC FOR POINT DISTRIBUTION FOR SPRING SEMESTER
    userFactory.getSpringPointDistribution = function() {
      return $http.get('api/getspringpointdistribution/');
    };

    // GET STATISTIC FOR POINT DISTRIBUTION FOR SUMMER SEMESTER
    userFactory.getSummerPointDistribution = function() {
      return $http.get('api/getsummerpointdistribution/');
    };

    // GET ALL ALUMNIS
    userFactory.getAlumni = function() {
      return $http.get('api/getalumni/');
    };

    // GET THE ALUMNI COORDINATES
    userFactory.getCoordinates = function() {
      return $http.get('api/getcoordinates/');
    };

    // GENERATE AN EXCEL DOCUMENT FOR A SPECIFIC EVENT
    userFactory.getExcelDoc = function(eventId) {
      return $http.get('api/getexceldoc/' + eventId);
    };

    // GET SPECIFIC INFO FOR A USER
    userFactory.getUserInfo = function(username) {
      return $http.get('api/getuserinfo/' + username);
    };

    // UPDATING USER INFO
    userFactory.editUserInfo = function(userInfo) {
      return $http.put('api/edituserinfo/', userInfo);
    };
    //CHANGING USER PERMISSION
    userFactory.changeUserPermission = function(updateUser){
      return $http.put('api/changeuserpermission/', updateUser);
    };

    // ADD A COMPANY INTO THE CORPORATE DATABASE
    userFactory.addCompany = function(companyInfo) {
      return $http.post('api/addcompany/', companyInfo);
    };

    // GET ALL OF THE COMPANIES IN THE CORPORATE DATABASE
    userFactory.getCompanies = function() {
      return $http.get('api/getcompanies/');
    };

    // GET THE INFORMATION FOR A SPECIFIC COMPANY
    userFactory.getCompanyInfo = function(companyId) {
      return $http.get('api/getcompanyinfo/' + companyId);
    };

    // REMOVE A COMPANY FROM THE CORPORATE DATABASE
    userFactory.removeCompany = function(companyName) {
      return $http.delete('api/removecompany/' + companyName);
    };

    // ADD A BOOKMARK TO THE USER
    userFactory.addBookmark = function(companyId) {
      return $http.put('api/addbookmark/' + companyId);
    };

    // GET THE INFORMATION FOR A USER'S BOOKMARKS
    userFactory.getBookmarkInfo = function(companyId) {
      return $http.get('api/getbookmarkinfo/' + companyId);
    };

    userFactory.removeBookmark = function(companyId) {
      return $http.put('api/removebookmark/' + companyId);
    };

    return userFactory;


  });
