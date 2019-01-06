import {Injectable} from '@angular/core';
import {HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse} from '@angular/common/http';
import {Observable} from 'rxjs';
import {tap} from 'rxjs/operators';
import {KodiService} from './kodi.service';

@Injectable()
export class KodiInterceptor implements HttpInterceptor {

  constructor(private kodi: KodiService) {
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req)
      .pipe(tap(event => {
        if (event instanceof HttpResponse && event.body.error) {
          this.kodi.panic({
            error: event.body.error,
            request: req,
          });
        }
      }));
  }
}
