export class AppError extends Error {
  constructor(status, message, code = 'ERROR') {
    super(message)
    this.status = status
    this.code = code
  }
}

export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

export function unwrap(result, notFoundMessage) {
  if (result.error) {
    throw mapDatabaseError(result.error)
  }

  if (notFoundMessage && (result.data === null || result.data === undefined)) {
    throw new AppError(404, notFoundMessage, 'NOT_FOUND')
  }

  return result.data
}

const RPC_ERRORS = {
  PROMOTION_NOT_FOUND: [404, 'Promotion not found'],
  PROMOTION_NOT_STARTED: [409, 'This promotion has not started yet'],
  PROMOTION_EXPIRED: [409, 'This promotion is no longer available'],
  INSUFFICIENT_QUANTITY: [409, 'Not enough quantity left'],
  INVALID_QUANTITY: [400, 'Quantity must be at least 1'],
  RESERVATION_NOT_FOUND: [404, 'Reservation not found'],
  RESERVATION_NOT_ACTIVE: [409, 'This reservation can no longer be changed'],
  FORBIDDEN: [403, 'You cannot change this reservation'],
  INVALID_STATUS: [400, 'Invalid reservation status'],
}

export function mapDatabaseError(error) {
  const message = error?.message || ''

  for (const [code, [status, text]] of Object.entries(RPC_ERRORS)) {
    if (message.includes(code)) {
      return new AppError(status, text, code)
    }
  }

  return new AppError(400, message || 'Database error', error?.code || 'DB_ERROR')
}
