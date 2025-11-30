import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PutCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const dynamo = DynamoDBDocumentClient.from(client);

export const handler = async (event) => {
  try {
    const body = JSON.parse(event.body);

    const { nome, cidade } = body;

    if (!nome || !cidade) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Campos obrigatórios faltando." }),
      };
    }

    const id = Date.now().toString();

    await dynamo.send(
      new PutCommand({
        TableName: "Praias",
        Item: { id, nome, cidade },
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
