export class NoApiKeyError extends Error {
  constructor () {
    super()
    this.name = 'NoApiKeyError'
  }
}
