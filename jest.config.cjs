module.exports = {
    collectCoverage: true,
    collectCoverageFrom: [
        'src/**/JsonParser.ts'
    ],
    coverageProvider: 'v8',
    testMatch: [
      "**/test/**/*.[jt]s?(x)",
    ],
};
