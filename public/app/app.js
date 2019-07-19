angular.module('userApp', ['appRoutes', 'userControllers', 'userServices', 'mainController', 'authServices', 'emailController', 'adminController', 'statsController', 'alumniController', 'corporateController'])

  .config(function($httpProvider) {
    $httpProvider.interceptors.push('AuthInterceptors');
  });
