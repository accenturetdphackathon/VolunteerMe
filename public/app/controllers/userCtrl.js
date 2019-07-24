angular.module('userControllers', ['userServices'])
  .controller('regCtrl', function($http, $location, $timeout, User) {

    var app = this;

    app.regVolunteer = function(regData) {
      app.errorMsg = false;

      User.create(app.regData).then(function(data) {
        if (data.data.success) {
          app.successMsg = data.data.message;
          $timeout(function() {
            $location.path('/login');
          }, 1500);
        } else {
          app.errorMsg = data.data.message;
        }
      });
    };
  })

  .directive('match', function() {
    return {
      restrict: 'A',
      controller: function($scope) {

        $scope.confirmed = false;

        $scope.doConfirm = function(values) {
          values.forEach(function(ele) {

            if ($scope.confirm == ele) {
              $scope.confirmed = true;
            } else {
              $scope.confirmed = false;
            }
          });
        };
      },

      link: function(scope, element, attrs) {

        attrs.$observe('match', function() {
          scope.matches = JSON.parse(attrs.match);
          scope.doConfirm(scope.matches);
        });

        scope.$watch('confirm', function() {
          scope.matches = JSON.parse(attrs.match);
          scope.doConfirm(scope.matches);
        });
      }
    };
  });
