import { Injectable, NgZone, inject, OnDestroy } from '@angular/core';
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { Dice } from './dice-factory.service';

/**
 * Animation callback function type
 */
export type AnimationCallback = () => void;

/**
 * Animation easing functions
 */
export enum EasingFunction {
  LINEAR = 'LINEAR',
  EASE_IN = 'EASE_IN',
  EASE_OUT = 'EASE_OUT',
  EASE_IN_OUT = 'EASE_IN_OUT',
  BOUNCE = 'BOUNCE',
}

/**
 * Camera animation configuration
 */
export interface CameraAnimation {
  targetPosition: THREE.Vector3;
  targetLookAt: THREE.Vector3;
  duration: number;
  easing?: EasingFunction;
  onComplete?: AnimationCallback;
}

/**
 * Dice roll animation configuration
 */
export interface DiceRollAnimation {
  dice: Dice;
  force: CANNON.Vec3;
  torque: CANNON.Vec3;
  duration: number;
  onComplete?: AnimationCallback;
}

/**
 * Service responsible for managing animations including dice rolls and camera movements.
 * Provides smooth transitions and animation callbacks.
 */
@Injectable({
  providedIn: 'root',
})
export class AnimationService implements OnDestroy {
  private readonly ngZone = inject(NgZone);

  private activeAnimations: Map<string, AnimationState> = new Map();
  private animationIdCounter = 0;
  private activeTimers = new Set<number>();

  /**
   * Animate camera movement
   * @param camera - Camera to animate
   * @param animation - Animation configuration
   * @returns Animation ID for cancellation
   */
  animateCamera(camera: THREE.PerspectiveCamera, animation: CameraAnimation): string {
    const animationId = this.generateAnimationId();
    const startPosition = camera.position.clone();
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / animation.duration, 1);
      const easedProgress = this.applyEasing(
        progress,
        animation.easing || EasingFunction.EASE_IN_OUT
      );

      // Interpolate position
      camera.position.lerpVectors(startPosition, animation.targetPosition, easedProgress);

      // Update look-at target
      camera.lookAt(animation.targetLookAt);

      if (progress < 1) {
        this.activeAnimations.set(animationId, {
          id: animationId,
          type: 'camera',
          progress,
          onComplete: animation.onComplete,
        });
      } else {
        this.completeAnimation(animationId);
      }
    };

    this.ngZone.runOutsideAngular(() => {
      this.activeAnimations.set(animationId, {
        id: animationId,
        type: 'camera',
        progress: 0,
        animate,
        onComplete: animation.onComplete,
      });
    });

    return animationId;
  }

  /**
   * Animate dice roll with physics
   * @param animation - Dice roll animation configuration
   * @returns Animation ID for tracking
   */
  animateDiceRoll(animation: DiceRollAnimation): string {
    const animationId = this.generateAnimationId();
    const startTime = Date.now();

    // Apply initial force and torque
    animation.dice.body.applyForce(animation.force, animation.dice.body.position);
    animation.dice.body.applyTorque(animation.torque);

    this.activeAnimations.set(animationId, {
      id: animationId,
      type: 'dice-roll',
      progress: 0,
      startTime,
      duration: animation.duration,
      onComplete: animation.onComplete,
      data: animation.dice,
    });

    // Set timeout to complete animation and track it
    const timerId = setTimeout(() => {
      this.activeTimers.delete(timerId);
      this.completeAnimation(animationId);
    }, animation.duration) as unknown as number;
    this.activeTimers.add(timerId);

    return animationId;
  }

  /**
   * Animate multiple dice rolling simultaneously
   * @param animations - Array of dice roll animations
   * @returns Array of animation IDs
   */
  animateMultipleDiceRoll(animations: DiceRollAnimation[]): string[] {
    return animations.map((animation) => this.animateDiceRoll(animation));
  }

  /**
   * Create a smooth transition for object position
   * @param object - Three.js object to animate
   * @param targetPosition - Target position
   * @param duration - Animation duration in milliseconds
   * @param easing - Easing function
   * @param onComplete - Callback on completion
   */
  animatePosition(
    object: THREE.Object3D,
    targetPosition: THREE.Vector3,
    duration: number,
    easing: EasingFunction = EasingFunction.EASE_IN_OUT,
    onComplete?: AnimationCallback
  ): string {
    const animationId = this.generateAnimationId();
    const startPosition = object.position.clone();
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = this.applyEasing(progress, easing);

      object.position.lerpVectors(startPosition, targetPosition, easedProgress);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.completeAnimation(animationId);
      }
    };

    this.ngZone.runOutsideAngular(() => {
      animate();
    });

    this.activeAnimations.set(animationId, {
      id: animationId,
      type: 'position',
      progress: 0,
      onComplete,
    });

    return animationId;
  }

  /**
   * Create a smooth rotation animation
   * @param object - Three.js object to animate
   * @param targetRotation - Target rotation (Euler angles)
   * @param duration - Animation duration in milliseconds
   * @param easing - Easing function
   * @param onComplete - Callback on completion
   */
  animateRotation(
    object: THREE.Object3D,
    targetRotation: THREE.Euler,
    duration: number,
    easing: EasingFunction = EasingFunction.EASE_IN_OUT,
    onComplete?: AnimationCallback
  ): string {
    const animationId = this.generateAnimationId();
    const startQuaternion = object.quaternion.clone();
    const targetQuaternion = new THREE.Quaternion().setFromEuler(targetRotation);
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = this.applyEasing(progress, easing);

      object.quaternion.slerpQuaternions(startQuaternion, targetQuaternion, easedProgress);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.completeAnimation(animationId);
      }
    };

    this.ngZone.runOutsideAngular(() => {
      animate();
    });

    this.activeAnimations.set(animationId, {
      id: animationId,
      type: 'rotation',
      progress: 0,
      onComplete,
    });

    return animationId;
  }

  /**
   * Animate opacity/transparency
   * @param material - Material to animate
   * @param targetOpacity - Target opacity (0-1)
   * @param duration - Animation duration in milliseconds
   * @param onComplete - Callback on completion
   */
  animateOpacity(
    material: THREE.Material,
    targetOpacity: number,
    duration: number,
    onComplete?: AnimationCallback
  ): string {
    const animationId = this.generateAnimationId();
    const startOpacity = (material as THREE.MeshStandardMaterial).opacity || 1;
    const startTime = Date.now();

    // Enable transparency if not already enabled
    material.transparent = true;

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      (material as THREE.MeshStandardMaterial).opacity =
        startOpacity + (targetOpacity - startOpacity) * progress;
      material.needsUpdate = true;

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.completeAnimation(animationId);
      }
    };

    this.ngZone.runOutsideAngular(() => {
      animate();
    });

    this.activeAnimations.set(animationId, {
      id: animationId,
      type: 'opacity',
      progress: 0,
      onComplete,
    });

    return animationId;
  }

  /**
   * Cancel an active animation
   * @param animationId - ID of the animation to cancel
   */
  cancelAnimation(animationId: string): void {
    this.activeAnimations.delete(animationId);
  }

  /**
   * Cancel all active animations
   */
  cancelAllAnimations(): void {
    // Clear all active timers
    this.activeTimers.forEach((timerId) => {
      clearTimeout(timerId);
    });
    this.activeTimers.clear();

    // Clear all animations
    this.activeAnimations.clear();
  }

  /**
   * Check if an animation is active
   * @param animationId - Animation ID to check
   */
  isAnimationActive(animationId: string): boolean {
    return this.activeAnimations.has(animationId);
  }

  /**
   * Get progress of an animation
   * @param animationId - Animation ID
   */
  getAnimationProgress(animationId: string): number | undefined {
    return this.activeAnimations.get(animationId)?.progress;
  }

  /**
   * Wait for an animation to complete
   * @param animationId - Animation ID
   */
  async waitForAnimation(animationId: string): Promise<void> {
    return new Promise((resolve) => {
      const checkCompletion = () => {
        if (!this.isAnimationActive(animationId)) {
          resolve();
        } else {
          const timerId = setTimeout(() => {
            this.activeTimers.delete(timerId);
            checkCompletion();
          }, 16) as unknown as number; // Check every frame (~60fps)
          this.activeTimers.add(timerId);
        }
      };
      checkCompletion();
    });
  }

  /**
   * Wait for multiple animations to complete
   * @param animationIds - Array of animation IDs
   */
  async waitForMultipleAnimations(animationIds: string[]): Promise<void> {
    await Promise.all(animationIds.map((id) => this.waitForAnimation(id)));
  }

  /**
   * Apply easing function to progress value
   */
  private applyEasing(progress: number, easing: EasingFunction): number {
    switch (easing) {
      case EasingFunction.LINEAR:
        return progress;

      case EasingFunction.EASE_IN:
        return progress * progress;

      case EasingFunction.EASE_OUT:
        return progress * (2 - progress);

      case EasingFunction.EASE_IN_OUT:
        return progress < 0.5 ? 2 * progress * progress : -1 + (4 - 2 * progress) * progress;

      case EasingFunction.BOUNCE:
        if (progress < 0.5) {
          return 8 * progress * progress * progress * progress;
        } else {
          const f = progress - 1;
          return 1 + 8 * f * f * f * f;
        }

      default:
        return progress;
    }
  }

  /**
   * Complete an animation and trigger callback
   */
  private completeAnimation(animationId: string): void {
    const animation = this.activeAnimations.get(animationId);

    if (animation?.onComplete) {
      this.ngZone.run(() => {
        animation.onComplete!();
      });
    }

    this.activeAnimations.delete(animationId);
  }

  /**
   * Generate unique animation ID
   */
  private generateAnimationId(): string {
    this.animationIdCounter++;
    return `animation_${Date.now()}_${this.animationIdCounter}`;
  }

  /**
   * Get count of active animations
   */
  getActiveAnimationCount(): number {
    return this.activeAnimations.size;
  }

  /**
   * Get all active animation IDs
   */
  getActiveAnimationIds(): string[] {
    return Array.from(this.activeAnimations.keys());
  }

  /**
   * Cleanup method called when service is destroyed.
   *
   * Ensures all timers are cleared to prevent memory leaks.
   *
   * @public
   */
  ngOnDestroy(): void {
    this.cancelAllAnimations();
  }
}

/**
 * Internal animation state tracking
 */
interface AnimationState {
  id: string;
  type: 'camera' | 'dice-roll' | 'position' | 'rotation' | 'opacity';
  progress: number;
  startTime?: number;
  duration?: number;
  animate?: () => void;
  onComplete?: AnimationCallback;
  data?: unknown;
}
