const Alexa = require('ask-sdk-core');
const speaks = require('../speakStrings');

const CaptureBirthdayIntentHandler = {
  canHandle(handlerInput) {
    return (
      handlerInput.requestEnvelope.request.type === 'IntentRequest' &&
      handlerInput.requestEnvelope.request.intent.name ===
        'CaptureBirthdayIntent'
    );
  },
  async handle(handlerInput) {
    try {
      const { serviceClientFactory } = handlerInput;
      const { deviceId } = handlerInput.requestEnvelope.context.System.device;

      let personId = 'default';
      const { person } = handlerInput.requestEnvelope.context.System;
      if (person) {
        personId = person.personId;
      }

      let dateOfBirth = Alexa.getSlotValue(
        handlerInput.requestEnvelope,
        'dateOfBirth',
      );
      // console.log('dateOfBirth:', dateOfBirth);

      dateOfBirth = dateOfBirth.split('-');
      // Exemplo: XX99 => 99
      let year = Number(dateOfBirth[0].replace('XX', ''));
      // No JavaScript o primeiro mês no "new Date()" começa com zero.
      const month = Number(dateOfBirth[1]) - 1;
      const day = Number(dateOfBirth[2]);

      // Ajusta os anos com dois dígitos.
      if (year < 100) {
        year += 1900;
      }

      // Verifica se é uma data válida.
      const checkDate = new Date(year, month, day);
      if (!(checkDate instanceof Date) || Number.isNaN(checkDate.getTime())) {
        throw Error(
          `Invalid date of birth in capture - ` +
            // No JavaScript o primeiro mês no "new Date()" começa com zero.
            `Year: ${year}, month: ${month + 1} and day: ${day}`,
        );
      }

      let userTimeZone;
      try {
        const upsServiceClient = serviceClientFactory.getUpsServiceClient();
        userTimeZone = await upsServiceClient.getSystemTimeZone(deviceId);
      } catch (error) {
        if (error.name !== 'ServiceError') {
          return handlerInput.responseBuilder
            .speak(speaks.PROBLEM)
            .withShouldEndSession(true)
            .getResponse();
        }

        throw Error(`ServiceError: ${error.message}`);
      }

      // Obtém a data atual com a hora.
      const currentDateTime = new Date(
        new Date().toLocaleString('en-US', { timeZone: userTimeZone }),
      );
      // Obtém o ano atual.
      const currentYear = currentDateTime.getFullYear();

      // Verifica se número capturado no ano de nascimento é igual
      // ou maior que o ano atual.
      if (year >= currentYear) {
        throw Error(`Future year of birth in capture - Year: ${year}`);
      }

      const { attributesManager } = handlerInput;
      const sessionAttributes =
        (await attributesManager.getPersistentAttributes()) || {};

      const dateOfBirthAttributes = {
        [personId]: {
          // No JavaScript o primeiro mês no "new Date()" começa com zero.
          dateOfBirth: `${year}-${month + 1}-${day}`,
          // Salva a data do último acesso.
          lastAccess: new Date().toISOString(),
        },
      };
      Object.assign(sessionAttributes, dateOfBirthAttributes);
      attributesManager.setPersistentAttributes(sessionAttributes);
      await attributesManager.savePersistentAttributes();

      return handlerInput.responseBuilder
        .speak(speaks.REMEMBER)
        .withStandardCard(speaks.SKILL_NAME, speaks.REMEMBER)
        .withShouldEndSession(true)
        .getResponse();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('error', `CaptureBirthdayIntentHandler - ${error.message}`);
    }

    return handlerInput.responseBuilder
      .speak(speaks.NOT_UNDERSTAND_BIRTH_DATE_CAPTURE)
      .withStandardCard(
        speaks.SKILL_NAME,
        speaks.NOT_UNDERSTAND_BIRTH_DATE_CAPTURE,
      )
      .withShouldEndSession(true)
      .getResponse();
  },
};

module.exports = CaptureBirthdayIntentHandler;
