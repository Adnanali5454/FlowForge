// MCP Server Registry and Tool execution for FlowForge Agents

export interface MCPServer {
  id: string;
  name: string;
  description: string;
  transport: 'stdio' | 'sse' | 'http';
  url?: string;
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  tools: MCPTool[];
  status: 'connected' | 'disconnected' | 'error';
}

export interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, { type: string; description: string; required?: boolean }>;
    required?: string[];
  };
  serverId: string;
}

export interface MCPToolCall {
  toolName: string;
  serverId: string;
  input: Record<string, unknown>;
}

export interface MCPToolResult {
  success: boolean;
  content: Array<{ type: 'text' | 'image' | 'resource'; text?: string; data?: string }>;
  error?: string;
  isError?: boolean;
}

// ─── Built-in MCP Server Definitions ────────────────────────────────────────

const BUILT_IN_SERVERS: MCPServer[] = [
  {
    id: 'filesystem',
    name: 'Filesystem',
    description: 'Read, write, and list files in the local filesystem',
    transport: 'stdio',
    command: 'mcp-server-filesystem',
    args: [],
    tools: [
      {
        name: 'read_file',
        description: 'Read the contents of a file at the given path',
        inputSchema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'The absolute or relative path to the file' },
          },
          required: ['path'],
        },
        serverId: 'filesystem',
      },
      {
        name: 'write_file',
        description: 'Write content to a file at the given path (creates or overwrites)',
        inputSchema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'The path to write to' },
            content: { type: 'string', description: 'The content to write' },
          },
          required: ['path', 'content'],
        },
        serverId: 'filesystem',
      },
      {
        name: 'list_directory',
        description: 'List the files and directories at the given path',
        inputSchema: {
          type: 'object',
          properties: {
            path: { type: 'string', description: 'The directory path to list' },
          },
          required: ['path'],
        },
        serverId: 'filesystem',
      },
    ],
    status: 'connected',
  },
  {
    id: 'web-search',
    name: 'Web Search',
    description: 'Search the web and fetch URLs for up-to-date information',
    transport: 'http',
    url: 'http://localhost:3100',
    tools: [
      {
        name: 'search',
        description: 'Search the web using a query string and return top results',
        inputSchema: {
          type: 'object',
          properties: {
            query: { type: 'string', description: 'The search query' },
            limit: { type: 'number', description: 'Maximum number of results to return' },
          },
          required: ['query'],
        },
        serverId: 'web-search',
      },
      {
        name: 'fetch_url',
        description: 'Fetch the content of a URL and return the text',
        inputSchema: {
          type: 'object',
          properties: {
            url: { type: 'string', description: 'The URL to fetch' },
            extractText: { type: 'boolean', description: 'Whether to extract plain text from HTML' },
          },
          required: ['url'],
        },
        serverId: 'web-search',
      },
    ],
    status: 'connected',
  },
  {
    id: 'database',
    name: 'Database',
    description: 'Query, insert, and update records in connected databases',
    transport: 'stdio',
    command: 'mcp-server-database',
    args: [],
    tools: [
      {
        name: 'query',
        description: 'Execute a SQL SELECT query and return results',
        inputSchema: {
          type: 'object',
          properties: {
            sql: { type: 'string', description: 'The SQL query to execute' },
            params: { type: 'string', description: 'JSON array of query parameters' },
          },
          required: ['sql'],
        },
        serverId: 'database',
      },
      {
        name: 'insert',
        description: 'Insert a new row into a database table',
        inputSchema: {
          type: 'object',
          properties: {
            table: { type: 'string', description: 'The table name to insert into' },
            data: { type: 'string', description: 'JSON object of column-value pairs to insert' },
          },
          required: ['table', 'data'],
        },
        serverId: 'database',
      },
      {
        name: 'update',
        description: 'Update existing rows in a database table',
        inputSchema: {
          type: 'object',
          properties: {
            table: { type: 'string', description: 'The table name to update' },
            data: { type: 'string', description: 'JSON object of column-value pairs to set' },
            where: { type: 'string', description: 'SQL WHERE clause (without the WHERE keyword)' },
          },
          required: ['table', 'data', 'where'],
        },
        serverId: 'database',
      },
    ],
    status: 'connected',
  },
  {
    id: 'code-interpreter',
    name: 'Code Interpreter',
    description: 'Execute Python and JavaScript code snippets in a sandboxed environment',
    transport: 'sse',
    url: 'http://localhost:3200/sse',
    tools: [
      {
        name: 'execute_python',
        description: 'Execute a Python code snippet and return the output',
        inputSchema: {
          type: 'object',
          properties: {
            code: { type: 'string', description: 'The Python code to execute' },
            timeout: { type: 'number', description: 'Execution timeout in seconds (default: 30)' },
          },
          required: ['code'],
        },
        serverId: 'code-interpreter',
      },
      {
        name: 'execute_javascript',
        description: 'Execute a JavaScript code snippet using Node.js and return the output',
        inputSchema: {
          type: 'object',
          properties: {
            code: { type: 'string', description: 'The JavaScript code to execute' },
            timeout: { type: 'number', description: 'Execution timeout in seconds (default: 30)' },
          },
          required: ['code'],
        },
        serverId: 'code-interpreter',
      },
    ],
    status: 'connected',
  },
];

// ─── MCP Registry ────────────────────────────────────────────────────────────

export class MCPRegistry {
  private servers: Map<string, MCPServer>;

  constructor() {
    this.servers = new Map();
    // Pre-register built-in servers
    for (const server of BUILT_IN_SERVERS) {
      this.servers.set(server.id, server);
    }
  }

  /**
   * Register a new MCP server (or replace an existing one with the same ID).
   */
  registerServer(server: MCPServer): void {
    this.servers.set(server.id, server);
  }

  /**
   * Retrieve a server by ID.
   */
  getServer(id: string): MCPServer | undefined {
    return this.servers.get(id);
  }

  /**
   * List all registered servers.
   */
  listServers(): MCPServer[] {
    return Array.from(this.servers.values());
  }

  /**
   * Return a flattened list of all tools from connected servers.
   */
  listTools(): MCPTool[] {
    const tools: MCPTool[] = [];
    for (const server of this.servers.values()) {
      if (server.status === 'connected') {
        tools.push(...server.tools);
      }
    }
    return tools;
  }

  /**
   * Call a tool on a connected MCP server.
   * This is a stub implementation that returns mock results.
   */
  async callTool(call: MCPToolCall): Promise<MCPToolResult> {
    const server = this.servers.get(call.serverId);

    if (!server) {
      return {
        success: false,
        content: [],
        error: `Server '${call.serverId}' not found`,
        isError: true,
      };
    }

    if (server.status !== 'connected') {
      return {
        success: false,
        content: [],
        error: `Server '${call.serverId}' is not connected (status: ${server.status})`,
        isError: true,
      };
    }

    const tool = server.tools.find((t) => t.name === call.toolName);
    if (!tool) {
      return {
        success: false,
        content: [],
        error: `Tool '${call.toolName}' not found on server '${call.serverId}'`,
        isError: true,
      };
    }

    // Stub: return mock result based on server/tool
    const mockText = generateMockResult(call.serverId, call.toolName, call.input);

    return {
      success: true,
      content: [{ type: 'text', text: mockText }],
    };
  }
}

/**
 * Generate a mock result string for a given tool call.
 */
function generateMockResult(
  serverId: string,
  toolName: string,
  input: Record<string, unknown>
): string {
  switch (serverId) {
    case 'filesystem':
      if (toolName === 'read_file') {
        return `[Mock] Contents of ${input.path}:\n// This is a mock file content\nconsole.log('hello world');`;
      }
      if (toolName === 'write_file') {
        return `[Mock] Successfully wrote ${String(input.content ?? '').length} bytes to ${input.path}`;
      }
      if (toolName === 'list_directory') {
        return `[Mock] Directory listing for ${input.path}:\n- file1.ts\n- file2.ts\n- subdir/`;
      }
      break;

    case 'web-search':
      if (toolName === 'search') {
        return `[Mock] Search results for "${input.query}":\n1. Result A — https://example.com/a\n2. Result B — https://example.com/b\n3. Result C — https://example.com/c`;
      }
      if (toolName === 'fetch_url') {
        return `[Mock] Content of ${input.url}:\n<html><body>Mock page content</body></html>`;
      }
      break;

    case 'database':
      if (toolName === 'query') {
        return `[Mock] Query results:\n[{"id":1,"name":"Alice"},{"id":2,"name":"Bob"}]`;
      }
      if (toolName === 'insert') {
        return `[Mock] Inserted 1 row into ${input.table}. New ID: 42`;
      }
      if (toolName === 'update') {
        return `[Mock] Updated 1 row in ${input.table}`;
      }
      break;

    case 'code-interpreter':
      if (toolName === 'execute_python') {
        return `[Mock] Python output:\nHello from Python!\n>>> ${input.code}`;
      }
      if (toolName === 'execute_javascript') {
        return `[Mock] JavaScript output:\nHello from Node.js!\n> ${input.code}`;
      }
      break;
  }

  return `[Mock] Tool '${toolName}' executed successfully with input: ${JSON.stringify(input)}`;
}

// ─── Singleton Registry ──────────────────────────────────────────────────────

export const mcpRegistry = new MCPRegistry();
