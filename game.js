
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.155/build/three.module.js";
import { VRButton } from "https://cdn.jsdelivr.net/npm/three@0.155/examples/jsm/webxr/VRButton.js";
import { XRHandModelFactory } from "https://cdn.jsdelivr.net/npm/three@0.155/examples/jsm/webxr/XRHandModelFactory.js";

let scene, camera, renderer, listener;
let controller1, controller2;
let enemies=[];
let bullets=[];
let score=0;

init();

function init(){

scene=new THREE.Scene();
scene.background=new THREE.Color(0x000010);

camera=new THREE.PerspectiveCamera(75,window.innerWidth/window.innerHeight,0.1,1000);

renderer=new THREE.WebGLRenderer({antialias:true});
renderer.setSize(window.innerWidth,window.innerHeight);
renderer.xr.enabled=true;

document.body.appendChild(renderer.domElement);
document.body.appendChild(VRButton.createButton(renderer));

listener=new THREE.AudioListener();
camera.add(listener);

const light=new THREE.HemisphereLight(0xffffff,0x444444,2);
scene.add(light);

createStarfield();
setupHands();

document.getElementById("start").onclick=startGame;

renderer.setAnimationLoop(loop);

}

function setupHands(){

const handFactory=new XRHandModelFactory();

controller1=renderer.xr.getController(0);
controller2=renderer.xr.getController(1);

scene.add(controller1);
scene.add(controller2);

const hand1=renderer.xr.getHand(0);
const hand2=renderer.xr.getHand(1);

hand1.add(handFactory.createHandModel(hand1));
hand2.add(handFactory.createHandModel(hand2));

scene.add(hand1);
scene.add(hand2);

addBlaster(hand1);
addBlaster(hand2);

controller1.addEventListener("select",()=>shoot(hand1));
controller2.addEventListener("select",()=>shoot(hand2));

}

function addBlaster(hand){

const gun=new THREE.Group();

const body=new THREE.Mesh(
new THREE.BoxGeometry(0.05,0.05,0.25),
new THREE.MeshStandardMaterial({color:0x222222})
);

gun.add(body);

const barrel=new THREE.Mesh(
new THREE.CylinderGeometry(0.01,0.01,0.2),
new THREE.MeshStandardMaterial({color:0x00ffff})
);

barrel.rotation.x=Math.PI/2;
barrel.position.z=-0.25;

gun.add(barrel);

gun.position.set(0,0,-0.1);

hand.add(gun);

hand.userData.gun=gun;

}

function createStarfield(){

const geo=new THREE.BufferGeometry();
const verts=[];

for(let i=0;i<10000;i++){

verts.push(
(Math.random()-0.5)*2000,
(Math.random()-0.5)*2000,
(Math.random()-0.5)*2000
);

}

geo.setAttribute("position",new THREE.Float32BufferAttribute(verts,3));

scene.add(new THREE.Points(
geo,
new THREE.PointsMaterial({size:0.7})
));

}

function startGame(){

document.getElementById("start").style.display="none";

navigator.xr.requestSession("immersive-vr")
.then(session=>renderer.xr.setSession(session));

spawnFleet();

}

function spawnFleet(){

for(let i=0;i<5;i++){
spawnEnemy();
}

setTimeout(spawnFleet,5000);

}

function spawnEnemy(){

const geo=new THREE.IcosahedronGeometry(0.5);

const mat=new THREE.MeshStandardMaterial({
color:0xff3300,
emissive:0xff3300
});

const enemy=new THREE.Mesh(geo,mat);

enemy.position.set(
(Math.random()-0.5)*10,
(Math.random()-0.5)*5,
-50
);

enemy.userData.speed=0.05+Math.random()*0.05;

scene.add(enemy);
enemies.push(enemy);

}

function shoot(hand){

const gun=hand.userData.gun;

gun.position.z+=0.05;

setTimeout(()=>gun.position.z-=0.05,60);

const beam=new THREE.Mesh(
new THREE.CylinderGeometry(0.01,0.01,2),
new THREE.MeshBasicMaterial({color:0x00ffff})
);

beam.rotation.x=Math.PI/2;

beam.position.setFromMatrixPosition(hand.matrixWorld);

const dir=new THREE.Vector3(0,0,-1).applyQuaternion(hand.quaternion);

beam.userData.vel=dir.multiplyScalar(2);

scene.add(beam);
bullets.push(beam);

playShootSound(hand);

}

function playShootSound(hand){

const sound=new THREE.PositionalAudio(listener);

const oscillator=listener.context.createOscillator();

oscillator.type="square";
oscillator.frequency.value=600;

oscillator.connect(sound.gain);

oscillator.start();
oscillator.stop(listener.context.currentTime+0.05);

hand.add(sound);

}

function updateBullets(){

bullets.forEach((b,i)=>{

b.position.add(b.userData.vel);

if(b.position.length()>500){

scene.remove(b);
bullets.splice(i,1);

}

});

}

function updateEnemies(){

enemies.forEach((e,i)=>{

e.position.z+=e.userData.speed;

e.rotation.x+=0.01;
e.rotation.y+=0.01;

if(e.position.z>5){

scene.remove(e);
enemies.splice(i,1);

}

});

}

function checkHits(){

bullets.forEach((b,bi)=>{

enemies.forEach((e,ei)=>{

if(b.position.distanceTo(e.position)<0.8){

scene.remove(e);
scene.remove(b);

enemies.splice(ei,1);
bullets.splice(bi,1);

score+=100;
document.getElementById("score").textContent=score;

}

});

});

}

function loop(){

updateBullets();
updateEnemies();
checkHits();

renderer.render(scene,camera);

}
