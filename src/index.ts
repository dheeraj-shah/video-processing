
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  McpError,
  ErrorCode,
} from "@modelcontextprotocol/sdk/types.js";

class VideoProcessingServer extends Server {
  constructor() {
    super(
      {
        name: "video-processing-server",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupToolHandlers();
  }

  private setupToolHandlers(): void {
    this.server.setRequestHandler(
      ListToolsRequestSchema,
      async () => ({
        tools: [
          {
            name: "process_videos",
            description: "Process a list of videos",
            inputSchema: {
              type: "object",
              properties: {
                videos: {
                  type: "array",
                  items: {
                    type: "string",
                  },
                },
              },
              required: ["videos"],
            },
          },
        ],
      })
    );

    this.server.setRequestHandler(
      CallToolRequestSchema,
      async (request) => {
        if (request.params.name !== "process_videos") {
          throw new McpError(
            ErrorCode.MethodNotFound,
            `Unknown tool: ${request.params.name}`
          );
        }

        if (
          !request.params.arguments ||
          typeof request.params.arguments !== "object" ||
          !Array.isArray(request.params.arguments.videos)
        ) {
          throw new McpError(
            ErrorCode.InvalidParams,
            "Invalid arguments for 'process_videos'"
          );
        }

        for (const video of request.params.arguments.videos) {
          console.log(`Processing video: ${video}`);
        }

        return { isError: false };
      }
    );
  }
}

const server = new VideoProcessingServer();
server.connect(new StdioServerTransport()).then(() => {
  console.log("Video processing server started");
});
