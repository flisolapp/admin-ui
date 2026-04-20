import { inject, Pipe, PipeTransform } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

@Pipe({
  name: 'authImage',
})
export class AuthImagePipe implements PipeTransform {
  private readonly http = inject(HttpClient);
  private readonly sanitizer = inject(DomSanitizer);

  transform(url: string | null | undefined): Observable<SafeUrl> {
    if (!url) {
      return of('');
    }

    return this.http
      .get(url, { responseType: 'blob' })
      .pipe(map((blob) => this.sanitizer.bypassSecurityTrustUrl(URL.createObjectURL(blob))));
  }
}
