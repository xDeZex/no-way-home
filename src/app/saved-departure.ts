export interface SavedDeparture {
    line: string,
    fromText: string,
    toText: string,
    toTextTitle: string,
    mode: string[],
    deviations: {
        Consequence: string,
        ImportanceLevel: number,
        Text: string;
    }[],
    deviationsImportance: number,
    fromDate: Date,
    toDate: Date,
}
