/**
 * Formata string.
 * Equivalente ao "printf()" C/PHP ou ao "String.Format()"
 * para programadores C#/Java.
 */
// eslint-disable-next-line no-extend-native
String.prototype.format = function formatString() {
  // eslint-disable-next-line prefer-rest-params
  const args = arguments;
  return this.replace(/\{(\d+)\}/g, (text, key) => args[key]);
};

const speaks = {
  SKILL_NAME: 'Cadê Meu Bolo',
  WELCOME: 'Olá! Bem-vindo ao Cadê Meu Bolo. Quando é que você nasceu?',
  PERSONALIZED_WELCOME:
    'Olá <alexa:name type="first" personId="{0}"/>! ' +
    'Bem-vindo ao Cadê Meu Bolo. Quando é que você nasceu?',
  WELCOME_BACK: 'Oi, ainda faltam {0} {1} para o seu aniversário de {2} {3}.',
  PERSONALIZED_WELCOME_BACK:
    'Oi <alexa:name type="first" personId="{0}"/>, ainda faltam {1} ' +
    '{2} para o seu aniversário de {3} {4}.',
  DAY: 'dia',
  YEAR: 'ano',
  DAYS: 'dias',
  YEARS: 'anos',
  INTERJECTION: ' <say-as interpret-as="interjection">Viva!</say-as> ',
  HAPPY_BIRTHDAY: 'Feliz Aniversário! 👏👏👏',
  REPROMPT:
    'Eu nasci em 6 de novembro de 2014. Qual é a sua data de nascimento?',
  REMEMBER: 'Obrigado. Vou lembrar quantos dias faltam para o seu aniversário.',
  HELP:
    'Eu sou capaz de lembrar quantos dias faltam para o seu aniversário. ' +
    'Quando é que você nasceu?',
  PROBLEM:
    'Desculpe. Ocorreu um problema ao conectar-se ao serviço. ' +
    'Por favor, tente novamente.',
  NOT_UNDERSTAND: 'Desculpe, não consegui entender. Por favor, fale novamente.',
  NOT_UNDERSTAND_BIRTH_DATE_CAPTURE:
    'Desculpe. Não consegui entender a sua data de nascimento. ' +
    'Por favor, chame novamente esta skill.',
  NOT_UNDERSTAND_BIRTH_DATE_STORAGE:
    'Desculpe. Não consegui recuperar a sua data de nascimento. ' +
    'Por favor, acesse o aplicativo Alexa, desative esta skill, ' +
    'torne ativá-la e tente novamente.',
  BYE_BYE: 'Tchauzinho!',
  AUDIO: '<audio src="{0}" />',
};

module.exports = speaks;
