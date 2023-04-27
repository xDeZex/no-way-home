import { Departure, Departures } from "./departures";
import { SavedDeparture } from "./saved-departure";
import { Station } from "./station";

export interface StationPair{
    one: Station,
    two: Station,
    savedDepartures: SavedDeparture[],
    chosen?: number
}