import type { FastifyInstance, FastifyError, FastifyRequest, FastifyReply } from "fastify";
import { ZodError } from "zod";

interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export function registerErrorHandler(app: FastifyInstance) {
  app.setErrorHandler((error: FastifyError, request: FastifyRequest, reply: FastifyReply) => {
    const response: ErrorResponse = {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "An unexpected error occurred",
      },
    };

    if (error instanceof ZodError) {
      response.error.code = "VALIDATION_ERROR";
      response.error.message = "Request validation failed";
      response.error.details = error.flatten();
      return reply.status(400).send(response);
    }

    if (error.validation) {
      response.error.code = "VALIDATION_ERROR";
      response.error.message = error.message;
      return reply.status(400).send(response);
    }

    if (error.statusCode === 404) {
      response.error.code = "NOT_FOUND";
      response.error.message = error.message || "Resource not found";
      return reply.status(404).send(response);
    }

    request.log.error(error);
    response.error.message = error.message;
    return reply.status(error.statusCode ?? 500).send(response);
  });

  app.setNotFoundHandler((_request: FastifyRequest, reply: FastifyReply) => {
    return reply.status(404).send({
      success: false,
      error: { code: "NOT_FOUND", message: "Route not found" },
    });
  });
}
