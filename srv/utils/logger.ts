import cds from "@sap/cds";

export const log = cds.log("srv");

export function logError(errMsg: string) {
    return log.error(errMsg);
}

export function logInfo(infoMsg: string) {
    return log.info(infoMsg);
}