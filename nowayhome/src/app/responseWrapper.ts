import { Observable } from "rxjs";

export interface ResponseWrapper{
    body: Observable<any> | null,
    error: string | null 
}