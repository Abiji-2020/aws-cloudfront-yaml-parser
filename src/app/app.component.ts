import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CytoscapeCanvaComponent } from './cytoscape-canva/cytoscape-canva.component';
import { EditorComponent } from './editor/editor.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CytoscapeCanvaComponent, EditorComponent],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'aws architecture diagram composer';
}