# Skill da Alexa: Cadê Meu Bolo

[![Build Status](https://travis-ci.com/dadeke/alexa-skill-cade-meu-bolo.svg?branch=master)](https://travis-ci.com/github/dadeke/alexa-skill-cade-meu-bolo)
[![Coverage Status](https://codecov.io/gh/dadeke/alexa-skill-cade-meu-bolo/branch/master/graph/badge.svg)](https://codecov.io/gh/dadeke/alexa-skill-cade-meu-bolo)
[![Stargazers](https://img.shields.io/github/stars/dadeke/alexa-skill-cade-meu-bolo?style=social)](https://github.com/dadeke/alexa-skill-cade-meu-bolo/stargazers)

Repositório do código fonte da skill da Alexa: [Cadê Meu Bolo](https://www.amazon.com.br/DD-Tecnologia-Cad%C3%AA-Meu-Bolo/dp/B081FL21ZR/).

Compatível com o "Import skill" do Alexa Developer Console.
[![Compatível com o Import skill](https://i.imgur.com/65L4f3f.png)](https://developer.amazon.com/alexa/console/ask/create-new-skill)

[Changelog](#changelog)&nbsp;&nbsp;&nbsp;|&nbsp;&nbsp;&nbsp;[Licença](#licença)

### _Gostou desta skill? Considere fazer uma doação para ajudar a apoiar seu desenvolvimento. Muito obrigado!_

[<p align="center">![Doe com Pix!](https://i.imgur.com/GncXSJY.png)</p>](https://picpay.me/deividsondamasio)
<p align="center"><b>Chave aleatória do Pix:</b><br /><b>3a00764d-7467-4505-80a5-5434f1b5d895</b></p>

A skill Cadê Meu Bolo é capaz de lembrar quantos dias faltam para o seu próximo aniversário.

Diga "Alexa, Cadê Meu Bolo?". Ela irá perguntar quando é que você nasceu.
Depois de ela conhecer a sua data de nascimento, sempre quando você perguntá-la "Alexa, Cadê Meu Bolo?" ela irá dizer quantos dias faltam e quantos anos você irá fazer no seu próximo aniversário.

Quando chegar o dia do seu aniversário, basta perguntar "Alexa, Cadê Meu Bolo?" ela irá cantar "parabéns pra você" e bater palmas.

Caso deseje corrigir a sua data de nascimento, acesse o aplicativo Alexa, desative esta skill e em seguida ative-a novamente para uso. Depois é somente repetir o processo informando a sua data de nascimento.

Esta skill pode tentar distinguir a sua voz da voz de outras pessoas e lhe chamar pelo nome.
Este recurso é fornecido pela própria Alexa. Caso tenha problemas para reconhecer a sua voz, será preciso tentar ensiná-la novamente.
Maiores informações, diga: "Alexa, aprenda a minha voz" ou acesse o aplicativo Alexa em **Configurações > Meu perfil > Voz**.

----------------

Gostou da skill Cadê Meu Bolo? Por favor, deixe uma avaliação! Muito obrigado!

Para dar feedback sobre esta skill, entre em contato através do e-mail: oi@dd.tec.br

----------------

Você pode visualizar o histórico de atualizações e contribuir para o código fonte desta skill aqui no GitHub.

Baseada na skill [Cake Time](https://github.com/alexa/skill-sample-nodejs-first-skill/) divulgada no treinamento da Amazon.

## Changelog ##

### 1.3.0 - 09/12/2020 ###
- Refatoração da estrutura.
- Adicionado EditorConfig, ESLint e Prettier.
- Adicionada a migração gradual das datas de nascimento do S3 para o DynamoDB. Isto será removido no futuro.
- Modificado para utilizar o AMAZON.DATE que agora possui suporte para datas no passado.
- Adicionado o "skill package" a fim de dar suporte ao "Import skill" no Alexa Developer Console.
- Implementados os testes unitários utilizando o Jest.

### 1.2.0 - 10/11/2020 ###

- Adicionado cards.
- Adicionado validação da data de nascimento.
- Melhorias no reconhecimento da data de nascimento.
- Adicionado suporte ao recurso de reconhecimento de voz a fim de oferecer experiência personalizada "Skills Personalization".
- Adicionado o armazenamento da data de nascimento para múltiplos perfis de voz.
- Modificado alguns textos da fala.

### 1.1.0 - 17/11/2019 ###
- Pequenas alterações nos textos da fala.

### 1.0.0 - 12/11/2019 ###
- Publicado a primeira versão.

## Licença ##

Esse projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE.txt) para mais detalhes.

----------------

"Esforcem-se para ter uma vida tranquila, cuidar dos seus próprios negócios e trabalhar com as próprias mãos..." 1 Tessalonicenses 4:11 NVI
