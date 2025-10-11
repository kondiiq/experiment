namespace kondiiq.projects.ts;

type Gender     : String enum {
    Male = 'M';
    Female = 'F';
}

type Grade      : String enum {
    A1 = 'A1';
    A2 = 'A2';
    B1 = 'B1';
    B2 = 'B2';
    C1 = 'C1';
    C2 = 'C3';
    D1 = 'D1';
    D2 = 'D2';
    E1 = 'E1';
    E2 = 'E2';
    F = 'F';
}

type Status     : Integer enum {
    TO_DO = 1;
    IN_PROGRESS = 2;
    UNDER_REVIEW = 3;
    TEST = 4;
    BUSINESS_TEST = 5;
    FINISHED = 6;
}

type Priorities : Integer enum {
    LOW = 1;
    MEDIUM = 2;
    HIGH = 3;
    URGENT = 4;
}

using {
    managed,
    cuid
} from '@sap/cds/common';

entity Projects : cuid, managed {
    name        : String(100);
    description : localized String(255);
    startDate   : Date;
    endDate     : Date;
    manager     : Association to Users;
    tasks       : Association to many Tasks
                    on tasks.project = $self;
}

entity Tasks : cuid, managed {
    name        : String(100);
    description : localized String(255);
    noTasks     : Integer;
    subtasks    : Association to many Subtasks
                    on subtasks.task = $self;
    progress    : Decimal(2, 1);
    project     : Association to Projects;
}

entity Subtasks : cuid, managed {
    name        : String(100);
    description : localized String(255);
    assigned    : Association to Users;
    estimation  : Integer;
    assigner    : Association to Users;
    priority    : Priorities;
    status      : Status;
    task        : Association to Tasks;
    comments    : Association to many Comments
                    on comments.subtask = $self;
    attachments : Association to many Attachments
                    on attachments.subtask = $self;
}

entity Roles : managed {
    key role_id : String(5);
        role    : String(50);
}

entity Teams : cuid, managed {
    name  : String(100);
    users : Association to many Users
                on users.team = $self;
}

entity Users : managed {
    key corpID          : String(10);
        firstName       : String(50);
        lastName        : String(50);
        fullName        : String;
        email           : String(50) @assert.format: '^\\S+@\\S+\\.\\S+$';
        telephoneNumber : String(15) @assert.format: '^[+\\d\\s\\(\\)\\-]{9,15}$';
        gender          : Gender;
        grade           : Grade;
        salary          : Integer;
        position        :  Association to Roles;
        subtasks        : Association to many Subtasks
                            on subtasks.assigned = $self;
        team            : Association to Teams; // <-- usuwamy ręczne team_ID
        comments        : Association to many Comments
                            on comments.author = $self;
        attachments     : Association to many Attachments
                            on attachments.uploadedBy = $self;
}

entity Comments : cuid, managed {
    content   : LargeString;
    author    : Association to Users;
    createdAt : Timestamp;
    task      : Association to Tasks;
    subtask   : Association to Subtasks;
}

entity Attachments : cuid, managed {
    fileName    : String(255);
    @Core.MediaType: mediaType
    description : localized String(255);
    content     : LargeBinary;
    mediaType   : String;
    size        : Integer;
    task        : Association to Tasks;
    subtask     : Association to Subtasks;
    uploadedBy  : Association to Users;
}
