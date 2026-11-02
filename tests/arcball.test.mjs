import test from 'node:test';
import assert from 'node:assert/strict';
import {Vector3} from '../dist/assets/three.module.js';
import {trackballPoint,ArcballRotation} from '../dist/arcball.js';

test('Dragging radially outside the planet disc still rotates the ring',()=>{
  const drag=new ArcballRotation();
  drag.begin(trackballPoint(450,0,0,0,300));drag.move(trackballPoint(620,0,0,0,300));
  assert.ok(drag.orientation.angleTo(new ArcballRotation().orientation)>.04);
});
test('Repeated vertical drags can flip the ring beyond the old pitch limit',()=>{
  const drag=new ArcballRotation();let flipped=false;
  for(let i=0;i<12;i++){
    drag.begin(trackballPoint(0,0,0,0,300));drag.move(trackballPoint(0,-240,0,0,300));drag.end();
    if(new Vector3(0,1,0).applyQuaternion(drag.orientation).y<-.5)flipped=true;
    assert.ok(Math.abs(drag.orientation.length()-1)<1e-10);
  }
  assert.equal(flipped,true);
});
test('Ending a drag prevents hover movement from rotating the planet',()=>{
  const drag=new ArcballRotation();drag.begin(trackballPoint(0,0,0,0,300));drag.move(trackballPoint(100,70,0,0,300));drag.end();
  const before=drag.orientation.clone();drag.move(trackballPoint(-200,100,0,0,300));assert.ok(drag.orientation.equals(before));
});
