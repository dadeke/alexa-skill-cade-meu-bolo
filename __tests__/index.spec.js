const Index = require('../lambda/index');

describe('Test Index', () => {
  it('should be able loading index', () => {
    expect(Index.handler);
  });
});
