const Alexa = require('ask-sdk-core');
const ErrorHandler = require('../../lambda/handlers/ErrorHandler');
const speaks = require('../../lambda/speakStrings');

describe('Sequence 08. Test scenario: ErrorHandler', () => {
  const mockConsoleError = jest.fn();
  // eslint-disable-next-line no-console
  console.error = mockConsoleError;

  const handlerInput = {
    responseBuilder: Alexa.ResponseFactory.init(),
  };
  const error = new Error('Test ErrorHandler');

  it('should be able can handle', () => {
    expect(ErrorHandler.canHandle()).toEqual(true);
  });

  it('should be able can return response', () => {
    const outputSpeech = {
      outputSpeech: {
        type: 'SSML',
        ssml: `<speak>${speaks.NOT_UNDERSTAND}</speak>`,
      },
      card: {
        type: 'Standard',
        title: speaks.SKILL_NAME,
        text: speaks.NOT_UNDERSTAND,
      },
      reprompt: {
        outputSpeech: {
          type: 'SSML',
          ssml: `<speak>${speaks.NOT_UNDERSTAND}</speak>`,
        },
      },
      shouldEndSession: false,
    };

    expect(ErrorHandler.handle(handlerInput, error)).toEqual(outputSpeech);
    expect(mockConsoleError).toHaveBeenCalledWith('Error handled:', '{}');
  });
});
