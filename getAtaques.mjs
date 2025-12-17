import { DynamoDBClient, ScanCommand } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({ region: "us-east-1" });

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "OPTIONS,GET"
};

export const handler = async () => {
  try {
    const result = await client.send(
      new ScanCommand({ TableName: "Ataques" })
    );

    const ataques = result.Items.map((item) => ({
      id: item.id?.S || "",
      praiaId: item.praiaId?.S || "",
      data: item.data?.S || "",
      descricao: item.descricao?.S || "",
      criadoEm: item.criadoEm?.S || "",
    }));

    return {
      statusCode: 200,
      headers: cors,
      body: JSON.stringify({ ataques }),
    };

  } catch (err) {
    console.error("Erro", err);
    return {
      statusCode: 500,
      headers: cors,
      body: JSON.stringify({ error: "Erro ao listar ataques" }),
    };
  }
};
