import {
  DynamoDBClient,
  PutItemCommand,
  UpdateItemCommand,
  DeleteItemCommand,
  ScanCommand,
} from "@aws-sdk/client-dynamodb";
import { v4 as uuidv4 } from "uuid";

const client = new DynamoDBClient({ region: "us-east-1" });

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
  "Access-Control-Allow-Methods": "OPTIONS,GET,POST,PUT,DELETE",
};

export const handler = async (event) => {
  try {
    if (event.httpMethod === "OPTIONS") {
      return { statusCode: 200, headers: cors, body: "OK" };
    }

    const body = JSON.parse(event.body || "{}");
    const acao = body.acao?.toLowerCase();

    const praiaId = body.praiaId || null;
    const nome = body.nomeNovo?.trim() || body.nome?.trim() || null;
    const cidade = body.cidade?.trim() || null;
    const lat = body.lat != null ? Number(body.lat) : null;
    const lng = body.lng != null ? Number(body.lng) : null;
    const risco = body.risco?.trim() || null;
    const descricao = body.descricao?.trim() || null;

    switch (acao) {
      case "adicionar":
        if (!nome || !cidade) {
          return {
            statusCode: 400,
            headers: cors,
            body: JSON.stringify({ error: "Nome e cidade são obrigatórios" }),
          };
        }

        // ❌ Impedir duplicidade pelo nome na adição
        const scanAdd = await client.send(
          new ScanCommand({
            TableName: "Praias",
            FilterExpression: "#n = :nome",
            ExpressionAttributeNames: { "#n": "nome" },
            ExpressionAttributeValues: { ":nome": { S: nome } },
          })
        );

        if (scanAdd.Count > 0) {
          return {
            statusCode: 400,
            headers: cors,
            body: JSON.stringify({ error: "Já existe uma praia com esse nome" }),
          };
        }

        const newPraiaId = uuidv4();

        await client.send(
          new PutItemCommand({
            TableName: "Praias",
            Item: {
              praiaId: { S: newPraiaId },
              nome: { S: nome },
              cidade: { S: cidade },
              lat: { N: (lat ?? 0).toString() },
              lng: { N: (lng ?? 0).toString() },
              risco: { S: risco ?? "médio" },
              descricao: { S: descricao ?? "Sem descrição" },
            },
          })
        );

        return {
          statusCode: 200,
          headers: cors,
          body: JSON.stringify({ message: "Praia adicionada!", praiaId: newPraiaId }),
        };

      case "atualizar":
        if (!praiaId) {
          return {
            statusCode: 400,
            headers: cors,
            body: JSON.stringify({ error: "praiaId não enviado" }),
          };
        }

        const updateExp = [];
        const expValues = {};

        // ❌ Impedir duplicidade ao atualizar o nome, apenas se nome existir
        if (nome) {
          const scanUpdate = await client.send(
            new ScanCommand({
              TableName: "Praias",
              FilterExpression: "#n = :nome AND praiaId <> :id",
              ExpressionAttributeNames: { "#n": "nome" },
              ExpressionAttributeValues: { 
                ":nome": { S: nome },
                ":id": { S: praiaId }
              },
            })
          );

          if (scanUpdate.Count > 0) {
            return {
              statusCode: 400,
              headers: cors,
              body: JSON.stringify({ error: "Já existe outra praia com esse nome" }),
            };
          }

          updateExp.push("nome = :nome");
          expValues[":nome"] = { S: nome };
        }

        if (cidade) {
          updateExp.push("cidade = :cidade");
          expValues[":cidade"] = { S: cidade };
        }
        if (lat !== null) {
          updateExp.push("lat = :lat");
          expValues[":lat"] = { N: lat.toString() };
        }
        if (lng !== null) {
          updateExp.push("lng = :lng");
          expValues[":lng"] = { N: lng.toString() };
        }
        if (risco) {
          updateExp.push("risco = :risco");
          expValues[":risco"] = { S: risco };
        }
        if (descricao) {
          updateExp.push("descricao = :descricao");
          expValues[":descricao"] = { S: descricao };
        }

        if (updateExp.length === 0) {
          return {
            statusCode: 400,
            headers: cors,
            body: JSON.stringify({ error: "Nada para atualizar" }),
          };
        }

        await client.send(
          new UpdateItemCommand({
            TableName: "Praias",
            Key: { praiaId: { S: praiaId } },
            UpdateExpression: "SET " + updateExp.join(", "),
            ExpressionAttributeValues: expValues,
          })
        );

        return {
          statusCode: 200,
          headers: cors,
          body: JSON.stringify({ message: "Praia atualizada!" }),
        };

      case "deletar":
        if (!praiaId) {
          return {
            statusCode: 400,
            headers: cors,
            body: JSON.stringify({ error: "praiaId não enviado" }),
          };
        }

        await client.send(
          new DeleteItemCommand({
            TableName: "Praias",
            Key: { praiaId: { S: praiaId } },
          })
        );

        return {
          statusCode: 200,
          headers: cors,
          body: JSON.stringify({ message: "Praia deletada!" }),
        };

      default:
        return {
          statusCode: 400,
          headers: cors,
          body: JSON.stringify({ error: "Ação inválida" }),
        };
    }
  } catch (err) {
    console.error("ERRO NA LAMBDA:", err);
    return {
      statusCode: 500,
      headers: cors,
      body: JSON.stringify({ error: "Erro interno na Lambda" }),
    };
  }
};
