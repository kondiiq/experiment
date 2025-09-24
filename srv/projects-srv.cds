using {kondiiq.projects.ts as projects} from '../db/schema';

service MainJira @(required: 'authenticated-user') {
    entity Projects   as projection on projects.Projects;
    entity Tasks      as projection on projects.Tasks;
    entity Subtasks   as projection on projects.Subtasks;
    entity Roles      as projection on projects.Roles;
    entity Teams      as projection on projects.Teams;
    entity Users      as projection on projects.Users;
    entity Comments   as projection on projects.Comments;
    entity Attachments as projection on projects.Attachments;

    function getTaskStatus(taskID: UUID) returns Decimal;
    function getUserWorkload(corpID: String(10)) returns Users;
    function getProjectStatus(projectID: UUID) returns Projects;
    function calculateTaskOverall(taskID: UUID) returns Decimal;
    action escalateSubtask(subtaskID: UUID) returns String;
    action promoteEmployee(corpID: String(10), grade: projects.Grade) returns Boolean;
    action increaseSalaryEmployee(corpID: String(10), newSalary: Integer) returns Boolean;
    action uploadFile(file: LargeBinary, fileName: String, taskID: UUID) returns Attachments;

    type errorMsg {
        message: String;
    }
}