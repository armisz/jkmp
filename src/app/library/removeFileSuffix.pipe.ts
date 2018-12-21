import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'removeFileSuffix'
})
export class RemoveFileSuffixPipe implements PipeTransform {

  transform(label: string) {
    return label.replace(/\.[^/.]+$/, '');
  }
}
