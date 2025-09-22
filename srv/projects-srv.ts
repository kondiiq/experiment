import cds from '@sap/cds';
import {getTaskStatusHandler, getUserWorkloadHandler, promoteEmployeeHandler, getProjectStatusHandler, calculateTaskOverallHandler, escalateSubtaskHandler} from "./handler/projectsServiceHandler"

export class MainJira extends cds.ApplicationService {
    async init() {
        
    this.on("getTaskStatus", getTaskStatusHandler);

    this.on("getUserWorkload", getUserWorkloadHandler);

    this.on("getProjectStatus", getProjectStatusHandler);

    this.on("calculateTaskOverall", calculateTaskOverallHandler);

    this.on("escalateSubtask", escalateSubtaskHandler);

    this.on("promoteEmployee", promoteEmployeeHandler);
    
    return await super.init();
    }
}