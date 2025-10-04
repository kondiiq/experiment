module.exports = {
        preset: 'ts-jest',
        testEnvironment: 'node',
        moduleFileExtensions: ['ts', 'js', 'json'],
        collectCoverage: true,
        coverageDirectory: "coverage",
        coverageReporters: ["text", "lcov", "html"],
        collectCoverageFrom: ["srv/**/*.{ts}"],
};
