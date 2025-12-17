
import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import crypto from "crypto";

const dynamoClient = new DynamoDBClient({ region: "us-east-1" });
const sesClient = new SESClient({ region: "us-east-1" });

// Nome da tabela DynamoDB
const PENDING_TABLE = "PendingUsers";
// E-mail verificado no SES (esta em sandbox por isso to colocando essa email)
const EMAIL_FROM = "bolizx2.0@gmail.com";

export const handler = async (event) => {
  try {
    const { email } = JSON.parse(event.body);

    if (!email) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Email obrigatório" }),
      };
    }

    // Codigo aleatorio de 6 numeros
    const code = crypto.randomInt(100000, 999999).toString();

    //  10 minutos
    const expiresAt = Math.floor(Date.now() / 1000) + 600;

    // Salva no DynamoDB
    const putCommand = new PutItemCommand({
      TableName: PENDING_TABLE,
      Item: {
        email: { S: email },
        code: { S: code },
        expiresAt: { N: expiresAt.toString() },
      },
    });
    await dynamoClient.send(putCommand);

    // Envia e-mail usando o SES
    const sendCommand = new SendEmailCommand({
      Destination: { ToAddresses: [email] },
      Message: {
        Body: {
          Text: {
            Data: `Seu código de confirmação é: ${code}. Ele expira em 10 minutos.`,
          },
        },
        Subject: { Data: "Código de Confirmação - Alerta Tubarão" },
      },
      Source: EMAIL_FROM,
    });

    await sesClient.send(sendCommand);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Código enviado por e-mail!" }),
    };
  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Erro ao enviar código",
        details: err.message,
      }),
    };
  }
};
