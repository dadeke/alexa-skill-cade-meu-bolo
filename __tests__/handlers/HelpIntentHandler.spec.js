const Alexa = require('ask-sdk-core');
const HelpIntentHandler = require('../../lambda/handlers/HelpIntentHandler');
const speaks = require('../../lambda/speakStrings');

describe('Sequence 04. Test scenario: HelpIntent', () => {
  const handlerInput = {
    requestEnvelope: {
      request: {
        type: 'IntentRequest',
        intent: {
          name: 'AMAZON.HelpIntent',
        },
      },
      context: {
        System: {},
      },
    },
    responseBuilder: Alexa.ResponseFactory.init(),
  };
  const testResponseBuilder = Alexa.ResponseFactory.init();

  beforeEach(() => {
    handlerInput.requestEnvelope.request.intent.name = 'AMAZON.HelpIntent';
  });

  it('should be able can not handle AMAZON.HelpIntent if intent name is diferent', () => {
    handlerInput.requestEnvelope.request.intent.name = 'AnotherIntent';

    expect(HelpIntentHandler.canHandle(handlerInput)).toEqual(false);
  });

  it('should be able can handle HelpIntent', () => {
    expect(HelpIntentHandler.canHandle(handlerInput)).toEqual(true);
  });

  it('should be able can return response', () => {
    const outputSpeech = testResponseBuilder
      .speak(speaks.HELP)
      .withStandardCard(speaks.SKILL_NAME, speaks.HELP)
      .reprompt(speaks.HELP)
      .getResponse();

    expect(HelpIntentHandler.handle(handlerInput)).toEqual(outputSpeech);
  });
});
