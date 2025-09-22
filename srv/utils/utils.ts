import cds from "@sap/cds";

export async function serviceWrapper(srvName: string) {
    return await cds.connect.to(srvName);
}

export function fieldsValidator(validatingField: string | number): boolean {
    return validatingField != null  && validatingField !== '';
}