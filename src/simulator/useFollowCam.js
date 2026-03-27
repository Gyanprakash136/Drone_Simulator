import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export function useFollowCam(droneRef) {
  useFrame((state, delta) => {
    if (!droneRef.current) return;

    // The target position we want the camera to be at
    // Offset slightly back and up from the drone's actual position
    const idealOffset = new THREE.Vector3(0, 3, 8);
    const cameraTargetPos = droneRef.current.position.clone().add(idealOffset);

    // Apply strict lerping to Y and Z for follow, but extreme cinematic lag on X (side-to-side)
    const newCamPos = state.camera.position.clone();
    newCamPos.x = THREE.MathUtils.lerp(newCamPos.x, cameraTargetPos.x, delta * 1.5);
    newCamPos.y = THREE.MathUtils.lerp(newCamPos.y, cameraTargetPos.y, delta * 4);
    newCamPos.z = THREE.MathUtils.lerp(newCamPos.z, cameraTargetPos.z, delta * 4);
    
    state.camera.position.copy(newCamPos);

    // Make the camera look directly at the drone, but slightly ahead
    const lookAtTarget = droneRef.current.position.clone().add(new THREE.Vector3(0, 0, -2));
    
    // We smooth out the LookAt so it feels cinematic and delayed rather than rigidly snapping
    const currentLookAt = new THREE.Vector3().copy(state.camera.userData.lookAt || new THREE.Vector3());
    currentLookAt.lerp(lookAtTarget, delta * 5);
    state.camera.userData.lookAt = currentLookAt;
    
    state.camera.lookAt(currentLookAt);
  });
}
