import type { ErrorRequestHandler } from 'express'

export class HttpError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  const status = error instanceof HttpError ? error.status : 500
  const message = error instanceof HttpError ? error.message : 'Server error. Please try again.'
  response.status(status).json({ message })
}
