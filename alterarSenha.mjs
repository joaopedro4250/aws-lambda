import { DynamoDBClient, GetItemCommand, UpdateItemCommand } from "@aws-sdk/client-dynamodb";
import bcrypt from "bcryptjs";

export const handler = async (event) => {

  // CORS
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };

  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 200, headers };
  }

  try {
    console.log("Event recebido:", event.body);

    const { email, senhaAntiga, novaSenha } = JSON.parse(event.body || "{}");

    if (!email || !senhaAntiga || !novaSenha) {
      console.log("Campos obrigatórios faltando");
      return { statusCode: 400, headers, body: JSON.stringify({ error: "Campos obrigatórios" }) };
    }

    const client = new DynamoDBClient({ region: "us-east-1" });

    // Busca usuário
    const result = await client.send(new GetItemCommand({
      TableName: "Usuarios",
      Key: { email: { S: email } }
    }));

    console.log("Resultado do GetItemCommand:", result);

    if (!result.Item) {
      console.log("Usuário não encontrado no DB");
      return { statusCode: 404, headers, body: JSON.stringify({ error: "Usuário não encontrado" }) };
    }

    const senhaHash = result.Item.senha.S;
    const senhaTemporaria = result.Item.senhaTemporaria?.BOOL || false;

    console.log("Senha hash do DB:", senhaHash);
    console.log("Senha temporária:", senhaTemporaria);

    // Se senha é temporária → não precisa verificar senha antiga
    if (!senhaTemporaria) {
      const ok = await bcrypt.compare(senhaAntiga, senhaHash);
      console.log("Comparação da senha antiga:", ok);
      if (!ok) {
        console.log("Senha antiga incorreta");
        return { statusCode: 403, headers, body: JSON.stringify({ error: "Senha antiga incorreta" }) };
      }
    }

    // Gerar hash da nova senha
    const novoHash = await bcrypt.hash(novaSenha, 10);
    console.log("Novo hash gerado:", novoHash);

    // Atualiza no DB
    const updateResult = await client.send(new UpdateItemCommand({
      TableName: "Usuarios",
      Key: { email: { S: email } },
      UpdateExpression: "SET senha = :s, senhaTemporaria = :t",
      ExpressionAttributeValues: {
        ":s": { S: novoHash },
        ":t": { BOOL: false }
      }
    }));

    console.log("Resultado do UpdateItemCommand:", updateResult);

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ message: "Senha alterada com sucesso!" })
    };

  } catch (err) {
    console.error("ERRO ALTERAR SENHA:", err);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: "Erro interno do servidor" })
    };
  }
};
