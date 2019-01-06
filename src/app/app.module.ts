import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';
import {AppComponent} from './app.component';
import {HTTP_INTERCEPTORS, HttpClientJsonpModule, HttpClientModule} from '@angular/common/http';
import {KodiService} from './kodi/kodi.service';
import {ControlsComponent} from './controls/controls.component';
import {LibraryComponent} from './library/library.component';
import {RemoveFileSuffixPipe} from './library/removeFileSuffix.pipe';
import {MaterialModule} from './material-module';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {KodiInterceptor} from './kodi/kodi.interceptor';

// https://stackoverflow.com/questions/47573655/how-to-intercept-angular-jsonp-requests-using-httpclient
@NgModule({
  providers: [
    {provide: HTTP_INTERCEPTORS, useClass: KodiInterceptor, multi: true}
  ]
})
export class JsonpInterceptingModule {
}

@NgModule({
  declarations: [
    AppComponent,
    ControlsComponent,
    LibraryComponent,
    RemoveFileSuffixPipe
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    JsonpInterceptingModule, // Must be before the HttpClientJsonpModule
    HttpClientModule,
    HttpClientJsonpModule,
    MaterialModule,
  ],
  providers: [
    KodiService, {provide: HTTP_INTERCEPTORS, useClass: KodiInterceptor, multi: true}
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
