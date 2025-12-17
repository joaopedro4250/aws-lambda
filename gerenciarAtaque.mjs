import {
  DynamoDBClient,
  PutItemCommand,
  UpdateItemCommand,
  DeleteItemCommand,
  GetItemCommand,
  ScanCommand
} from "@aws-sdk/client-dynamodb";
import { randomUUID } from "crypto";

const uuid = () => randomUUID();
const client = new DynamoDBClient({ region: "us-east-1" });

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "OPTIONS,GET,POST"
};

export const handler = async (event) => {
  try {
    if (event.httpMethod === "OPTIONS") {
      return { statusCode: 200, headers: cors, body: "OK" };
    }

    // LISTAR ATAQUES
    if (event.httpMethod === "GET") {
      const result = await client.send(new ScanCommand({ TableName: "Ataques" }));

      const ataques = result.Items.map((item) => ({
        id: item.id.S,
        praiaId: item.praiaId.S,
        data: item.data.S,
        descricao: item.descricao.S,
        criadoEm: item.criadoEm.S
      }));

      return { statusCode: 200, headers: cors, body: JSON.stringify({ ataques }) };
    }

    // ADICIONAR / ATUALIZAR / DELETAR
    const body = JSON.parse(event.body || "{}");
    const { acao, id, praiaId, data, descricao } = body;

    if (!acao) {
      return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "Ação não informada" }) };
    }

    switch (acao.toLowerCase()) {
      // ADICIONAR ATAQUE
      case "adicionar":
        if (!praiaId || !data || !descricao) {
          return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "Campos obrigatórios faltando" }) };
        }

        const praiaExiste = await client.send(
          new GetItemCommand({
            TableName: "Praias",
            Key: { praiaId: { S: praiaId } }
          })
        );

        if (!praiaExiste.Item) {
          return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "Praia não encontrada no sistema" }) };
        }

        const newId = uuid();
        const criadoEm = new Date().toISOString();

        await client.send(
          new PutItemCommand({
            TableName: "Ataques",
            Item: {
              id: { S: newId },
              praiaId: { S: praiaId },
              data: { S: data },
              descricao: { S: descricao },
              criadoEm: { S: criadoEm }
            }
          })
        );

        return { statusCode: 200, headers: cors, body: JSON.stringify({ message: "Ataque registrado com sucesso", id: newId }) };

      // ATUALIZAR ATAQUE
      case "atualizar":
        if (!id) {
          return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "ID não informado" }) };
        }

        const ataqueCheck = await client.send(
          new GetItemCommand({ TableName: "Ataques", Key: { id: { S: id } } })
        );

        if (!ataqueCheck.Item) {
          return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "Ataque não encontrado" }) };
        }

        const updates = [];
        const values = {};
        const names = {};

        if (praiaId) {
          const praia = await client.send(
            new GetItemCommand({ TableName: "Praias", Key: { praiaId: { S: praiaId } } })
          );
          if (!praia.Item) {
            return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "Praia não encontrada" }) };
          }
          updates.push("#p = :praiaId");
          values[":praiaId"] = { S: praiaId };
          names["#p"] = "praiaId";
        }

        if (data) {
          updates.push("#d = :data");
          values[":data"] = { S: data };
          names["#d"] = "data";
        }

        if (descricao) {
          updates.push("#desc = :descricao");
          values[":descricao"] = { S: descricao };
          names["#desc"] = "descricao";
        }

        if (updates.length === 0) {
          return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "Nenhuma alteração enviada" }) };
        }

        await client.send(
          new UpdateItemCommand({
            TableName: "Ataques",
            Key: { id: { S: id } },
            UpdateExpression: "SET " + updates.join(", "),
            ExpressionAttributeValues: values,
            ExpressionAttributeNames: names
          })
        );

        return { statusCode: 200, headers: cors, body: JSON.stringify({ message: "Ataque atualizado com sucesso" }) };

      // DELETAR ATAQUE
      case "deletar":
        if (!id) {
          return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "ID não informado" }) };
        }

        await client.send(new DeleteItemCommand({ TableName: "Ataques", Key: { id: { S: id } } }));

        return { statusCode: 200, headers: cors, body: JSON.stringify({ message: "Ataque removido com sucesso" }) };

      default:
        return { statusCode: 400, headers: cors, body: JSON.stringify({ error: "Ação inválida" }) };
    }

  } catch (err) {
    console.error("ERRO:", err);
    return { statusCode: 500, headers: cors, body: JSON.stringify({ error: "Erro interno do servidor" }) };
  }
};
