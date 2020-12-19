const Alexa = require('ask-sdk-core');
const ErrorHandler = require('../../lambda/handlers/ErrorHandler');
const speaks = require('../../lambda/speakStrings');

describe('Sequence 08. Test scenario: ErrorHandler', () => {
  const mockConsoleError = jest.fn();
  // eslint-disable-next-line no-console
  console.error = mockConsoleError;

  const testResponseBuilder = Alexa.ResponseFactory.init();

  const handlerInput = {
    responseBuilder: Alexa.ResponseFactory.init(),
  };
  const error = new Error('Test ErrorHandler');

  it('should be able can handle', () => {
    expect(ErrorHandler.canHandle()).toEqual(true);
  });

  it('should be able can return response', () => {
    const outputSpeech = testResponseBuilder
      .speak(speaks.NOT_UNDERSTAND)
      .withStandardCard(speaks.SKILL_NAME, speaks.NOT_UNDERSTAND)
      .reprompt(speaks.NOT_UNDERSTAND)
      .getResponse();

    expect(ErrorHandler.handle(handlerInput, error)).toEqual(outputSpeech);
    expect(mockConsoleError).toHaveBeenCalledWith('Error handled:', '{}');
  });
});
