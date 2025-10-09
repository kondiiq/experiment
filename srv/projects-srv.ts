import cds from '@sap/cds';
import { getTaskStatusHandler, sendReminderHandler, findUserWithCapacity, onUpdateTaskHandler, onUpdateProjectEndDate, fileUploadHandler, afterCreateTaskHandle, getUsersWorkloadHandler, promoteEmployeeHandler, getProjectStatusHandler, calculateTaskOverallHandler, escalateSubtaskHandler } from "./handler/projectsServiceHandler"
import { Projects, Subtasks, Tasks } from '#cds-models/MainJira';

export class MainJira extends cds.ApplicationService {
    async init() {

        this.on("getTaskStatus", getTaskStatusHandler);
        this.on("getUsersWorkload", getUsersWorkloadHandler);
        this.on("getProjectStatus", getProjectStatusHandler);
        this.on("calculateTaskOverall", calculateTaskOverallHandler);
        this.on("escalateSubtask", escalateSubtaskHandler);
        this.on("promoteEmployee", promoteEmployeeHandler);
        this.on("uploadFile", fileUploadHandler);
        this.on("findUserWithCapacity", findUserWithCapacity);
        this.on(UPDATE, Subtasks, onUpdateTaskHandler);
        this.on(UPDATE, Projects, onUpdateProjectEndDate)
        this.after(CREATE, Tasks, afterCreateTaskHandle);
        this.on("sendReminder", sendReminderHandler);

        return await super.init();
    }
}