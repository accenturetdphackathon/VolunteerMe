angular.module('authServices', [])

  .factory('Auth', function($http, AuthToken) {
    var authFactory = {};

    // AUTHENTICATE USER
    authFactory.login = function(authData) {
      return $http.post('/api/authenticate', authData).then(function(data) {
        AuthToken.setToken(data.data.token);
        return data;
      });
    };

    // VERIFY THAT THE USER IS LOGGED IN FOR NAVBAR
    authFactory.isLoggedIn = function() {
      if (AuthToken.getToken()) {
        return true;
      } else {
        return false;
      }
    };

    // SEND LOGGED IN USER INFORMATION
    authFactory.getUser = function() {
      if (AuthToken.getToken()) {
        return $http.post('/api/me');
      } else {
        $q.reject({
          message: 'Please log out and log back in!'
        });
      }
    };

    authFactory.logout = function() {
      AuthToken.setToken();
    };

    return authFactory;
  })

  .factory('AuthToken', function($window) {
    var authTokenFactory = {};

    authTokenFactory.setToken = function(token) {
      $window.localStorage.setItem('token', token);

      if (token) {
        $window.localStorage.setItem('token', token);
      } else {
        $window.localStorage.removeItem('token');
      }
    };

    authTokenFactory.getToken = function() {
      return $window.localStorage.getItem('token');
    };

    return authTokenFactory;
  })

  .factory('AuthInterceptors', function(AuthToken) {
    var AuthInterceptorsFactory = {};

    AuthInterceptorsFactory.request = function(config) {
      var token = AuthToken.getToken();

      if (token) {
        config.headers['x-access-token'] = token;
      }

      return config;
    };

    return AuthInterceptorsFactory;
  });
