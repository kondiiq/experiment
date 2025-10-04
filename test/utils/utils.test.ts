import { serviceWrapper, fieldsValidator, startEnddateValidator, dateValidator } from '../../srv/utils/utils';
import cds from '@sap/cds';

jest.mock('@sap/cds', () => ({
  connect: {
    to: jest.fn()
  }
}));

describe('Utils functions', () => {


  describe('startEnddateValidator', () => {
    it('returns true if start < end', () => {
      const start = new Date('2025-01-01');
      const end = new Date('2025-02-01');
      expect(startEnddateValidator(start, end)).toBe(true);
    });
    it('returns true if start exists and end missing', () => {
      const start = new Date('2025-01-01');
      expect(startEnddateValidator(start, null as any)).toBe(true);
    });
    it('returns false if start >= end', () => {
      const start = new Date('2025-03-01');
      const end = new Date('2025-02-01');
      expect(startEnddateValidator(start, end)).toBe(false);
      expect(startEnddateValidator(start, start)).toBe(false);
    });
    it('returns false if no start', () => {
      const end = new Date('2025-02-01');
      expect(startEnddateValidator(null as any, end)).toBe(false);
    });
  });

  describe('dateValidator', () => {
    it('returns true for valid Date objects', () => {
      expect(dateValidator(new Date())).toBe(true);
      expect(dateValidator(new Date('2025-01-01'))).toBe(true);
    });
    it('returns false for invalid Date objects', () => {
      expect(dateValidator(new Date('invalid-date'))).toBe(false);
      expect(dateValidator(null as any)).toBe(false);
      expect(dateValidator(undefined as any)).toBe(false);
      expect(dateValidator({} as any)).toBe(false);
    });
  });

});
