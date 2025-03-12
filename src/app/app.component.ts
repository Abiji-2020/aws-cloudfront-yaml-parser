import { Component } from '@angular/core';
import parse from './utils/parse';
@Component({
  selector: 'app-root',
 // template: '<button (click)="runParse()">Run Parse</button> <p>{{result}}</p>',
 standalone: false,
  styleUrls: ['./app.component.scss'],
  templateUrl: './app.component.html',
})
export class AppComponent {
  title = 'cfn-visual';
  result: any ;
  runParse(){
    console.log("Run parse function");
    this.result = parse('hello', 'serverless');
    console.log("Result value" ,this.result);
  }
}
