const Alexa = require('ask-sdk-core');
const Util = require('../../lambda/util');
const LoadBirthdayInterceptor = require('../../lambda/interceptors/LoadBirthdayInterceptor');

const userId = 'amzn1.ask.account.XXXXXXXX';
const personId = 'amzn1.ask.person.XXXXXXXX';

describe('Test LoadBirthdayInterceptor', () => {
  const mockConsoleError = jest.fn();
  const getPersistentAttributes = jest.fn();
  const setSessionAttributes = jest.fn();
  const s3ObjectExists = jest.fn();
  const getS3Object = jest.fn();
  const toString = jest.fn();
  // eslint-disable-next-line no-console
  console.error = mockConsoleError;
  Util.s3ObjectExists = s3ObjectExists;
  Util.getS3Object = getS3Object;

  const responseBuilder = Alexa.ResponseFactory.init();
  const handlerInput = {
    attributesManager: {
      getPersistentAttributes,
      setSessionAttributes,
    },
    requestEnvelope: {
      request: {
        type: 'LaunchRequest',
      },
      context: {
        System: {
          user: {
            userId,
          },
        },
      },
    },
    responseBuilder,
  };

  it('should be able process with persistent attributes not existing', async () => {
    getPersistentAttributes.mockReturnValueOnce(false);
    s3ObjectExists.mockReturnValueOnce(true);

    const objectOutput = {
      Body: {
        toString,
      },
    };
    toString.mockReturnValueOnce(JSON.stringify({}));
    getS3Object.mockReturnValueOnce(objectOutput);

    const response = await LoadBirthdayInterceptor.process(handlerInput);

    expect(response);
    expect(mockConsoleError).not.toHaveBeenCalled();
  });

  it('should be able process with persistent attributes elsewhere', async () => {
    getPersistentAttributes.mockReturnValueOnce(false);
    s3ObjectExists.mockReturnValueOnce(true);

    const existingAttributes = {
      default: {
        year: 1990,
        month: 1,
        day: 1,
      },
    };
    const objectOutput = {
      Body: {
        toString,
      },
    };
    toString.mockReturnValueOnce(JSON.stringify(existingAttributes));
    getS3Object.mockReturnValueOnce(objectOutput);

    const response = await LoadBirthdayInterceptor.process(handlerInput);

    expect(response);
    expect(mockConsoleError).not.toHaveBeenCalled();
  });

  it('should be able process with persistent attributes elsewhere and with invalid month', async () => {
    getPersistentAttributes.mockReturnValueOnce(false);
    s3ObjectExists.mockReturnValueOnce(true);

    const existingAttributes = {
      default: {
        year: 1990,
        month: 0,
        day: 1,
      },
    };
    const objectOutput = {
      Body: {
        toString,
      },
    };
    toString.mockReturnValueOnce(JSON.stringify(existingAttributes));
    getS3Object.mockReturnValueOnce(objectOutput);

    const response = await LoadBirthdayInterceptor.process(handlerInput);

    expect(response);
    expect(mockConsoleError).not.toHaveBeenCalled();
  });

  it('should be able process with persistent attributes elsewhere and with invalid date', async () => {
    // Realmente não sei como isto poderia acontecer. XD
    jest.spyOn(global, 'Date').mockImplementation(() => {
      return {};
    });

    getPersistentAttributes.mockReturnValueOnce(false);
    s3ObjectExists.mockReturnValueOnce(true);

    const existingAttributes = {
      default: {
        year: 1990,
        month: 1,
        day: 1,
      },
    };
    const objectOutput = {
      Body: {
        toString,
      },
    };
    toString.mockReturnValueOnce(JSON.stringify(existingAttributes));
    getS3Object.mockReturnValueOnce(objectOutput);

    const response = await LoadBirthdayInterceptor.process(handlerInput);

    expect(response);
    expect(mockConsoleError).not.toHaveBeenCalled();
  });

  it('should be able process', () => {
    getPersistentAttributes.mockReturnValueOnce({
      [personId]: {
        dateOfBirth: '1990-1-1',
      },
    });

    expect(LoadBirthdayInterceptor.process(handlerInput));
    expect(mockConsoleError).not.toHaveBeenCalled();
  });

  it('should be able process personalized', () => {
    handlerInput.requestEnvelope.context.System.person = {
      personId,
    };

    getPersistentAttributes.mockReturnValueOnce({
      [personId]: {
        dateOfBirth: '1990-1-1',
      },
    });

    expect(LoadBirthdayInterceptor.process(handlerInput));
    expect(mockConsoleError).not.toHaveBeenCalled();
  });

  it('should be able process personalized with persistent attributes elsewhere', async () => {
    handlerInput.requestEnvelope.context.System.person = {
      personId,
    };

    getPersistentAttributes.mockReturnValueOnce(false);
    s3ObjectExists.mockReturnValueOnce(true);

    const existingAttributes = {
      [personId]: {
        year: 1990,
        month: 1,
        day: 1,
      },
    };
    const objectOutput = {
      Body: {
        toString,
      },
    };
    toString.mockReturnValueOnce(JSON.stringify(existingAttributes));
    getS3Object.mockReturnValueOnce(objectOutput);

    const response = await LoadBirthdayInterceptor.process(handlerInput);

    expect(response);
    expect(mockConsoleError).not.toHaveBeenCalled();
  });

  it('should be able process with return error', async () => {
    getPersistentAttributes.mockReturnValueOnce(false);
    s3ObjectExists.mockImplementation(() => {
      throw new Error('InternalError'); // Simula um erro genérico.
    });

    const existingAttributes = {
      [personId]: {
        year: 1990,
        month: 1,
        day: 1,
      },
    };
    const objectOutput = {
      Body: {
        toString,
      },
    };
    toString.mockReturnValueOnce(JSON.stringify(existingAttributes));
    getS3Object.mockReturnValueOnce(objectOutput);

    await LoadBirthdayInterceptor.process(handlerInput);

    expect(mockConsoleError).toHaveBeenCalledWith(
      'error',
      'LoadBirthdayInterceptor - InternalError',
    );
  });
});
