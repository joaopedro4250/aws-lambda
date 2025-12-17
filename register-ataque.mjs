import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";
import { randomUUID } from "crypto";

const client = new DynamoDBClient({});
const ddb = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
  try {
    // Garantir que o body é string e não undefined
    const bodyString = event.body || '{}';
    let body;
    try {
      body = JSON.parse(bodyString);
    } catch (parseErr) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Body inválido: precisa ser JSON" }),
      };
    }

    // Validar campos
    if (!body.praia || !body.data || !body.descricao) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Campos obrigatórios: praia, data, descricao" }),
      };
    }

    const item = {
      id: randomUUID(),
      praia: body.praia,
      data: body.data,
      descricao: body.descricao,
      criadoEm: new Date().toISOString(),
    };

    await ddb.send(new PutCommand({ TableName: "Ataques", Item: item }));

    return {
      statusCode: 201,
      body: JSON.stringify({ message: "Ataque registrado com sucesso!", item }),
    };
  } catch (err) {
    console.error("Erro interno:", err, "EVENT:", event);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "Erro interno", details: err.message }),
    };
  }
};
