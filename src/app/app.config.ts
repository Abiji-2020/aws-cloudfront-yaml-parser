import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideMonacoEditor } from 'ngx-monaco-editor-v2';

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter([]),
    provideMonacoEditor({
      baseUrl: 'assets/monaco', // Ensure Monaco assets exist here
    }),
  ],
};
