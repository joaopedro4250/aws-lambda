import { DynamoDBClient, GetItemCommand, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import bcrypt from "bcryptjs"; // npm install bcryptjs

export const handler = async (event) => {
  try {
    // CORS PARA TUDO (preflight + responses)
    if (event.httpMethod === "OPTIONS") {
      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS"
        },
        body: JSON.stringify({ message: "OK" })
      };
    }

    const { email } = JSON.parse(event.body || "{}");

    if (!email) {
      return {
        statusCode: 400,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: "Email obrigatório" })
      };
    }

    const client = new DynamoDBClient({ region: "us-east-1" });

    // Verifica se usuário existe
    const getUser = await client.send(new GetItemCommand({
      TableName: "Usuarios",
      Key: { email: { S: email } }
    }));

    if (!getUser.Item) {
      return {
        statusCode: 404,
        headers: { "Access-Control-Allow-Origin": "*" },
        body: JSON.stringify({ error: "Email não encontrado" })
      };
    }

    // Gera senha temporária de 8 caracteres
    const novaSenha = Math.random().toString(36).slice(-8);

    // Hash
    const hashSenha = await bcrypt.hash(novaSenha, 10);

    // Atualiza senha + marca como temporária
    await client.send(new UpdateItemCommand({
      TableName: "Usuarios",
      Key: { email: { S: email } },
      UpdateExpression: "SET senha = :s, senhaTemporaria = :t",
      ExpressionAttributeValues: {
        ":s": { S: hashSenha },
        ":t": { BOOL: true }
      }
    }));

    // SEND EMAIL
    const sesClient = new SESClient({ region: "us-east-1" });

    await sesClient.send(new SendEmailCommand({
      Destination: { ToAddresses: [email] },
      Message: {
        Subject: { Data: "Recuperação de senha" },
        Body: { Text: { Data: `Sua nova senha provisória é: ${novaSenha}\nApós o login, altere sua senha.` } }
      },
      Source: "shunper4250@gmail.com"
    }));

    return {
      statusCode: 200,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ message: "Email enviado com a nova senha!" })
    };

  } catch (err) {
    console.error(err);
    return {
      statusCode: 500,
      headers: { "Access-Control-Allow-Origin": "*" },
      body: JSON.stringify({ error: "Erro interno" })
    };
  }
};
