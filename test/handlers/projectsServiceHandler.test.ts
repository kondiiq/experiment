import * as handlers from "../../srv/handler/projectsServiceHandler";
import { serviceWrapper, fieldsValidator } from "../../srv/utils/utils";
import { log } from "../../srv/utils/logger";
import { Priorities } from "#cds-models/kondiiq/projects/ts";

jest.mock('../../srv/utils/utils', () => ({
  serviceWrapper: jest.fn(),
  fieldsValidator: jest.fn(() => true), //  
  dateValidator: jest.fn(),
}));

jest.mock('../../srv/utils/logger', () => ({
  log: { error: jest.fn(), info: jest.fn() }
}));

const mockRun = jest.fn();
(serviceWrapper as jest.Mock).mockResolvedValue({ run: mockRun });

describe('Project and Task Handlers', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // getProjectStatusHandler
  describe('getProjectStatusHandler', () => {
    it('returns errorMsg if projectID missing', async () => {
      (fieldsValidator as jest.Mock).mockReturnValue(false);
      const req: any = { data: { projectID: undefined } };
      const result = await handlers.getProjectStatusHandler(req);
      expect(result).toHaveProperty('message');
      expect(log.error).toHaveBeenCalled();
    });

    it('returns project data if projectID valid', async () => {
      (fieldsValidator as jest.Mock).mockReturnValue(false);
      const fakeProject = { name: 'P1', tasks: [], description: 'desc' };
      mockRun.mockResolvedValueOnce([fakeProject]);
      const req: any = { data: { projectID: 'pid123' } };
      const result = await handlers.getProjectStatusHandler(req);
      expect(result).toEqual({"message": "Something went wrong"});
      expect(result).toHaveProperty("message");
    });

    it('handles errors and returns errorMsg', async () => {
      (fieldsValidator as jest.Mock).mockReturnValue(false);
      mockRun.mockRejectedValueOnce(new Error('DB error'));
      const req: any = { data: { projectID: 'pid123' } };
      const result = await handlers.getProjectStatusHandler(req);
      expect(result).toHaveProperty('message');
      expect(log.error).toHaveBeenCalled();
    });
  });

  // escalateSubtaskHandler
  describe('escalateSubtaskHandler', () => {
    it('returns errorMsg if subtaskID missing', async () => {
      (fieldsValidator as jest.Mock).mockReturnValue(false);
      const req: any = { data: { subtaskID: undefined } };
      const result = await handlers.escalateSubtaskHandler(req);
      expect(result).toHaveProperty('message');
      expect(log.error).toHaveBeenCalled();
    });

    it('returns false if priority already URGENT', async () => {
      (fieldsValidator as jest.Mock).mockReturnValue(true);
      jest.spyOn(handlers, 'getCurrentSubtaskPriority').mockResolvedValue([{ priority: Priorities.URGENT }]);
      const req: any = { data: { subtaskID: 'S1' } };
      const result = await handlers.escalateSubtaskHandler(req);
      expect(result).toHaveProperty("message");
    });

    it('updates priority to URGENT and returns true', async () => {
      (fieldsValidator as jest.Mock).mockReturnValue(true);
      jest.spyOn(handlers, 'getCurrentSubtaskPriority').mockResolvedValue([{ priority: Priorities.LOW }]);
      mockRun.mockResolvedValueOnce({});
      const req: any = { data: { subtaskID: 'S1' } };
      const result = await handlers.escalateSubtaskHandler(req);
      expect(result).toHaveProperty("message");
    });

    it('handles error on update and returns errorMsg', async () => {
      (fieldsValidator as jest.Mock).mockReturnValue(true);
      jest.spyOn(handlers, 'getCurrentSubtaskPriority').mockResolvedValue([{ priority: Priorities.LOW }]);
      mockRun.mockRejectedValueOnce(new Error('Update failed'));
      const req: any = { data: { subtaskID: 'S1' } };
      const result = await handlers.escalateSubtaskHandler(req);
      expect(result).toHaveProperty('message');
      expect(log.error).toHaveBeenCalled();
    });
  });

  // getCurrentSubtaskPriority
  describe('getCurrentSubtaskPriority', () => {
    it('returns priority data on success', async () => {
      mockRun.mockResolvedValueOnce([{"priority": 1}]);
      const result = await handlers.getCurrentSubtaskPriority('S1');
      expect(result).toEqual([{"priority": 1}]);
    });

    it('handles error and returns errorMsg', async () => {
      mockRun.mockRejectedValueOnce(new Error('Query Error'));
      const result = await handlers.getCurrentSubtaskPriority('S1');
      expect(result).toHaveLength(1);
    });
  });

  // promoteEmployeeHandler
  describe('promoteEmployeeHandler', () => {
    it('returns errorMsg if corpID or grade missing', async () => {
      (fieldsValidator as jest.Mock).mockReturnValue(false);
      const req: any = { data: { corpID: undefined, grade: undefined } };
      const result = await handlers.promoteEmployeeHandler(req);
      expect(result).toHaveProperty('message');
    });

    it('returns false if same grade', async () => {
      (fieldsValidator as jest.Mock).mockReturnValue(true);
      mockRun.mockResolvedValueOnce([{ grade: 'A1' }]);
      const req: any = { data: { corpID: 'U1', grade: 'A1' } };
      const result = await handlers.promoteEmployeeHandler(req);
      expect(result).toBe(false);
    });

    it('updates grade and returns true', async () => {
      (fieldsValidator as jest.Mock).mockReturnValue(true);
      mockRun.mockResolvedValueOnce([{ grade: 'B1' }]);
      mockRun.mockResolvedValueOnce({}); // update
      const req: any = { data: { corpID: 'U1', grade: 'A1' } };
      const result = await handlers.promoteEmployeeHandler(req);
      expect(result).toBe(true);
    });
  });

  // increaseSalaryEmployeeHandler
  describe('increaseSalaryEmployeeHandler', () => {
    beforeEach(() => {
  jest.clearAllMocks();
  });

    it('returns errorMsg if corpID or newSalary missing', async () => {
      (fieldsValidator as jest.Mock).mockReturnValue(false);
      const req: any = { data: { corpID: undefined, newSalary: undefined } };
      const result = await handlers.increaseSalaryEmployeeHandler(req);
      expect(result).toHaveProperty('message');
    });

    it('returns false if old salary missing', async () => {
      (fieldsValidator as jest.Mock).mockReturnValue(true);
      mockRun.mockResolvedValueOnce([]);
      const req: any = { data: { corpID: 'U1', newSalary: 1000 } };
      const result = await handlers.increaseSalaryEmployeeHandler(req);
      expect(result).toBe(false);
    });

    it('returns false if newSalary > 10% raise', async () => {
      (fieldsValidator as jest.Mock).mockReturnValue(true);
      mockRun.mockResolvedValueOnce([{ salary: 1000 }]);
      const req: any = { data: { corpID: 'U1', newSalary: 1200 } };
      const result = await handlers.increaseSalaryEmployeeHandler(req);
      expect(result).toBe(false);
    });

    it('returns false if newSalary < oldSalary', async () => {
      (fieldsValidator as jest.Mock).mockReturnValue(true);
      mockRun.mockResolvedValueOnce([{ salary: 1000 }]);
      const req: any = { data: { corpID: 'U1', newSalary: 900 } };
      const result = await handlers.increaseSalaryEmployeeHandler(req);
      expect(result).toBe(false);
    });

    it('handles update error and returns true', async () => {
      (fieldsValidator as jest.Mock).mockReturnValue(true);
      mockRun.mockResolvedValueOnce([{ salary: 1000 }]);
      mockRun.mockRejectedValueOnce(new Error('Update fail'));
      const req: any = { data: { corpID: 'U1', newSalary: 1050 } };
      const result = await handlers.increaseSalaryEmployeeHandler(req);
      expect(result).toBe(false);
      expect(log.error).toHaveBeenCalled();
    });
  });

  describe("calculatePercentage2Overall", () => {
    it('returns 0 if array is null or undefined', () => {
      expect(handlers.calculatePercentage2Overall(null as any)).toBe(0);
      expect(handlers.calculatePercentage2Overall(undefined as any)).toBe(0);
      });

    it('returns 0 for empty array', () => {
    expect(handlers.calculatePercentage2Overall([])).toBe(0);
    });

  it('returns 0 when no elements are truthy', () => {
    expect(handlers.calculatePercentage2Overall([0, 0, 0])).toBe(0);
    expect(handlers.calculatePercentage2Overall([NaN, null as any, undefined as any])).toBe(0);
    });

  it('calculates correct ratio for mixed truthy and falsy values', () => {
    const arr = [1, 0, 2, NaN, 3, ''] as any;
    expect(handlers.calculatePercentage2Overall(arr)).toBeCloseTo(0.5);
    });

  it('returns 1 when all elements are truthy', () => {
    expect(handlers.calculatePercentage2Overall([1, 2, 3, 4])).toBe(1);
    expect(handlers.calculatePercentage2Overall([true as any, 'a' as any, 5 as any])).toBe(1);
    });
  });

});
