const Alexa = require('ask-sdk-core');
const AWS = require('aws-sdk');
const DDBAdapter = require('ask-sdk-dynamodb-persistence-adapter');

const HasBirthdayLaunchRequestHandler = require('./handlers/HasBirthdayLaunchRequestHandler');
const LaunchRequestHandler = require('./handlers/LaunchRequestHandler');
const CaptureBirthdayIntentHandler = require('./handlers/CaptureBirthdayIntentHandler');
const HelpIntentHandler = require('./handlers/HelpIntentHandler');
const CancelAndStopIntentHandler = require('./handlers/CancelAndStopIntentHandler');
const FallbackIntentHandler = require('./handlers/FallbackIntentHandler');
const SessionEndedRequestHandler = require('./handlers/SessionEndedRequestHandler');
const ErrorHandler = require('./handlers/ErrorHandler');

const LoadBirthdayInterceptor = require('./interceptors/LoadBirthdayInterceptor');

process.env.URL_ICON_108 = 'https://example.com/icon_108.png';
process.env.URL_ICON_512 = 'https://example.com/icon_512.png';

exports.handler = Alexa.SkillBuilders.custom()
  .withPersistenceAdapter(
    new DDBAdapter.DynamoDbPersistenceAdapter({
      tableName: process.env.DYNAMODB_PERSISTENCE_TABLE_NAME,
      createTable: false,
      dynamoDBClient: new AWS.DynamoDB({
        apiVersion: 'latest',
        region: process.env.DYNAMODB_PERSISTENCE_REGION,
      }),
    }),
  )
  .addRequestHandlers(
    HasBirthdayLaunchRequestHandler,
    LaunchRequestHandler,
    HelpIntentHandler,
    CancelAndStopIntentHandler,
    CaptureBirthdayIntentHandler,
    FallbackIntentHandler,
    SessionEndedRequestHandler,
  )
  .addErrorHandlers(ErrorHandler)
  .addRequestInterceptors(LoadBirthdayInterceptor)
  .withApiClient(new Alexa.DefaultApiClient())
  .lambda();
