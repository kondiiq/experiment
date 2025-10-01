import cds from "@sap/cds";

export async function serviceWrapper(srvName: string) {
    return await cds.connect.to(srvName);
}

export function fieldsValidator(validatingField: string | number): boolean {
    return validatingField != null  && validatingField !== '';
}

export function startEnddateValidator(startDate: Date, endDate: Date): boolean {
    if(startDate && endDate) {
        return startDate < endDate;
    }
    if(startDate && !endDate) return true;
    return false;
}

export function dateValidator(date: Date){ 
    return date instanceof Date && !isNaN(date.getTime());
}