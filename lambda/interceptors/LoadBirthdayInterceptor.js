const Util = require('../util');

const LoadBirthdayInterceptor = {
  async process(handlerInput) {
    try {
      let personId = 'default';
      const { person } = handlerInput.requestEnvelope.context.System;
      if (person) {
        personId = person.personId;
      }

      const { attributesManager } = handlerInput;
      const sessionAttributes =
        (await attributesManager.getPersistentAttributes()) || {};

      let personAttributes = Object.prototype.hasOwnProperty.call(
        sessionAttributes,
        personId,
      )
        ? sessionAttributes[personId]
        : {};

      const dateOfBirth = Object.prototype.hasOwnProperty.call(
        personAttributes,
        'dateOfBirth',
      )
        ? personAttributes.dateOfBirth
        : false;

      if (dateOfBirth !== false) {
        attributesManager.setSessionAttributes(sessionAttributes);
      }
      // - Início -
      // Código temporário que será utilizado apenas para ler
      // as datas de nascimento que ainda estão cadastradas no S3.
      else {
        const { userId } = handlerInput.requestEnvelope.context.System.user;

        const objectExists = await Util.s3ObjectExists(userId);
        // console.log('objectExists:', objectExists);
        if (objectExists === true) {
          const objectOutput = await Util.getS3Object(userId);
          const existingAttributes = JSON.parse(
            objectOutput.Body.toString('utf-8'),
          );
          // console.log('existingAttributes:', existingAttributes);

          personAttributes = Object.prototype.hasOwnProperty.call(
            existingAttributes,
            personId,
          )
            ? existingAttributes[personId]
            : {};

          const slotYear = Object.prototype.hasOwnProperty.call(
            personAttributes,
            'year',
          )
            ? personAttributes.year
            : 0;
          const slotMonth = Object.prototype.hasOwnProperty.call(
            personAttributes,
            'month',
          )
            ? personAttributes.month
            : 0;
          const slotDay = Object.prototype.hasOwnProperty.call(
            personAttributes,
            'day',
          )
            ? personAttributes.day
            : 0;

          const year = Number(slotYear);
          // No JavaScript o primeiro mês no "new Date()" começa com zero.
          const month = Number(slotMonth) - 1;
          const day = Number(slotDay);

          // Verifica o número do ano de nascimento
          // e o número do dia de nascimento.
          if (year <= 0 || day <= 0) {
            return;
          }

          // Verifica se é uma data válida.
          // Inspirado em:
          // https://stackoverflow.com/questions/1353684/#1353711
          const checkDate = new Date(year, month, day);
          if (
            !(checkDate instanceof Date) ||
            Number.isNaN(checkDate.getTime())
          ) {
            return;
          }

          if (slotYear !== 0 && slotMonth !== 0 && slotDay !== 0) {
            const attributes = {
              [personId]: {
                // No JavaScript o primeiro mês no "new Date()" começa com zero.
                dateOfBirth: `${year}-${month + 1}-${day}`,
              },
            };
            Object.assign(sessionAttributes, attributes);
            attributesManager.setSessionAttributes(sessionAttributes);
          }
        }
      }
      // - Fim -
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error('error', `LoadBirthdayInterceptor - ${error.message}`);
    }
  },
};

module.exports = LoadBirthdayInterceptor;
