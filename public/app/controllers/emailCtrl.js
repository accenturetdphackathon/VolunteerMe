angular.module('emailController', ['userServices'])

  .controller('usernameCtrl', function($timeout, $window, $location, User) {

    app = this;

    app.sendUsername = function(userData, valid) {
      app.errorMsg = false;

      if (valid) {
        User.sendUsername(app.userData.email).then(function(data) {
          if (data.data.success) {
            app.successMsg = data.data.message;
            $timeout(function() {
              $location.path('/login');
            }, 1000);
          } else {
            app.errorMsg = data.data.message;
          }
        });
      } else {
        app.errorMsg = 'Please enter a valid email';
      }
    };
  })

  .controller('passwordCtrl', function($timeout, $window, $location, User) {

    app = this;

    app.sendPassword = function(resetData, valid) {
      app.errorMsg = false;

      if (valid) {
        User.sendPassword(app.resetData).then(function(data) {
          if (data.data.success) {
            app.successMsg = data.data.message;
            $timeout(function() {
              $location.path('/login');
            }, 1000);
          } else {
            app.errorMsg = data.data.message;
          }
        });
      } else {
        app.errorMsg = 'Please enter a valid username';
      }
    };
  })

  .controller('resetCtrl', function($timeout, $window, $location, $routeParams, $scope, User) {

    app = this;
    app.hide = true;

    User.resetPassword($routeParams.token).then(function(data) {

      if (data.data.success) {
        app.hide = false;
        app.successMsg = 'Please enter a new password';

        $scope.username = data.data.user.username;

      } else {
        app.errorMsg = data.data.message;
      }
    });

    app.savePassword = function(regData, valid) {
      app.errorMsg = false;

      if (valid) {
        app.regData.username = $scope.username;
        User.savePassword(app.regData).then(function(data) {
          if (data.data.success) {
            app.successMsg = data.data.message;
            $timeout(function() {
              $location.path('/login');
            }, 1000);
          } else {
            app.errorMsg = data.data.message.errors.password.message;
          }
        });
      } else {
        app.errorMsg = 'Please ensure the form is filled out properly';
      }
    };

  });
