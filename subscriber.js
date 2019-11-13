var Redis = require("redis");

class Subscriber {
  constructor(serviceName, serviceCommands, debug, callback) {
    this.serviceName = serviceName;
    this.serviceCommands = serviceCommands;
    this.debug = debug || false;
    this.callback = callback;

    this.redisClient = Redis.createClient();
    this.redisClient.on('error', (err) => {
      this.log("redis client error: " + err);
    });
    this.redisClient.on('connect', () => {
      this.log("redis client connected.");      
    });
    this.subscribe();
  }

  /**
   * Prints the Service Name and a message to the console.
   * @param {string} message - The message to print.
   */
  log(message) {
    if (this.debug) {
      console.log(this.serviceName + ' Event Subscriber: ' + message + '\n');
    }
  }

  /**
   * Subscribes to a redis pubSub channel and processes received messages.
   */
  subscribe() {
    this.log('subscribing to: ' + this.serviceName + '.*');
    this.redisClient.psubscribe(this.serviceName + '.*');
    this.redisClient.on("pmessage", (pattern, channel, value) => {
      try {
        const valueObject = JSON.parse(value);
        this.log("Received msg on channel: " + channel + " with value: " + value);
        channel = channel.replace(this.serviceName + '.', '');
        channel = channel.trim();
        this.log("Parsed channel =  " + channel);
        let sendCommands = this.getCommandsWithChannel(channel);
        for (var i = sendCommands.length - 1; i > -1; i--) {
          let message = this.appendSpecialCharacters(sendCommands[i]);
          if (message.includes('#PAYLOAD#')) {
            if (valueObject.value != null) {
              message = message.replace(new RegExp('#PAYLOAD#', 'g'), valueObject.value);
              this.callback(message);
            }
            return;
          }
          this.callback(message);
        }
      } catch (e) {
        this.log('Exception receiving subscribe message: ' + e);
      }
    });
  }

  /** 
   * Search service commands for all commands that contain the channel.
   * @param {array} channel - A string containing the channel to search for.
   * @param {array} commands - An array of json objects containing the commands to search through. 'channel' field is required.
   * @returns {array} A json array of service commands.
   */
  getCommandsWithChannel(channel) {
    if (channel != null && this.serviceCommands) {
      return this.serviceCommands.filter((command) => {
        if (command.channel != null) {
          return command.channel === channel;
        }
      }).map(command => command);
    }
    return [];
  }

  /**
   * Appends carriage return and/or line feed to a command pattern as defined in given a json object.
   * @param {json} command - A json object containing the command information. Required fields: pattern endWith
   * @returns {string} A string with carriage return and/or line feed appended. 
   */
  appendSpecialCharacters(command) {
    var message = command.pattern;
    if (command.endWith && command.endWith !== 'none') {
      if (command.endWith === 'n') {
        return message + '\n';
      } else if (command.endWith === 'rn') {
        return message + '\r\n';
      } else if (command.endWith === 'r') {
        return message + '\r';
      }
    }
    return message;
  }
}

module.exports = Subscriber;