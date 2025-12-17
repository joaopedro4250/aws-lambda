import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PutCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const dynamo = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
  try {
    const body = JSON.parse(event.body);

    const { nome, cidade, lat, lng } = body;

    // Verificação dos campos obrigatórios
    if (!nome || !cidade || lat === undefined || lng === undefined) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Campos obrigatórios: nome, cidade, lat, lng" }),
      };
    }

    const id = Date.now().toString();

    await dynamo.send(
      new PutCommand({
        TableName: "Praias",
        Item: {
          id,
          nome,
          cidade,
          lat,    // agora salva a latitude
          lng     // agora salva a longitude
        },
      })
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Praia cadastrada!", id }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
