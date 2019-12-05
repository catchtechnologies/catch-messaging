var Subscriber = require('./subscriber');
var Publisher = require('./publisher');

class Messaging {

  constructor(serviceName, serviceCommands, serviceResponses, debug, callback) {
    this.serviceName = serviceName || '';
    this.serviceCommands = serviceCommands;
    this.serviceResponses = serviceResponses;
    this.debug = debug || false;
    this.callback = callback;
    this.init();
  }

  log(message) {
    if (this.debug) {
      console.log(this.serviceName + ' Event Manager: ' + message + '\n');
    }
  }

  init() {
    this.detectPubSubLoop();

    /* Publish reponses from this service. */
    if (this.serviceResponses) {
      this.publisher = new Publisher(this.serviceName, this.serviceResponses, this.debug);
    }

    /* Subscribe to messages for this service. */
    if (this.callback && this.serviceCommands) {
      this.subscriber = new Subscriber(this.serviceName, this.serviceCommands, this.debug, (message) => {
        this.callback(message);
      });
    } else {
      this.log('Cannot create subscriber. The callback function is not defined.');
    }
  }

  detectPubSubLoop() {
    try {
      if (this.serviceCommands && this.serviceCommands) {
        this.serviceCommands.forEach(command => {
          this.serviceResponses.forEach((response, index, object) => {
            if (response.channel === command.channel) {
              log('Potential pubsub loop detected! Removing response: ' + response.friendlyName + ' with duplicate channel: ' + command.channel);
              object.splice(index, 1);
            }
          });
        });
      }
    } catch (e) {
      this.log('Exception checking for pubsub loops');
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
    this.publisher.exit();
    this.subscriber.exit();
  }
}

module.exports = Messaging;