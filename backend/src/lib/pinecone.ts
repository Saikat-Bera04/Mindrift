import { Pinecone } from "@pinecone-database/pinecone";
import crypto from "crypto";

type InsightMetadata = {
  type: string;
  userId: string;
  title: string;
  content: string;
  createdAt: string;
};

const DEFAULT_VECTOR_DIMENSION = 384;

const apiKey = process.env.PINECONE_API_KEY;

export const pc = apiKey
  ? new Pinecone({
      apiKey,
    })
  : null;

export const getIndex = () => {
  if (!pc) {
    throw new Error("PINECONE_API_KEY is not configured");
  }

  return pc.index<InsightMetadata>(process.env.PINECONE_INDEX || "mindrift");
};

let cachedDimension: number | null = null;

export async function getVectorDimension(): Promise<number> {
  if (cachedDimension) return cachedDimension;

  const configured = Number(process.env.PINECONE_DIMENSION);
  if (Number.isInteger(configured) && configured > 0) {
    cachedDimension = configured;
    return cachedDimension;
  }

  try {
    const stats = await getIndex().describeIndexStats();
    if (stats.dimension && stats.dimension > 0) {
      cachedDimension = stats.dimension;
      return cachedDimension;
    }
  } catch (error) {
    console.warn("Unable to read Pinecone index dimension; using default.", error);
  }

  cachedDimension = DEFAULT_VECTOR_DIMENSION;
  return cachedDimension;
}

export function vectorizeText(text: string, dimension: number): number[] {
  const vector = new Array<number>(dimension).fill(0);
  const tokens = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter(Boolean);

  for (const token of tokens) {
    const digest = crypto.createHash("sha256").update(token).digest();
    const index = digest.readUInt32BE(0) % dimension;
    const sign = digest[4] % 2 === 0 ? 1 : -1;
    vector[index] += sign;
  }

  const magnitude = Math.hypot(...vector);
  if (magnitude === 0) return vector;

  return vector.map((value) => value / magnitude);
}

export async function upsertInsightVector(params: {
  id: string;
  userId: string;
  type: string;
  title: string;
  content: string;
  createdAt: Date;
}) {
  const dimension = await getVectorDimension();
  const values = vectorizeText(`${params.type} ${params.title} ${params.content}`, dimension);
  const namespace = getIndex().namespace(params.userId);

  await namespace.upsert([
    {
      id: params.id,
      values,
      metadata: {
        type: params.type,
        userId: params.userId,
        title: params.title,
        content: params.content,
        createdAt: params.createdAt.toISOString(),
      },
    },
  ]);
}
