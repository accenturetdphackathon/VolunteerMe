angular.module('mainController', ['authServices', 'userServices'])
  .controller('mainCtrl', function($timeout, $location, $rootScope, $interval, $window, $route, Auth, User, AuthToken) {

    var app = this;
    app.loadme = false;
    app.showModal = true;
    app.events;
    app.newUserInfo = {
      firstName: "",
      lastName: "",
      major: "",
      sex: "",
      year: "",
      nationality: "",
      ethnicity: "",
      username: ""
    };

    this.openRequestModal = function() {
      app.errorMsg = false;
      app.successMsg = false;

      $("#createRequestModal").modal({
        backdrop: 'static',
        keyboard: false
      });

      app.showModal = true;
    };

    this.closeRequestModal = function(requestData) {
      $('#createRequestModal').modal('hide');
      $window.location.reload();
    };

    this.createRequest = function(requestData) {
      app.successMsg = false;
      app.errorMsg = false;

      User.addRequest(app.requestData).then(function(data) {
        if (data.data.success) {
          app.successMsg = data.data.message;
          app.showModal = false;
        } else {
          app.errorMsg = data.data.message;
        }
      });

      app.requestData = '';
    };

    this.openPointsSystemModal = function() {
      $("#pointsSystemModal").modal({
        backdrop: 'static',
        keyboard: false
      });
    }

    this.closePointsSystemModal = function() {
      $('#pointsSystemModal').modal('hide');
    }

    app.checkSession = function() {
      if (Auth.isLoggedIn()) {
        app.checkInSession = true;
        var interval = $interval(function() {
          var token = $window.localStorage.getItem('token');

          if (token === null) {
            $interval.cancel(interval);
          } else {

            self.parseJwt = function(token) {
              var base64url = token.split('.')[1];
              var base64 = base64url.replace('-', '+').replace('_', '/');
              return JSON.parse($window.atob(base64));
            };

            var expireTime = self.parseJwt(token);
            var timeStamp = Math.floor(Date.now() / 1000);

            var timeCheck = expireTime.exp - timeStamp;

            // console.log("SECONDS LEFT: " + timeCheck);

            if (timeCheck <= 600 && timeCheck > 0) {
              console.log("TOKEN EXPIRATION: " + timeCheck);
              showModal(1);
              $interval.cancel(interval);
            } else if (timeCheck <= 0){
              app.isLoggedIn = false;
              Auth.logout();
            }
          }
        }, 1000);
      }
    };

    app.checkSession();

    var showModal = function(option) {
      app.choiceMade = false;
      app.modalHeader = undefined;
      app.modalBody = undefined;
      app.hideButton = false;

      if (option === 1) {
        app.modalHeader = 'Timeout Warning';
        app.modalBody = 'Your session will expire in 10 minutes. Would you like to renew your session?';

        $("#tokenExpire").modal({
          backdrop: "static"
        });

        $timeout(function() {
          if (!app.choiceMade) app.endSession();
        }, 60000);

      } else if (option === 2) {
        app.hideButton = true;
        app.modalHeader = 'Logging out';

        $("#tokenExpire").modal({
          backdrop: "static"
        });

        $timeout(function() {
          Auth.logout();
          $location.path('/');
          hideModal();
          $window.location.reload();
        }, 1000);
      }
    };

    app.renewSession = function() {
      app.choiceMade = true;

      User.renewSession(app.username).then(function(data) {
        if (data.data.success) {
          AuthToken.setToken(data.data.token);
          app.checkSession();
        } else {
          app.modalBody = data.data.message;
        }
      });
      hideModal();
    };

    app.endSession = function() {
      app.choiceMade = true;
      hideModal();
      $timeout(function() {
        showModal(2);
      }, 1000);
    };

    var hideModal = function() {
      $("#tokenExpire").modal('hide');
    };

    $rootScope.$on('$routeChangeStart', function() {

      if (!app.checkInSession) app.checkSession();

      if (Auth.isLoggedIn()) {
        app.isLoggedIn = true;

        Auth.getUser().then(function(data) {
          app.firstName = data.data.firstName;
          app.lastName = data.data.lastName;
          app.username = data.data.username;
          app.email = data.data.email;
          app.major = data.data.major;
          app.year = data.data.year;
          app.nationality = data.data.nationality;
          app.ethnicity = data.data.ethnicity;
          app.sex = data.data.sex;
          app.points = data.data.points;
          app.fallPoints = data.data.fallPoints
          app.springPoints = data.data.springPoints;
          app.summerPoints = data.data.summerPoints;
          app.events = data.data.events;
          app.bookmarks = data.data.bookmarks;

          app.newUserInfo.username = data.data.username;

          User.getPermission().then(function(data) {
            if (data.data.message === 'admin') {
              app.authorized = true;
              app.loadme = true;
            } else {
              app.authorized = false;
              app.loadme = true;
            }
          });

          User.getPercentile(app.username).then(function(data) {
            if (data.data.success) {
              app.fallPercentile = data.data.message.fall;
              app.springPercentile = data.data.message.spring;
              app.summerPercentile = data.data.message.summer;
            }
          });

          app.codeArray = [];

          if (app.events) {
            for (var i = 0; i < app.events.length; i++) {
              User.getCodeInfo(app.events[i]._id).then(function(codeData) {
                app.codeArray.push(codeData.data.message);
              });
            }
          }
        });

      } else {
        app.isLoggedIn = false;
        app.loadme = true;
        app.username = '';
        app.email = '';
      }
    });

    this.doLogin = function(loginData) {
      app.errorMsg = false;

      Auth.login(app.loginData).then(function(data) {
        if (data.data.success) {
          app.successMsg = data.data.message;
          $timeout(function() {
            $location.path('/rewards');
            app.loginData = '';
            app.successMsg = false;
            app.checkSession();
          }, 1000);
        } else {
          app.errorMsg = data.data.message;
        }
      });
    };

    app.logout = function() {
      showModal(2);
    };

    this.editUser = function(newUserInfo) {
      User.editUserInfo(app.newUserInfo).then(function(data) {
        if (data.data.empty) {
          app.errorUpdateProfile = false;
          app.successUpdateProfile = false;
          app.emptyUpdateProfile = data.data.message;
        }
        if (data.data.success) {
          app.errorUpdateProfile = false;
          app.emptyUpdateProfile = false;
          app.successUpdateProfile = data.data.message;
          $timeout(function() {
            app.successUpdateProfile = false;
            $window.location.reload();
          }, 1000);
        } else {
          app.emptyUpdateProfile = false;
          app.successUpdateProfile = false;
          app.errorUpdateProfile = data.data.message;
        }
      });
    };

    app.openUpdateProfile = function() {
      app.errorUpdateProfile = false;
      app.successUpdateProfile = false;

      $("#profileUpdate").modal({
        backdrop: "static"
      });
    };

    app.closeUpdateProfile = function() {
      $('#profileUpdate').modal('hide');
      app.newUserInfo.firstName = "";
      app.newUserInfo.lastName = "";
      app.newUserInfo.nationality = "";
      app.newUserInfo.sex = "";
      app.newUserInfo.ethnicity = "";
      app.newUserInfo.major = "";
      app.newUserInfo.year = "";
    };
  });
