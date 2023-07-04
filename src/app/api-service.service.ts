import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, ObservableInput, firstValueFrom, of, throwError } from 'rxjs';
import { catchError, retry, timeout } from 'rxjs/operators';
import { ResponseWrapper } from './responseWrapper';
import { Departures } from './departures';
import { isDevMode } from '@angular/core';

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

  httpOptions = {
    headers: new HttpHeaders({
    })
  };
  
  public error: string = ""


  constructor(
    private http: HttpClient,
  ) { }

  getStationName(station: string): Observable<JSON>{

    if(this.hasCORS){
      let ret = this.http.get<JSON>(`${this.URLStationName}&searchstring=${station}&stationsonly=true`, this.httpOptions).pipe(
        catchError(this.handleError.bind(this))
      );
  
      return ret
    }

    let ret = this.http.get<JSON>(`${this.URLStationNameSafe}&station=${station}`, this.httpOptions).pipe(
      catchError(this.handleError.bind(this))
    );

    return ret

  }

  getStationReal(station: string, time: string): Observable<JSON>{

    if(this.hasCORS){
      let ret = this.http.get<JSON>(`${this.URLStationReal}&siteid=${station}&timewindow=${time}`, this.httpOptions).pipe(
        catchError(this.handleError.bind(this))
      )
      return ret
    }
      
    let ret = this.http.get<JSON>(`${this.URLStationRealSafe}&siteid=${station}&timewindow=${time}`, this.httpOptions).pipe(
      catchError(this.handleError.bind(this))
    )
    return ret
    
      
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
