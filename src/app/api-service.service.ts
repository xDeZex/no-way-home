import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, ObservableInput, firstValueFrom, of, throwError } from 'rxjs';
import { catchError, retry, timeout } from 'rxjs/operators';
import { ResponseWrapper } from './responseWrapper';

@Injectable({
  providedIn: 'root'
})
export class ApiServiceService {

  private realkey = "cea6074a2f0248a3b466aae7a88af063"
  private namekey = "968f31ed688a44bcbb24bafd5fc5a40b"
  private URLStationReal = "http://api.sl.se/api2/realtimedeparturesv4.json?key=" + this.realkey
  private URLStationName = "https://api.sl.se/api2/typeahead.json?key=" + this.namekey


  httpOptions = {
    headers: new HttpHeaders({
    })
  };
  
  public error: string = ""


  constructor(
    private http: HttpClient,
  ) { }

  getStationName(station: string): ResponseWrapper{

    try {
      
      let ret = this.http.get<JSON>(`${this.URLStationName}&searchstring=${station}&stationsonly=true`, this.httpOptions).pipe(
        catchError(this.handleError.bind(this))
      );


      let retBody: ResponseWrapper = {body : ret, error : null}
      return retBody

    } catch (error: any) {
      this.error = error.message
      let retError: ResponseWrapper = {body : null, error : error.message}
      return retError
    }
  }

  getStationReal(station: string, time: string): ResponseWrapper {
    
    try {
      
      let ret = this.http.get<JSON>(`${this.URLStationReal}&siteid=${station}&timewindow=${time}`, this.httpOptions).pipe(
        catchError(this.handleError.bind(this))
      );
      let retBody: ResponseWrapper = {body : ret, error : null}
      return retBody

    } catch (error: any) {
      this.error = error.message
      let retError: ResponseWrapper = {body : null, error : error.message}
      return retError
    }
  }


  handleError(error: HttpErrorResponse, caught: Observable<JSON>) {
    console.log("ERROR")
    if (error.status === 0) {
      // A client-side or network error occurred. Handle it accordingly.
    } 
    else {
      // The backend returned an unsuccessful response code.
      // The response body may contain clues as to what went wrong.
      console.error(
        `Backend returned code ${error.status}, body was: `, error.error);
    }
    // Return an observable with a user-facing error message.
    return new Observable<JSON>()
  }
}
