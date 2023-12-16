import * as THREE from 'https://unpkg.com/three@0.126.1/build/three.module.js';
import { OrbitControls } from 'https://unpkg.com/three@0.126.1/examples/jsm/controls/OrbitControls.js';
import { GUI } from 'https://unpkg.com/three@0.126.1/examples/jsm/libs/dat.gui.module.js';

import { EffectComposer } from 'https://unpkg.com/three@0.126.1/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://unpkg.com/three@0.126.1/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'https://unpkg.com/three@0.126.1/examples/jsm/postprocessing/UnrealBloomPass.js';



const scene = new THREE.Scene();
scene.background = new THREE.Color(0x000000); // Set background color to black
//scene.background = new THREE.Color(0xffffff); // Set background color to white

let camera, renderer, controls;
let square1, square2, square3; // Top Squares
let square4, square5, square6; // Bottom Squares
let squares;
const frustumSize = 7;
let shaderMaterialTop, shaderMaterialBot, material;

let cube, group;

// Define the Outline Size //
let cubeHeight = 1, cubeWidth = 0.075;
let squareHeight = 1.6, squareWidth = 0.09;
let delta;

let animationPhase = 0;
let elapsedTime = 0;
let phaseDuration = 750;

let clock = new THREE.Clock(false); // Clock for animation
clock.start();

let composer, bloomPass;

const params = {
    threshold: 0,
    strength: 0.5,
    radius: 0.05
};

let cubeColor = new THREE.Color(0.2, 1.0, 0,3);         // Green
let topFrontColor = new THREE.Color(1.5, 0.2, 1.5);     // Purple (Pink)
let botFrontColor = new THREE.Color(0.0, 0.2, 1.5);     // Blue
let topBackColor = new THREE.Color(0.55, 1.0, 1.5);     // Aqua color
let botBackColor = new THREE.Color(0.75, 0.75, 1.5);    // Grey color

init();
animate();

function init() {

    // Renderer Settings //
    renderer = new THREE.WebGLRenderer( { antialias: true } );
    renderer.setPixelRatio( window.devicePixelRatio );
    renderer.setClearColor( 0x000000, 0.0 );
    renderer.setSize( window.innerWidth, window.innerHeight );
    document.body.appendChild( renderer.domElement );

    // Camera Setting //
    const aspect = window.innerWidth / window.innerHeight;
    camera = new THREE.OrthographicCamera( frustumSize * aspect / - 2, frustumSize * aspect / 2, 
    frustumSize / 2, frustumSize / - 2, 0.1, 100 );
    camera.position.z = 5;

    // Control Settings //
    controls = new OrbitControls( camera, renderer.domElement );
    controls.enableDamping = true;   

    // Cube Material Settings //
    material = new THREE.MeshBasicMaterial({ 
        color: cubeColor, 
        side: THREE.DoubleSide, 
        transparent: true, 
        opacity: 0.75 
    });

    // Function to create a plane mesh
    function createPlane(x, y, z, height, width, rotationX, rotationY, rotationZ) {
        const geometry = new THREE.PlaneGeometry(height, width);
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.set(x, y, z);
        mesh.rotation.x = rotationX;
        mesh.rotation.y = rotationY;
        mesh.rotation.z = rotationZ;
        return mesh;
    }

    // Function to create group meshes
    function createMesh(groupMesh, planeMeshes){
        groupMesh = new THREE.Group();
        planeMeshes.forEach(mesh => {
            groupMesh.add(mesh);
        });
        // Add the cube group to the scene
        scene.add(groupMesh);
        return groupMesh;
    }
    
    // Creating a cube by positioning plane meshes for each side //
    delta = cubeHeight/2 - cubeWidth/2;
    const cubePlaneMeshes = [
        createPlane(0, -delta, cubeHeight/2, cubeHeight, cubeWidth, 0, 0, 0),           // Front
        createPlane(0, delta, delta, cubeHeight, cubeWidth, -Math.PI/4, 0, 0),          // Front-Top
        createPlane(-delta, 0, cubeHeight/2, cubeHeight, cubeWidth, 0, 0, Math.PI/2),   // Front

        createPlane(0, cubeHeight/2, -delta, cubeHeight, cubeWidth, -Math.PI/2, 0, 0),          // Top
        createPlane(delta, delta, 0, cubeHeight, cubeWidth, -Math.PI/2, Math.PI/4, Math.PI/2),  // Top-Right
        createPlane(-delta, cubeHeight/2, 0, cubeHeight, cubeWidth, -Math.PI/2, 0, Math.PI/2),  // Top

        createPlane(cubeHeight/2, -delta, 0, cubeHeight, cubeWidth, 0, Math.PI/2, 0),           // Right
        createPlane(delta, 0, delta, cubeHeight, cubeWidth, 0, Math.PI/4, Math.PI/2),           // Right-Front
        createPlane(cubeHeight/2, 0, -delta, cubeHeight, cubeWidth, 0, Math.PI/2, Math.PI/2)    // Right
    ];

    cube = createMesh(cube, cubePlaneMeshes);


    // Creating squares //
    function createSquarePlanes(square){
        delta = squareHeight/2 - squareWidth/2;
        const squarePlanes = [
            createPlane(0, delta, 0, squareHeight, squareWidth, 0, 0, 0),
            createPlane(0, -delta, 0, squareHeight, squareWidth, 0, 0, 0),
            createPlane(delta, 0, 0, squareHeight, squareWidth, 0, 0, Math.PI/2),
            createPlane(-delta, 0, 0, squareHeight, squareWidth, 0, 0, Math.PI/2)
        ];
        return createMesh(square, squarePlanes);
    }
    // Top Squares //
    square1 = createSquarePlanes(square1);
    square2 = createSquarePlanes(square2);
    square3 = createSquarePlanes(square3);
    // Bottom Squares //
    square4 = createSquarePlanes(square4);
    square5 = createSquarePlanes(square5);
    square6 = createSquarePlanes(square6);
    squares = [square1, square2, square3, square4, square5, square6];
    
    // Transform Setting //

    // Top Squares //
    square1.position.z += squareHeight/2+0.15;
    square2.rotation.y += Math.PI/2;
    square2.position.x += squareHeight/2+0.15;
    square3.rotation.x -= Math.PI/2;
    square3.position.y += squareHeight/2+0.15;
    // Bottom Squares //
    square4.position.z -= squareHeight/2+0.35;
    square5.rotation.y += Math.PI/2;
    square5.position.x -= squareHeight/2+0.35;
    square6.rotation.x -= Math.PI/2;
    square6.position.y -= squareHeight/2+0.35;
    
    // All Elements Rotation //
    group = createMesh(group, [cube,square1,square2,square3,square4,square5,square6]);
    group.rotation.set(Math.PI/5, -Math.PI/4, 0);
    

    // Shaders //

    // Vertex Shader Code //
    const vertexShader = `
    varying vec3 vNormal;
    varying vec3 vPosition;

    void main() {
    vNormal = normalMatrix * normal; // Transform normal to view space
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vPosition = worldPosition.xyz; // Pass the world position of the mesh
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
    `;

    // Fragment Shader Code incorporating gradient color //
    const fragmentShaderPurple = `
    varying vec3 vNormal;
    varying vec3 vPosition;
    uniform vec3 topFrontColor;  // Purple color
    uniform vec3 botFrontColor;  // Blue color

    void main() {

    vec3 gradientColor = mix(topFrontColor, botFrontColor, smoothstep(-1.0, -2.0, vPosition.x));
    gradientColor = mix(gradientColor, botFrontColor, smoothstep(1.0, -1.0, vPosition.y));
    gradientColor = mix(gradientColor, botFrontColor, smoothstep(0.0, -2.5, vPosition.z));

    gl_FragColor = vec4(gradientColor, 1.0);
    }
    `;

    // Fragment Shader Code incorporating gradient color //
    const fragmentShaderGrey = `
    varying vec3 vNormal;
    varying vec3 vPosition;
    uniform vec3 topBackColor;  // Aqua color
    uniform vec3 botBackColor;  // Grey color

    void main() {

    vec3 gradientColor = mix(topBackColor, botBackColor, smoothstep(-1.0, -2.0, vPosition.x));
    gradientColor = mix(gradientColor, botBackColor, smoothstep(1.0, -1.0, vPosition.y));
    gradientColor = mix(gradientColor, botBackColor, smoothstep(0.0, -4.0, vPosition.z));

    gl_FragColor = vec4(gradientColor, 1.0);
    }
    `;

    const uniforms = {
        topFrontColor: { value: new THREE.Vector3(topFrontColor.r, topFrontColor.g, topFrontColor.b) }, // Purple color
        botFrontColor: { value: new THREE.Vector3(botFrontColor.r, botFrontColor.g, botFrontColor.b) }, // Blue color
        topBackColor: { value: new THREE.Vector3(topBackColor.r, topBackColor.g, topBackColor.b) }, // Aqua color
        botBackColor: { value: new THREE.Vector3(botBackColor.r, botBackColor.g, botBackColor.b) } // Grey color
    };

    shaderMaterialTop = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: vertexShader,
        side: THREE.DoubleSide,
        fragmentShader: fragmentShaderPurple
    });

    shaderMaterialBot = new THREE.ShaderMaterial({
        uniforms: uniforms,
        vertexShader: vertexShader,
        side: THREE.DoubleSide,
        fragmentShader: fragmentShaderGrey
    });
  

    // Apply the shader material to the cube group //
    for(let i = 0; i < 3; i++){
        squares[i].traverse(child => {
            if (child instanceof THREE.Mesh) {
                child.material = shaderMaterialTop;
            }
        });
    }
    for(let i = 3; i < 6; i++){
        squares[i].traverse(child => {
            if (child instanceof THREE.Mesh) {
                child.material = shaderMaterialBot;
            }
        });
    }

    // Create an EffectComposer
    composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    // Add a BloomPass with increased effect
    bloomPass = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
        params.strength, // Strength
        params.radius, // Radius
        params.threshold // Threshold
    );
    composer.addPass(bloomPass);

    const gui = new GUI();
    
    const bloomFolder = gui.addFolder('Bloom');

    bloomFolder.add(params, 'threshold', 0.0, 1.0).step(0.01).onChange(function(value){
        bloomPass.threshold = Number(value);
    });

    bloomFolder.add(params, 'strength', 0.0, 3.0).step(0.01).onChange(function(value){
        bloomPass.strength = Number(value);
    });

    bloomFolder.add(params, 'radius', 0.0, 1.0).step(0.01).onChange(function(value){
        bloomPass.radius = Number(value);
    });

    const materialsFolder = gui.addFolder('Materials');

    var conf = { 
        CubeColor : `#${cubeColor.getHexString()}`,
        TopSquares : `#${topFrontColor.getHexString()}`,
        BotSquares : `#${botFrontColor.getHexString()}`
    };

    var guiControlador = materialsFolder.addColor( conf, 'CubeColor');
    guiControlador.onChange( function( colorValue  )
    {
        let colorObject = new THREE.Color( colorValue ) ;
        material.color = colorObject;
        cubeColor = colorObject;
    });

    guiControlador = materialsFolder.addColor( conf, 'TopSquares');
    guiControlador.onChange( function( colorValue  )
    {
        let colorObject = new THREE.Color( colorValue ) ;
        topFrontColor = colorObject;
        shaderMaterialTop.uniforms.topFrontColor.value = new THREE.Vector3(colorObject.r, colorObject.g, colorObject.b);
    });

    guiControlador = materialsFolder.addColor( conf, 'BotSquares');
    guiControlador.onChange( function( colorValue  )
    {
        let colorObject = new THREE.Color( colorValue ) ;
        botFrontColor = colorObject;
        shaderMaterialTop.uniforms.botFrontColor.value = new THREE.Vector3(colorObject.r, colorObject.g, colorObject.b);
    });


    // Additional Functions //
    window.addEventListener( 'resize', onWindowResize );
    onWindowResize();

}



function animate() {

    requestAnimationFrame( animate );
    
    controls.update();
    composer.render();

     // Calculate elapsed time since the start of the animation
    const delta = clock.getDelta()*1000;
    elapsedTime += delta;
      
    // Check if the elapsed time is within the current phase duration
    if (elapsedTime < phaseDuration) {
        // Perform animations based on the current phase
        switch (animationPhase) {
        case 0:
            phaseDuration = 1500;
            changeOutTopFacesPosition(0.0075, 25);
            changeOutBotFacesPosition(0.0075, 25);
            changeOutFacesScale(0.01, -10);
            break;
        case 1:
            phaseDuration = 750;
            changeOutTopFacesPosition(0.0135, -4.1);
            changeOutBotFacesPosition(0.0135, -3.64);
            changeOutFacesRotation(0, 6.15);
            break;
        case 2:
            phaseDuration = 750;
            changeOutTopFacesPosition(-0.005, -22);
            changeOutBotFacesPosition(-0.005, -21);
            changeOutFacesRotation(0.012, 14);
            break;
        case 3:
            phaseDuration = 750;
            changeOutTopFacesPosition(-0.0085, -22);
            changeOutBotFacesPosition(-0.011, -21);
            changeOutFacesScale(-0.005, -30);
            changeOutFacesRotation(0.017, 12);
            break;
        case 4:
            phaseDuration = 750;
            if (square1.position.z > cubeHeight/2+0.015) changeOutTopFacesPosition(-0.012, -23);
            if (square4.position.z < -cubeHeight/2-0.015) changeOutBotFacesPosition(-0.0145, -23);

            if (square1.scale.x > cubeHeight/squareHeight) changeOutFacesScale(-0.0075, -30);
            else setOutFacesScale(cubeHeight/squareHeight);

            if (square1.rotation.z/Math.PI < 1 && square1.rotation.z/Math.PI != 0) changeOutFacesRotation(0.0195, 14);
            else setOutFacesRotation(0);
            break;
        case 5:
            phaseDuration = 280;
            if (square1.position.z > cubeHeight/2+0.015) changeOutTopFacesPosition(-0.0155, 20);
            else{
                squares[0].position.z = cubeHeight/2+0.001;
                squares[1].position.x = cubeHeight/2+0.001;
                squares[2].position.y = cubeHeight/2+0.001;
            }
            if (square4.position.z < -cubeHeight/2-0.015) changeOutBotFacesPosition(-0.018, 25);

            if (square1.scale.x > cubeHeight/squareHeight) changeOutFacesScale(-0.01, 90);
            else setOutFacesScale(cubeHeight/squareHeight);

            if (square1.rotation.z/Math.PI < 1 && square1.rotation.z/Math.PI != 0) changeOutFacesRotation(0.025, 10);
            else setOutFacesRotation(0);
            break;
        case 6: // Material Effects
            phaseDuration = 5000;
            if(bloomPass.strength > 0){
                if(elapsedTime < 100) bloomPass.strength -= params.strength/50;
                else if(elapsedTime < 250) {
                    bloomPass.strength += params.strength/100;
                    if(shaderMaterialTop.uniforms.topFrontColor.value.x > 0) shaderMaterialTop.uniforms.topFrontColor.value.x -= 0.5;
                }
                else if(elapsedTime < 500) {
                    bloomPass.strength -= params.strength/50;
                    if(shaderMaterialTop.uniforms.topFrontColor.value.y < 2) shaderMaterialTop.uniforms.topFrontColor.value.y += 0.35;
                    if(shaderMaterialTop.uniforms.botFrontColor.value.x < 2) shaderMaterialTop.uniforms.botFrontColor.value.x += 0.25;
                }
                else if(elapsedTime < 750) {
                    bloomPass.strength += params.strength/100;
                    if(shaderMaterialTop.uniforms.topFrontColor.value.z > 0) shaderMaterialTop.uniforms.topFrontColor.value.z -= 0.25;
                    if(shaderMaterialTop.uniforms.botFrontColor.value.x > 0.0) shaderMaterialTop.uniforms.botFrontColor.value.x -= 0.2;
                }
                else if(elapsedTime < 1000) {
                    bloomPass.strength -= params.strength/50;
                    if(shaderMaterialTop.uniforms.topFrontColor.value.x < 2) shaderMaterialTop.uniforms.topFrontColor.value.x += 0.15;
                    if(shaderMaterialTop.uniforms.botFrontColor.value.z < 2) shaderMaterialTop.uniforms.botFrontColor.value.z += 0.05;
                }
                else if(elapsedTime < 1250) {
                    bloomPass.strength += params.strength/100;
                    if(shaderMaterialTop.uniforms.topFrontColor.value.x > 0) shaderMaterialTop.uniforms.topFrontColor.value.x -= 0.15;
                    if(shaderMaterialTop.uniforms.topFrontColor.value.y > 0) shaderMaterialTop.uniforms.topFrontColor.value.y -= 0.15;
                    if(shaderMaterialTop.uniforms.botFrontColor.value.z > 0.0) shaderMaterialTop.uniforms.botFrontColor.value.z -= 0.2;
                }
                else if(elapsedTime < 1500) {
                    bloomPass.strength -= params.strength/50;
                    if(shaderMaterialTop.uniforms.topFrontColor.value.z < 1.5) shaderMaterialTop.uniforms.topFrontColor.value.z += 0.125;
                    if(shaderMaterialTop.uniforms.botFrontColor.value.x < 1.5) shaderMaterialTop.uniforms.botFrontColor.value.x += 0.25;
                }
                else if(elapsedTime < 1750) {
                    bloomPass.strength += params.strength/100;
                    if(shaderMaterialTop.uniforms.topFrontColor.value.x > 0.0) shaderMaterialTop.uniforms.topFrontColor.value.x -= 0.125;
                    if(shaderMaterialTop.uniforms.botFrontColor.value.x > 0.0) shaderMaterialTop.uniforms.botFrontColor.value.x -= 0.2;
                }
                else if(elapsedTime < 5000) {
                    bloomPass.strength -= params.strength/50;
                }
            }

            if(elapsedTime < 2500){
                if(shaderMaterialTop.uniforms.topFrontColor.value.y > 0.0) shaderMaterialTop.uniforms.topFrontColor.value.y -= 0.05;
                if(shaderMaterialTop.uniforms.topFrontColor.value.z < 2.0) shaderMaterialTop.uniforms.topFrontColor.value.z += 0.05;
                if(shaderMaterialTop.uniforms.topFrontColor.value.x < 2.0) shaderMaterialTop.uniforms.topFrontColor.value.x += 0.05;
                if(shaderMaterialTop.uniforms.botFrontColor.value.y < 1.5) shaderMaterialTop.uniforms.botFrontColor.value.y += 0.05;
                if(shaderMaterialTop.uniforms.botFrontColor.value.x < 1.5) shaderMaterialTop.uniforms.botFrontColor.value.x += 0.05;
                if(shaderMaterialTop.uniforms.botFrontColor.value.z < 2.0) shaderMaterialTop.uniforms.botFrontColor.value.z += 0.05;
            }else if(elapsedTime < 3500){
                if(shaderMaterialTop.uniforms.topFrontColor.value.y < 1.5) shaderMaterialTop.uniforms.topFrontColor.value.y += 0.05;
                if(shaderMaterialTop.uniforms.botFrontColor.value.y > 0.0) shaderMaterialTop.uniforms.botFrontColor.value.y -= 0.05;
                if(shaderMaterialTop.uniforms.botFrontColor.value.x < 1.5) shaderMaterialTop.uniforms.botFrontColor.value.x += 0.05;
                if(shaderMaterialTop.uniforms.botFrontColor.value.z < 2.0) shaderMaterialTop.uniforms.botFrontColor.value.z += 0.05;
            }else if(elapsedTime < 5000){
                if(shaderMaterialTop.uniforms.topFrontColor.value.x < topFrontColor.r) shaderMaterialTop.uniforms.topFrontColor.value.x += 0.025;
                else shaderMaterialTop.uniforms.topFrontColor.value.x -= 0.025;
                if(shaderMaterialTop.uniforms.topFrontColor.value.y < topFrontColor.g) shaderMaterialTop.uniforms.topFrontColor.value.y += 0.025;
                else shaderMaterialTop.uniforms.topFrontColor.value.y -= 0.025;
                if(shaderMaterialTop.uniforms.topFrontColor.value.z < topFrontColor.b) shaderMaterialTop.uniforms.topFrontColor.value.z += 0.025;
                else shaderMaterialTop.uniforms.topFrontColor.value.z -= 0.025;

                if(shaderMaterialTop.uniforms.botFrontColor.value.x < botFrontColor.r) shaderMaterialTop.uniforms.botFrontColor.value.x += 0.025;
                else shaderMaterialTop.uniforms.botFrontColor.value.x -= 0.025;
                if(shaderMaterialTop.uniforms.botFrontColor.value.y < botFrontColor.g) shaderMaterialTop.uniforms.botFrontColor.value.y += 0.025;
                else shaderMaterialTop.uniforms.botFrontColor.value.y -= 0.025;
                if(shaderMaterialTop.uniforms.botFrontColor.value.z < botFrontColor.b) shaderMaterialTop.uniforms.botFrontColor.value.z += 0.025;
                else shaderMaterialTop.uniforms.botFrontColor.value.z -= 0.025;
            }

            break;
        case 7: // Returning to the start position
            phaseDuration = 1500;
            if (square1.position.z < cubeHeight+0.15+0.015) changeOutTopFacesPosition(0.0055, -75);
            if (square4.position.z > -cubeHeight-0.35-0.015) changeOutBotFacesPosition(0.008, -75);

            if (square1.scale.x < 1) changeOutFacesScale(0.00275, 250);
            else setOutFacesScale(1);
            
            if(bloomPass.strength < params.strength) bloomPass.strength += 0.025;
            break;
        default:
            break;
        }
    } else {
        // Move to the next animation phase after the phase duration is reached
        elapsedTime = 0; // Reset elapsed time
        if (animationPhase < 7) {
            animationPhase++; // Move to the next phase
            if(animationPhase == 6) cube.visible = false; 
            else if(animationPhase == 7) cube.visible = true; 
        } else {
            animationPhase = 0; // Loop back to the first phase after completing all phases
        }
    }

}

function onWindowResize() {

    const aspect = window.innerWidth / window.innerHeight;

    camera.left = - frustumSize * aspect / 2;
    camera.right = frustumSize * aspect / 2;
    camera.top = frustumSize / 2;
    camera.bottom = - frustumSize / 2;

    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
    composer.setSize( window.innerWidth, window.innerHeight );

}


// Functions for Changing geometry parameters //

function changeOutTopFacesPosition(add, delta){
    //document.write(animationPhase + ":X" + (add + elapsedTime/(delta*10000)).toFixed(4) + "   "); // Trasitions Debug
    if(add >= 0 && add + elapsedTime/(delta*10000) > 0 || add <= 0 && add + elapsedTime/(delta*10000) < 0){
        square1.position.z += add + elapsedTime/(delta*10000);
        square2.position.x += add + elapsedTime/(delta*10000);
        square3.position.y += add + elapsedTime/(delta*10000);
    }
}

function changeOutBotFacesPosition(add, delta){
    //document.write(animationPhase + ":X" + (add + elapsedTime/(delta*10000)).toFixed(4) + "   "); // Trasitions Debug
    if(add >= 0 && add + elapsedTime/(delta*10000) > 0 || add <= 0 && add + elapsedTime/(delta*10000) < 0){
        square4.position.z -= add + elapsedTime/(delta*10000);
        square5.position.x -= add + elapsedTime/(delta*10000);
        square6.position.y -= add + elapsedTime/(delta*10000);
    }
}

function changeOutFacesScale(add, delta){
    //document.write(animationPhase + ":X" + (add + elapsedTime/(delta*10000)).toFixed(4) + "   "); // Trasitions Debug
    if(add >= 0 && add + elapsedTime/(delta*10000) > 0 || add <= 0 && add + elapsedTime/(delta*10000) < 0){
        for(let i = 0; i < 6; i++){
            squares[i].scale.x += add + elapsedTime/(delta*10000);
            squares[i].scale.y += add + elapsedTime/(delta*10000);
        }
    }
}    

function changeOutFacesRotation(add, delta){
    //document.write(animationPhase + ":X" + (add + elapsedTime/(delta*10000)).toFixed(4) + "   "); // Trasitions Debug
    if(add >= 0 && add + elapsedTime/(delta*10000) > 0 || add <= 0 && add + elapsedTime/(delta*10000) < 0){
        square1.rotation.z += add + elapsedTime/(delta*10000);
        square2.rotation.x += add + elapsedTime/(delta*10000);
        square3.rotation.z -= add + elapsedTime/(delta*10000);
        square4.rotation.z -= add + elapsedTime/(delta*10000);
        square5.rotation.x -= add + elapsedTime/(delta*10000);
        square6.rotation.z += add + elapsedTime/(delta*10000);
    }
}

function setOutFacesScale(value){
    for(let i = 0; i < 6; i++){
        squares[i].scale.x = value;
        squares[i].scale.y = value;
    }
}

function setOutFacesRotation(value){
    square1.rotation.z = value;
    square2.rotation.x = value;
    square3.rotation.z = value;
    square4.rotation.z = value;
    square5.rotation.x = value;
    square6.rotation.z = value;
}
