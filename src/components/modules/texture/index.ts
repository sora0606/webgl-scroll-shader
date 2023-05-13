import * as THREE from "three";

class ImagePlane{
    refImage: HTMLImageElement;
    mesh: THREE.Mesh;
    w: number;
    h: number;

    constructor(mesh, img, {w, h}){
        this.refImage = img;
        this.mesh = mesh;
        this.w = w;
        this.h = h;
    }

    setParams(){
        const rect = this.refImage.getBoundingClientRect();

        this.mesh.scale.x = rect.width;
        this.mesh.scale.y = rect.height;

        // window座標をWebGL座標に変換
        const x = rect.left - this.w / 2 + rect.width / 2;
        const y = -rect.top + this.h / 2 - rect.height / 2;
        this.mesh.position.set(x, y, this.mesh.position.z);
    }

    update(offset){
        this.setParams();

        // @ts-ignore
        this.mesh.material.uniforms.uTime.value = offset;
    }
}

export default ImagePlane;