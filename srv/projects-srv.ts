import cds from '@sap/cds';
import { getTaskStatusHandler, findUserWithCapacity, onUpdateTaskHandler, onUpdateProjectEndDate, fileUploadHandler, afterCreateTaskHandle, getUserWorkloadHandler, promoteEmployeeHandler, getProjectStatusHandler, calculateTaskOverallHandler, escalateSubtaskHandler } from "./handler/projectsServiceHandler"
import { Projects, Subtasks, Tasks } from '#cds-models/MainJira';

export class MainJira extends cds.ApplicationService {
    async init() {

        this.on("getTaskStatus", getTaskStatusHandler);
        this.on("getUserWorkload", getUserWorkloadHandler);
        this.on("getProjectStatus", getProjectStatusHandler);
        this.on("calculateTaskOverall", calculateTaskOverallHandler);
        this.on("escalateSubtask", escalateSubtaskHandler);
        this.on("promoteEmployee", promoteEmployeeHandler);
        this.on("uploadFile", fileUploadHandler);
        this.on("findUserWithCapacity", findUserWithCapacity);
        this.on(UPDATE, Subtasks, onUpdateTaskHandler);
        this.on(UPDATE, Projects, onUpdateProjectEndDate)
        this.after(CREATE, Tasks, afterCreateTaskHandle);

        return await super.init();
    }
}