import { createLogger, format, transports } from 'winston'
import { v4 as uuidv4 } from 'uuid'

export function createIdLogger () {
  return createLogger({
    format: format.combine(
      format.label({ label: uuidv4() }),
      format.timestamp(),
      format.printf(({ level, message, label, timestamp }) => {
        return `${timestamp} [${label}] ${level}: ${message}`
      })
    ),
    transports: [new transports.Console()]
  })
}
