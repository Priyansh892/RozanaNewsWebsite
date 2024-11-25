import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SharedNewsComponent } from './shared-news.component';

describe('SharenewsComponent', () => {
  let component: SharedNewsComponent;
  let fixture: ComponentFixture<SharedNewsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SharedNewsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SharedNewsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
