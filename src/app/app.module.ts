import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MainComponent } from './main/main.component';
import { TravelComponent } from './travel/travel.component';

@NgModule({ declarations: [
        AppComponent,
        MainComponent,
        TravelComponent
    ],
    bootstrap: [AppComponent], imports: [BrowserModule,
        FormsModule,
        AppRoutingModule], providers: [provideHttpClient(withInterceptorsFromDi())] })
export class AppModule { }
