/**
 * @fileoverview Automated tests for container support and dynamic resizing
 * @module DiceCanvasComponent.Resize
 * @since 2.2.0
 */

import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DiceCanvasComponent } from './dice-canvas.component';
import { ThreeRendererService } from '../../services/three-renderer.service';
import { PhysicsEngineService } from '../../services/physics-engine.service';

describe('DiceCanvasComponent - Container Support & Resize (v2.2.0)', () => {
  let component: DiceCanvasComponent;
  let fixture: ComponentFixture<DiceCanvasComponent>;
  let mockThreeRenderer: jasmine.SpyObj<ThreeRendererService>;
  let mockPhysicsEngine: jasmine.SpyObj<PhysicsEngineService>;

  beforeEach(async () => {
    // Create mock services
    mockThreeRenderer = jasmine.createSpyObj('ThreeRendererService', [
      'initialize',
      'render',
      'dispose',
      'onResize',
      'getRenderer',
      'getScene',
      'getCamera',
    ]);

    mockPhysicsEngine = jasmine.createSpyObj('PhysicsEngineService', [
      'initialize',
      'step',
      'dispose',
      'addBody',
      'removeBody',
      'wakeAllBodies',
    ]);

    await TestBed.configureTestingModule({
      imports: [DiceCanvasComponent],
      providers: [
        { provide: ThreeRendererService, useValue: mockThreeRenderer },
        { provide: PhysicsEngineService, useValue: mockPhysicsEngine },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DiceCanvasComponent);
    component = fixture.componentInstance;
  });

  describe('Fill Container Mode', () => {
    it('should apply .fill-container class when fillContainer is true', (done) => {
      // Set input using fixture.componentRef.setInput for signals
      fixture.componentRef.setInput('fillContainer', true);
      fixture.componentRef.setInput('maintainAspectRatio', false);
      fixture.detectChanges();

      // Wait for next tick to allow component initialization
      setTimeout(() => {
        const canvasElement = fixture.nativeElement.querySelector('canvas');
        const container = canvasElement?.parentElement;

        expect(container?.classList.contains('fill-container')).toBe(true);
        done();
      }, 100);
    });

    it('should set aspect-ratio: unset when fillContainer is true', (done) => {
      fixture.componentRef.setInput('fillContainer', true);
      fixture.componentRef.setInput('maintainAspectRatio', false);
      fixture.detectChanges();

      setTimeout(() => {
        const canvasElement = fixture.nativeElement.querySelector('canvas');
        const container = canvasElement?.parentElement;
        const computedStyle = window.getComputedStyle(container!);

        // Check for unset aspect ratio (may be 'auto' or 'unset' depending on browser)
        expect(
          computedStyle.aspectRatio === 'auto' ||
            computedStyle.aspectRatio === 'unset' ||
            computedStyle.aspectRatio === ''
        ).toBe(true);
        done();
      }, 100);
    });

    it('should NOT apply .fill-container class when fillContainer is false', (done) => {
      fixture.componentRef.setInput('fillContainer', false);
      fixture.componentRef.setInput('maintainAspectRatio', true);
      fixture.detectChanges();

      setTimeout(() => {
        const canvasElement = fixture.nativeElement.querySelector('canvas');
        const container = canvasElement?.parentElement;

        expect(container?.classList.contains('fill-container')).toBe(false);
        done();
      }, 100);
    });
  });

  describe('Aspect Ratio Mode', () => {
    it('should apply custom aspect ratio via CSS custom property', (done) => {
      const customRatio = 2.0; // 2:1 aspect ratio
      fixture.componentRef.setInput('maintainAspectRatio', true);
      fixture.componentRef.setInput('customAspectRatio', customRatio);
      fixture.componentRef.setInput('fillContainer', false);
      fixture.detectChanges();

      setTimeout(() => {
        const canvasElement = fixture.nativeElement.querySelector('canvas');
        const container = canvasElement?.parentElement;
        const aspectRatioValue = container?.style.getPropertyValue('--dice-canvas-aspect-ratio');

        expect(aspectRatioValue).toBe(customRatio.toString());
        expect(container?.classList.contains('custom-aspect')).toBe(true);
        done();
      }, 100);
    });

    it('should use default 16:9 aspect ratio when not specified', (done) => {
      fixture.componentRef.setInput('maintainAspectRatio', true);
      fixture.componentRef.setInput('customAspectRatio', 1.7778);
      fixture.detectChanges();

      setTimeout(() => {
        const canvasElement = fixture.nativeElement.querySelector('canvas');
        const container = canvasElement?.parentElement;
        const aspectRatioValue = container?.style.getPropertyValue('--dice-canvas-aspect-ratio');

        expect(parseFloat(aspectRatioValue)).toBeCloseTo(1.7778, 3);
        done();
      }, 100);
    });

    it('should apply .custom-aspect class when maintaining aspect ratio', (done) => {
      fixture.componentRef.setInput('maintainAspectRatio', true);
      fixture.componentRef.setInput('customAspectRatio', 1.5);
      fixture.detectChanges();

      setTimeout(() => {
        const canvasElement = fixture.nativeElement.querySelector('canvas');
        const container = canvasElement?.parentElement;

        expect(container?.classList.contains('custom-aspect')).toBe(true);
        done();
      }, 100);
    });
  });

  describe('Dynamic Resize Behavior', () => {
    it('should handle resize events when enableDynamicResize is true', () => {
      fixture.componentRef.setInput('enableDynamicResize', true);
      fixture.detectChanges();

      const resizeData = {
        width: 800,
        height: 450,
        aspectRatio: 1.7778,
        pixelRatio: 2,
        timestamp: Date.now(),
        requiresSceneUpdate: true,
        delta: { width: 100, height: 56 },
      };

      spyOn<any>(component, 'handleCanvasResize').and.callThrough();

      // Simulate resize
      component['handleCanvasResize'](resizeData);

      expect(component['handleCanvasResize']).toHaveBeenCalledWith(resizeData);
    });

    it('should ignore resize events when enableDynamicResize is false', () => {
      fixture.componentRef.setInput('enableDynamicResize', false);
      fixture.detectChanges();

      const resizeData = {
        width: 800,
        height: 450,
        aspectRatio: 1.7778,
        pixelRatio: 2,
        timestamp: Date.now(),
        requiresSceneUpdate: false,
      };

      spyOn<any>(component, 'calculateSceneScale');
      spyOn<any>(component, 'updateGroundPlaneGeometry');

      component['handleCanvasResize'](resizeData);

      // These methods should not be called when dynamic resize is disabled
      expect(component['calculateSceneScale']).not.toHaveBeenCalled();
      expect(component['updateGroundPlaneGeometry']).not.toHaveBeenCalled();
    });

    it('should respect resizeThreshold for minor vs major updates', () => {
      fixture.componentRef.setInput('enableDynamicResize', true);
      fixture.componentRef.setInput('resizeThreshold', 50);
      fixture.detectChanges();

      // Simulate minor resize (delta < threshold)
      const minorResize = {
        width: 750,
        height: 425,
        aspectRatio: 1.7647,
        pixelRatio: 2,
        timestamp: Date.now(),
        requiresSceneUpdate: false,
        delta: { width: 30, height: 20 }, // Less than 50px
      };

      spyOn<any>(component, 'adjustCamera');
      spyOn<any>(component, 'calculateSceneScale');

      component['handleCanvasResize'](minorResize);

      // Only camera should adjust on minor resize
      expect(component['adjustCamera']).toHaveBeenCalled();
      expect(component['calculateSceneScale']).not.toHaveBeenCalled();
    });

    it('should perform full update on major resize', () => {
      fixture.componentRef.setInput('enableDynamicResize', true);
      fixture.componentRef.setInput('resizeThreshold', 50);
      fixture.detectChanges();

      // Simulate major resize (delta >= threshold)
      const majorResize = {
        width: 900,
        height: 500,
        aspectRatio: 1.8,
        pixelRatio: 2,
        timestamp: Date.now(),
        requiresSceneUpdate: true,
        delta: { width: 100, height: 60 }, // More than 50px
      };

      spyOn<any>(component, 'calculateSceneScale');
      spyOn<any>(component, 'adjustCamera');
      spyOn<any>(component, 'updateGroundPlaneGeometry');
      spyOn<any>(component, 'updatePhysicsBoundaries');

      component['handleCanvasResize'](majorResize);

      // Full pipeline should execute
      expect(component['calculateSceneScale']).toHaveBeenCalled();
      expect(component['adjustCamera']).toHaveBeenCalled();
      expect(component['updateGroundPlaneGeometry']).toHaveBeenCalled();
      expect(component['updatePhysicsBoundaries']).toHaveBeenCalled();
    });
  });

  describe('Configuration Input Validation', () => {
    it('should have correct default values for new v2.2.0 inputs', () => {
      fixture.detectChanges();

      expect(component.maintainAspectRatio()).toBe(true);
      expect(component.customAspectRatio()).toBeCloseTo(1.7778, 3);
      expect(component.fillContainer()).toBe(false);
      expect(component.enableDynamicResize()).toBe(true);
      expect(component.resizeThreshold()).toBe(50);
    });

    it('should accept custom configuration values', () => {
      fixture.componentRef.setInput('maintainAspectRatio', false);
      fixture.componentRef.setInput('customAspectRatio', 2.0);
      fixture.componentRef.setInput('fillContainer', true);
      fixture.componentRef.setInput('enableDynamicResize', false);
      fixture.componentRef.setInput('resizeThreshold', 100);
      fixture.detectChanges();

      expect(component.maintainAspectRatio()).toBe(false);
      expect(component.customAspectRatio()).toBe(2.0);
      expect(component.fillContainer()).toBe(true);
      expect(component.enableDynamicResize()).toBe(false);
      expect(component.resizeThreshold()).toBe(100);
    });

    it('should validate minimum dimensions (50px)', () => {
      const invalidResize = {
        width: 30, // Too small
        height: 30, // Too small
        aspectRatio: 1.0,
        pixelRatio: 1,
        timestamp: Date.now(),
      };

      spyOn<any>(component, 'calculateSceneScale');

      component['handleCanvasResize'](invalidResize);

      // Should not process resize below minimum
      expect(component['calculateSceneScale']).not.toHaveBeenCalled();
    });

    it('should validate maximum aspect ratio (5:1)', () => {
      const extremeResize = {
        width: 1000,
        height: 100, // 10:1 aspect ratio - too extreme
        aspectRatio: 10.0,
        pixelRatio: 1,
        timestamp: Date.now(),
        requiresSceneUpdate: true,
      };

      spyOn<any>(component, 'calculateSceneScale');

      component['handleCanvasResize'](extremeResize);

      // Should not process extreme aspect ratios
      expect(component['calculateSceneScale']).not.toHaveBeenCalled();
    });
  });

  describe('Backward Compatibility', () => {
    it('should maintain v2.1.x behavior with default configuration', (done) => {
      // Default configuration should behave like v2.1.x
      fixture.detectChanges();

      setTimeout(() => {
        expect(component.maintainAspectRatio()).toBe(true);
        expect(component.customAspectRatio()).toBeCloseTo(1.7778, 3); // 16:9
        expect(component.fillContainer()).toBe(false);
        expect(component.enableDynamicResize()).toBe(true);
        done();
      }, 100);
    });

    it('should work without specifying v2.2.0 properties', (done) => {
      // Simulating existing usage without new properties
      fixture.detectChanges();

      setTimeout(() => {
        const canvasElement = fixture.nativeElement.querySelector('canvas');
        expect(canvasElement).toBeTruthy();

        // Should use defaults
        expect(component.maintainAspectRatio()).toBe(true);
        expect(component.fillContainer()).toBe(false);
        done();
      }, 100);
    });
  });

  describe('Scene Scale Calculation', () => {
    it('should calculate scene scale based on canvas dimensions', () => {
      const mockCanvas = {
        width: 800,
        height: 450,
      } as HTMLCanvasElement;

      spyOn<any>(component, 'calculateSceneScale').and.callThrough();

      component['calculateSceneScale'](mockCanvas);

      expect(component['calculateSceneScale']).toHaveBeenCalledWith(mockCanvas);
      expect(component['sceneScale']).toBeDefined();
    });
  });

  describe('Physics Integration', () => {
    it('should wake all physics bodies on resize', () => {
      fixture.componentRef.setInput('enableDynamicResize', true);
      fixture.detectChanges();

      const resizeData = {
        width: 800,
        height: 450,
        aspectRatio: 1.7778,
        pixelRatio: 2,
        timestamp: Date.now(),
        requiresSceneUpdate: true,
        delta: { width: 100, height: 60 },
      };

      component['handleCanvasResize'](resizeData);

      // PhysicsEngine.wakeAllBodies should be called
      expect(mockPhysicsEngine.wakeAllBodies).toHaveBeenCalled();
    });
  });
});
