const AWS = require('aws-sdk');

jest.useFakeTimers();

const Util = require('../lambda/util');

const userId = 'amzn1.ask.account.XXXXXXXX';
process.env.S3_PERSISTENCE_BUCKET = 'amzn1-ask-skill-XXXXXXXX';

describe('Test Util', () => {
  const mockS3 = jest.fn();
  const headObject = jest.fn();
  const getObject = jest.fn();
  const mockPromise = jest.fn();
  AWS.S3 = mockS3;

  it('should be able call getS3PreSignedUrl', () => {
    const url = Util.getS3PreSignedUrl(userId);

    expect(url).toEqual('https://s3.amazonaws.com/');
  });

  it('should be able call s3ObjectExists', async () => {
    mockS3.mockReturnValueOnce({
      headObject,
    });
    headObject.mockReturnValueOnce({
      promise: mockPromise,
    });
    mockPromise.mockReturnValueOnce(
      new Promise(resolve => {
        resolve();
      }),
    );

    const response = await Util.s3ObjectExists(userId);

    expect(response).toEqual(true);
  });

  it('should be able return error at call s3ObjectExists when error code is "NotFound"', async () => {
    mockS3.mockReturnValueOnce({
      headObject,
    });
    headObject.mockReturnValueOnce({
      promise: mockPromise,
    });
    mockPromise.mockReturnValueOnce(
      new Promise((_, reject) => {
        // eslint-disable-next-line prefer-promise-reject-errors
        reject({
          code: 'NotFound',
        });
      }),
    );

    const response = await Util.s3ObjectExists(userId);

    expect(response).toEqual(false);
  });

  it('should be able return error at call s3ObjectExists when error code is diferent "NotFound"', async () => {
    mockS3.mockReturnValueOnce({
      headObject,
    });
    headObject.mockReturnValueOnce({
      promise: mockPromise,
    });
    mockPromise.mockReturnValueOnce(
      new Promise((_, reject) => {
        // eslint-disable-next-line prefer-promise-reject-errors
        reject({
          code: 'InternalError',
        });
      }),
    );

    let currentError = null;

    try {
      await Util.s3ObjectExists(userId);
    } catch (error) {
      currentError = error;
    }

    expect(currentError).toEqual({ code: 'InternalError' });
  });

  it('should be able call getS3Object', async () => {
    mockS3.mockReturnValueOnce({
      getObject,
    });
    getObject.mockImplementation((_, error) => {
      error(false);

      return {
        promise: mockPromise,
      };
    });
    mockPromise.mockReturnValueOnce(
      new Promise(resolve => {
        resolve();
      }),
    );

    const response = await Util.getS3Object(userId);

    expect(response);
  });

  it('should be able return error at call getS3Object', async () => {
    mockS3.mockReturnValueOnce({
      getObject,
    });
    getObject.mockImplementation((_, error) => {
      error('InternalError');
    });

    let currentError = null;

    try {
      await Util.getS3Object(userId);
    } catch (error) {
      currentError = error;
    }

    expect(currentError).toEqual(new Error('error'));
  });
});
