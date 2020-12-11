const speaks = require('../speakStrings');

const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    // eslint-disable-next-line no-console
    console.error('Error handled:', JSON.stringify(error));

    return handlerInput.responseBuilder
      .speak(speaks.NOT_UNDERSTAND)
      .withStandardCard(speaks.SKILL_NAME, speaks.NOT_UNDERSTAND)
      .reprompt(speaks.NOT_UNDERSTAND)
      .getResponse();
  },
};

module.exports = ErrorHandler;
