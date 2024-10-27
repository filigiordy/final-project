import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { cloneUniforms } from 'three/src/renderers/shaders/UniformsUtils.js';


// Inizializzo la scena 
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB);
//Inizializzo la camera
const camera = new THREE.PerspectiveCamera( 80, window.innerWidth / window.innerHeight, 0.1, 1000 );
camera.position.set(0, 3.7, 10);
//Osservo gli stai di caricamento
const loadingManager = new THREE.LoadingManager();

/*loadingManager.onStart = function(url, item, total){
    console.log(`Starter loading: ${url}`);
}*/
// const startScreen = document.getElementById('start-screen');

const progressBar = document.getElementById('progress-bar');
//Barra di caricamento
loadingManager.onProgress = function(url, loaded, total){
    progressBar.value = (loaded / total) * 100;
}
// Nascondi container
const progressBarContainer = document.querySelector('.progress-bar-container');

loadingManager.onLoad = function(){
    progressBarContainer.style.display = 'none';
}
//Calcolo dello score e Gameover
let score = 0;
let isGameOver = false;
//Aumento score man mano che vado avanti
function updateScore() {
    const scoreElement = document.getElementById('score');
    score += 1;  
    const scoreString = score.toString().padStart(6, '0');  
    scoreElement.textContent = scoreString;
};
//Gameover alla fine
function showGameOver() {
    document.getElementById('gameOver').style.display = 'block';
    setTimeout(() => {
        document.getElementById('gameOverOptions').style.display = 'block';
    }, 3000);  
};

document.getElementById('exit').addEventListener('click', () => {
    window.location.href = 'index.html';
});

//Inizializzo il canvas 
const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.shadowMap.enabled = true;
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

const controls = new OrbitControls( camera, renderer.domElement );
//Costruisco una classe per gli oggetti
class Box extends THREE.Mesh {

    constructor({width, height, depth, color = '#00ff00', texture = null,  velocity = {x: 0, y: 0, z: 0}, position = {x:0, y: 0, z: 0}, zAcceleration = false}) {
        /*super(
        new THREE.BoxGeometry( widht, height, depth ),
        new THREE.MeshPhongMaterial( { color })    
    )*/
    const geometry = new THREE.BoxGeometry(width, height, depth);
    const material = texture ? new THREE.MeshPhongMaterial({ map: texture }) : new THREE.MeshPhongMaterial({ color });
    super(geometry, material);

    this.height = height;
    this.width = width;
    this.depth = depth;
    

    this.position.set(position.x, position.y, position.z);

    this.right = this.position.x + this.width / 2;
    this.left = this.position.x - this.width / 2;

    this.bottom = this.position.y - this.height / 2; 
    this.top = this.position.y + this.height / 2;

    this.front = this.position.z + this.depth /2;
    this.back = this.position.z - this.depth /2;

    this.velocity = velocity;

    this.gravity = -0.002;

    this.zAcceleration = zAcceleration; 
   }
        
   updateSides() {
    this.right = this.position.x + this.width / 2;
    this.left = this.position.x - this.width / 2;

    this.bottom = this.position.y - this.height / 2; 
    this.top = this.position.y + this.height / 2;

    this.front = this.position.z + this.depth /2;
    this.back = this.position.z - this.depth /2;
    }

   update(ground, walls1, walls2) {
    this.updateSides();

    if (this.zAcceleration) this.velocity.z += 0.0001;

    //Collisione con i muri 
    if (boxCollision({ box1: this, box2: walls1 })) {
        this.position.x = walls1.left - this.width / 2;  
    } else if (boxCollision({ box1: this, box2: walls2 })) {
        this.position.x = walls2.right + this.width / 2;  
    }

    this.position.x += this.velocity.x;
    this.position.z += this.velocity.z;

    this.applyGravity(ground);
    }

    applyGravity(ground) {
    this.velocity.y += this.gravity;

    
    if (boxCollision({box1: this, box2: ground})) {
    // console.log("Collisione con il terreno!");
    const friction = 0.5;    
    this.velocity.y *= friction;
    this.velocity.y = -this.velocity.y;
    } else 
    this.position.y += this.velocity.y;
    }
}

function boxCollision({box1, box2}) {
    const zCollision = box1.front >= box2.back && box1.back <= box2.front;
    const yCollision = box1.bottom + box1.velocity.y <= box2.top && box1.top >= box2.bottom; 
    const xCollision = box1.right >= box2.left && box1.left <= box2.right;

    return xCollision && yCollision && zCollision;
}
//Applicazione texture
const textureLoader = new THREE.TextureLoader();
const groundtexture = textureLoader.load('road.jpg', (texture) => {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set (1.6,15);
});
const walltexture = textureLoader.load('muro.jpg', (texture) => {
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set (1,15);
});

const woodTexture = textureLoader.load('wood.jpg'); 

const mountainTexture = textureLoader.load('montagne.jpg'); 

/*function adjustTextureRepeat(object, texture, scaleX = 1, scaleY = 1) {
    const width = object.geometry.parameters.width;
    const height = object.geometry.parameters.height;
    const depth = object.geometry.parameters.depth;
    
    
    texture.repeat.set(width / scaleX, depth / scaleY);
}*/


const cube = new Box({
    width: 1,
    height: 1,
    depth: 1,
    velocity: {x: 0, y: -0.01, z: 0}
});
cube.visible = false;
cube.castShadow = true;
scene.add( cube );

const walls1 = new Box({
    width: 1.5,
    height: 3,
    depth: 90,
    texture: walltexture,
    position: {
        x: 6,
        y: -0.75,
        z: 0 
    }
});
/*walls1.castShadow = true;
scene.add( walls1 );
adjustTextureRepeat(walls1, walltexture, 1, 10);*/

const walls2 = new Box({
    width: 1.5,
    height: 3,
    depth: 90,
    texture: walltexture,
    position: {
        x: -6,
        y: -0.75,
        z: 0 
    }
});
/*walls2.castShadow = true;
scene.add( walls2 );
adjustTextureRepeat(walls2, walltexture, 1, 10);*/

const ground = new Box({
    width: 11,
    height: 0.5,
    depth: 150,
    texture: groundtexture,
    position: {
        x: 0,
        y: -2,
        z: -40 
    }
})
ground.receiveShadow = true;
scene.add( ground );

const ground2 = new Box({
    width: 400,
    height: 0.5,
    depth: 320,
    color: 0xf6f47f,
    position: {
        x: 0,
        y: -2.5,
        z: 0 
    }
});
ground2.castShadow = true;
ground2.receiveShadow = true;
scene.add( ground2 );

const ground3= new Box({
    width: 500,
    height: 300,
    depth: 3,
    color: 0xf6f47f,
    texture: mountainTexture,
    position: {
        x: 0,
        y: 100,
        z: -400 
    }
});
ground2.castShadow = false;
ground2.receiveShadow = true;
scene.add( ground3 );

camera.position.z = 5;
//console.log(ground.top);
//console.log(cube.bottom);
//console.log(ground.position.y + ground.height / 2);

//Movimenti
const keys = {
     left: {
        pressed: false
     },
     right: {
        pressed: false
     },
     down: {
        pressed: false
     },
     up: {
        pressed: false
     }

}

window.addEventListener('keydown', (event) => {
    switch(event.code) {
      case 'ArrowLeft':
       keys.left.pressed = true
       break
      case 'ArrowRight':
       keys.right.pressed = true
       break
      case 'ArrowDown':
       keys.down.pressed = true
       break
      case 'ArrowUp':
       keys.up.pressed = true
       break
      case  'Space':
          cube.velocity.y = 0.1
      break 
    }
      });
  
window.addEventListener('keyup', (event) => {
      switch(event.code) {
       case 'ArrowLeft':
         keys.left.pressed = false
         break
       case 'ArrowRight':
         keys.right.pressed = false
         break
       case 'ArrowDown':
         keys.down.pressed = false
         break
       case 'ArrowUp':
         keys.up.pressed = false
         break
      }
});

//Ridimensiona
window.addEventListener('resize', function() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
//Nemici
const  enemies = [];
let frames = 0;
let spawnRate = 180;


let mixer;
let action; // Per controllare l'azione di animazione
let isWalking = false; //Variabile per verificare se è in esecuzione 
//Contorno
function loadModel(path, scale, position, rotation = {x: 0, y: 0, z: 0}, velocity = {x: 0, y: 0, z: 0}, zAcceleration = false) {
    const loader = new GLTFLoader(loadingManager);

    loader.load(path, (gltf) => {
        //console.log(`Modello caricato da: ${path}`, gltf);
    const model = gltf.scene;

        model.traverse((child) => {
            if (child.isMesh && child.material.map) {
                child.material.map.encoding = THREE.sRGBEncoding;
            }
        });

        // Applico le trasformazioni specificate
        model.scale.set(scale.x, scale.y, scale.z);
        model.position.set(position.x, position.y, position.z);
        model.rotation.set(rotation.x, rotation.y, rotation.z);
        //console.log("Rotazione applicata: ", model.rotation);
        scene.add(model);

        if (path === './cha/Characters_Henry9.glb') {
            cube.model = model; // Sincronizza solo il modello del cubo invisibile
        }

        //Controllo le animazioni
        if (gltf.animations.length > 0) {
           mixer = new THREE.AnimationMixer(model);

           action = mixer.clipAction(gltf.animations[3]);
           action.play();
           action.paused = true; // pausa l'animazione all'inizio
            
        }
    }, undefined, (error) => {
        console.error(`Errore nel caricamento del modello da: ${path}`, error);
    });
}


function animate() {

    if (isGameOver) return;
    //cube.rotation.x += 0.01;
	//cube.rotation.y += 0.01;
    const animationId = requestAnimationFrame(animate);
    renderer.render( scene, camera );
    updateScore();

    cube.velocity.x = 0
    cube.velocity.z = 0

    let isMoving = false; // Controlla se c'è movimento attivo

    if (keys.left.pressed) {
        cube.velocity.x = -0.03;
        isMoving = true;
    }
    else if (keys.right.pressed) {
        cube.velocity.x = 0.03;
        isMoving = true;
    }

    if (keys.down.pressed) {
        cube.velocity.z = 0.03;
        isMoving = true;
    }
    else if (keys.up.pressed) {
        cube.velocity.z = -0.03;
        isMoving = true;
    }

    if (isMoving) {
        if (!isWalking && mixer && action) {
            action.paused = false; 
            isWalking = true; 
        }
        } else {
            if (isWalking && mixer && action) {
                action.paused = true;
                isWalking = false;
            }
    }



    if (mixer) mixer.update(0.01);
    

    // Sincronizzo il modello con il cubo invisibile
    if (cube.model) {
    cube.model.position.copy(cube.position); 
    cube.model.position.y = cube.position.y - 0.5;
    // console.log('Rotazione del cubo:', cube.rotation);
    // console.log('Rotazione del modello:', cube.model.rotation);
    }

    cube.update(ground, walls1, walls2);

    enemies.forEach(enemy => {
        enemy.update(ground, walls1, walls2)
        if (boxCollision({box1: cube, box2: enemy})){
           
            cancelAnimationFrame(animationId);
            isGameOver = true; 
            showGameOver(); 
        }
    });

    if (frames % spawnRate == 0){
        if (spawnRate > 60) spawnRate -= 10;

        const enemy = new Box({
            width: 1.25,
            height: 1.25,
            depth: 1.25,
            texture: woodTexture,
            position: {x: (Math.random() - 0.5) * 9, y: 0, z: -20},
            velocity: {x: 0, y: 0, z: 0.005},
            zAcceleration: true 
        });
        enemy.castShadow = true;
        scene.add( enemy );
        
        enemies.push(enemy)
    }

    frames++
    //cube.position.y += -0.01;
}
//Gestione della luce
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

const light = new THREE.DirectionalLight(0xFFFFFF, 1);
light.position.set(-2, 3, 3);
light.castShadow = true;
scene.add(light);


//Caricamento dei modelli 

loadModel('./cha/Characters_Henry9.glb', 
    { x: 1.5, y: 1.5, z: 1.5 }, 
    { x: cube.position.x, y: cube.position.y , z: cube.position.z }, 
    {x: 0, y: Math.PI , z: 0}
    
);

loadModel(
    './model/BirchTree_1.gltf', 
    {x: 4, y: 5, z: 5}, 
    {x: -10, y: -2, z: -14.5}, 
    {x: 0, y: 0, z: 0}, 
    {x: 0, y: 0, z: 0.005}, 
    true
);


loadModel(
    './model/BirchTree_2.gltf', 
    {x: 4, y: 5, z: 5}, 
    {x: 10, y: -2, z: -20},
    {x: 0, y: 0, z: 0}, 
    {x: 0, y: 0, z: 0.005}, 
    true
);

loadModel(
    './addobbi/Blacksmith1.glb', 
    {x: 4, y: 5, z: 5}, 
    {x: -13.6, y: -2, z: -5}, 
    {x: 0, y: Math.PI / 2, z: 0}, 
    {x: 0, y: 0, z: 0.005}, 
    true
);

loadModel(
    './addobbi/Bell_Tower.glb', 
    {x: 4, y: 5, z: 5}, 
    {x: -11, y: -2, z: -25}, 
    {x: 0, y: Math.PI / 2, z: 0}, 
    {x: 0, y: 0, z: 0.005}, 
    true
);


loadModel(
    './addobbi/Sawmill.glb', 
    {x: 4, y: 5, z: 5}, 
    {x: 13.4, y: -2, z: -3}, 
    {x: 0, y: -Math.PI / 2, z: 0}, 
    {x: 0, y: 0, z: 0.005}, 
    true
);

loadModel(
    './addobbi/Blacksmith1.glb', 
    {x: 4, y: 5, z: 5}, 
    {x: 13.2, y: -2, z: -25}, 
    {x: 0, y: -Math.PI / 2, z: 0}, 
    {x: 0, y: 0, z: 0.005}, 
    true
);

loadModel(
    './addobbi/Stable.glb', 
    {x: 4, y: 5, z: 5}, 
    {x: -14, y: -2, z: -50}, 
    {x: 0, y: Math.PI / 2, z: 0}, 
    {x: 0, y: 0, z: 0.005}, 
    true
);

loadModel(
    './addobbi/House_2.glb', 
    {x: 4, y: 5, z: 5}, 
    {x: -9.5, y: -2, z: -70}, 
    {x: 0, y: Math.PI / 2, z: 0}, 
    {x: 0, y: 0, z: 0.005}, 
    true
);


loadModel(
    './addobbi/House_2.glb', 
    {x: 4, y: 5, z: 5}, 
    {x: 14, y: -2, z: -40}, 
    {x: 0, y: Math.PI / 2, z: 0}, 
    {x: 0, y: 0, z: 0.005}, 
    true
);


loadModel(
    './addobbi/House_1.glb', 
    {x: 4, y: 5, z: 5}, 
    {x: 9.5, y: -2, z: -70}, 
    {x: 0, y: Math.PI / 2, z: 0}, 
    {x: 0, y: 0, z: 0.005}, 
    true
);


loadModel(
    './addobbi/Inn.glb', 
    {x: 4, y: 5, z: 5}, 
    {x: 14, y: -2, z: -55}, 
    {x: 0, y: Math.PI / 2, z: 0}, 
    {x: 0, y: 0, z: 0.005}, 
    true
);

loadModel(
    './model/Bush.gltf', 
    {x: 4, y: 5, z: 5}, 
    {x: 9, y: -2, z: -10}, 
    {x: 0, y: Math.PI / 2, z: 0}, 
    {x: 0, y: 0, z: 0.005}, 
    true
);

loadModel(
    './model/Bush.gltf', 
    {x: 4, y: 5, z: 5}, 
    {x: 9, y: -2, z: -14}, 
    {x: 0, y: Math.PI / 2, z: 0}, 
    {x: 0, y: 0, z: 0.005}, 
    true
);

loadModel(
    './model/MapleTree_1.gltf', 
    {x: 4, y: 5, z: 5}, 
    {x: 7, y: -2, z: -80}, 
    {x: 0, y: Math.PI / 2, z: 0}, 
    {x: 0, y: 0, z: 0.005}, 
    true
);

/*loadModel(
    './model/MapleTree_1.gltf', 
    {x: 4, y: 5, z: 5}, 
    {x: 15, y: -2, z: -80}, 
    {x: 0, y: Math.PI / 2, z: 0}, 
    {x: 0, y: 0, z: 0.005}, 
    true
);


loadModel(
    './model/MapleTree_1.gltf', 
    {x: 4, y: 5, z: 5}, 
    {x: -7, y: -2, z: -80}, 
    {x: 0, y: Math.PI / 2, z: 0}, 
    {x: 0, y: 0, z: 0.005}, 
    true
);*/

loadModel(
    './model/MapleTree_1.gltf', 
    {x: 4, y: 5, z: 5}, 
    {x: -5, y: -2, z: -150}, 
    {x: 0, y: Math.PI / 2, z: 0}, 
    {x: 0, y: 0, z: 0.005}, 
    true
);

loadModel(
    './model/MapleTree_1.gltf', 
    {x: 4, y: 5, z: 5}, 
    {x: 5, y: -2, z: -150}, 
    {x: 0, y: Math.PI / 2, z: 0}, 
    {x: 0, y: 0, z: 0.005}, 
    true
);

loadModel(
    './addobbi/Bell_Tower.glb', 
    {x: 4, y: 5, z: 5}, 
    {x: 0, y: -2, z: -120}, 
    {x: 0, y: 0, z: 0}, 
    {x: 0, y: 0, z: 0.005}, 
    true
);
 
loadModel(
    './model/MapleTree_1.gltf', 
    {x: 4, y: 5, z: 5}, 
    {x: -15, y: -2, z: -80}, 
    {x: 0, y: Math.PI / 2, z: 0}, 
    {x: 0, y: 0, z: 0.005}, 
    true
);

loadModel(
    './addobbi/House_1.glb', 
    {x: 4, y: 5, z: 5}, 
    {x: 9.5, y: -2, z: -100}, 
    {x: 0, y: Math.PI / 2, z: 0}, 
    {x: 0, y: 0, z: 0.005}, 
    true
);


loadModel(
    './addobbi/House_2.glb', 
    {x: 4, y: 5, z: 5}, 
    {x: -9.5, y: -2, z: -100}, 
    {x: 0, y: Math.PI / 2, z: 0}, 
    {x: 0, y: 0, z: 0.005}, 
    true
); 

animate();



