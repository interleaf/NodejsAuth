angular.module('authService', [])

// ===================================================
// auth factory to login and get information
// inject $http for communicating with the API
// inject $q to return promise objects
// inject AuthToken to manage tokens
// ===================================================
.factory('Auth', function($http, $q, AuthToken) {

	// create auth factory object
	var authFactory = {};

	// log a user in
	authFactory.login = function(username, password) {

		// return the promise object and its data
		return $http.post('/api/authenticate', {
			username: username,
			password: password
		})
			.success(function(data) {
        AuthToken.setToken(data.token);
        console.log('login set token ' + data.token); 
       	return data;
			});
	};

	// log a user out by clearing the token
	authFactory.logout = function() {
		// clear the token
		AuthToken.setToken();
	};

	// check if a user is logged in
	// checks if there is a local token
	authFactory.isLoggedIn = function() {
		if (AuthToken.getToken()) 
			return true;
		else
			return false;	
	};

	// get the logged in user
	authFactory.getUser = function() {
		if (AuthToken.getToken())
			//return $http.get('/api/me', { cache: true });
			return $http.get('/api/me');
		else
			return $q.reject({ message: 'User has no token.' });		
	};

	authFactory.createSampleUser = function() {
		$http.post('/api/sample');
	};

	// return auth factory object
	return authFactory;

})

// ===================================================
// factory for handling tokens
// inject $window to store token client-side
// ===================================================
.factory('AuthToken', function($window) {

	var authTokenFactory = {};

	// get the token out of local storage
	authTokenFactory.getToken = function() {
		return $window.sessionStorage.getItem('token');
	};

	// function to set token or clear token
	// if a token is passed, set the token
	// if there is no token, clear it from local storage
	authTokenFactory.setToken = function(token) {
		if (token) {
			$window.sessionStorage.setItem('token', token);

    }
	 	else {
			$window.sessionStorage.removeItem('token');
    }
	};

	return authTokenFactory;

})

// ===================================================
// application configuration to integrate token into requests
// ===================================================
.factory('AuthInterceptor', function($q, $location, AuthToken) {

	var interceptorFactory = {};

	// this will happen on all HTTP requests
	interceptorFactory.request = function(config) {

		// grab the token
		var token = AuthToken.getToken();
		// if the token exists, add it to the header as x-access-token
		if (token) {
			config.headers['x-access-token'] = token;
      //console.log('req set header ' + token);
    }
		
		return config;
	};


	// happens on response errors
	interceptorFactory.responseError = function(response) {

		// if our server returns a 403 forbidden response
		if (response.status == 403) {
			AuthToken.setToken();
      //console.log('403 clear token, redirect to login');
			$location.path('/login');
		}

		// return the errors from the server as a promise
    return response;
		//return $q.reject(response);
	};

  // happens on all HTTP response
  interceptorFactory.response = function(response) {
    var token = response.headers('x-access-token');
    if (token) {
      console.log('res set token ' + token);
      AuthToken.setToken(token);
    }
    return response;
  };

	return interceptorFactory;
	
});
