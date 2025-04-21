import DefaultHttpClient from '../index';

// Example 1: Basic GET request
const client = new DefaultHttpClient();
client.get('https://jsonplaceholder.typicode.com/posts/1')
    .then(data => console.log('GET result:', data));

// Example 2: Setting default headers
client.setDefaults({
    headers: {
        'Authorization': 'Bearer my-token',
        'Content-Type': 'application/json'
    }
});
client.get('https://jsonplaceholder.typicode.com/posts/2')
    .then(data => console.log('GET with default headers:', data));

// Example 3: POST request with data
client.post('https://jsonplaceholder.typicode.com/posts', {
    title: 'foo',
    body: 'bar',
    userId: 1
}).then(data => console.log('POST result:', data));

// Example 4: Using interceptors
client.setInterceptor({
    request: (config) => {
        console.log('Request Interceptor:', config);
        return config;
    },
    response: (response) => {
        console.log('Response Interceptor:', response);
        return response;
    },
    responseError: (error) => {
        console.error('Response Error Interceptor:', error);
        throw error;
    }
});
client.get('https://jsonplaceholder.typicode.com/posts/3')
    .then(data => console.log('GET with interceptors:', data));