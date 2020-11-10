const Alexa = require('ask-sdk-core');
const persistenceAdapter = require('ask-sdk-s3-persistence-adapter');
const Escape = require('lodash/escape');

const Util = require('./util.js');

const messages = {
    SKILL_NAME: 'Cadê Meu Bolo',
    WELCOME: 'Olá! Bem-vindo ao Cadê Meu Bolo. Quando é que você nasceu?',
    PERSONALIZED_WELCOME: 'Olá <alexa:name type="first" personId="{0}"/>! Bem-vindo ao Cadê Meu Bolo. Quando é que você nasceu?',
    WELCOME_BACK: 'Oi, ainda faltam {0} dias para o seu aniversário de {1} anos.',
    PERSONALIZED_WELCOME_BACK: 'Oi <alexa:name type="first" personId="{0}"/>, ainda faltam {1} dias para o seu aniversário de {2} anos.',
    INTERJECTION: ' <say-as interpret-as="interjection">Viva!</say-as> ',
    HAPPY_BIRTHDAY: 'Feliz Aniversário! 👏👏👏',
    REPROMPT: 'Eu nasci em 6 de novembro de 2014. Quando é que você nasceu?',
    REMEMBER: 'Obrigado. Vou lembrar quantos dias faltam para o seu aniversário.',
    HELP: 'Eu sou capaz de lembrar quantos dias faltam para o seu aniversário. Quando é que você nasceu?',
    PROBLEM: 'Ocorreu um problema ao conectar-se ao serviço. Por favor, tente novamente.',
    NOT_UNDERSTAND: 'Desculpe, não consegui entender. Por favor, fale novamente.',
    NOT_UNDERSTAND_BIRTH_DATE_CAPTURE: 'Desculpe, não consegui entender a sua data de nascimento. Por favor, chame novamente esta skill.',
    NOT_UNDERSTAND_BIRTH_DATE_STORAGE: 'Desculpe, não consegui recuperar a sua data de nascimento. Por favor, acesse o aplicativo Alexa, desative e ative novamente esta skill.',
    BYE_BYE: 'Tchauzinho!',
    AUDIO: '<audio src="{0}" />',
};

const monthsEnglish = {
    'janeiro': 'january',
    'fevereiro': 'february',
    'março': 'march',
    'abril': 'april',
    'maio': 'may',
    'junho': 'june',
    'julho': 'july',
    'agosto': 'august',
    'setembro': 'september',
    'outubro': 'october',
    'novembro': 'november',
    'dezembro': 'december',
};

/*
 * Formata string.
 * Equivalente ao "printf()" C/PHP ou ao "String.Format()" para programadores C#/Java.
 */
String.prototype.format = function() {
	var args = arguments;
	return this.replace(/\{(\d+)\}/g, function(text, key) {
		return args[key];
	});
};

const HasBirthdayLaunchRequestHandler = {
    canHandle(handlerInput) {
        let personId = 'default'
        const person = handlerInput.requestEnvelope.context.System.person;
        if(person) {
            personId = person.personId;
        }

        const attributesManager = handlerInput.attributesManager;
        const sessionAttributes = attributesManager.getSessionAttributes() || {};

        const birthdayAttributes = sessionAttributes.hasOwnProperty(personId) ? sessionAttributes[personId] : {};
        
        const slotYear = birthdayAttributes.hasOwnProperty('year') ? birthdayAttributes.year : 0;
        const slotMonth = birthdayAttributes.hasOwnProperty('month') ? birthdayAttributes.month : 0;
        const slotDay = birthdayAttributes.hasOwnProperty('day') ? birthdayAttributes.day : 0;
        
        return handlerInput.requestEnvelope.request.type === 'LaunchRequest' &&
            slotYear &&
            slotMonth &&
            slotDay;
    },
    async handle(handlerInput) {
        
        const serviceClientFactory = handlerInput.serviceClientFactory;
        const deviceId = handlerInput.requestEnvelope.context.System.device.deviceId;

        let personId = 'default'
        const person = handlerInput.requestEnvelope.context.System.person;
        if(person) {
            personId = person.personId;
        }
        
        const attributesManager = handlerInput.attributesManager;
        const sessionAttributes = attributesManager.getSessionAttributes() || {};

        const birthdayAttributes = sessionAttributes.hasOwnProperty(personId) ? sessionAttributes[personId] : {};
        
        const slotYear = birthdayAttributes.hasOwnProperty('year') ? birthdayAttributes.year : 0;
        const slotMonth = birthdayAttributes.hasOwnProperty('month') ? birthdayAttributes.month : 0;
        const slotDay = birthdayAttributes.hasOwnProperty('day') ? birthdayAttributes.day : 0;

        let year = parseInt(slotYear);
        let month = parseInt(slotMonth) - 1; // No JavaScript o primeiro mês começa com zero.
        let day = parseInt(slotDay);

        // Verifica o número do ano de nascimento.
        if(year <= 0) {
            console.log('error', `Invalid year of birth in storage - Year: ${year}`);

            return handlerInput.responseBuilder
                .speak(messages.NOT_UNDERSTAND_BIRTH_DATE_STORAGE)
                .withStandardCard(
                    messages.SKILL_NAME,
                    messages.NOT_UNDERSTAND_BIRTH_DATE_STORAGE
                )
                .withShouldEndSession(true)
                .getResponse();
        }

        // Verifica o número do dia de nascimento.
        if(day <= 0) {
            console.log('error', `Invalid day of birth in storage - Day: ${day}`);

            return handlerInput.responseBuilder
                .speak(messages.NOT_UNDERSTAND_BIRTH_DATE_STORAGE)
                .withStandardCard(
                    messages.SKILL_NAME,
                    messages.NOT_UNDERSTAND_BIRTH_DATE_STORAGE
                )
                .withShouldEndSession(true)
                .getResponse();
        }

        // Verifica se é uma data válida.
        // (Inspirado em: https://stackoverflow.com/questions/1353684/#1353711)
        const dateBirth = new Date(year, month, day);
        if (!(dateBirth instanceof Date) || isNaN(dateBirth.getTime())) {
            console.log('error', `Invalid date of birth in storage - Year: ${year}, month: ${month + 1} and day: ${day}`);

            return handlerInput.responseBuilder
                .speak(messages.NOT_UNDERSTAND_BIRTH_DATE_STORAGE)
                .withStandardCard(
                    messages.SKILL_NAME,
                    messages.NOT_UNDERSTAND_BIRTH_DATE_STORAGE
                )
                .withShouldEndSession(true)
                .getResponse();
        }
        
        let userTimeZone;
        try {
            const upsServiceClient = serviceClientFactory.getUpsServiceClient();
            userTimeZone = await upsServiceClient.getSystemTimeZone(deviceId);    
        } catch (error) {
            if (error.name !== 'ServiceError') {
                return handlerInput.responseBuilder
                    .speak(messages.PROBLEM)
                    .withShouldEndSession(true)
                    .getResponse();
            }
            console.log('error', error.message);
        }
        
        const oneDay = 24*60*60*1000;
        
        // Obtém a data atual com a hora.
        const currentDateTime = new Date(new Date().toLocaleString("en-US", {timeZone: userTimeZone}));
        // Remove a hora da data porque afeta o cálculo de diferença.
        const currentDate = new Date(currentDateTime.getFullYear(), currentDateTime.getMonth(), currentDateTime.getDate());
        let currentYear = currentDate.getFullYear();
        
        // Obtém o próximo antiversário.
        let nextBirthday = new Date(currentYear, month, day);
        nextBirthday = nextBirthday.getTime();
        
        // Ajusta o próximo aniversário em um ano se a data atual for após o aniversário.
        if (currentDate.getTime() > nextBirthday) {
            nextBirthday = new Date(currentYear + 1, month, day);
            nextBirthday = nextBirthday.getTime();
            currentYear++;
        }
        
        // Define a fala padrão para "Bem vindo de volta...".
        // Quando for o dia do aniversário, toca o áudio "parabéns pra você", dê os parabéns e toca o áudio dos aplausos.
        let speakOutput = null;
        if (currentDate.getTime() !== nextBirthday) {
            const diffDays = Math.round(Math.abs((currentDate.getTime() - nextBirthday) / oneDay));

            if(personId !== 'default') {
                speakOutput = messages.PERSONALIZED_WELCOME_BACK.format(personId, diffDays, currentYear - year);
            }
            else {
                speakOutput = messages.WELCOME_BACK.format(diffDays, currentYear - year);
            }

            return handlerInput.responseBuilder
                .speak(speakOutput)
                .withStandardCard(
                    messages.SKILL_NAME,
                    messages.WELCOME_BACK.format(diffDays, currentYear - year)
                )
                .withShouldEndSession(true)
                .getResponse();
        }
        else {
            const urlHappyBirthDay = Escape(Util.getS3PreSignedUrl('Media/alexa_happy_birthday_pt_br.mp3'));
            const urlApplause = Escape(Util.getS3PreSignedUrl('Media/applause.mp3'));
            
            speakOutput = messages.AUDIO.format(urlHappyBirthDay) + messages.INTERJECTION + messages.AUDIO.format(urlApplause);
        }
        
        return handlerInput.responseBuilder
            .speak(speakOutput)
            .withShouldEndSession(true)
            .getResponse();
    }
};

const LaunchRequestHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'LaunchRequest';
    },
    handle(handlerInput) {
        const person = handlerInput.requestEnvelope.context.System.person;

        let speakOutput = null;

        if(person) {
            speakOutput = messages.PERSONALIZED_WELCOME.format(person.personId)
        }
        else {
            speakOutput = messages.WELCOME;
        }

        return handlerInput.responseBuilder
            .speak(speakOutput)
            .withStandardCard(
                messages.SKILL_NAME,
                messages.WELCOME
            )
            .reprompt(messages.REPROMPT)
            .getResponse();
    }
};

const CaptureBirthdayIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'CaptureBirthdayIntent';
    },
    async handle(handlerInput) {
        const serviceClientFactory = handlerInput.serviceClientFactory;
        const deviceId = handlerInput.requestEnvelope.context.System.device.deviceId;

        let personId = 'default'
        const person = handlerInput.requestEnvelope.context.System.person;
        if(person) {
            personId = person.personId;
        }

        const slotYear = handlerInput.requestEnvelope.request.intent.slots.year.value;
        const slotMonth = handlerInput.requestEnvelope.request.intent.slots.month.value;
        const slotDay = handlerInput.requestEnvelope.request.intent.slots.day.value;

        let year = parseInt(slotYear);
        let month = Object.keys(monthsEnglish).indexOf(slotMonth);
        let day = parseInt(slotDay);

        // Verifica o número capturado no ano de nascimento.
        if(year <= 0) {
            console.log('error', `Invalid year of birth in capture - Year: ${year}`);

            return handlerInput.responseBuilder
                .speak(messages.NOT_UNDERSTAND_BIRTH_DATE_CAPTURE)
                .withStandardCard(
                    messages.SKILL_NAME,
                    messages.NOT_UNDERSTAND_BIRTH_DATE_CAPTURE
                )
                .withShouldEndSession(true)
                .getResponse();
        }

        // Verifica o número capturado no dia de nascimento.
        if(day <= 0) {
            console.log('error', `Invalid day of birth in capture - Day: ${day}`);

            return handlerInput.responseBuilder
                .speak(messages.NOT_UNDERSTAND_BIRTH_DATE_CAPTURE)
                .withStandardCard(
                    messages.SKILL_NAME,
                    messages.NOT_UNDERSTAND_BIRTH_DATE_CAPTURE
                )
                .withShouldEndSession(true)
                .getResponse();
        }

        if(year < 100) {
            year += 1900;
        }

        // Verifica se é uma data válida.
        const dateBirth = new Date(year, month, day);
        if (!(dateBirth instanceof Date) || isNaN(dateBirth.getTime())) {
            console.log('error', `Invalid date of birth in capture - Year: ${year}, month: ${month} and day: ${day}`);

            return handlerInput.responseBuilder
                .speak(messages.NOT_UNDERSTAND_BIRTH_DATE_CAPTURE)
                .withStandardCard(
                    messages.SKILL_NAME,
                    messages.NOT_UNDERSTAND_BIRTH_DATE_CAPTURE
                )
                .withShouldEndSession(true)
                .getResponse();
        }

        let userTimeZone;
        try {
            const upsServiceClient = serviceClientFactory.getUpsServiceClient();
            userTimeZone = await upsServiceClient.getSystemTimeZone(deviceId);
        } catch (error) {
            if (error.name !== 'ServiceError') {
                return handlerInput.responseBuilder
                    .speak(messages.PROBLEM)
                    .withShouldEndSession(true)
                    .getResponse();
            }
            console.log('error', error.message);
        }

        // Obtém a data atual com a hora.
        const currentDateTime = new Date(new Date().toLocaleString('en-US', { timeZone: userTimeZone }));
        // Obtém o ano atual.
        const currentYear = currentDateTime.getFullYear();

        // Verifica se número capturado no ano de nascimento é igual ou maior que o ano atual.
        if(year >= currentYear) {
            console.log('error', `Future year of birth in capture - Year: ${year}`);

            return handlerInput.responseBuilder
                .speak(messages.NOT_UNDERSTAND_BIRTH_DATE_CAPTURE)
                .withStandardCard(
                    messages.SKILL_NAME,
                    messages.NOT_UNDERSTAND_BIRTH_DATE_CAPTURE
                )
                .withShouldEndSession(true)
                .getResponse();
        }
        
        const attributesManager = handlerInput.attributesManager;
        let sessionAttributes = await attributesManager.getPersistentAttributes() || {};
        
        const birthdayAttributes = {
            [personId]: {
                'year': year,
                'month': month + 1, // No JavaScript o primeiro mês começa com zero.
                'day': day
            }
        };
        Object.assign(sessionAttributes, birthdayAttributes);

        attributesManager.setPersistentAttributes(sessionAttributes);
        await attributesManager.savePersistentAttributes();    
        
        return handlerInput.responseBuilder
            .speak(messages.REMEMBER.format(dia, mes, ano))
            .withShouldEndSession(true)
            .getResponse();
    }
};

const HelpIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'AMAZON.HelpIntent';
    },
    handle(handlerInput) {
        return handlerInput.responseBuilder
            .speak(messages.HELP)
            .reprompt(messages.HELP)
            .getResponse();
    }
};

const CancelAndStopIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && (handlerInput.requestEnvelope.request.intent.name === 'AMAZON.CancelIntent'
                || handlerInput.requestEnvelope.request.intent.name === 'AMAZON.StopIntent');
    },
    handle(handlerInput) {
        return handlerInput.responseBuilder
            .speak(messages.BYE_BYE)
            .withStandardCard(
                messages.SKILL_NAME,
                messages.BYE_BYE
            )
            .withShouldEndSession(true)
            .getResponse();
    }
};

const FallbackIntentHandler = {
    canHandle(handlerInput) {
        return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
            && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.FallbackIntent';
    },
    handle(handlerInput) {
        return handlerInput.responseBuilder
            .speak(messages.NOT_UNDERSTAND_BIRTH_DATE_CAPTURE)
            .withStandardCard(
                messages.SKILL_NAME,
                messages.NOT_UNDERSTAND_BIRTH_DATE_CAPTURE
            )
            .withShouldEndSession(true)
            .getResponse();
    }
};

const SessionEndedRequestHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'SessionEndedRequest';
    },
    handle(handlerInput) {
        return handlerInput.responseBuilder.getResponse();
    }
};

const ErrorHandler = {
    canHandle() {
        return true;
    },
    handle(handlerInput, error) {
        console.log(`~~~~ Error handled: ${error.message}`);

        return handlerInput.responseBuilder
            .speak(messages.UNDERSTAND)
            .reprompt(messages.UNDERSTAND)
            .getResponse();
    }
};

const LoadBirthdayInterceptor = {
    async process(handlerInput) {
        let personId = 'default'
        const person = handlerInput.requestEnvelope.context.System.person;
        if(person) {
            personId = person.personId;
        }

        const attributesManager = handlerInput.attributesManager;
        const sessionAttributes = await attributesManager.getPersistentAttributes() || {};

        const birthdayAttributes = sessionAttributes.hasOwnProperty(personId) ? sessionAttributes[personId] : {};

        const slotYear = birthdayAttributes.hasOwnProperty('year') ? birthdayAttributes.year : 0;
        const slotMonth = birthdayAttributes.hasOwnProperty('month') ? birthdayAttributes.month : 0;
        const slotDay = birthdayAttributes.hasOwnProperty('day') ? birthdayAttributes.day : 0;
        
        if (slotYear && slotMonth && slotDay) {
            attributesManager.setSessionAttributes(sessionAttributes);
        }
    }
}

exports.handler = Alexa.SkillBuilders.custom()
    .withPersistenceAdapter(
        new persistenceAdapter.S3PersistenceAdapter({bucketName:process.env.S3_PERSISTENCE_BUCKET})
    )
    .addRequestHandlers(
        HasBirthdayLaunchRequestHandler,
        LaunchRequestHandler,
        CaptureBirthdayIntentHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        FallbackIntentHandler,
        SessionEndedRequestHandler)
    .addErrorHandlers(
        ErrorHandler)
    .addRequestInterceptors(
        LoadBirthdayInterceptor
    )
    .withApiClient(new Alexa.DefaultApiClient())
    .lambda();
