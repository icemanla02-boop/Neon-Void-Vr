
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.155/build/three.module.js";
import { VRButton } from "https://cdn.jsdelivr.net/npm/three@0.155/examples/jsm/webxr/VRButton.js";

let scene, camera, renderer;
let controller;
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

const light=new THREE.HemisphereLight(0xffffff,0x444444,2);
scene.add(light);

createStarfield();
createCrosshair();

controller=renderer.xr.getController(0);
controller.addEventListener("select",shoot);
scene.add(controller);

document.getElementById("start").onclick=startGame;

renderer.setAnimationLoop(loop);

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

const mat=new THREE.PointsMaterial({size:0.7});

const stars=new THREE.Points(geo,mat);
scene.add(stars);

}

function createCrosshair(){

const geo=new THREE.RingGeometry(0.02,0.04,32);
const mat=new THREE.MeshBasicMaterial({color:0x00ffff});

const crosshair=new THREE.Mesh(geo,mat);
crosshair.position.z=-2;

camera.add(crosshair);
scene.add(camera);

}

function startGame(){

document.getElementById("start").style.display="none";
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

function shoot(){

const geo=new THREE.SphereGeometry(0.05);
const mat=new THREE.MeshBasicMaterial({color:0x00ffff});

const bullet=new THREE.Mesh(geo,mat);

bullet.position.setFromMatrixPosition(controller.matrixWorld);

const dir=new THREE.Vector3(0,0,-1).applyQuaternion(controller.quaternion);

bullet.userData.vel=dir.multiplyScalar(1.5);

scene.add(bullet);
bullets.push(bullet);

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

if(b.position.distanceTo(e.position)<0.6){

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
