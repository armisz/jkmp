import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { AppComponent } from './app.component';
import { HttpClientJsonpModule, HttpClientModule } from '@angular/common/http';
import { KodiService } from './kodi/kodi.service';
import { ControlsComponent } from './controls/controls.component';
import { LibraryComponent } from './library/library.component';

@NgModule({
  declarations: [
    AppComponent,
    ControlsComponent,
    LibraryComponent
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    HttpClientJsonpModule
  ],
  providers: [
    KodiService,
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
