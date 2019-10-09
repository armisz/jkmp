# JK Music Player

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 7.1.2.

## Status

Reading data from the Kodi player (directories, songs, player status) works. Modifications (insert songs, play, stop, pause) fail.

Starting with Kodi 18 Leia, trying to call a modifying JSON-RPC method the following error will be returned: `Bad client permission.` [(JSON-RPC no longer accepts many of the commands via HTTP)](https://forum.kodi.tv/showthread.php?tid=324598). Changing these calls to use POST fails, too, due to [CORS problems](https://forum.kodi.tv/showthread.php?tid=239965).

## Kodi

* [Kodi - JSON-RPC API/v9](https://kodi.wiki/view/JSON-RPC_API/v9)

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Buildng serve


Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.

`ng build --prod --base-href .`

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).
