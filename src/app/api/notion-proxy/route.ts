import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const { apiKey, databaseId, startCursor, statusProperty, statusGroup } = await request.json();

  if (!apiKey || !databaseId) {
    return NextResponse.json({ error: "Missing apiKey or databaseId" }, { status: 400 });
  }

  const filters: Record<string, unknown>[] = [
    { property: "Archive", checkbox: { equals: false } },
  ];
  if (statusProperty && statusGroup) {
    filters.push({ property: statusProperty, status: { equals: statusGroup } });
  }

  const body: Record<string, unknown> = {
    page_size: 100,
    filter: filters.length === 1 ? filters[0] : { and: filters },
  };
  if (startCursor) body.start_cursor = startCursor;

  try {
    const response = await fetch(`https://api.notion.com/v1/databases/${databaseId}/query`, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
    }

    return NextResponse.json(data);
  } catch {
    return NextResponse.json({ error: "Network error" }, { status: 500 });
  }
}
