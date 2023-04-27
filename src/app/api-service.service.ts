import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, ObservableInput, firstValueFrom, of, throwError } from 'rxjs';
import { catchError, retry, timeout } from 'rxjs/operators';
import { ResponseWrapper } from './responseWrapper';
import { Departures } from './departures';

@Injectable({
  providedIn: 'root'
})
export class ApiServiceService {

  private realkey = "cea6074a2f0248a3b466aae7a88af063"
  private namekey = "968f31ed688a44bcbb24bafd5fc5a40b"
  private URLStationReal = "https://api.sl.se/api2/realtimedeparturesv4.json?key=" + this.realkey
  private URLStationName = "https://api.sl.se/api2/typeahead.json?key=" + this.namekey


  httpOptions = {
    headers: new HttpHeaders({
    })
  };
  
  public error: string = ""


  constructor(
    private http: HttpClient,
  ) { }

  getStationName(station: string): Observable<JSON>{

      let ret = this.http.get<JSON>(`${this.URLStationName}&searchstring=${station}&stationsonly=true`, this.httpOptions).pipe(
        catchError(this.handleError.bind(this))
      );

      return ret

  }

  getStationReal(station: string, time: string): Observable<JSON>{

      
    
      let ret = this.http.get<JSON>(`${this.URLStationReal}&siteid=${station}&timewindow=${time}`, this.httpOptions).pipe(
        catchError(this.handleError.bind(this))
      )
      return ret
  }


  handleError(error: HttpErrorResponse, caught: Observable<JSON>) {
    // Return an observable with a user-facing error message.
    let message = error.message
    if(message.includes("0 Unknown Error")){
      message = "You probably need to enable CORS with an extension"
    }

    return of(({error: message} as any as JSON))
  }
}
