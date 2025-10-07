import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { TypeAdapters } from './type-adapters.util';

describe('TypeAdapters', () => {
  describe('cannonToThreeVector', () => {
    it('should correctly convert Cannon Vec3 to Three Vector3', () => {
      const cannonVec = new CANNON.Vec3(1, 2, 3);
      const threeVec = TypeAdapters.cannonToThreeVector(cannonVec);

      expect(threeVec).toBeInstanceOf(THREE.Vector3);
      expect(threeVec.x).toBe(1);
      expect(threeVec.y).toBe(2);
      expect(threeVec.z).toBe(3);
    });

    it('should handle negative values', () => {
      const cannonVec = new CANNON.Vec3(-5, -10, -15);
      const threeVec = TypeAdapters.cannonToThreeVector(cannonVec);

      expect(threeVec.x).toBe(-5);
      expect(threeVec.y).toBe(-10);
      expect(threeVec.z).toBe(-15);
    });

    it('should handle zero values', () => {
      const cannonVec = new CANNON.Vec3(0, 0, 0);
      const threeVec = TypeAdapters.cannonToThreeVector(cannonVec);

      expect(threeVec.x).toBe(0);
      expect(threeVec.y).toBe(0);
      expect(threeVec.z).toBe(0);
    });

    it('should create a new instance (not reference original)', () => {
      const cannonVec = new CANNON.Vec3(1, 2, 3);
      const threeVec = TypeAdapters.cannonToThreeVector(cannonVec);

      // Modify original
      cannonVec.x = 100;

      // Three.js vector should not be affected
      expect(threeVec.x).toBe(1);
    });
  });

  describe('cannonToThreeQuaternion', () => {
    it('should correctly convert Cannon Quaternion to Three Quaternion', () => {
      const cannonQuat = new CANNON.Quaternion(0.5, 0.5, 0.5, 0.5);
      const threeQuat = TypeAdapters.cannonToThreeQuaternion(cannonQuat);

      expect(threeQuat).toBeInstanceOf(THREE.Quaternion);
      expect(threeQuat.x).toBe(0.5);
      expect(threeQuat.y).toBe(0.5);
      expect(threeQuat.z).toBe(0.5);
      expect(threeQuat.w).toBe(0.5);
    });

    it('should handle identity quaternion', () => {
      const cannonQuat = new CANNON.Quaternion(0, 0, 0, 1);
      const threeQuat = TypeAdapters.cannonToThreeQuaternion(cannonQuat);

      expect(threeQuat.x).toBe(0);
      expect(threeQuat.y).toBe(0);
      expect(threeQuat.z).toBe(0);
      expect(threeQuat.w).toBe(1);
    });

    it('should create a new instance (not reference original)', () => {
      const cannonQuat = new CANNON.Quaternion(0.5, 0.5, 0.5, 0.5);
      const threeQuat = TypeAdapters.cannonToThreeQuaternion(cannonQuat);

      // Modify original
      cannonQuat.x = 1;

      // Three.js quaternion should not be affected
      expect(threeQuat.x).toBe(0.5);
    });
  });

  describe('threeToCannonVector', () => {
    it('should correctly convert Three Vector3 to Cannon Vec3', () => {
      const threeVec = new THREE.Vector3(4, 5, 6);
      const cannonVec = TypeAdapters.threeToCannonVector(threeVec);

      expect(cannonVec).toBeInstanceOf(CANNON.Vec3);
      expect(cannonVec.x).toBe(4);
      expect(cannonVec.y).toBe(5);
      expect(cannonVec.z).toBe(6);
    });

    it('should handle negative values', () => {
      const threeVec = new THREE.Vector3(-1, -2, -3);
      const cannonVec = TypeAdapters.threeToCannonVector(threeVec);

      expect(cannonVec.x).toBe(-1);
      expect(cannonVec.y).toBe(-2);
      expect(cannonVec.z).toBe(-3);
    });

    it('should create a new instance (not reference original)', () => {
      const threeVec = new THREE.Vector3(1, 2, 3);
      const cannonVec = TypeAdapters.threeToCannonVector(threeVec);

      // Modify original
      threeVec.x = 100;

      // Cannon vector should not be affected
      expect(cannonVec.x).toBe(1);
    });
  });

  describe('threeToCannonQuaternion', () => {
    it('should correctly convert Three Quaternion to Cannon Quaternion', () => {
      const threeQuat = new THREE.Quaternion(0.1, 0.2, 0.3, 0.4);
      const cannonQuat = TypeAdapters.threeToCannonQuaternion(threeQuat);

      expect(cannonQuat).toBeInstanceOf(CANNON.Quaternion);
      expect(cannonQuat.x).toBe(0.1);
      expect(cannonQuat.y).toBe(0.2);
      expect(cannonQuat.z).toBe(0.3);
      expect(cannonQuat.w).toBe(0.4);
    });

    it('should create a new instance (not reference original)', () => {
      const threeQuat = new THREE.Quaternion(0.1, 0.2, 0.3, 0.4);
      const cannonQuat = TypeAdapters.threeToCannonQuaternion(threeQuat);

      // Modify original
      threeQuat.x = 1;

      // Cannon quaternion should not be affected
      expect(cannonQuat.x).toBe(0.1);
    });
  });

  describe('syncBodyToObject', () => {
    it('should sync position and rotation from Cannon body to Three object', () => {
      const body = new CANNON.Body({ mass: 1 });
      body.position.set(10, 20, 30);
      body.quaternion.set(0.5, 0.5, 0.5, 0.5);

      const threeObject = new THREE.Object3D();
      TypeAdapters.syncBodyToObject(body, threeObject);

      expect(threeObject.position.x).toBe(10);
      expect(threeObject.position.y).toBe(20);
      expect(threeObject.position.z).toBe(30);
      expect(threeObject.quaternion.x).toBe(0.5);
      expect(threeObject.quaternion.y).toBe(0.5);
      expect(threeObject.quaternion.z).toBe(0.5);
      expect(threeObject.quaternion.w).toBe(0.5);
    });

    it('should work with mesh objects', () => {
      const body = new CANNON.Body({ mass: 1 });
      body.position.set(5, 10, 15);

      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshBasicMaterial();
      const mesh = new THREE.Mesh(geometry, material);

      TypeAdapters.syncBodyToObject(body, mesh);

      expect(mesh.position.x).toBe(5);
      expect(mesh.position.y).toBe(10);
      expect(mesh.position.z).toBe(15);
    });
  });

  describe('syncObjectToBody', () => {
    it('should sync position and rotation from Three object to Cannon body', () => {
      const threeObject = new THREE.Object3D();
      threeObject.position.set(1, 2, 3);
      threeObject.quaternion.set(0.1, 0.2, 0.3, 0.4);

      const body = new CANNON.Body({ mass: 1 });
      TypeAdapters.syncObjectToBody(threeObject, body);

      expect(body.position.x).toBe(1);
      expect(body.position.y).toBe(2);
      expect(body.position.z).toBe(3);
      expect(body.quaternion.x).toBe(0.1);
      expect(body.quaternion.y).toBe(0.2);
      expect(body.quaternion.z).toBe(0.3);
      expect(body.quaternion.w).toBe(0.4);
    });

    it('should work with mesh objects', () => {
      const geometry = new THREE.BoxGeometry(1, 1, 1);
      const material = new THREE.MeshBasicMaterial();
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(7, 8, 9);

      const body = new CANNON.Body({ mass: 1 });
      TypeAdapters.syncObjectToBody(mesh, body);

      expect(body.position.x).toBe(7);
      expect(body.position.y).toBe(8);
      expect(body.position.z).toBe(9);
    });
  });

  describe('round-trip conversions', () => {
    it('should maintain values through Cannon->Three->Cannon vector conversion', () => {
      const original = new CANNON.Vec3(1.5, 2.5, 3.5);
      const threeVec = TypeAdapters.cannonToThreeVector(original);
      const backToCannon = TypeAdapters.threeToCannonVector(threeVec);

      expect(backToCannon.x).toBe(original.x);
      expect(backToCannon.y).toBe(original.y);
      expect(backToCannon.z).toBe(original.z);
    });

    it('should maintain values through Three->Cannon->Three vector conversion', () => {
      const original = new THREE.Vector3(4.5, 5.5, 6.5);
      const cannonVec = TypeAdapters.threeToCannonVector(original);
      const backToThree = TypeAdapters.cannonToThreeVector(cannonVec);

      expect(backToThree.x).toBe(original.x);
      expect(backToThree.y).toBe(original.y);
      expect(backToThree.z).toBe(original.z);
    });

    it('should maintain values through Cannon->Three->Cannon quaternion conversion', () => {
      const original = new CANNON.Quaternion(0.1, 0.2, 0.3, 0.9);
      const threeQuat = TypeAdapters.cannonToThreeQuaternion(original);
      const backToCannon = TypeAdapters.threeToCannonQuaternion(threeQuat);

      expect(backToCannon.x).toBeCloseTo(original.x);
      expect(backToCannon.y).toBeCloseTo(original.y);
      expect(backToCannon.z).toBeCloseTo(original.z);
      expect(backToCannon.w).toBeCloseTo(original.w);
    });
  });
});
