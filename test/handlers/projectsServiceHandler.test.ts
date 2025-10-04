import {getTaskStatusHandler,
        getUserWorkloadHandler,
        calculateTaskOverallHandler,
        escalateSubtaskHandler} from "../../srv/handler/projectsServiceHandler";
import { serviceWrapper } from "../../srv/utils/utils";
import { Status, Priorities } from "#cds-models/kondiiq/projects/ts";

// Ustaw mocki
jest.mock('../../srv/utils/utils');
jest.mock('../../srv/utils/logger', () => ({
  log: { error: jest.fn(), info: jest.fn() }
}));

const mockServiceRun = jest.fn();
(serviceWrapper as jest.Mock).mockResolvedValue({ run: mockServiceRun });

describe('getUserWorkloadHandler', () => {
  it('returns errorMsg if corpID is undefined', async () => {
    const req: any = { data: { corpID: undefined }};
    jest.requireMock('../../srv/utils/utils').fieldsValidator.mockReturnValue(false);

    const result = await getUserWorkloadHandler(req);
    expect(result).toEqual({ message: "Something went wrong" });
  });

  it('returns user and subtasks if corpID exists', async () => {
    const req: any = { data: { corpID: "U1" } };
    jest.requireMock('../../srv/utils/utils').fieldsValidator.mockReturnValue(true);
    mockServiceRun
      .mockResolvedValueOnce([{ corpID: "U1", grade: "A1" }]) // user query
      .mockResolvedValueOnce([{ ID: "S1", status: 1, priority: 2, task_ID: "T1", description: "Test" }]); // subtasks query
    const result = await getUserWorkloadHandler(req);
    expect(result).toHaveProperty('user');
    expect(result).toHaveProperty('subtasks');
  });
});

describe('calculateTaskOverallHandler', () => {
  it('returns errorMsg if taskID is undefined', async () => {
    const req: any = { data: { taskID: undefined } };
    jest.requireMock('../../srv/utils/utils').fieldsValidator.mockReturnValue(false);

    const result = await calculateTaskOverallHandler(req);
    expect(result).toEqual({ message: "The field taskID is undefined" });
  });

  it('correctly calculates overall if subtasks exist', async () => {
    const req: any = { data: { taskID: "T1" }};
    jest.requireMock('../../srv/utils/utils').fieldsValidator.mockReturnValue(true);
    // Two subtasks, one FINISHED
    mockServiceRun.mockResolvedValueOnce([
      {status: Status.FINISHED, name: "sss", priority: Priorities.URGENT},
      {status: Status.IN_PROGRESS, name: "sss2", priority: Priorities.LOW}
    ]);
    const result = await calculateTaskOverallHandler(req);
    expect(result).toBeCloseTo(0.5);
  });
});

describe('escalateSubtaskHandler', () => {
  it('returns false if currentPriority is already URGENT', async () => {
    const req: any = { data: { subtaskID: "S1" } };
    jest.requireMock('../../srv/utils/utils').fieldsValidator.mockReturnValue(true);
    const getCurrentSubtaskPriority = jest.requireMock('../../srv/handlers').getCurrentSubtaskPriority;
    getCurrentSubtaskPriority.mockResolvedValue([{priority: Priorities.URGENT}]);
    const result = await escalateSubtaskHandler(req);
    expect(result).toBe(false);
  });

  it('updates priority to URGENT when not yet urgent', async () => {
    jest.clearAllMocks();
    const req: any = { data: { subtaskID: "S1" } };
    jest.requireMock('../srv/utils/utils').fieldsValidator.mockReturnValue(true);
    const getCurrentSubtaskPriority = jest.requireMock('../../srv/handlers').getCurrentSubtaskPriority;
    getCurrentSubtaskPriority.mockResolvedValue([{priority: Priorities.LOW}]);
    mockServiceRun.mockResolvedValueOnce({});
    const result = await escalateSubtaskHandler(req);
    expect(result).toBe(true);
  })
});