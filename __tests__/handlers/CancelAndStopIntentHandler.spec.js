const Alexa = require('ask-sdk-core');
const CancelAndStopIntentHandler = require('../../lambda/handlers/CancelAndStopIntentHandler');
const speaks = require('../../lambda/speakStrings');

describe('Sequence 05. Test scenario: AMAZON.CancelIntent and AMAZON.StopIntent', () => {
  const responseBuilder = Alexa.ResponseFactory.init();

  const handlerInput = {
    requestEnvelope: {
      request: {
        type: 'IntentRequest',
        intent: {},
      },
      context: {
        System: {},
      },
    },
    responseBuilder,
  };

  beforeEach(() => {
    handlerInput.requestEnvelope.request.type = 'IntentRequest';
  });

  it('should be able can not handle CancelAndStopIntent if type is diferent', () => {
    handlerInput.requestEnvelope.request.type = 'AnotherRequest';

    expect(CancelAndStopIntentHandler.canHandle(handlerInput)).toEqual(false);
  });

  it('should be able can handle AMAZON.CancelIntent', () => {
    handlerInput.requestEnvelope.request.intent.name = 'AMAZON.CancelIntent';

    expect(CancelAndStopIntentHandler.canHandle(handlerInput)).toEqual(true);
  });

  it('should be able can handle AMAZON.StopIntent', () => {
    handlerInput.requestEnvelope.request.intent.name = 'AMAZON.StopIntent';

    expect(CancelAndStopIntentHandler.canHandle(handlerInput)).toEqual(true);
  });

  it('should be able can return response when AMAZON.CancelIntent', () => {
    handlerInput.requestEnvelope.request.intent.name = 'AMAZON.CancelIntent';

    const outputSpeech = {
      outputSpeech: {
        type: 'SSML',
        ssml: `<speak>${speaks.BYE_BYE}</speak>`,
      },
      card: {
        type: 'Standard',
        title: speaks.SKILL_NAME,
        text: speaks.BYE_BYE,
      },
      shouldEndSession: true,
    };

    expect(CancelAndStopIntentHandler.handle(handlerInput)).toEqual(
      outputSpeech,
    );
  });

  it('should be able can return response when AMAZON.StopIntent', () => {
    handlerInput.requestEnvelope.request.intent.name = 'AMAZON.StopIntent';

    const outputSpeech = {
      outputSpeech: {
        type: 'SSML',
        ssml: `<speak>${speaks.BYE_BYE}</speak>`,
      },
      card: {
        type: 'Standard',
        title: speaks.SKILL_NAME,
        text: speaks.BYE_BYE,
      },
      shouldEndSession: true,
    };

    expect(CancelAndStopIntentHandler.handle(handlerInput)).toEqual(
      outputSpeech,
    );
  });
});
