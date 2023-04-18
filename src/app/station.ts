import { Departures } from "./departures"

export interface Station{
    name: string
    siteID: string
    
    dep: Departures | null,
}