
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
  McpError,
  ErrorCode,
} from "@modelcontextprotocol/sdk/types.js";
import { spawn } from "child_process";

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
          await this.processVideo(video);
        }

        return { isError: false };
      }
    );
  }

  private async processVideo(videoPath: string): Promise<void> {
    try {
      console.log(`Processing video: ${videoPath}`);
      await new Promise((resolve, reject) => {
        const childProcess = spawn("echo", [`Processed video: ${videoPath}`]);
        childProcess.on("exit", (code) => {
          if (code === 0) {
            resolve();
          } else {
            reject(new Error(`Failed to process video: ${videoPath}`));
          }
        });
      });
    } catch (error) {
      console.error(`Error processing video: ${videoPath}`, error);
      throw error;
    }
  }
}

const server = new VideoProcessingServer();
server.connect(new StdioServerTransport()).then(() => {
  console.log("Video processing server started");
});
