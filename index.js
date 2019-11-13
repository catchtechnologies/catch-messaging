var Subscriber = require('./subscriber');
var Publisher = require('./publisher');

var serviceName = 'catch-messaging';
var serviceCommands = [];
var serviceResponses = [];
var debug = true;

class Events {

  constructor(serviceName, serviceCommands, serviceResponses, debug, callback) {
    this.serviceName = serviceName || '';
    this.serviceCommands = serviceCommands || [];
    this.serviceResponses = serviceResponses || [];
    this.debug = debug || false;
    this.callback = callback;
    this.init();
  }

  log(message) {
    if (this.debug) {
      console.log(serviceName + ' Event Manager: ' + message + '\n');
    }
  }

  init() {
    this.detectPubSubLoop();

    /* Publish reponses from this service. */
    this.publisher = new Publisher(this.serviceName, this.serviceResponses, debug);

    /* Subscribe to messages for this service. */
    if (this.callback) {
      this.subscriber = new Subscriber(this.serviceName, this.serviceCommands, this.debug, (message) => {
        this.callback(message);
      });
    } else {
      this.log('Cannot create subscriber. The callback function is not defined.');
    }
  }

  detectPubSubLoop() {
    try {
      serviceCommands.forEach(command => {
        serviceResponses.forEach((response, index, object) => {
          if (response.channel === command.channel) {
            log('Potential pubsub loop detected! Removing response: ' + response.friendlyName + ' with duplicate channel: ' + command.channel);
            object.splice(index, 1);
          }
        });
      });
    } catch (e) {
      log('Exception checking for pubsub loops');
    }
  }

  /**
   * Searches for a matching serviceResponse, checks for a regEx value, handles appending special characters,
   * and publishes the result to the serviceResponse's channel.
   * @param {*} response 
   */
  publish(response) {
    this.publisher.publish(response);
  }

  exit() {
    this.publisher.redisClient.quit();
    this.subscriber.redisClient.quit();
  }
}

module.exports = Events;