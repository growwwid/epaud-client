import { authedProxy } from "@/lib/epaud";

type Ctx = { params: Promise<{ path: string[] }> };
type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

async function forward(request: Request, { params }: Ctx, method: Method) {
  const { path } = await params;
  const search = new URL(request.url).search;
  const body = method === "GET" ? undefined : await request.text();
  return authedProxy(`/api/v1/${path.join("/")}${search}`, { method, body });
}

export async function GET(request: Request, ctx: Ctx) {
  return forward(request, ctx, "GET");
}

export async function POST(request: Request, ctx: Ctx) {
  return forward(request, ctx, "POST");
}

export async function PUT(request: Request, ctx: Ctx) {
  return forward(request, ctx, "PUT");
}

export async function PATCH(request: Request, ctx: Ctx) {
  return forward(request, ctx, "PATCH");
}

export async function DELETE(request: Request, ctx: Ctx) {
  return forward(request, ctx, "DELETE");
}
