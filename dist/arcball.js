import {Vector3,Quaternion} from './assets/three.module.js';

// A hyperbolic continuation keeps dragging responsive outside the planet disc,
// including Saturn's outer ring. A flat rim would ignore radial outward drags.
export function trackballPoint(x,y,cx,cy,radius){
  const px=(x-cx)/radius,py=(cy-y)/radius,d2=px*px+py*py;
  const z=d2<=.5?Math.sqrt(1-d2):.5/Math.sqrt(d2);
  return new Vector3(px,py,z).normalize();
}
export class ArcballRotation{
  constructor(){this.orientation=new Quaternion();this.previous=null;}
  begin(point){this.previous=point;}
  move(point){
    if(!this.previous)return;
    this.orientation.premultiply(new Quaternion().setFromUnitVectors(this.previous,point)).normalize();
    this.previous=point;
  }
  end(){this.previous=null;}
}
