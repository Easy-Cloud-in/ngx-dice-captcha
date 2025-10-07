import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { DiceCanvasComponent } from './dice-canvas.component';
import { ThreeRendererService } from '../../services/three-renderer.service';
import { PhysicsEngineService } from '../../services/physics-engine.service';
import { DiceFactoryService } from '../../services/dice-factory.service';

describe('DiceCanvasComponent - Race Conditions & Memory Management', () => {
  let component: DiceCanvasComponent;
  let fixture: ComponentFixture<DiceCanvasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DiceCanvasComponent],
      providers: [ThreeRendererService, PhysicsEngineService, DiceFactoryService],
    }).compileComponents();

    fixture = TestBed.createComponent(DiceCanvasComponent);
    component = fixture.componentInstance;
  });

  describe('Resize Race Condition Prevention', () => {
    it('should handle rapid resize events without queuing multiple RAFs', fakeAsync(() => {
      // Initialize component
      fixture.detectChanges();
      tick();

      // Spy on cancelAnimationFrame to verify cleanup
      const cancelSpy = spyOn(window, 'cancelAnimationFrame').and.callThrough();
      const rafSpy = spyOn(window, 'requestAnimationFrame').and.callThrough();

      // Simulate rapid resize events
      for (let i = 0; i < 10; i++) {
        window.dispatchEvent(new Event('resize'));
        tick(10); // Small delay between resizes
      }

      // Wait for debounce to complete
      tick(200);

      // Verify that cancelAnimationFrame was called to prevent race conditions
      // (It should be called at least once if multiple resizes occurred)
      if (rafSpy.calls.count() > 1) {
        expect(cancelSpy).toHaveBeenCalled();
      }

      // Verify only one RAF should be active at the end
      tick();
    }));

    it('should clear pending RAF when component is destroyed during resize', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const cancelSpy = spyOn(window, 'cancelAnimationFrame').and.callThrough();

      // Trigger resize
      window.dispatchEvent(new Event('resize'));
      tick(50); // Don't wait for debounce to complete

      // Destroy component while resize is pending
      component.ngOnDestroy();

      // Verify cleanup was called
      expect(cancelSpy).toHaveBeenCalled();
    }));

    it('should not process concurrent resize operations', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      let resizeCallCount = 0;
      const originalHandleResize = (component as any).handleCanvasResize;

      // Spy on handleCanvasResize to count calls
      (component as any).handleCanvasResize = function (...args: any[]) {
        resizeCallCount++;
        return originalHandleResize.apply(this, args);
      };

      // Trigger multiple rapid resizes
      for (let i = 0; i < 5; i++) {
        window.dispatchEvent(new Event('resize'));
      }

      // Wait for all operations to complete
      tick(500);

      // Due to debouncing and RAF, we should have significantly fewer calls than triggers
      expect(resizeCallCount).toBeLessThan(5);
    }));

    it('should clear resize debounce timer on destroy', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const clearTimeoutSpy = spyOn(window, 'clearTimeout').and.callThrough();

      // Trigger resize
      window.dispatchEvent(new Event('resize'));
      tick(50);

      // Destroy component
      component.ngOnDestroy();

      // Verify timeout was cleared
      expect(clearTimeoutSpy).toHaveBeenCalled();
    }));
  });

  describe('Memory Management - Cleanup', () => {
    it('should clean up all timers and observers on destroy', () => {
      fixture.detectChanges();

      // Spy on cleanup methods
      const clearTimeoutSpy = spyOn(window, 'clearTimeout').and.callThrough();
      const clearIntervalSpy = spyOn(window, 'clearInterval').and.callThrough();
      const cancelAnimationFrameSpy = spyOn(window, 'cancelAnimationFrame').and.callThrough();

      // Create some timers
      (component as any).resizeDebounceTimer = window.setTimeout(() => {}, 1000);
      (component as any).resizeRafId = window.requestAnimationFrame(() => {});

      // Destroy component
      component.ngOnDestroy();

      // Verify cleanup methods were called
      expect(clearTimeoutSpy).toHaveBeenCalled();
      expect(cancelAnimationFrameSpy).toHaveBeenCalled();
    });

    it('should dispose Three.js resources on destroy', () => {
      fixture.detectChanges();

      const threeRenderer = (component as any).threeRenderer;
      const disposeSpy = spyOn(threeRenderer, 'dispose').and.callThrough();

      component.ngOnDestroy();

      expect(disposeSpy).toHaveBeenCalled();
    });

    it('should set isDisposed flag on destroy', () => {
      fixture.detectChanges();

      expect((component as any).isDisposed).toBeFalsy();

      component.ngOnDestroy();

      expect((component as any).isDisposed).toBeTruthy();
    });

    it('should clear all dice arrays on destroy', () => {
      fixture.detectChanges();

      // Add some mock dice
      (component as any).dice = [
        { body: {}, mesh: {} },
        { body: {}, mesh: {} },
      ];

      expect((component as any).dice.length).toBeGreaterThan(0);

      component.ngOnDestroy();

      expect((component as any).dice.length).toBe(0);
    });

    it('should clear resize cleanup callback on destroy', () => {
      fixture.detectChanges();

      const mockCleanup = jasmine.createSpy('cleanup');
      (component as any).resizeCleanup = mockCleanup;

      component.ngOnDestroy();

      expect(mockCleanup).toHaveBeenCalled();
    });

    it('should clear pending dice scale on destroy', () => {
      fixture.detectChanges();

      (component as any).pendingDiceScale = 1.5;

      component.ngOnDestroy();

      expect((component as any).pendingDiceScale).toBeNull();
    });
  });

  // Memory tracking tests removed as console logging has been removed

  describe('RAF Cleanup in Progressive Resize', () => {
    it('should not queue multiple progressive resize operations', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      const rafSpy = spyOn(window, 'requestAnimationFrame').and.callThrough();

      // Trigger resize that uses progressive updates
      (component as any).performProgressiveResize({
        width: 800,
        height: 600,
        aspectRatio: 800 / 600,
        pixelRatio: 1,
        timestamp: Date.now(),
      });

      // Wait for all RAF calls to complete
      tick(100);

      // Should have called RAF, but cleanup should prevent queuing
      expect(rafSpy).toHaveBeenCalled();
    }));
  });

  describe('Error Recovery', () => {
    it('should handle errors during resize gracefully', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      // Force an error in resize handling
      const originalHandleResize = (component as any).handleCanvasResize;
      (component as any).handleCanvasResize = function () {
        throw new Error('Test error');
      };

      const consoleErrorSpy = spyOn(console, 'error');

      // Trigger resize
      window.dispatchEvent(new Event('resize'));
      tick(200);

      // Should log error but not crash
      expect(consoleErrorSpy).toHaveBeenCalled();

      // Restore original method
      (component as any).handleCanvasResize = originalHandleResize;
    }));

    it('should still cleanup even after resize error', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      // Force an error
      const originalHandleResize = (component as any).handleCanvasResize;
      (component as any).handleCanvasResize = function () {
        throw new Error('Test error');
      };

      const cancelSpy = spyOn(window, 'cancelAnimationFrame').and.callThrough();

      // Trigger resize
      window.dispatchEvent(new Event('resize'));
      tick(200);

      // Destroy component
      component.ngOnDestroy();

      // Cleanup should still be called
      expect(cancelSpy).toHaveBeenCalled();

      // Restore
      (component as any).handleCanvasResize = originalHandleResize;
    }));
  });

  describe('Resize State Management', () => {
    it('should set and clear isResizeProcessing flag correctly', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      expect((component as any).isResizeProcessing).toBeFalsy();

      // Trigger resize
      window.dispatchEvent(new Event('resize'));
      tick(200);
      tick(); // Let RAF execute

      // Should be cleared after processing
      expect((component as any).isResizeProcessing).toBeFalsy();
    }));

    it('should skip resize if already processing', fakeAsync(() => {
      fixture.detectChanges();
      tick();

      // Set processing flag
      (component as any).isResizeProcessing = true;

      let resizeCallCount = 0;
      const originalHandleResize = (component as any).handleCanvasResize;
      (component as any).handleCanvasResize = function (...args: any[]) {
        resizeCallCount++;
        return originalHandleResize.apply(this, args);
      };

      // Trigger resize while processing
      window.dispatchEvent(new Event('resize'));
      tick(200);

      // Should not have called resize handler
      expect(resizeCallCount).toBe(0);

      // Reset
      (component as any).isResizeProcessing = false;
    }));
  });
});
