const speaks = require('../speakStrings');

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
  },
  handle(handlerInput) {
    const { person } = handlerInput.requestEnvelope.context.System;

    let speakOutput = null;

    if (person) {
      speakOutput = speaks.PERSONALIZED_WELCOME.format(person.personId);
    } else {
      speakOutput = speaks.WELCOME;
    }

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .withStandardCard(speaks.SKILL_NAME, speaks.WELCOME)
      .reprompt(speaks.REPROMPT)
      .getResponse();
  },
};

module.exports = LaunchRequestHandler;
