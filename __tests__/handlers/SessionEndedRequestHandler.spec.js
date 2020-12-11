const Alexa = require('ask-sdk-core');
const SessionEndedRequestHandler = require('../../lambda/handlers/SessionEndedRequestHandler');

describe('Sequence 07. Test scenario: SessionEndedRequest', () => {
  const handlerInput = {
    requestEnvelope: {
      request: {
        type: 'SessionEndedRequest',
      },
      context: {
        System: {},
      },
    },
    responseBuilder: Alexa.ResponseFactory.init(),
  };

  beforeEach(() => {
    handlerInput.requestEnvelope.request.type = 'SessionEndedRequest';
  });

  it('should be able can not handle SessionEndedRequest if type is diferent', () => {
    handlerInput.requestEnvelope.request.type = 'AnotherRequest';

    expect(SessionEndedRequestHandler.canHandle(handlerInput)).toEqual(false);
  });

  it('should be able can handle SessionEndedRequest', () => {
    expect(SessionEndedRequestHandler.canHandle(handlerInput)).toEqual(true);
  });

  it('should be able can return empty response', () => {
    expect(SessionEndedRequestHandler.handle(handlerInput)).toEqual({});
  });
});
