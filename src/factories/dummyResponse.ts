const generateDummyResponse = () => {
  return {
    status: function (code) {
      return this;
    },
    json: jest.fn(),
    sendStatus: jest.fn(),
  };
};

module.exports = generateDummyResponse;
