import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CytoscapeCanvaComponent } from './cytoscape-canva.component';

describe('CytoscapeCanvaComponent', () => {
  let component: CytoscapeCanvaComponent;
  let fixture: ComponentFixture<CytoscapeCanvaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CytoscapeCanvaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CytoscapeCanvaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
