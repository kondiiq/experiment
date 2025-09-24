import { Priorities, Status } from "#cds-models/kondiiq/projects/ts";
import { Attachments, errorMsg, Projects, Subtasks, Users } from "#cds-models/MainJira";
import cds from "@sap/cds";
import { serviceWrapper, fieldsValidator } from "../utils/utils";
import { log} from "../utils/logger"

/**
 * Getter Task status
 * @param req 
 * @returns {Promise<Projects | errorMsg>} with priority 
 */
export async function getTaskStatusHandler(req : cds.Request): Promise<Projects | errorMsg> {
    const { taskID  } = req.data;
    if(!fieldsValidator(taskID)) {
        log.error(`The field taskID is undefined`);
        return {message: "The field taskID is undefined"} as errorMsg;}
    const srv = await serviceWrapper("MainJira");
    try{
        const query = SELECT
            .from(Projects)
            .columns("name", "description", "progress")
            .where({ID : taskID});
        const result = await srv.run(query);
        return result[0];
    } catch(error: unknown){
        console.error(`Something went wrong ${error}`);
        log.error(`Something went wrong ${error}`);
        return {message: `Something went wrong ${error}`} as errorMsg;
    }
}

export async function getUserWorkloadHandler(req: cds.Request) {
    const { corpID } = req.data;         
    if(!fieldsValidator(corpID)) {
        log.error(`The field corpID is undefined`);
        return {message: "Something went wrong"} as errorMsg;
    }
    const srv = await serviceWrapper("MainJira");
    try {
        const userQuery = cds.ql.SELECT
            .from(Users)
            .columns("corpID", "grade")
            .where({ corpID });
        const user = (await srv.run(userQuery))[0];
        if (!user) {
            return { message: "User not found" } as errorMsg;
        }
        const subtasksQuery = cds.ql.SELECT
            .from(Subtasks)
            .columns("ID", "status", "priority", "task_ID", "description")
            .where({ assigned_corpID: corpID });
        const subtasks = await srv.run(subtasksQuery);
        return { subtasks, user };
    } catch(error: unknown) {
        console.error(`Something went wrong ${error}`);
        log.error(`Something went wrong ${error}`);
        return {message: `Something went wrong ${error}`} as errorMsg;
    }
}

/**
 * Getter to Project Status
 * @param req 
 * @returns {Project}
 */
export async function getProjectStatusHandler(req : cds.Request): Promise<Projects | errorMsg> {
    const { projectID } = req.data;
    if(!fieldsValidator(projectID)){
        log.error(`The field projectID is undefined`);
        return {message: "Something went wrong"} as errorMsg;
    }
    const srv = await serviceWrapper("MainJira");
    try {
        const query = SELECT
            .from(Projects)
            .columns("name", "tasks", "description", "startDate", "endDate", "manager_corpID")
            .where({ID : projectID});
        return await srv.run(query);
    } catch(error: unknown){
        log.error(`Something went wrong ${error}`);
        return {message: `Something went wrong ${error}`} as errorMsg;
    }
}

/**
 *  Action to calculate task progress based on subtask progress 
 * @param req 
 * @returns {Number} calculate task progress based on subtask progress 
 */
export async function calculateTaskOverallHandler(req : cds.Request): Promise<errorMsg | Number> {
    const { taskID } = req.data;
    if(!fieldsValidator(taskID)) {
        log.error(`The field taskID is undefined`);
        return {message: "The field taskID is undefined"} as errorMsg;
    }
    const srv = await serviceWrapper("MainJira");
    let resultQuery;
    try{
        const querySubtasks = SELECT.from(Subtasks)
        .columns("status", "name", "priority")
        .where({task: taskID});
        resultQuery = await srv.run(querySubtasks);
    } catch(error: unknown) {
        console.error(`Something went wrong${error}`);
        log.error(`Something went wrong ${error}`);
        return {message: `Something went wrong ${error}`} as errorMsg;
    }
    const isFinishedArray = resultQuery.map(subtask => {
        return subtask.status === Status.FINISHED;
    });
    const doneCount = isFinishedArray.filter(Boolean).length;
    log.info(`Calculated overall is around ${doneCount === 0 ? 0 : doneCount / isFinishedArray.length}`);
    return doneCount === 0 ? 0 : doneCount / isFinishedArray.length;
}

/**
 * Action to change Subtask priority to urgent
 * @param req 
 * @returns {Promise<boolean | errorMsg>} depends in success/ failure
 */
export async function escalateSubtaskHandler(req : cds.Request): Promise<boolean | errorMsg>  {
    const { subtaskID } = req.data;
    if(!fieldsValidator(subtaskID)) {
        log.error(`The field subtaskID is undefined`);
        return {message: "Something went wrong"} as errorMsg;
    }
    const srv = await serviceWrapper("MainJira");
    const currentPriority = await getCurrentSubtaskPriority(subtaskID) as Subtasks;
    if(currentPriority[0]?.priority === Priorities.URGENT) {
        console.info('The highest priority already exist');
        log.info('The highest priority already exist');
        return false;
    }
    try {
        const updateQuery = UPDATE(Subtasks)
            .set({priority : Priorities.URGENT})
            .where({ID : subtaskID});
        await srv.run(updateQuery);
        log.info(`Priority increase to ${Priorities.URGENT}`);
        return true;
    } catch(error: unknown) {
        console.error(`Something went wrong ${error}`);
        console.error(`Something went wrong ${error}`);
        log.error(`Something went wrong ${error}`);
        return {message : `Something went wrong ${error}`} as errorMsg;
    }
}

/**
 * Getter to return Sybtask priority
 * @param req 
 * @returns { Promise<Subtasks | errorMsg>}
 */
export async function getCurrentSubtaskPriority(subtaskID: string): Promise<Subtasks | errorMsg> {
    const srv = await serviceWrapper("MainJira");
    try {
        const query = SELECT.from(Subtasks)
            .columns("priority")
            .where({ID: subtaskID});
        return await srv.run(query);
    } catch(error: unknown) {
        console.error(error);
        log.error(`Something went wrong ${error}`);
        return {message: `Something went wrong ${error}`} as errorMsg;
    }
}

/**
 * Action to promote user
 * @param req 
 * @returns {Promise<boolean | errorMsg>} depends on success failure
 */
export async function promoteEmployeeHandler(req : cds.Request): Promise<boolean | errorMsg> {
    const { corpID, grade } = req.data;
    if(!fieldsValidator(corpID) || !fieldsValidator(grade)) {
        log.error(`The field corpID or grade is undefined`);
        return {message: "Something went wrong"} as errorMsg;
    }
    const srv = await serviceWrapper("MainJira");
    const currentGradeQuery = SELECT
        .from(Users)
        .columns("grade", "firstName", "lastName", "email", "telephoneNumber")
        .where({corpID : corpID});
    const currentGrade = await srv.run(currentGradeQuery);
    if(currentGrade[0]?.grade === grade) {
        log.info(`Cannot promote user to the same grade`);
        console.log("Cannot promote user to the same grade");
        return false;
    }
    try {
        const query = UPDATE(Users)
        .set({grade : grade})
        .where({corpID : corpID});
        await srv.run(query);
        return true;
    } catch(error:unknown){
        log.error(`Something went wrong ${error}`);
        console.error(error);
        return false;
    }
}

/**
 *  Action to increase user salary
 * @param req 
 * @returns {Promise<boolean | errorMsg>} depends on success failure
 */
export async function increaseSalaryEmployeeHandler(req : cds.Request): Promise<boolean | errorMsg> {
    const { corpID, newSalary} = req.data;
    if(!fieldsValidator(corpID) || !fieldsValidator(newSalary)) {
        log.error(`The field corpID or grade is undefined`);
        return {message: "Something went wrong"} as errorMsg;
    }
    const srv = await serviceWrapper("MainJira");
    try{
        const oldSalary = await srv.run(SELECT
            .from(Users)
            .columns("salary")
            .where({corpID: corpID}));
        if(!oldSalary.length || oldSalary[0].salary == null){
            console.log("Old salary not found value");
            log.info(`Old salary not found value`);
            return false;
        }
        if( Number(newSalary)> Number(oldSalary[0].salary * 1.1)){
            console.log("Cannot increase salary more than 10%");
            log.info(`Cannot increase salary more than 10%`);
            return false;
        }
        if(Number(newSalary) < Number(oldSalary[0].salary)){
            console.log("Cannot decrease User salary");
            log.info(`Cannot decrease User salary`);
            return false;
        }
        const query = UPDATE(Users)
            .set({salary : Number(newSalary)})
            .where({corpID : corpID});
            await srv.run(query);
            log.info(`The salary increase to ${Number(newSalary)} for the user ${corpID}`);
            return true;
    } catch(error: unknown) {
        console.error(error)
        log.error(`Something went wrong $error}`);
        return false;
    }
}

export async function fileUploadHandler(req: cds.Request) : Promise<Attachments[] | unknown> {
    const srv = await serviceWrapper("MainJira");
    try{
        const {file, taskID, description} = req.data;
        if(!fieldsValidator(file) || !fieldsValidator(taskID) || !fieldsValidator(description) ) {
        log.error(`The fields file or taskID or description is/re undefined`);
        return req.reject(400, `The fields file or taskID or description is/re undefined`);
        }
        const attachment = {
            fileName: file.name,
            content: file.content,
            description: description,
            mediaType: file.mimeType,
            size: file.size,
            task_ID: taskID,
            uploadedBy_corpID: req.user.id
        };
        const insertQuery = INSERT.into(Attachments).entries(attachment);
        const result = await srv.run(insertQuery) as Attachments[];
        log.info(`Succesfully inserted ${result.length} ${result.length === 1 ? 'file' : 'files'} `);
        return result;
    }catch(error: unknown){
        log.error(`Something went wrong ${error}`);
        return req.reject(400, `Something went wrong ${error}`);
    }
}