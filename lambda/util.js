const AWS = require('aws-sdk');

const s3SigV4Client = new AWS.S3({
  signatureVersion: 'v4',
});

module.exports.getS3PreSignedUrl = function getS3PreSignedUrl(s3ObjectKey) {
  const bucketName = process.env.S3_PERSISTENCE_BUCKET;
  const s3PreSignedUrl = s3SigV4Client.getSignedUrl('getObject', {
    Bucket: bucketName,
    Key: s3ObjectKey,
    Expires: 60, // Expirar em 60 segundos.
  });

  // console.log(`Util.s3PreSignedUrl: ${s3ObjectKey} URL ${s3PreSignedUrl}`);
  return s3PreSignedUrl;
};

// - Início -
// Código temporário que será utilizado apenas para migrar
// as datas de nascimento cadastradas do S3 para o DynamoDB.

// Verifica se existe o objeto no S3.
module.exports.s3ObjectExists = async function s3ObjectExists(s3ObjectKey) {
  const s3 = new AWS.S3();

  const params = {
    // Nome do Bucket S3 nas variáveis de ambiente.
    Bucket: process.env.S3_PERSISTENCE_BUCKET,
    // Caminho para pegar o arquivo.
    Key: s3ObjectKey,
  };

  const response = await s3
    .headObject(params)
    .promise()
    .then(
      () => true,
      error => {
        if (error.code === 'NotFound') {
          return false;
        }

        throw error;
      },
    );

  return response;
};

// Retorna o conteúdo do objeto do S3.
module.exports.getS3Object = async function getS3Object(s3ObjectKey) {
  const s3 = new AWS.S3();

  const params = {
    Bucket: process.env.S3_PERSISTENCE_BUCKET,
    Key: s3ObjectKey,
  };

  const response = await s3
    .getObject(params, error => {
      // Em caso de erro, não faça nada.
      if (error) {
        throw Error('error', `getS3Object - ${error}`);
      }
    })
    .promise();

  return response;
};
// - Fim -
