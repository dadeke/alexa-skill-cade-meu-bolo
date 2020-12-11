const Escape = require('lodash/escape');
const Util = require('../util');
const speaks = require('../speakStrings');

const HasBirthdayLaunchRequestHandler = {
  canHandle(handlerInput) {
    // Evitar de entrar caso não seja esta intenção.
    if (handlerInput.requestEnvelope.request.type !== 'LaunchRequest') {
      return false;
    }

    let personId = 'default';
    const { person } = handlerInput.requestEnvelope.context.System;
    if (person) {
      personId = person.personId;
    }

    const { attributesManager } = handlerInput;
    const sessionAttributes = attributesManager.getSessionAttributes() || {};
    // console.log('sessionAttributes:', sessionAttributes);
    const personAttributes = Object.prototype.hasOwnProperty.call(
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

    return dateOfBirth !== false;
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

      const { attributesManager } = handlerInput;
      const sessionAttributes = attributesManager.getSessionAttributes() || {};

      const personAttributes = Object.prototype.hasOwnProperty.call(
        sessionAttributes,
        personId,
      )
        ? sessionAttributes[personId]
        : {};

      let dateOfBirth = Object.prototype.hasOwnProperty.call(
        personAttributes,
        'dateOfBirth',
      )
        ? personAttributes.dateOfBirth
        : false;

      if (dateOfBirth === false) {
        throw Error(`dateOfBirth is false`);
      }

      dateOfBirth = dateOfBirth.split('-');
      const year = Number(dateOfBirth[0]);
      // No JavaScript o primeiro mês no "new Date()" começa com zero.
      const month = Number(dateOfBirth[1]) - 1;
      const day = Number(dateOfBirth[2]);

      // Verifica se é uma data válida.
      // (Inspirado em: https://stackoverflow.com/questions/1353684/#1353711)
      const checkDate = new Date(year, month, day);
      if (!(checkDate instanceof Date) || Number.isNaN(checkDate.getTime())) {
        throw Error(
          `Invalid date of birth in storage - Year: ${year}, month: ${
            month + 1
          } and day: ${day}`,
        );
      }

      // Captura o fuso horário do dispositivo.
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

      // Salva a data do último acesso.
      const newAttributes = {
        [personId]: {
          // No JavaScript o primeiro mês no "new Date()" começa com zero.
          dateOfBirth: `${year}-${month + 1}-${day}`,
          // Salva a data do último acesso.
          lastAccess: new Date().toISOString(),
        },
      };
      Object.assign(sessionAttributes, newAttributes);
      attributesManager.setPersistentAttributes(sessionAttributes);
      await attributesManager.savePersistentAttributes();

      const oneDay = 24 * 60 * 60 * 1000;

      // Obtém a data atual com a hora.
      const currentDateTime = new Date(
        new Date().toLocaleString('en-US', { timeZone: userTimeZone }),
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

        if (personId !== 'default') {
          speakOutput = speaks.PERSONALIZED_WELCOME_BACK.format(
            personId,
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
            speaks.WELCOME_BACK.format(
              diffDays,
              speakDays,
              yearsOld,
              speakYears,
            ),
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
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(
        'error',
        `HasBirthdayLaunchRequestHandler - ${error.message}`,
      );
    }

    return handlerInput.responseBuilder
      .speak(speaks.NOT_UNDERSTAND_BIRTH_DATE_STORAGE)
      .withStandardCard(
        speaks.SKILL_NAME,
        speaks.NOT_UNDERSTAND_BIRTH_DATE_STORAGE,
      )
      .withShouldEndSession(true)
      .getResponse();
  },
};

module.exports = HasBirthdayLaunchRequestHandler;
