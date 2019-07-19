angular.module('alumniController', ['userServices'])
  .controller('alumniCtrl', function($window, $scope, $filter, User) {

    var app = this;

    var orderBy = $filter('orderBy');

    User.getAlumni().then(function(data) {
      app.alumniArray = data.data.message;

      User.getCoordinates().then(function(data) {
        app.coordinates = data.data.message;

        var mymap = L.map('mapid').setView([39.8283, -98.5795], 4);

        L.tileLayer('https://api.tiles.mapbox.com/v4/{id}/{z}/{x}/{y}.png?access_token=pk.eyJ1IjoibWFwYm94IiwiYSI6ImNpejY4NXVycTA2emYycXBndHRqcmZ3N3gifQ.rJcFIG214AriISLbB6B5aw', {
          maxZoom: 18,
          id: 'mapbox.streets'
        }).addTo(mymap);

        for (var i = 0; i < app.coordinates.length; i++) {
          marker = new L.marker(app.coordinates[i])
            .bindPopup("<strong class='all-caps'>" + app.alumniArray[i].name + "</strong> <br> <strong>Location:</strong> " + app.alumniArray[i].city + ", " + app.alumniArray[i].state + "<br> <strong>Employer:</strong> " + app.alumniArray[i].employer + "<br> <strong>Position/Title:</strong> " + app.alumniArray[i].position + "<br> <strong>Undergrad. Degree:</strong> " + app.alumniArray[i].undergrad + "<br> <strong>Grad. Degree:</strong> " + app.alumniArray[i].grad + "</strong> <br> <strong>Country of Origin:</strong> " + app.alumniArray[i].nationality + "</strong> <br> <strong>LinkedIn Profile:</strong> " + "<a href='" + app.alumniArray[i].linkedIn + "' target='_blank'> View Profile </a>")
            .addTo(mymap);
        }
      });
    });

    this.sortBy = function(propertyName, array) {
      $scope.reverse = (propertyName !== null && $scope.propertyName === propertyName) ?
        !$scope.reverse : false;
      $scope.propertyName = propertyName;
      app.alumniArray = orderBy(array, $scope.propertyName, $scope.reverse);
    };
  });
