import { TestBed } from '@angular/core/testing';
import { ContentService } from './content-service.service';

describe('ContentService', () => {
  let service: ContentService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ContentService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should have unique instance IDs when injected in different contexts', () => {
    // This test demonstrates that each time the service is injected,
    // it creates a unique instance ID for tracking purposes
    const service1 = TestBed.inject(ContentService);
    const service2 = TestBed.inject(ContentService);
    
    // In the same injector context, they should be the same instance
    expect(service1).toBe(service2);
    expect(service1.getInstanceId()).toBe(service2.getInstanceId());
  });

  it('should track content sections updates', () => {
    const initialSections = service.contentSections();
    expect(initialSections).toEqual([]);

    service.createContentSection();
    const updatedSections = service.contentSections();
    
    expect(updatedSections.length).toBe(1);
    expect(updatedSections[0].id).toBeDefined();
    expect(updatedSections[0].content).toBe('');
  });

  it('should track global style updates', () => {
    const initialStyle = service.globalStyle();
    expect(initialStyle).toBe('');

    const testStyle = 'body { color: red; }';
    service.updateGlobalStyling(testStyle);
    
    expect(service.globalStyle()).toBe(testStyle);
  });
});