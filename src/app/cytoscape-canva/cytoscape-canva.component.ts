import { isPlatformBrowser } from '@angular/common';
import { Component, OnInit, ElementRef, ViewChild, Inject, PLATFORM_ID } from '@angular/core';
import cytoscape from 'cytoscape';

@Component({
  selector: 'app-cytoscape-canva',
  imports: [],
  templateUrl: './cytoscape-canva.component.html',
  styleUrl: './cytoscape-canva.component.css'
})
export class CytoscapeCanvaComponent implements OnInit{
  @ViewChild('cy') cyElement!: ElementRef;
  private isBroswer:boolean

  constructor(@Inject(PLATFORM_ID) private platformId:Object){
    this.isBroswer = isPlatformBrowser(this.platformId)
  } 

  ngOnInit(): void {
  }

  ngAfterViewInit(){
    if(!this.isBroswer){
      return
    }
    const cy = cytoscape({
      container: this.cyElement.nativeElement,
      elements: [
        { data: { id: 'a' } },
        { data: { id: 'b' } },
        {data: { id: 'c' } },
        {
          data: {
            id: 'wow',
            source: 'a',
            target: 'b'
          }
        },
        {
          data: {
            id: 'whoa',
            source: 'a',
            target: 'c'
          }
        }
      ],
      style: [
        {
          selector: 'node',
          style: {
            'background-color': '#666',
            'label': 'data(id)'
          }
        }
        ,
        {
          selector: 'edge',
          style: {
            'width': 3,
            'line-color': '#ccc',
            'target-arrow-color': '#ccc',
            'target-arrow-shape': 'triangle'
          }
        }
      ],
      layout: {
        name: 'grid'
      }
    });
  }
}
