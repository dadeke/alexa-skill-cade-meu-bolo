const speaks = require('../speakStrings');

const FallbackIntentHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
      handlerInput.requestEnvelope.request.intent.name ===
        'AMAZON.FallbackIntent'
    );
  },
  handle(handlerInput) {
    return handlerInput.responseBuilder
      .speak(speaks.NOT_UNDERSTAND_BIRTH_DATE_CAPTURE)
      .withStandardCard(
        speaks.SKILL_NAME,
        speaks.NOT_UNDERSTAND_BIRTH_DATE_CAPTURE,
      )
      .withShouldEndSession(true)
      .getResponse();
  },
};

module.exports = FallbackIntentHandler;
