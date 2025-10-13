module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',

  roots: [ './test'],

  testMatch: [
    '**/?(*.)+(test).[tj]s?(x)'
  ],

  moduleFileExtensions: ['ts', 'js', 'json'],

  collectCoverage: true,
  coverageDirectory: './coverage',
  coverageReporters: ['text', 'lcov', 'html'],

  // Analizuj coverage tylko w srv/, ignoruj testy
  collectCoverageFrom: [
    'srv/**/*.{ts,js}',
    '!srv/**/*.d.ts',
    '!srv/**/*.{test}.{ts,js}'
  ],

  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },

  testPathIgnorePatterns: ['/node_modules/', '/coverage/', '/@cds-models', '/.pipeline'],
  coveragePathIgnorePatterns: ['/node_modules/', '/coverage/']
};
