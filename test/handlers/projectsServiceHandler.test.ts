import * as handlers from "../../srv/handler/projectsServiceHandler";
import { serviceWrapper, fieldsValidator, dateValidator } from "../../srv/utils/utils";
import { log } from "../../srv/utils/logger";
import { Status, Priorities } from "#cds-models/kondiiq/projects/ts";


jest.mock('../../srv/utils/utils');
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
      (fieldsValidator as jest.Mock).mockReturnValue(true);
      const fakeProject = { name: 'P1', tasks: [], description: 'desc' };
      mockRun.mockResolvedValueOnce([fakeProject]);
      const req: any = { data: { projectID: 'pid123' } };
      const result = await handlers.getProjectStatusHandler(req);
      expect(result).toEqual([fakeProject]);
    });

    it('handles errors and returns errorMsg', async () => {
      (fieldsValidator as jest.Mock).mockReturnValue(true);
      mockRun.mockRejectedValueOnce(new Error('DB error'));
      const req: any = { data: { projectID: 'pid123' } };
      const result = await handlers.getProjectStatusHandler(req);
      expect(result).toHaveProperty('message');
      expect(log.error).toHaveBeenCalled();
    });
  });

  // calculateTaskOverallHandler
  describe('calculateTaskOverallHandler', () => {
    it('returns errorMsg if taskID missing', async () => {
      (fieldsValidator as jest.Mock).mockReturnValue(false);
      const req: any = { data: { taskID: undefined } };
      const result = await handlers.calculateTaskOverallHandler(req);
      expect(result).toHaveProperty('message');
      expect(log.error).toHaveBeenCalled();
    });

    it('calculates progress correctly', async () => {
      (fieldsValidator as jest.Mock).mockReturnValue(true);
      mockRun.mockResolvedValueOnce([
        { status: Status.FINISHED, name: 's1', priority: Priorities.HIGH },
        { status: Status.IN_PROGRESS, name: 's2', priority: Priorities.LOW }
      ]);
      const req: any = { data: { taskID: 'T1' } };
      const result = await handlers.calculateTaskOverallHandler(req);
      expect(result).toBeCloseTo(0.5);
      expect(log.info).toHaveBeenCalled();
    });

    it('handles query error and returns errorMsg', async () => {
      (fieldsValidator as jest.Mock).mockReturnValue(true);
      mockRun.mockRejectedValueOnce(new Error('Query Error'));
      const req: any = { data: { taskID: 'T1' } };
      const result = await handlers.calculateTaskOverallHandler(req);
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
      expect(result).toBe(false);
    });

    it('updates priority to URGENT and returns true', async () => {
      (fieldsValidator as jest.Mock).mockReturnValue(true);
      jest.spyOn(handlers, 'getCurrentSubtaskPriority').mockResolvedValue([{ priority: Priorities.LOW }]);
      mockRun.mockResolvedValueOnce({});
      const req: any = { data: { subtaskID: 'S1' } };
      const result = await handlers.escalateSubtaskHandler(req);
      expect(result).toBe(true);
      expect(log.info).toHaveBeenCalled();
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
      mockRun.mockResolvedValueOnce([{ priority: Priorities.HIGH }]);
      const result = await handlers.getCurrentSubtaskPriority('S1');
      expect(result).toEqual([{ priority: Priorities.HIGH }]);
    });

    it('handles error and returns errorMsg', async () => {
      mockRun.mockRejectedValueOnce(new Error('Query Error'));
      const result = await handlers.getCurrentSubtaskPriority('S1');
      expect(result).toHaveProperty('message');
      expect(log.error).toHaveBeenCalled();
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

    it('handles update error and returns false', async () => {
      (fieldsValidator as jest.Mock).mockReturnValue(true);
      mockRun.mockResolvedValueOnce([{ grade: 'B1' }]);
      mockRun.mockRejectedValueOnce(new Error('Update error'));
      const req: any = { data: { corpID: 'U1', grade: 'A1' } };
      const result = await handlers.promoteEmployeeHandler(req);
      expect(result).toBe(false);
      expect(log.error).toHaveBeenCalled();
    });
  });

  // increaseSalaryEmployeeHandler
  describe('increaseSalaryEmployeeHandler', () => {
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

    it('updates salary and returns true', async () => {
      (fieldsValidator as jest.Mock).mockReturnValue(true);
      mockRun.mockResolvedValueOnce([{ salary: 1000 }]);
      mockRun.mockResolvedValueOnce({});
      const req: any = { data: { corpID: 'U1', newSalary: 1050 } };
      const result = await handlers.increaseSalaryEmployeeHandler(req);
      expect(result).toBe(true);
      expect(log.info).toHaveBeenCalled();
    });

    it('handles update error and returns false', async () => {
      (fieldsValidator as jest.Mock).mockReturnValue(true);
      mockRun.mockResolvedValueOnce([{ salary: 1000 }]);
      mockRun.mockRejectedValueOnce(new Error('Update fail'));
      const req: any = { data: { corpID: 'U1', newSalary: 1050 } };
      const result = await handlers.increaseSalaryEmployeeHandler(req);
      expect(result).toBe(false);
      expect(log.error).toHaveBeenCalled();
    });
  });

  // fileUploadHandler
  describe('fileUploadHandler', () => {
    it('rejects if file, taskID or description missing', async () => {
      const req: any = { data: { file: null, taskID: null, description: null }, reject: jest.fn() };
      const result = await handlers.fileUploadHandler(req);
      expect(req.reject).toHaveBeenCalledWith(400, expect.any(String));
    });

    it('inserts attachment and returns result', async () => {
      const req: any = {
        data: {
          file: { name: "file.txt", content: Buffer.alloc(1), mimeType: "text/plain", size: 1 },
          taskID: "T1",
          description: "desc"
        },
        user: { id: "U1" }
      };
      mockRun.mockResolvedValueOnce([{ ID: "A1" }]);
      const result = await handlers.fileUploadHandler(req);
      expect(result).toEqual([{ ID: "A1" }]);
      expect(log.info).toHaveBeenCalled();
    });
  });
});
