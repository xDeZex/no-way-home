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
    TransportMode: string
    LineNumber: string
    Destination: string
    JourneyDirection: number
    GroupOfLine: string
    StopAreaName: string
    StopAreaNumber: number
    StopPointNumber: number
    StopPointDesignation: string
    TimeTabledDateTime: Date
    ExpectedDateTime?: Date
    DisplayTime: string
    JourneyNumber: number
    Deviations: Array<{ Consequence: string; ImportanceLevel: number; Text: string }>
    SecondaryDestinationName: string
    PredictionState: string

    constructor(
        TransportMode: string,
        LineNumber: string,
        Destination: string,
        JourneyDirection: number,
        GroupOfLine: string,
        StopAreaName: string,
        StopAreaNumber: number,
        StopPointNumber: number,
        StopPointDesignation: string,
        TimeTabledDateTime: Date,
        ExpectedDateTime: Date,
        DisplayTime: string,
        JourneyNumber: number,
        Deviations: Array<{ Consequence: string; ImportanceLevel: number; Text: string }>,
        SecondaryDestinationName: string,
        PredictionState: string
    ) {
        this.TransportMode = TransportMode
        this.LineNumber = LineNumber
        this.Destination = Destination
        this.JourneyDirection = JourneyDirection
        this.GroupOfLine = GroupOfLine
        this.StopAreaName = StopAreaName
        this.StopAreaNumber = StopAreaNumber
        this.StopPointNumber = StopPointNumber
        this.StopPointDesignation = StopPointDesignation
        this.TimeTabledDateTime = TimeTabledDateTime
        this.ExpectedDateTime = ExpectedDateTime
        this.DisplayTime = DisplayTime
        this.JourneyNumber = JourneyNumber
        this.Deviations = Deviations
        this.SecondaryDestinationName = SecondaryDestinationName
        this.PredictionState = PredictionState
    }

    public Compare(dep: Departure): boolean{
        if (dep.JourneyNumber === this.JourneyNumber)
            return true
        return false
    }
}