import { NextResponse } from 'next/server';
import { mcpRegistry, type MCPServer } from '@/lib/mcp';

export const runtime = 'nodejs';

// GET /api/mcp — list all servers and tools
export async function GET() {
  const servers = mcpRegistry.listServers();
  const tools = mcpRegistry.listTools();
  return NextResponse.json({ servers, tools });
}

// POST /api/mcp — register a new server
// Body: { action: 'register', server: MCPServer }
export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (body.action === 'register') {
      const server = body.server as MCPServer;
      if (!server?.id || !server?.name) {
        return NextResponse.json(
          { error: 'Invalid server definition: id and name are required' },
          { status: 400 }
        );
      }
      mcpRegistry.registerServer(server);
      return NextResponse.json({ success: true, server });
    }

    return NextResponse.json({ error: `Unknown action: ${body.action}` }, { status: 400 });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Invalid request body' },
      { status: 400 }
    );
  }
}

// PUT /api/mcp — call a tool
// Body: { serverId, toolName, input }
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { serverId, toolName, input } = body;

    if (!serverId || !toolName) {
      return NextResponse.json(
        { error: 'serverId and toolName are required' },
        { status: 400 }
      );
    }

    const result = await mcpRegistry.callTool({
      serverId,
      toolName,
      input: input ?? {},
    });

    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Invalid request body' },
      { status: 400 }
    );
  }
}
