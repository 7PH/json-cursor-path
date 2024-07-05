module.exports = {
    collectCoverage: true,
    collectCoverageFrom: [
        'src/**/*'
    ],
    coverageProvider: 'v8',
    testMatch: [
      "**/test/**/*.[jt]s?(x)",
    ],
};
