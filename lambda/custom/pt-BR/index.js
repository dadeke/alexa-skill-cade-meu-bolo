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

const meses_ingles = {
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
        const attributesManager = handlerInput.attributesManager;
        const sessionAttributes = attributesManager.getSessionAttributes() || {};
        
        const ano = sessionAttributes.hasOwnProperty('ano') ? sessionAttributes.ano : 0;
        const mes = sessionAttributes.hasOwnProperty('mes') ? sessionAttributes.mes : 0;
        const dia = sessionAttributes.hasOwnProperty('dia') ? sessionAttributes.dia : 0;
        
        return handlerInput.requestEnvelope.request.type === 'LaunchRequest' &&
            ano &&
            mes &&
            dia;
    },
    async handle(handlerInput) {
        
        const serviceClientFactory = handlerInput.serviceClientFactory;
        const deviceId = handlerInput.requestEnvelope.context.System.device.deviceId;
        
        const attributesManager = handlerInput.attributesManager;
        const sessionAttributes = attributesManager.getSessionAttributes() || {};
        
        const ano = sessionAttributes.hasOwnProperty('ano') ? sessionAttributes.ano : 0;
        const mes = sessionAttributes.hasOwnProperty('mes') ? sessionAttributes.mes : 0;
        const dia = sessionAttributes.hasOwnProperty('dia') ? sessionAttributes.dia : 0;
        
        let userTimeZone;
        try {
            const upsServiceClient = serviceClientFactory.getUpsServiceClient();
            userTimeZone = await upsServiceClient.getSystemTimeZone(deviceId);    
        } catch (error) {
            if (error.name !== 'ServiceError') {
                return handlerInput.responseBuilder.speak(messages.PROBLEM).getResponse();
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
        let nextBirthday = Date.parse(`${meses_ingles[mes]} ${dia}, ${currentYear}`);
        
        // Ajusta o próximo aniversário em um ano se a data atual for após o aniversário.
        if (currentDate.getTime() > nextBirthday) {
            nextBirthday = Date.parse(`${meses_ingles[mes]} ${dia}, ${currentYear + 1}`);
            currentYear++;
        }
        
        // Define a fala padrão para "Bem vindo de volta...".
        // Quando for o dia do aniversário, toca o áudio "parabéns pra você", dê os parabéns e toca o áudio dos aplausos.
        let speakOutput = null;
        if (currentDate.getTime() !== nextBirthday) {
            const diffDays = Math.round(Math.abs((currentDate.getTime() - nextBirthday)/oneDay));
            speakOutput = messages.WELCOME_BACK.format(diffDays, currentYear - ano);
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
        return handlerInput.responseBuilder
            .speak(messages.WELCOME)
            .reprompt(messages.REPROMPT)
            .getResponse();
    }
};

const BirthdayIntentHandler = {
    canHandle(handlerInput) {
        return handlerInput.requestEnvelope.request.type === 'IntentRequest'
            && handlerInput.requestEnvelope.request.intent.name === 'CapturarAniversario';
    },
    async handle(handlerInput) {
        const ano = handlerInput.requestEnvelope.request.intent.slots.ano.value;
        const mes = handlerInput.requestEnvelope.request.intent.slots.mes.value;
        const dia = handlerInput.requestEnvelope.request.intent.slots.dia.value;
        
        const attributesManager = handlerInput.attributesManager;
        
        const birthdayAttributes = {
            "ano": ano,
            "mes": mes,
            "dia": dia
            
        };
        attributesManager.setPersistentAttributes(birthdayAttributes);
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
        const attributesManager = handlerInput.attributesManager;
        const sessionAttributes = await attributesManager.getPersistentAttributes() || {};
        
        const ano = sessionAttributes.hasOwnProperty('ano') ? sessionAttributes.ano : 0;
        const mes = sessionAttributes.hasOwnProperty('mes') ? sessionAttributes.mes : 0;
        const dia = sessionAttributes.hasOwnProperty('dia') ? sessionAttributes.dia : 0;
        
        if (ano && mes && dia) {
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
        BirthdayIntentHandler,
        HelpIntentHandler,
        CancelAndStopIntentHandler,
        SessionEndedRequestHandler)
    .addErrorHandlers(
        ErrorHandler)
    .addRequestInterceptors(
        LoadBirthdayInterceptor
    )
    .withApiClient(new Alexa.DefaultApiClient())
    .lambda();
