const Alexa = require('ask-sdk-core');
const CaptureBirthdayIntentHandler = require('../../lambda/handlers/CaptureBirthdayIntentHandler');
const speaks = require('../../lambda/speakStrings');

const deviceId = 'amzn1.ask.device.XXXXXXXX';
const personId = 'amzn1.ask.person.XXXXXXXX';
const deviceTimeZone = 'America/Sao_Paulo';

function getMockResponseRemember(handlerInput) {
  return handlerInput.responseBuilder
    .speak(speaks.REMEMBER)
    .withStandardCard(speaks.SKILL_NAME, speaks.REMEMBER)
    .withShouldEndSession(true)
    .getResponse();
}

function getMockResponseNotUnderstandCapture(handlerInput) {
  return handlerInput.responseBuilder
    .speak(speaks.NOT_UNDERSTAND_BIRTH_DATE_CAPTURE)
    .withStandardCard(
      speaks.SKILL_NAME,
      speaks.NOT_UNDERSTAND_BIRTH_DATE_CAPTURE,
    )
    .withShouldEndSession(true)
    .getResponse();
}

describe('Sequence 02. CaptureBirthdayIntent with an utterance', () => {
  const mockConsoleError = jest.fn();
  const getSystemTimeZone = jest.fn();
  const getPersistentAttributes = jest.fn();
  const setPersistentAttributes = jest.fn();
  const savePersistentAttributes = jest.fn();
  // eslint-disable-next-line no-console
  console.error = mockConsoleError;

  const handlerInput = {
    attributesManager: {
      getPersistentAttributes,
      setPersistentAttributes,
      savePersistentAttributes,
    },
    requestEnvelope: {
      request: {
        type: 'IntentRequest',
        intent: {
          name: 'CaptureBirthdayIntent',
          slots: {
            dateOfBirth: {
              value: 'XX99-1-1',
            },
          },
        },
      },
      context: {
        System: {
          device: {
            deviceId,
          },
        },
      },
    },
    responseBuilder: Alexa.ResponseFactory.init(),
    serviceClientFactory: {
      getUpsServiceClient: () => ({
        getSystemTimeZone,
      }),
    },
  };
  const testResponseBuilder = Alexa.ResponseFactory.init();

  beforeEach(() => {
    handlerInput.requestEnvelope.request.intent.name = 'CaptureBirthdayIntent';
    handlerInput.requestEnvelope.request.intent.slots.dateOfBirth.value =
      'XX99-1-1';
  });

  it('should be able can not handle CaptureBirthdayIntent if intent name is diferent', () => {
    handlerInput.requestEnvelope.request.intent.name = 'AnotherIntent';

    expect(CaptureBirthdayIntentHandler.canHandle(handlerInput)).toEqual(false);
  });

  it('should be able can handle CaptureBirthdayIntent', () => {
    expect(CaptureBirthdayIntentHandler.canHandle(handlerInput)).toEqual(true);
  });

  it('should be able can return response', async () => {
    getSystemTimeZone.mockReturnValueOnce(deviceTimeZone);

    const outputSpeech = getMockResponseRemember(handlerInput);

    const response = await CaptureBirthdayIntentHandler.handle(handlerInput);

    expect(response).toEqual(outputSpeech);
    expect(mockConsoleError).not.toHaveBeenCalled();
  });

  it('should be able can return response personalized', async () => {
    handlerInput.requestEnvelope.context.System.person = {
      personId,
    };

    getSystemTimeZone.mockReturnValueOnce(deviceTimeZone);

    const outputSpeech = getMockResponseRemember(handlerInput);

    const response = await CaptureBirthdayIntentHandler.handle(handlerInput);

    expect(response).toEqual(outputSpeech);
    expect(mockConsoleError).not.toHaveBeenCalled();
  });

  it('should be able can return response when year four digits', async () => {
    handlerInput.requestEnvelope.request.intent.slots.dateOfBirth.value =
      '2000-1-1';

    getSystemTimeZone.mockReturnValueOnce(deviceTimeZone);

    const outputSpeech = getMockResponseRemember(handlerInput);

    const response = await CaptureBirthdayIntentHandler.handle(handlerInput);

    expect(response).toEqual(outputSpeech);
    expect(mockConsoleError).not.toHaveBeenCalled();
  });

  it('should be able can return response personalized when year four digits', async () => {
    handlerInput.requestEnvelope.context.System.person = {
      personId,
    };
    handlerInput.requestEnvelope.request.intent.slots.dateOfBirth.value =
      '2000-1-1';

    getSystemTimeZone.mockReturnValueOnce(deviceTimeZone);

    const outputSpeech = getMockResponseRemember(handlerInput);

    const response = await CaptureBirthdayIntentHandler.handle(handlerInput);

    expect(response).toEqual(outputSpeech);
    expect(mockConsoleError).not.toHaveBeenCalled();
  });

  it('should be able can return response not understand when invalid date', async () => {
    handlerInput.requestEnvelope.request.intent.slots.dateOfBirth.value =
      'NaN-1-1';

    getSystemTimeZone.mockImplementation(() => deviceTimeZone);

    const outputSpeech = getMockResponseNotUnderstandCapture(handlerInput);

    const response = await CaptureBirthdayIntentHandler.handle(handlerInput);

    expect(response).toEqual(outputSpeech);
    expect(mockConsoleError).toHaveBeenCalledWith(
      'error',
      'CaptureBirthdayIntentHandler - Invalid date of birth in capture - Year: NaN, month: 1 and day: 1',
    );
  });

  it('should be able can return response problem when can not connect service when is not ServiceError', async () => {
    getSystemTimeZone.mockImplementation(() => {
      const error = {
        name: 'InternalError',
        message: 'Message to simulation InternalError.',
      };

      throw error;
    });

    const outputSpeech = testResponseBuilder
      .speak(speaks.PROBLEM)
      .withStandardCard(
        speaks.SKILL_NAME,
        speaks.NOT_UNDERSTAND_BIRTH_DATE_CAPTURE,
      )
      .withShouldEndSession(true)
      .getResponse();

    const response = await CaptureBirthdayIntentHandler.handle(handlerInput);

    expect(response).toEqual(outputSpeech);
    expect(mockConsoleError).not.toHaveBeenCalled();
  });

  it('should be able can return response not understand when can not connect service when is ServiceError', async () => {
    getSystemTimeZone.mockImplementation(() => {
      const error = {
        name: 'ServiceError',
        message: 'Message to simulation ServiceError.',
      };

      throw error;
    });

    const outputSpeech = getMockResponseNotUnderstandCapture(handlerInput);

    const response = await CaptureBirthdayIntentHandler.handle(handlerInput);

    expect(response).toEqual(outputSpeech);
    expect(mockConsoleError).toHaveBeenCalledWith(
      'error',
      'CaptureBirthdayIntentHandler - ServiceError: Message to simulation ServiceError.',
    );
  });

  it('should be able can return response not understand when is year current', async () => {
    const currentDateTime = new Date(
      new Date().toLocaleString('en-US', { timeZone: deviceTimeZone }),
    );
    const currentYear = currentDateTime.getFullYear();
    handlerInput.requestEnvelope.request.intent.slots.dateOfBirth.value = `${currentYear}-1-1`;

    getSystemTimeZone.mockReturnValueOnce(deviceTimeZone);

    const outputSpeech = getMockResponseNotUnderstandCapture(handlerInput);

    const response = await CaptureBirthdayIntentHandler.handle(handlerInput);

    expect(response).toEqual(outputSpeech);
    expect(mockConsoleError).toHaveBeenCalledWith(
      'error',
      `CaptureBirthdayIntentHandler - Future year of birth in capture - Year: ${currentYear}`,
    );
  });
});
