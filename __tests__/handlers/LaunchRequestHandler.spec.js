const Alexa = require('ask-sdk-core');
const LaunchRequestHandler = require('../../lambda/handlers/LaunchRequestHandler');
const speaks = require('../../lambda/speakStrings');

const personId = 'amzn1.ask.person.XXXXXXXX';

describe('Sequence 01. Test scenario: launch request. no further interaction.', () => {
  const handlerInput = {
    requestEnvelope: {
      request: {
        type: 'LaunchRequest',
      },
      context: {
        System: {},
      },
    },
    responseBuilder: Alexa.ResponseFactory.init(),
  };
  const testResponseBuilder = Alexa.ResponseFactory.init();

  beforeEach(() => {
    handlerInput.requestEnvelope.request.type = 'LaunchRequest';
  });

  it('should be able can not handle LaunchRequest if type is diferent', () => {
    handlerInput.requestEnvelope.request.type = 'AnotherRequest';

    expect(LaunchRequestHandler.canHandle(handlerInput)).toEqual(false);
  });

  it('should be able can handle LaunchRequest', () => {
    expect(LaunchRequestHandler.canHandle(handlerInput)).toEqual(true);
  });

  it('should be able can return response', () => {
    const outputSpeech = testResponseBuilder
      .speak(speaks.WELCOME)
      .withStandardCard(speaks.SKILL_NAME, speaks.WELCOME)
      .reprompt(speaks.REPROMPT)
      .getResponse();

    expect(LaunchRequestHandler.handle(handlerInput)).toEqual(outputSpeech);
  });

  it('should be able can return response personalized', () => {
    handlerInput.requestEnvelope.context.System.person = {
      personId,
    };

    const outputSpeech = testResponseBuilder
      .speak(speaks.PERSONALIZED_WELCOME.format(personId))
      .withStandardCard(speaks.SKILL_NAME, speaks.WELCOME)
      .reprompt(speaks.REPROMPT)
      .getResponse();

    expect(LaunchRequestHandler.handle(handlerInput)).toEqual(outputSpeech);
  });
});
