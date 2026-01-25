const fs = require('fs')

describe('Simple Test', () => {
  it('should pass', () => {
    fs.writeFileSync('test-output.txt', 'Test ran at ' + new Date().toISOString())
    expect(1 + 1).toBe(2)
  })
})