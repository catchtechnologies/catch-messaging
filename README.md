# Catch Messaging
Publish messages and subscribe to message channels on Catch Service Management Gateways.

## Requirements  
This package uses (redis)[https://redis.io] pubsub for messaging and requires a local redis instance to be running.

## Usage  
``npm i catch-messaging``  
  
```javascript
var Messaging = require('catch-messaging');
const serviceName = 'Messaging Test';
const debug = true;

// Sample commands for testing.
var serviceCommands = [
  {
    endWith: "none",
    useHex: false,
    channel: "connect",
    pattern: "connect"
  }
];

// Sample responses for testing.
var serviceResponses = [
  {
    endWith: "none",
    useHex: false,
    useRegularExpression: false,
    channel: "messaging tester.connected",
    pattern: "connected"
  }
]

messaging = new Messaging(serviceName, serviceCommands, serviceResponses, debug, (message) => {
  console.log('New message received: ' + message);
  if(message === 'connect'){
    connect();
  }
});

function connect(){
  messaging.publish('connected');
}
```