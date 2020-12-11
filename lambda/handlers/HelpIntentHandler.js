const speaks = require('../speakStrings');

const HelpIntentHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
      handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent'
    );
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak(speaks.HELP)
      .withStandardCard(speaks.SKILL_NAME, speaks.HELP)
      .reprompt(speaks.HELP)
      .getResponse();
  },
};

module.exports = HelpIntentHandler;
