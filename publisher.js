var Redis = require("redis");

class Publisher {
  constructor(serviceName, serviceResponses, debug) {
    this.serviceName = serviceName;
    this.serviceResponses = serviceResponses;
    this.debug = debug || false;

    this.redisClient = Redis.createClient();
    this.redisClient.on('error', (err) => {
      this.log("redis client error: " + err);
    });
    this.redisClient.on('connect', () => {
      this.log("redis client connected.");
      this.connected = true;
    });
  }

  /**
   * Prints the Service Name and a message to the console.
   * @param {string} message - The message to print.
   */
  log(message) {
    if (this.debug) {
      console.log(this.serviceName + ' Event Publisher: ' + message) + '\n';
    }
  }

  /**
 * Disconnects the redis client.
 */
  exit() {
    this.redisClient.quit();
  }

  publishDirect(channel, value) {
    try {
      this.log('Publishing direct to channel: ' + channel + ' with value: ' + value);
      this.redisClient.publish(channel, value);
    } catch (e) {
      this.log('Exception publishing message direct: ' + e);
    }
  }

  publish(message) {
    try {
      if (this.connected) {
        let matchedResponses = this.getResponse(message);
        let i = matchedResponses.length - 1;
        for (i; i > -1; i--) {
          if (matchedResponses[i].useRegularExpression && matchedResponses[i].parsedRegexValue) {
            this.log('Publishing to channel: ' + matchedResponses[i].channel + ' with value: ' + matchedResponses[i].parsedRegexValue);
            const valueObject = {
              value: matchedResponses[i].parsedRegexValue,
              persist: matchedResponses[i].persist
            }
            this.redisClient.publish(matchedResponses[i].channel, JSON.stringify(valueObject));
            matchedResponses[i].parsedRegexValue = null;
          } else if (!matchedResponses[i].useRegularExpression) {
            this.log('Publishing to channel: ' + matchedResponses[i].channel + ' with value: null');
            const valueObject = {
              value: 'null',
              persist: matchedResponses[i].persist
            }
            this.redisClient.publish(matchedResponses[i].channel, JSON.stringify(valueObject));
          }
        }
      } else {
        this.log('Cannot publish message until connected to redis.');
      }
    } catch (e) {
      this.log('Exception publishing message: ' + e);
    }
  }

  /**
   * Searches the array of serviceResponses for the incoming message.
   *
   * @param {string} message - A string containing the message to find.
   * @returns {json} A json array of service responses.
   */
  getResponse(message) {
    if (this.serviceResponses) {
      return this.serviceResponses.filter((response) => {
        if (response.useRegularExpression && this.checkEndWith(message, response)) {
          return this.parseRegex(message, response);
        }
        return this.checkResponsePattern(message, response);
      }).map(response => response);
    }
    return [];
  }

  /**
   * Matches a message to a regex and stores the parsed value in the response object's parsedRegexValue field.
   *
   * @param {string} message - A string containing the message to check for a regex value.
   * @param {json} response - A json object with a parsedRegexValue field and a pattern field that contains a regular expression.
   * @returns {bool} True if a match was found.
   */
  parseRegex(message, response) {
    message = message.trim();
    if (message === '') {
      return false;
    }

    const r = new RegExp(response.pattern);
    const m = r.exec(message);
    if (!m) {
      return false;
    }

    if (m.length > 1) {
      response.parsedRegexValue = m[1];
    }
    return true;
  }

  /**
   * Compares a message to the pattern and endWith fields of a response object.
   *
   * @param {string} message - A string containing the message.
   * @param {json} response - A json object with pattern and endWith fields.
   * @returns {bool} True if the last message matches the pattern property of the response object.
   */
  checkResponsePattern(message, response) {
    switch (response.endWith) {
      case 'none':
        if (message === response.pattern) {
          return true;
        }
        break;
      case 'r':
        if (message === response.pattern + '\r') {
          return true;
        }
        break;
      case 'n':
        if (message === response.pattern + '\n') {
          return true;
        }
        break;
      case 'rn':
        if (message === response.pattern + '\r\n') {
          return true;
        }
        break;
      default:
        if (message === response.pattern) {
          return true;
        }
    }
    return false;
  }

  /**
   * Checks the last character(s) of a message for the endWith fields of a response object
   *
   * @param {string} message - A string containing the message.
   * @param {json} response - A json object with an endWith field.
   * @returns {bool} True if the last character of the message matches the endWith property of the response object.
   */
  checkEndWith(message, response) {
    switch (response.endWith) {
      case 'none':
        if (message.slice(-2) != "\r\n" && message.slice(-1) != "\r" && message.slice(-1) != "\n") {
          return true;
        }
        break;
      case 'r':
        if (message.slice(-1) === '\r') {
          return true;
        }
        break;
      case 'n':
        if (message.slice(-1) === '\n') {
          return true;
        }
        break;
      case 'rn':
        if (message.slice(-1) === '\r\n') {
          return true;
        }
        break;
      default:
        if (message.slice(-2) != "\r\n" && message.slice(-1) != "\r" && message.slice(-1) != "\n") {
          return true;
        }
    }
    return false;
  }
}

module.exports = Publisher;