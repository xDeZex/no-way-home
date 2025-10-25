import { Deviation } from "./departures";

export interface SavedDeparture {
    line: string,
    fromText: string,
    toText: string,
    toTextTitle: string,
    mode: string[],
    deviations: Deviation[],
    deviationsImportance: number,
    fromDate: Date,
    toDate: Date,
}
