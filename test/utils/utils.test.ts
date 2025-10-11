// tests/utils/utils.test.ts
import cds from '@sap/cds';
import {
  serviceWrapper,
  fieldsValidator,
  startEnddateValidator,
  dateValidator
} from '../../srv/utils/utils';

jest.mock('@sap/cds', () => ({
  connect: {
    to: jest.fn()
  }
}));

describe('utils', () => {
  describe('serviceWrapper', () => {
    it('should call cds.connect.to with service name and return the service', async () => {
      const fakeService = { run: jest.fn() };
      (cds.connect.to as jest.Mock).mockResolvedValueOnce(fakeService);
      const result = await serviceWrapper('MyService');
      expect(cds.connect.to).toHaveBeenCalledWith('MyService');
      expect(result).toBe(fakeService);
    });

    it('should propagate errors from cds.connect.to', async () => {
      const error = new Error('Connection failed');
      (cds.connect.to as jest.Mock).mockRejectedValueOnce(error);
      await expect(serviceWrapper('BadService')).rejects.toThrow('Connection failed');
    });
  });

  describe('fieldsValidator', () => {
    it('returns false for null, undefined or empty string', () => {
      expect(fieldsValidator(null as any)).toBe(false);
      expect(fieldsValidator(undefined as any)).toBe(false);
      expect(fieldsValidator('')).toBe(false);
    });

    it('returns true for non-empty string or number', () => {
      expect(fieldsValidator('hello')).toBe(true);
      expect(fieldsValidator(0)).toBe(true);
      expect(fieldsValidator(42)).toBe(true);
    });
  });

  describe('startEnddateValidator', () => {
    it('returns true if both dates exist and start < end', () => {
      const start = new Date('2025-01-01');
      const end = new Date('2025-02-01');
      expect(startEnddateValidator(start, end)).toBe(true);
    });

    it('returns false if both dates exist and start >= end', () => {
      const start = new Date('2025-03-01');
      const end = new Date('2025-02-01');
      expect(startEnddateValidator(start, end)).toBe(false);
      expect(startEnddateValidator(end, end)).toBe(false);
    });

    it('returns true if only startDate provided', () => {
      const start = new Date();
      expect(startEnddateValidator(start, null as any)).toBe(true);
    });

    it('returns false if startDate missing', () => {
      const end = new Date();
      expect(startEnddateValidator(null as any, end)).toBe(false);
      expect(startEnddateValidator(null as any, null as any)).toBe(false);
    });
  });

  describe('dateValidator', () => {
    it('returns true for valid Date instance', () => {
      expect(dateValidator(new Date())).toBe(true);
    });

    it('returns false for invalid Date', () => {
      expect(dateValidator(new Date('invalid'))).toBe(false);
    });

    it('returns false for non-Date inputs', () => {
      expect(dateValidator(null as any)).toBe(false);
      expect(dateValidator('2025-01-01' as any)).toBe(false);
      expect(dateValidator({} as any)).toBe(false);
    });
  });
});
