import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, ObservableInput, firstValueFrom, of, throwError } from 'rxjs';
import { catchError, retry, timeout } from 'rxjs/operators';
import { ResponseWrapper } from './responseWrapper';
import { Departure, Departures } from './departures';
import { isDevMode } from '@angular/core';
import { Station } from './station';

@Injectable({
  providedIn: 'root'
})

export class ApiServiceService {

  public hasCORS = false

  private realkey = ""
  private namekey = ""
  private URLStationReal = "https://api.sl.se/api2/realtimedeparturesv4.json?key=" + this.realkey
  private URLStationName = "https://api.sl.se/api2/typeahead.json?key=" + this.namekey

  private URLStationRealSafe = "https://xdezex.duckdns.org:7001/stationreal?key=" + this.realkey
  private URLStationNameSafe = "https://xdezex.duckdns.org:7001/stationname?key=" + this.namekey

  private URLSites = "https://transport.integration.sl.se/v1/sites?expand=false"


  private stations: Station[] = []

  httpOptions = {
    headers: new HttpHeaders({
    })
  };
  
  public error: string = ""


  constructor(
    private http: HttpClient,
  ) { 
    this.getStations();
  }

  getStations(): void{
    let ret = this.http.get<JSON>(`${this.URLSites}`, this.httpOptions).pipe(
      catchError(this.handleError.bind(this))
    );

    ret.subscribe((stations: any) => {
      stations.forEach((stations: any) => {
        this.stations.push({name: stations["name"], siteID: stations["id"], dep: null})
      })
    })
  }

  getStationName(station: string): Station[]{
    let found = this.stations.filter((s: Station) => s.name.toLowerCase().includes(station.toLowerCase()))

    return found
  }

  async getStationDepartures(station: string): Promise<Departures>{


    let ret = this.http.get<JSON>(`https://transport.integration.sl.se/v1/sites/${station}/departures`, this.httpOptions).pipe(
      catchError(this.handleError.bind(this))
    )
    let returnDepartures = new Departures("", [], [], [], [], [])

    try {
        const departures: any = await firstValueFrom(ret)
        departures["departures"].forEach((dep: any) => {
            const departure = new Departure(
                dep.direction,
                dep.direction_code,
                dep.via,
                dep.destination,
                dep.state,
                dep.scheduled,
                dep.expected,
                dep.journey,
                dep.stop_area,
                dep.line,
                dep.deviations || []
            )

            switch (departure.line.transport_mode) {
                case "BUS":
                    returnDepartures.Buses.push(departure)
                    break;
                case "TRAM":
                    returnDepartures.Trams.push(departure)
                    break;
                case "TRAIN":
                    returnDepartures.Trains.push(departure)
                    break;
                case "METRO":
                    returnDepartures.Metros.push(departure)
                    break;
                case "SHIP":
                    returnDepartures.Ships.push(departure)
                    break;
                default:
                    break;
            }
      })
    } catch (error) {
      console.error(error)
    }

    return returnDepartures
  }


  handleError(error: HttpErrorResponse, caught: Observable<JSON>) {
    // Return an observable with a user-facing error message.
    let message = error.message
    if(message.includes("0 Unknown Error")){
      message = "There was an error"
    }

    return of(({error: message} as any as JSON))
  }
}
