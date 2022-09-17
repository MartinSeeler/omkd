import type { NextApiRequest, NextApiResponse } from "next";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const q = req.query["similar"];

  if (!q || typeof q !== "string") {
    res.statusCode = 404;

    res.send(JSON.stringify({ message: "pls use with a query" }));

    return;
  }
  const query_embedding = await fetch("https://api.openai.com/v1/embeddings", {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    method: "POST",
    body: JSON.stringify({
      input: q,
      model: "text-search-davinci-query-001",
    }),
  })
    .then((res) => res.json())
    .then((res) => res.data[0].embedding);
  res.status(200).json(query_embedding);
}
