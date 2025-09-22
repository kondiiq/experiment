import { Priorities, Status } from "#cds-models/kondiiq/projects/ts";
import { errorMsg, Projects, Subtasks, Users } from "#cds-models/MainJira";
import cds, { Query } from "@sap/cds";
import { serviceWrapper, fieldsValidator } from "../utils/utils";
import { join } from "path";
import { argv } from "process";

/**
 * Getter Task status
 * @param req 
 * @returns {Promise<Projects | errorMsg>} with priority 
 */
export async function getTaskStatusHandler(req : cds.Request): Promise<Projects | errorMsg> {
    const { taskID  } = req.data;
    if(!fieldsValidator(taskID)) return {message: "Something went wrong"} as errorMsg;
    const srv = await serviceWrapper("MainJira");
    try{
        const query = SELECT
            .from(Projects)
            .columns("name", "description", "progress")
            .where({ID : taskID});
        const result = await srv.run(query);
        return result[0];
    } catch(error: unknown){
        console.error(error);
        return {message: "Something went wrong"} as errorMsg;
    }
}

export async function getUserWorkloadHandler(req : cds.Request) {
    const { corpID } = req.data;         
    if(!fieldsValidator(corpID)) return {message: "Something went wrong"} as errorMsg;      
    const srv = await serviceWrapper("MainJira");
    try{
        const query = {
                SELECT : {
                    from: {
                        join: "left",
                        args: [
                            {
                                ref: [Subtasks], as: 's'
                            }, 
                            {
                                ref: [Users], as: 'u'
                            }
                        ],
                        on: [
                            {
                                ref: ['s', 'assigned']
                            },
                            '=',
                            {
                                ref: ['u', 'corpID']
                            }
                        ]
                    },
                    columns: [
                        { ref: ['u', 'corpID'] },
                        { ref: ['u', 'grade'] },
                        { ref: ['s', 'status'] },
                        { ref: ['s', 'priority'] }
                    ],
                    where: [
                        { ref: ['u', 'corpID'] }, '=', { val: corpID }
                    ]
                }
            };
        const result = await srv.run(query as any);
        return result;
    } catch(error : unknown){
        return {message : error} as errorMsg;
    }
}

/**
 * Getter to Project Status
 * @param req 
 * @returns {Project}
 */
export async function getProjectStatusHandler(req : cds.Request): Promise<Projects | errorMsg> {
    const { projectID } = req.data;
    if(!fieldsValidator(projectID)) return {message: "Something went wrong"} as errorMsg;
    const srv = await serviceWrapper("MainJira");
    try {
        const query = SELECT
            .from(Projects)
            .columns("name", "tasks", "description", "startDate", "endDate", "manager_corpID")
            .where({ID : projectID});
        return await srv.run(query);
    } catch(error: unknown){
        console.error(error);
        return {message : error} as errorMsg;
    }
}

/**
 *  Action to calculate task progress based on subtask progress 
 * @param req 
 * @returns {Number} calculate task progress based on subtask progress 
 */
export async function calculateTaskOverallHandler(req : cds.Request): Promise<errorMsg | Number> {
    const { taskID } = req.data;
    if(!fieldsValidator(taskID)) return {message: "Something went wrong"} as errorMsg;
    const srv = await serviceWrapper("MainJira");
    let resultQuery;
    try{
        const querySubtasks = SELECT.from(Subtasks)
        .columns("status", "name", "priority")
        .where({task: taskID});
        resultQuery = await srv.run(querySubtasks);
    } catch(error: unknown) {
        console.error(`Something went wrong${error}`);
        return {message: "Something went wrong"} as errorMsg;
    }
    const isFinishedArray = resultQuery.map(subtask => {
        return subtask.status === Status.FINISHED;
    });
    const doneCount = isFinishedArray.filter(Boolean).length;
    return doneCount === 0 ? 0 : doneCount / isFinishedArray.length;
}

/**
 * Action to change Subtask priority to urgent
 * @param req 
 * @returns {Promise<boolean | errorMsg>} depends in success/ failure
 */
export async function escalateSubtaskHandler(req : cds.Request): Promise<boolean | errorMsg>  {
    const { subtaskID } = req.data;
    if(!fieldsValidator(subtaskID)) return {message: "Something went wrong"} as errorMsg;
    const srv = await serviceWrapper("MainJira");
    const currentPriority = await getCurrentSubtaskPriority(subtaskID) as Subtasks;
    if(currentPriority[0]?.priority === Priorities.URGENT) {
        console.log('The highest priority already exist');
        return false;
    }
    try {
        const updateQuery = UPDATE(Subtasks)
            .set({priority : Priorities.URGENT})
            .where({ID : subtaskID});
        await srv.run(updateQuery);
        return true;
    } catch(error: unknown) {
        console.error(error);
        return {message : error} as errorMsg;
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
        return {message: "Something went wrong"} as errorMsg;
    }
}

/**
 * Action to promote user
 * @param req 
 * @returns {Promise<boolean | errorMsg>} depends on success failure
 */
export async function promoteEmployeeHandler(req : cds.Request): Promise<boolean | errorMsg> {
    const { corpID, grade } = req.data;
    if(!fieldsValidator(corpID) || !fieldsValidator(grade)) return {message: "Something went wrong"} as errorMsg;
    const srv = await serviceWrapper("MainJira");
    const currentGradeQuery = SELECT
        .from(Users)
        .columns("grade", "firstName", "lastName", "email", "telephoneNumber")
        .where({corpID : corpID});
    const currentGrade = await srv.run(currentGradeQuery);
    if(currentGrade[0]?.grade === grade) {
        console.log("Cannot promote user to the same grade ;)");
        return false;
    }
    try {
        const query = UPDATE(Users)
        .set({grade : grade})
        .where({corpID : corpID});
        await srv.run(query);
        return true;
    } catch(error:unknown){
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
    if(!fieldsValidator(corpID) || !fieldsValidator(newSalary)) return {message: "Something went wrong"} as errorMsg;
    const srv = await serviceWrapper("MainJira");
    try{
        const oldSalary = await srv.run(SELECT
            .from(Users)
            .columns("salary")
            .where({corpID: corpID}));
        if(!oldSalary.length || oldSalary[0].salary == null){
            console.log("Old salary not found value");
            return false;
        }
        if( Number(newSalary)> Number(oldSalary[0].salary * 1.1)){
            console.log("Cannot increase salary more than 10%");
            return false;
        }
        if(Number(newSalary) < Number(oldSalary[0].salary)){
            console.log("Cannot decrease User salary");
            return false;
        }
        const query = UPDATE(Users)
            .set({salary : Number(newSalary)})
            .where({corpID : corpID});
            await srv.run(query);
            return true;
    } catch(error: unknown) {
        console.error(error)
        return false;
    }
}