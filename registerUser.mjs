import { DynamoDBClient, PutItemCommand } from "@aws-sdk/client-dynamodb";
import bcrypt from "bcryptjs";

export const handler = async (event) => {
  const body = JSON.parse(event.body || "{}");

  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Allow-Methods": "*"
  };

  if (!body.email || !body.senha || !body.nome) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Dados incompletos" }),
    };
  }

  const client = new DynamoDBClient({ region: "us-east-1" });

  // Hash da senha
  const hashedPassword = await bcrypt.hash(body.senha, 10);

  const cmd = new PutItemCommand({
    TableName: "Usuarios",
    Item: {
      email: { S: body.email },
      senha: { S: hashedPassword },
      nome: { S: body.nome },
      role: { S: "usuario" }
    },
    ConditionExpression: "attribute_not_exists(email)"
  });

  try {
    await client.send(cmd);

    return {
      statusCode: 201,
      headers: corsHeaders,
      body: JSON.stringify({ message: "Usuário criado" })
    };

  } catch (err) {
    return {
      statusCode: 400,
      headers: corsHeaders,
      body: JSON.stringify({ error: "Email já cadastrado" })
    };
  }
};
