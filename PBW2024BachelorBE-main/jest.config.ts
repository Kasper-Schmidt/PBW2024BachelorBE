module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
  moduleFileExtensions: ["ts", "tsx", "js"],
  collectCoverage: true, // Enable coverage
  collectCoverageFrom: ["controllers/**/*.ts"], // Target the specific test file
  coverageDirectory: "coverage", // Output directory for coverage reports
  coverageReporters: ["text", "lcov"], // Desired coverage report formats
  testTimeout: 10000,
};
