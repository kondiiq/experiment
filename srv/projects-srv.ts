import cds from '@sap/cds';
import {getTaskStatusHandler, findUserWithCapacity, fileUploadHandler, getUserWorkloadHandler, promoteEmployeeHandler, getProjectStatusHandler, calculateTaskOverallHandler, escalateSubtaskHandler} from "./handler/projectsServiceHandler"

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
    
    return await super.init();
    }
}