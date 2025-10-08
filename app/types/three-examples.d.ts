import * as THREE from "three";

declare module "three/examples/jsm/*" {
  const whatever: any;
  export default whatever;
}

declare module "three/examples/jsm/controls/OrbitControls" {
  import * as THREE from "three";
  export class OrbitControls extends THREE.EventDispatcher {
    constructor(object: THREE.Camera, domElement?: HTMLElement);
    update(): void;
    dispose(): void;
    enableDamping: boolean;
  }
}
