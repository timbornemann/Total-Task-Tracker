/**
 * OpenAPI/Swagger Documentation Setup
 * Generates API documentation and serves it under /docs
 */

import swaggerJSDoc from "swagger-jsdoc";
import { Express } from "express";
import swaggerUi from "swagger-ui-express";

// Swagger definition
const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "Total Task Tracker API",
    version: process.env.npm_package_version || "1.0.0",
    description: `
A comprehensive task and productivity management API.

## Features
- Task management with categories and subtasks
- Note-taking with markdown support  
- Habit tracking
- Pomodoro timer sessions
- Inventory management
- Flashcards for learning
- Work time tracking

## Authentication
Currently, this API doesn't require authentication as it's designed for personal use.

## Error Handling
All endpoints return consistent error responses with correlation IDs for tracking.

## Rate Limiting
API endpoints are rate-limited to prevent abuse. See response headers for current limits.
    `,
    contact: {
      name: "Total Task Tracker",
      url: "https://github.com/your-repo/total-task-tracker",
    },
    license: {
      name: "MIT",
      url: "https://opensource.org/licenses/MIT",
    },
  },
  servers: [
    {
      url: process.env.API_BASE_URL || "http://localhost:3001",
      description: "Development server",
    },
    {
      url: "https://your-production-domain.com",
      description: "Production server",
    },
  ],
  tags: [
    {
      name: "Health",
      description: "Health check and monitoring endpoints",
    },
    {
      name: "Tasks",
      description: "Task management operations",
    },
    {
      name: "Categories",
      description: "Category management operations",
    },
    {
      name: "Notes",
      description: "Note management operations",
    },
    {
      name: "Habits",
      description: "Habit tracking operations",
    },
    {
      name: "Inventory",
      description: "Inventory management operations",
    },
    {
      name: "Pomodoro",
      description: "Pomodoro timer operations",
    },
    {
      name: "Sync",
      description: "Data synchronization operations",
    },
  ],
  components: {
    schemas: {
      Task: {
        type: "object",
        required: [
          "id",
          "title",
          "status",
          "priority",
          "createdAt",
          "updatedAt",
        ],
        properties: {
          id: {
            type: "string",
            description: "Unique task identifier",
            example: "task-1234567890-abc123",
          },
          title: {
            type: "string",
            minLength: 1,
            maxLength: 500,
            description: "Task title",
            example: "Complete project documentation",
          },
          description: {
            type: "string",
            description: "Optional task description",
            example: "Write comprehensive API documentation with examples",
          },
          completed: {
            type: "boolean",
            description: "Whether the task is completed",
            example: false,
          },
          status: {
            type: "string",
            enum: ["todo", "in-progress", "completed", "cancelled"],
            description: "Current task status",
            example: "in-progress",
          },
          priority: {
            type: "string",
            enum: ["low", "medium", "high"],
            description: "Task priority level",
            example: "high",
          },
          dueDate: {
            type: "string",
            format: "date-time",
            description: "Optional due date",
            example: "2024-12-31T23:59:59.000Z",
          },
          categoryId: {
            type: "string",
            description: "Optional category ID",
            example: "cat-1234567890-xyz789",
          },
          parentId: {
            type: "string",
            description: "Parent task ID for subtasks",
            example: "task-1234567890-parent",
          },
          createdAt: {
            type: "string",
            format: "date-time",
            description: "Creation timestamp",
            example: "2024-01-01T10:00:00.000Z",
          },
          updatedAt: {
            type: "string",
            format: "date-time",
            description: "Last update timestamp",
            example: "2024-01-01T15:30:00.000Z",
          },
          pinned: {
            type: "boolean",
            description: "Whether the task is pinned",
            example: false,
          },
          visible: {
            type: "boolean",
            description: "Whether the task is visible",
            example: true,
          },
          order: {
            type: "integer",
            minimum: 0,
            description: "Display order",
            example: 0,
          },
          subtasks: {
            type: "array",
            items: { $ref: "#/components/schemas/Task" },
            description: "Array of subtasks",
          },
        },
      },
      CreateTask: {
        type: "object",
        required: ["title"],
        properties: {
          title: {
            type: "string",
            minLength: 1,
            maxLength: 500,
            description: "Task title",
            example: "New task",
          },
          description: {
            type: "string",
            description: "Optional task description",
          },
          status: {
            type: "string",
            enum: ["todo", "in-progress", "completed", "cancelled"],
            default: "todo",
          },
          priority: {
            type: "string",
            enum: ["low", "medium", "high"],
            default: "medium",
          },
          dueDate: {
            type: "string",
            format: "date-time",
            description: "Optional due date",
          },
          categoryId: {
            type: "string",
            description: "Optional category ID",
          },
          parentId: {
            type: "string",
            description: "Parent task ID for subtasks",
          },
        },
      },
      SuccessResponse: {
        type: "object",
        required: ["success", "data"],
        properties: {
          success: {
            type: "boolean",
            example: true,
          },
          data: {
            type: "object",
            description: "Response data",
          },
          metadata: {
            type: "object",
            properties: {
              timestamp: {
                type: "string",
                format: "date-time",
              },
              page: { type: "integer" },
              limit: { type: "integer" },
              total: { type: "integer" },
              hasNext: { type: "boolean" },
              hasPrev: { type: "boolean" },
            },
          },
        },
      },
      ErrorResponse: {
        type: "object",
        required: ["success", "error"],
        properties: {
          success: {
            type: "boolean",
            example: false,
          },
          error: {
            type: "object",
            required: ["code", "message", "timestamp"],
            properties: {
              code: {
                type: "string",
                description: "Error code",
                example: "VALIDATION_ERROR",
              },
              message: {
                type: "string",
                description: "Human-readable error message",
                example: "Request validation failed",
              },
              details: {
                type: "object",
                description: "Additional error details",
              },
              timestamp: {
                type: "string",
                format: "date-time",
                description: "Error timestamp",
              },
              path: {
                type: "string",
                description: "Request path",
                example: "/api/tasks",
              },
              method: {
                type: "string",
                description: "HTTP method",
                example: "POST",
              },
            },
          },
        },
      },
      HealthCheck: {
        type: "object",
        required: ["status", "timestamp", "uptime", "version"],
        properties: {
          status: {
            type: "string",
            enum: ["healthy", "unhealthy"],
            description: "Overall health status",
            example: "healthy",
          },
          timestamp: {
            type: "string",
            format: "date-time",
            description: "Health check timestamp",
          },
          uptime: {
            type: "integer",
            description: "Application uptime in seconds",
            example: 3600,
          },
          version: {
            type: "string",
            description: "Application version",
            example: "1.0.0",
          },
          database: {
            type: "object",
            properties: {
              status: {
                type: "string",
                enum: ["connected", "disconnected"],
              },
              responseTime: {
                type: "number",
                description: "Database response time in milliseconds",
              },
            },
          },
          memory: {
            type: "object",
            properties: {
              used: { type: "integer" },
              total: { type: "integer" },
              percentage: { type: "integer" },
            },
          },
        },
      },
    },
    parameters: {
      CorrelationId: {
        name: "X-Correlation-ID",
        in: "header",
        description: "Request correlation ID for tracking",
        schema: {
          type: "string",
          example: "req-1234567890-abc123",
        },
      },
      Page: {
        name: "page",
        in: "query",
        description: "Page number for pagination",
        schema: {
          type: "integer",
          minimum: 1,
          default: 1,
        },
      },
      Limit: {
        name: "limit",
        in: "query",
        description: "Number of items per page",
        schema: {
          type: "integer",
          minimum: 1,
          maximum: 100,
          default: 20,
        },
      },
    },
    responses: {
      ValidationError: {
        description: "Validation error",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
            example: {
              success: false,
              error: {
                code: "VALIDATION_ERROR",
                message: "Request validation failed",
                details: [
                  {
                    field: "title",
                    message: "Title is required",
                    code: "invalid_type",
                  },
                ],
                timestamp: "2024-01-01T10:00:00.000Z",
                path: "/api/tasks",
                method: "POST",
              },
            },
          },
        },
      },
      NotFound: {
        description: "Resource not found",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
            example: {
              success: false,
              error: {
                code: "NOT_FOUND",
                message: "Resource not found",
                timestamp: "2024-01-01T10:00:00.000Z",
                path: "/api/tasks/nonexistent",
                method: "GET",
              },
            },
          },
        },
      },
      RateLimitExceeded: {
        description: "Rate limit exceeded",
        content: {
          "application/json": {
            schema: { $ref: "#/components/schemas/ErrorResponse" },
            example: {
              success: false,
              error: {
                code: "RATE_LIMIT_EXCEEDED",
                message: "Too many requests, please try again later",
                timestamp: "2024-01-01T10:00:00.000Z",
              },
            },
          },
        },
      },
    },
  },
};

// Options for the swagger docs
const options = {
  definition: swaggerDefinition,
  apis: [
    "./controllers/*.ts",
    "./services/*.ts",
    "./schemas/*.ts",
    // Add more paths as needed
  ],
};

// Initialize swagger-jsdoc
const swaggerSpec = swaggerJSDoc(options);

// Setup Swagger UI
export function setupSwagger(app: Express) {
  // Serve swagger spec as JSON
  app.get("/docs/swagger.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });

  // Serve swagger UI
  app.use(
    "/docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      customSiteTitle: "Total Task Tracker API Docs",
      customCssUrl:
        "https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css",
      swaggerOptions: {
        persistAuthorization: true,
        displayRequestDuration: true,
        docExpansion: "list",
        filter: true,
        showRequestHeaders: true,
        showCommonExtensions: true,
        tryItOutEnabled: true,
      },
    }),
  );

  console.log("📚 Swagger documentation available at /docs");
}

export { swaggerSpec };
