const Alexa = require('ask-sdk-core');
const FallbackIntentHandler = require('../../lambda/handlers/FallbackIntentHandler');
const speaks = require('../../lambda/speakStrings');

describe('Sequence 06. Test scenario: FallbackIntent', () => {
  const handlerInput = {
    requestEnvelope: {
      request: {
        type: 'IntentRequest',
        intent: {
          name: 'AMAZON.FallbackIntent',
        },
      },
      context: {
        System: {},
      },
    },
    responseBuilder: Alexa.ResponseFactory.init(),
  };

  beforeEach(() => {
    handlerInput.requestEnvelope.request.intent.name = 'AMAZON.FallbackIntent';
  });

  it('should be able can not handle CaptureBirthdayIntent if intent name is diferent', () => {
    handlerInput.requestEnvelope.request.intent.name = 'AnotherIntent';

    expect(FallbackIntentHandler.canHandle(handlerInput)).toEqual(false);
  });

  it('should be able can handle FallbackIntent', () => {
    expect(FallbackIntentHandler.canHandle(handlerInput)).toEqual(true);
  });

  it('should be able can return response', () => {
    const outputSpeech = {
      outputSpeech: {
        type: 'SSML',
        ssml: `<speak>${speaks.NOT_UNDERSTAND_BIRTH_DATE_CAPTURE}</speak>`,
      },
      card: {
        type: 'Standard',
        title: speaks.SKILL_NAME,
        text: speaks.NOT_UNDERSTAND_BIRTH_DATE_CAPTURE,
      },
      shouldEndSession: true,
    };

    expect(FallbackIntentHandler.handle(handlerInput)).toEqual(outputSpeech);
  });
});
