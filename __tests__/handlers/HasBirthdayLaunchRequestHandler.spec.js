const Alexa = require('ask-sdk-core');
const Escape = require('lodash/escape');
const { subYears, addDays } = require('date-fns');

jest.useFakeTimers();

const HasBirthdayLaunchRequestHandler = require('../../lambda/handlers/HasBirthdayLaunchRequestHandler');
const Util = require('../../lambda/util');
const speaks = require('../../lambda/speakStrings');

const deviceId = 'amzn1.ask.device.XXXXXXXX';
const personId = 'amzn1.ask.person.XXXXXXXX';
const deviceTimeZone = 'America/Sao_Paulo';
process.env.URL_ICON_108 = 'https://example.com/icon_108.png';
process.env.URL_ICON_512 = 'https://example.com/icon_512.png';

function getMockResponseNotUnderstandStorage(handlerInput) {
  return handlerInput.responseBuilder
    .speak(speaks.NOT_UNDERSTAND_BIRTH_DATE_STORAGE)
    .withStandardCard(
      speaks.SKILL_NAME,
      speaks.NOT_UNDERSTAND_BIRTH_DATE_STORAGE,
    )
    .withShouldEndSession(true)
    .getResponse();
}

function getMockResponse(handlerInput) {
  let currentPersonId = 'default';
  const { person } = handlerInput.requestEnvelope.context.System;
  if (person) {
    currentPersonId = person.personId;
  }
  // console.log(currentPersonId);
  const sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
  // console.log(sessionAttributes);

  let { dateOfBirth } = sessionAttributes[currentPersonId];
  dateOfBirth = dateOfBirth.split('-');
  const year = Number(dateOfBirth[0]);
  // No JavaScript o primeiro mês no "new Date()" começa com zero.
  const month = Number(dateOfBirth[1]) - 1;
  const day = Number(dateOfBirth[2]);

  const oneDay = 24 * 60 * 60 * 1000;

  // Obtém a data atual com a hora.
  const currentDateTime = new Date(
    new Date().toLocaleString('en-US', { timeZone: deviceTimeZone }),
  );
  // Remove a hora da data porque afeta o cálculo de diferença.
  const currentDate = new Date(
    currentDateTime.getFullYear(),
    currentDateTime.getMonth(),
    currentDateTime.getDate(),
  );
  let currentYear = currentDate.getFullYear();
  // Obtém o próximo aniversário.
  let nextBirthday = new Date(currentYear, month, day);
  nextBirthday = nextBirthday.getTime();

  // Ajusta o próximo aniversário em um ano se a data atual for
  // após o aniversário.
  if (currentDate.getTime() > nextBirthday) {
    nextBirthday = new Date(currentYear + 1, month, day);
    nextBirthday = nextBirthday.getTime();
    currentYear += 1;
  }

  // Define a fala padrão para "Olá, bem-vindo de volta..." com ou sem
  // personalização.
  // Quando for o dia do aniversário, toca o áudio
  // "parabéns pra você", "viva!" e toca o áudio dos aplausos.
  let speakOutput = null;
  if (currentDate.getTime() !== nextBirthday) {
    const diffDays = Math.round(
      Math.abs((currentDate.getTime() - nextBirthday) / oneDay),
    );

    const yearsOld = currentYear - year;

    // Define se é para falar no plural ou no singular.
    const speakDays = diffDays === 1 ? speaks.DAY : speaks.DAYS;
    const speakYears = yearsOld === 1 ? speaks.YEAR : speaks.YEARS;

    if (currentPersonId !== 'default') {
      speakOutput = speaks.PERSONALIZED_WELCOME_BACK.format(
        currentPersonId,
        diffDays,
        speakDays,
        yearsOld,
        speakYears,
      );
    } else {
      speakOutput = speaks.WELCOME_BACK.format(
        diffDays,
        speakDays,
        yearsOld,
        speakYears,
      );
    }

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .withStandardCard(
        speaks.SKILL_NAME,
        speaks.WELCOME_BACK.format(diffDays, speakDays, yearsOld, speakYears),
      )
      .withShouldEndSession(true)
      .getResponse();
  }

  const urlHappyBirthDay = Escape(
    Util.getS3PreSignedUrl('Media/alexa_happy_birthday_pt_br.mp3'),
  );
  const urlApplause = Escape(Util.getS3PreSignedUrl('Media/applause.mp3'));

  speakOutput =
    speaks.AUDIO.format(urlHappyBirthDay) +
    speaks.INTERJECTION +
    speaks.AUDIO.format(urlApplause);

  return handlerInput.responseBuilder
    .speak(speakOutput)
    .withStandardCard(
      speaks.SKILL_NAME,
      speaks.HAPPY_BIRTHDAY,
      process.env.URL_ICON_108,
      process.env.URL_ICON_512,
    )
    .withShouldEndSession(true)
    .getResponse();
}

describe('Sequence 03. HasBirthdayLaunchRequest with an utterance', () => {
  const mockConsoleError = jest.fn();
  const setPersistentAttributes = jest.fn();
  const savePersistentAttributes = jest.fn();
  const getSystemTimeZone = jest.fn();
  // eslint-disable-next-line no-console
  console.error = mockConsoleError;

  const responseBuilder = Alexa.ResponseFactory.init();
  const handlerInput = {
    attributesManager: {
      setPersistentAttributes,
      savePersistentAttributes,
    },
    requestEnvelope: {
      request: {
        type: 'LaunchRequest',
      },
      context: {
        System: {
          device: {
            deviceId,
          },
        },
      },
    },
    responseBuilder,
    serviceClientFactory: {
      getUpsServiceClient: () => {
        return {
          getSystemTimeZone,
        };
      },
    },
  };

  beforeEach(() => {
    handlerInput.requestEnvelope.request.type = 'LaunchRequest';
    handlerInput.requestEnvelope.context.System.person = undefined;
  });

  it('should be able can not handle LaunchRequest if type is diferent', () => {
    handlerInput.requestEnvelope.request.type = 'IntentRequest';

    expect(HasBirthdayLaunchRequestHandler.canHandle(handlerInput)).toEqual(
      false,
    );
  });

  it('should be able can not handle LaunchRequest if sessionAttributes return null', () => {
    handlerInput.attributesManager.getSessionAttributes = () => null;

    expect(HasBirthdayLaunchRequestHandler.canHandle(handlerInput)).toEqual(
      false,
    );
  });

  it('should be able can handle LaunchRequest', () => {
    handlerInput.attributesManager.getSessionAttributes = () => {
      return {
        default: {
          dateOfBirth: '1990-1-1',
        },
      };
    };

    expect(HasBirthdayLaunchRequestHandler.canHandle(handlerInput)).toEqual(
      true,
    );
  });

  it('should be able can handle LaunchRequest personalized', () => {
    handlerInput.requestEnvelope.context.System.person = { personId };

    handlerInput.attributesManager.getSessionAttributes = () => {
      return {
        [personId]: {
          dateOfBirth: '1990-1-1',
        },
      };
    };

    expect(HasBirthdayLaunchRequestHandler.canHandle(handlerInput)).toEqual(
      true,
    );
  });

  it('should be able can return response problem when can not connect service when is not ServiceError', async () => {
    handlerInput.attributesManager.getSessionAttributes = () => {
      return {
        default: {
          dateOfBirth: '1990-1-1',
        },
      };
    };

    getSystemTimeZone.mockImplementation(() => {
      const error = {
        name: 'InternalError',
        message: 'Message to simulation InternalError.',
      };

      throw error;
    });

    const outputSpeech = {
      outputSpeech: {
        type: 'SSML',
        ssml: `<speak>${speaks.PROBLEM}</speak>`,
      },
      shouldEndSession: true,
    };

    const response = await HasBirthdayLaunchRequestHandler.handle(handlerInput);

    expect(response).toEqual(outputSpeech);
    expect(mockConsoleError).not.toHaveBeenCalled();
  });

  it('should be able can return response not understand when can not connect service when is ServiceError', async () => {
    handlerInput.attributesManager.getSessionAttributes = () => {
      return {
        default: {
          dateOfBirth: '1990-1-1',
        },
      };
    };

    getSystemTimeZone.mockImplementation(() => {
      const error = {
        name: 'ServiceError',
        message: 'Message to simulation ServiceError.',
      };

      throw error;
    });

    const outputSpeech = getMockResponseNotUnderstandStorage(handlerInput);

    const response = await HasBirthdayLaunchRequestHandler.handle(handlerInput);
    // console.log(response);

    expect(response).toEqual(outputSpeech);
    expect(mockConsoleError).toHaveBeenCalledWith(
      'error',
      'HasBirthdayLaunchRequestHandler - ServiceError: Message to simulation ServiceError.',
    );
  });

  it('should be able can return response not understand when sessionAttributes return null', async () => {
    handlerInput.attributesManager.getSessionAttributes = () => {
      return null;
    };

    getSystemTimeZone.mockReturnValueOnce(deviceTimeZone);

    const outputSpeech = getMockResponseNotUnderstandStorage(handlerInput);
    // console.log(outputSpeech);

    const response = await HasBirthdayLaunchRequestHandler.handle(handlerInput);
    // console.log(response);

    expect(response).toEqual(outputSpeech);
    expect(mockConsoleError).toHaveBeenCalledWith(
      'error',
      'HasBirthdayLaunchRequestHandler - dateOfBirth is false',
    );
  });

  it('should be able can return response', async () => {
    handlerInput.attributesManager.getSessionAttributes = () => {
      return {
        default: {
          dateOfBirth: '1990-1-1',
        },
      };
    };

    getSystemTimeZone.mockReturnValueOnce(deviceTimeZone);

    const outputSpeech = getMockResponse(handlerInput);
    // console.log(outputSpeech);

    const response = await HasBirthdayLaunchRequestHandler.handle(handlerInput);
    // console.log(response);

    expect(response).toEqual(outputSpeech);
    expect(mockConsoleError).not.toHaveBeenCalled();
  });

  it('should be able can return response personalized', async () => {
    handlerInput.requestEnvelope.context.System.person = { personId };

    handlerInput.attributesManager.getSessionAttributes = () => {
      return {
        [personId]: {
          dateOfBirth: '1990-1-1',
        },
      };
    };

    getSystemTimeZone.mockReturnValueOnce(deviceTimeZone);

    const outputSpeech = getMockResponse(handlerInput);
    // console.log(outputSpeech);

    const response = await HasBirthdayLaunchRequestHandler.handle(handlerInput);
    // console.log(response);

    expect(response).toEqual(outputSpeech);
    expect(mockConsoleError).not.toHaveBeenCalled();
  });

  it('should be able can return response with words in the singular', async () => {
    const currentDateTime = new Date(
      new Date().toLocaleString('en-US', { timeZone: deviceTimeZone }),
    );

    let testDateOfBirth = subYears(currentDateTime, 1);
    testDateOfBirth = addDays(testDateOfBirth, 1);

    handlerInput.attributesManager.getSessionAttributes = () => {
      return {
        default: {
          dateOfBirth:
            `${testDateOfBirth.getFullYear()}-` +
            // No JavaScript o primeiro mês no "new Date()" começa com zero.
            `${testDateOfBirth.getMonth() + 1}-` +
            `${testDateOfBirth.getDate()}`,
        },
      };
    };

    getSystemTimeZone.mockReturnValueOnce(deviceTimeZone);

    const outputSpeech = getMockResponse(handlerInput);
    // console.log(outputSpeech);

    const response = await HasBirthdayLaunchRequestHandler.handle(handlerInput);
    // console.log(response);

    expect(response).toEqual(outputSpeech);
    expect(mockConsoleError).not.toHaveBeenCalled();
  });

  it('should be able can return response happy birthday', async () => {
    const currentDateTime = new Date(
      new Date().toLocaleString('en-US', { timeZone: deviceTimeZone }),
    );

    handlerInput.attributesManager.getSessionAttributes = () => {
      return {
        default: {
          dateOfBirth:
            `${currentDateTime.getFullYear()}-` +
            // No JavaScript o primeiro mês no "new Date()" começa com zero.
            `${currentDateTime.getMonth() + 1}-` +
            `${currentDateTime.getDate()}`,
        },
      };
    };

    getSystemTimeZone.mockReturnValueOnce(deviceTimeZone);

    const outputSpeech = getMockResponse(handlerInput);
    // console.log(outputSpeech);

    const response = await HasBirthdayLaunchRequestHandler.handle(handlerInput);
    // console.log(response);

    expect(response).toEqual(outputSpeech);
    expect(mockConsoleError).not.toHaveBeenCalled();
  });

  it('should be able can return response not understand when invalid date', async () => {
    // Realmente não sei como isto poderia acontecer. XD
    jest.spyOn(global, 'Date').mockImplementation(() => {
      return {};
    });

    handlerInput.attributesManager.getSessionAttributes = () => {
      return {
        default: {
          dateOfBirth: '0-0-0',
        },
      };
    };

    getSystemTimeZone.mockReturnValueOnce(deviceTimeZone);

    const outputSpeech = getMockResponseNotUnderstandStorage(handlerInput);
    // console.log(outputSpeech);

    const response = await HasBirthdayLaunchRequestHandler.handle(handlerInput);
    // console.log(response);

    expect(response).toEqual(outputSpeech);
    expect(mockConsoleError).toHaveBeenCalledWith(
      'error',
      'HasBirthdayLaunchRequestHandler - Invalid date of birth in storage - Year: 0, month: 0 and day: 0',
    );
  });
});
