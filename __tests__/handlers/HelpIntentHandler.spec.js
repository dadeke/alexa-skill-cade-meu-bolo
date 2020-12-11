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
    const outputSpeech = {
      outputSpeech: {
        type: 'SSML',
        ssml: `<speak>${speaks.HELP}</speak>`,
      },
      card: {
        type: 'Standard',
        title: speaks.SKILL_NAME,
        text: speaks.HELP,
      },
      reprompt: {
        outputSpeech: {
          type: 'SSML',
          ssml: `<speak>${speaks.HELP}</speak>`,
        },
      },
      shouldEndSession: false,
    };

    expect(HelpIntentHandler.handle(handlerInput)).toEqual(outputSpeech);
  });
});
