import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { GetCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const client = new DynamoDBClient({});
const dynamo = DynamoDBDocumentClient.from(client);

const USERS_TABLE = "Usuarios";

export const handler = async (event) => {
  try {
    const body = JSON.parse(event.body);

    const { email, senha } = body;

    if (!email || !senha) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Email e senha obrigatórios" }),
      };
    }

    // Buscar usuário
    const result = await dynamo.send(
      new GetCommand({
        TableName: USERS_TABLE,
        Key: { email },
      })
    );

    const user = result.Item;

    if (!user) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Usuário não encontrado" }),
      };
    }

    // Verificar senha
    const senhaValida = await bcrypt.compare(senha, user.senha);

    if (!senhaValida) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Senha incorreta" }),
      };
    }

    // Gerar token JWT
    const token = jwt.sign(
      {
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "2h" }
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ token }),
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: "Erro no login",
        details: err.message,
      }),
    };
  }
};
