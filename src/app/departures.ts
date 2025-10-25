export class Departures {
    Message: string
    Buses: Array<Departure>
    Metros: Array<Departure>
    Trains: Array<Departure>
    Trams: Array<Departure>
    Ships: Array<Departure>

    constructor(message: string, buses: Array<Departure>, metros: Array<Departure>, trains: Array<Departure>, trams: Array<Departure>, ships: Array<Departure>) {

        this.Message = message
        this.Buses = buses
        this.Metros = metros
        this.Trains = trains
        this.Trams = trams
        this.Ships = ships
    }

    getDepartures(mode: string): Array<Departure>{
        let deps: Array<Departure> = new Array<Departure>
        switch (mode) {
            case "buses":
              deps = this.Buses
              break;
            case "trams":
              deps = this.Trams
              break;
            case "trains":
              deps = this.Trains
              break;
            case "metros":
              deps = this.Metros
              break;
            case "ships":
              deps = this.Ships
              break;
          
            default:
              break;
          }
          
        return deps
    }
    ToString(): string {
        return `${this.Message} | Buses: ${this.Buses.length}, Metros: ${this.Metros.length}, Trains: ${this.Trains.length}, Trams: ${this.Trams.length}, Ships: ${this.Ships.length}`
    }

    DisplayDepartures(mode: string): string{
        let deps: Array<Departure>
        switch (mode) {
            case "buses":
              deps = this.Buses
              break;
            case "trams":
              deps = this.Trams
              break;
            case "trains":
              deps = this.Trains
              break;
            case "metro":
              deps = this.Metros
              break;
            case "ships":
              deps = this.Ships
              break;
          
            default:
              break;
          }
        
        let retString: string

        return ""

    }

    hasDepartures(mode: string): boolean{
      switch (mode) {
        case "buses":
          return this.Buses.length > 0
          
        case "trams":
          return this.Trams.length > 0
          
        case "trains":
          return this.Trains.length > 0
          
        case "metro":
          return this.Metros.length > 0
          
        case "ships":
          return this.Ships.length > 0
          
        default:
          return false
      }
    }
}

export class Departure{
    direction: string
    direction_code: number
    via: string
    destination: string
    state: string
    schedule: string
    expected: string
    journey: {
        id: number
        state: string
        prediction_state: string
        passenger_level: number
    }
    stop_area: {
        id: number
        name: string
        designation: string
    }
    line: {
        id: number
        designation: string
        transport_mode: string
        group_of_lines: string
    }
    deviations: Deviation[]

    constructor(
        direction: string,
        direction_code: number,
        via: string,
        destination: string,
        state: string,
        schedule: string,
        expected: string,
        journey: {
            id: number
            state: string
            prediction_state: string
            passenger_level: number
        },
        stop_area: {
            id: number
            name: string
            designation: string
        },
        line: {
            id: number
            designation: string
            transport_mode: string
            group_of_lines: string
        },
        deviations: {
            importance_level: number
            consequence: string
            message: string
        }[]
    ) {
        this.direction = direction
        this.direction_code = direction_code
        this.via = via
        this.destination = destination
        this.state = state
        this.schedule = schedule
        this.expected = expected
        this.journey = journey
        this.stop_area = stop_area
        this.line = line
        this.deviations = deviations
    }

    public Compare(dep: Departure): boolean{
        if (dep.journey.id === this.journey.id)
            return true
        return false
    }

    public GetDepartureTime(): string{
        if (this.expected === "")
            return this.schedule
        return this.expected
    }
}

export class Deviation{
    importance_level: number
    consequence: string
    message: string
    constructor(importance_level: number, consequence: string, message: string){
        this.importance_level = importance_level
        this.consequence = consequence
        this.message = message
    }
}