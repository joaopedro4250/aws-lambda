import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({ region: "us-east-1" });
const dynamo = DynamoDBDocumentClient.from(client);

const cors = {
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "GET,OPTIONS",
};

export const handler = async (event) => {
  try {
    
    if (event.httpMethod === "OPTIONS") {
      return {
        statusCode: 200,
        headers: cors,
        body: JSON.stringify({ message: "Preflight OK" }),
      };
    }

    const cmd = new ScanCommand({
      TableName: "Praias",
    });

    const result = await dynamo.send(cmd);
    const items = result.Items || [];

    //  praiaId antes era so nome
    const praias = items.map((p) => ({
      praiaId: p.praiaId, 
      nome: p.nome,
      cidade: p.cidade ?? "",
      lat: p.lat !== undefined ? Number(p.lat) : null,
      lng: p.lng !== undefined ? Number(p.lng) : null,
      risco: p.risco ?? null,
      descricao: p.descricao ?? "",
    }));

    return {
      statusCode: 200,
      headers: cors,
      body: JSON.stringify({ praias }),
    };

  } catch (err) {
    console.error("Erro getPraias:", err);
    return {
      statusCode: 500,
      headers: cors,
      body: JSON.stringify({
        error: "Erro ao buscar praias",
        details: err.message,
      }),
    };
  }
};
