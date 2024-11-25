import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TopHeadlinesComponent } from './top-headlines.component';

describe('TopHeadlinesComponent', () => {
  let component: TopHeadlinesComponent;
  let fixture: ComponentFixture<TopHeadlinesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TopHeadlinesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TopHeadlinesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
