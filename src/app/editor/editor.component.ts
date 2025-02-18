import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { yamlParse, yamlDump } from 'yaml-cfn';
import { CommonModule, isPlatformBrowser
 } from '@angular/common';
import {ReactiveFormsModule, FormControl} from '@angular/forms';
import { MonacoEditorModule } from 'ngx-monaco-editor';

@Component({
  selector: 'app-editor',
  imports: [CommonModule,ReactiveFormsModule,MonacoEditorModule],
  templateUrl: './editor.component.html',
  styleUrl: './editor.component.css'
})
export class EditorComponent implements OnInit {
  private isBroswer:boolean
  editorOptions= {theme: 'vs-dark', language: 'json'};
  code = new FormControl('');
  currentLanguage: 'json' | 'yaml' = 'json';
  constructor(@Inject(PLATFORM_ID) private platformId:Object){
    this.isBroswer = isPlatformBrowser(this.platformId)
  }
  ngOnInit(): void {
  }
  toggleLanguage(){
    try{
      if(this.currentLanguage === 'json'){
        const json = JSON.parse(this.code.value??"{}");
        this.code.setValue(yamlDump(json));
        this.currentLanguage = 'yaml';
        this.editorOptions ={ ...this.editorOptions, language: 'yaml'};
      }else{
        const yamlContent = yamlParse(this.code.value??"");
        this.code.setValue( JSON.stringify(yamlContent, null, 2));
        this.currentLanguage = 'json';
        this.editorOptions = { ...this.editorOptions, language: 'json'};
      }
    }catch(error){
      console.error("Conversion Error: ", error);
    }
  }
}
