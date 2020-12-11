const Alexa = require('ask-sdk-core');
const LaunchRequestHandler = require('../../lambda/handlers/LaunchRequestHandler');
const speaks = require('../../lambda/speakStrings');

const personId = 'amzn1.ask.person.XXXXXXXX';

describe('Sequence 01. Test scenario: launch request. no further interaction.', () => {
  const responseBuilder = Alexa.ResponseFactory.init();
  const handlerInput = {
    requestEnvelope: {
      request: {
        type: 'LaunchRequest',
      },
      context: {
        System: {},
      },
    },
    responseBuilder,
  };

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
    const outputSpeech = {
      outputSpeech: {
        type: 'SSML',
        ssml: `<speak>${speaks.WELCOME}</speak>`,
      },
      card: {
        type: 'Standard',
        title: speaks.SKILL_NAME,
        text: speaks.WELCOME,
      },
      reprompt: {
        outputSpeech: {
          type: 'SSML',
          ssml: `<speak>${speaks.REPROMPT}</speak>`,
        },
      },
      shouldEndSession: false,
    };

    expect(LaunchRequestHandler.handle(handlerInput)).toEqual(outputSpeech);
  });

  it('should be able can return response personalized', () => {
    handlerInput.requestEnvelope.context.System.person = {
      personId,
    };

    const outputSpeech = {
      outputSpeech: {
        type: 'SSML',
        ssml: `<speak>${speaks.PERSONALIZED_WELCOME.format(personId)}</speak>`,
      },
      card: {
        type: 'Standard',
        title: speaks.SKILL_NAME,
        text: speaks.WELCOME,
      },
      reprompt: {
        outputSpeech: {
          type: 'SSML',
          ssml: `<speak>${speaks.REPROMPT}</speak>`,
        },
      },
      shouldEndSession: false,
    };

    expect(LaunchRequestHandler.handle(handlerInput)).toEqual(outputSpeech);
  });
});
