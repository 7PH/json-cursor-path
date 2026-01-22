module.exports = {
    collectCoverage: true,
    collectCoverageFrom: [
        'src/**/json-cursor-path.ts'
    ],
    coverageProvider: 'v8',
    testMatch: [
      "**/test/**/*.[jt]s?(x)",
    ],
};
