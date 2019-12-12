var UNITWIDTH = 90;                 // Largura de um cubo no labirinto
var UNITHEIGHT = 45;                // Altura dos cubos no labirinto
var PLAYERCOLLISIONDISTANCE = 20;   // Quantas unidades o jogador pode tirar da parede
var PLAYERSPEED = 800.0;            // Quão rápido o jogador se move


var clock;
var camera, controls, scene, renderer;
var mapSize;

var collidableObjects = [];

var totalCubesWide;


// Sinalizadores para determinar em qual direção ou jogador está se movendo
var moveForward = false;
var moveBackward = false;
var moveLeft = false;
var moveRight = false;


// Vetores de velocidade para o player
var playerVelocity = new THREE.Vector3();


// elementos HTML a serem alterados
var blocker = document.getElementById('blocker');
var instructions = document.getElementById('instructions');

var container = document.getElementById('container');
var body = document.getElementById('body');
var blocker = document.getElementById('blocker');


// Obtenha o bloqueio do ponteiro e comece a ouvir se o seu estado mudar
function getPointerLock() {
    document.onclick = function () {
        container.requestPointerLock();
    }

    document.addEventListener('pointerlockchange', lockChange, false);
}

// Liga ou desliga os controles
function lockChange() {
    // Ativar controles
    if (document.pointerLockElement === container) {
        blocker.style.display = "none";
        controls.enabled = true;
    // Desligue os controles
    } else {
        if (gameOver) {
            location.reload();
        }
        // Exibe o bloqueador e a instrução
        blocker.style.display = "";
        controls.enabled = false;
    }
}


// Configure o jogo
getPointerLock();
init();



// Configure o jogo
function init() {

    // Acerte o relógio para acompanhar os quadros
    clock = new THREE.Clock();
    // Crie a cena em que tudo irá
    scene = new THREE.Scene();

    // Adicione um pouco de neblina para efeitos
    scene.fog = new THREE.FogExp2(0xcccccc, 0.0015);

    // Definir configurações de renderização
    renderer = new THREE.WebGLRenderer();
    renderer.setClearColor(scene.fog.color);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Renderizar para o contêiner
    var container = document.getElementById('container');
    container.appendChild(renderer.domElement);

    // Defina a posição da câmera e veja os detalhes
    camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 1, 2000);
    camera.position.y = 20; // Altura em que a câmera estará olhando
    camera.position.x = 0;
    camera.position.z = 0;

    // Adicione a câmera ao controlador e, em seguida, adicione à cena
    controls = new THREE.PointerLockControls(camera);
    scene.add(controls.getObject());

    listenForPlayerMovement();


    // Adicione as paredes (cubos) do labirinto
    createMazeCubes();
   // Adicionar plano de terra
    createGround();
    // Adicione paredes de perímetro que cercam o labirinto
    createPerimWalls();

   
    // alterna de "Carregando ..." para o texto de instruções
    instructions.innerHTML = "<strong>Clique para jogar!</strong></br> <strong> Ache a parede rosa</strong> </br></br>Use W,A,S,D para se mover </br> Use o Mouse para olhar em volta</br> Aperte ESC para reiniciar";
    // Chame a função animar para que a animação comece após o carregamento
    animate();
    // Adicione luzes à cena
    addLights();

    // Escute se a janela muda de tamanho
    window.addEventListener('resize', onWindowResize, false);

}


// Adicione ouvintes de eventos para pressionar as teclas de movimento do jogador
function listenForPlayerMovement() {
    // Escuta quando uma tecla é pressionada
    // Se for uma chave especificada, marque a direção como verdadeira desde que movendo
    var onKeyDown = function (event) {

        switch (event.keyCode) {

            case 38: // cima
            case 87: // w
                moveForward = true;
                break;

            case 37: // esquerda
            case 65: // a
                moveLeft = true;
                break;

            case 40: // baixo
            case 83: // s
                moveBackward = true;
                break;

            case 39: // direita
            case 68: // d
                moveRight = true;
                break;


        }

    };

    // Escuta quando uma tecla é liberada
    // Se for uma chave especificada, marque a direção como falsa, pois não se move mais
    var onKeyUp = function (event) {

        switch (event.keyCode) {

            case 38: // cima
            case 87: // w
                moveForward = false;
                break;

            case 37: // esquerda
            case 65: // a
                moveLeft = false;
                break;

            case 40: // baixo
            case 83: // s
                moveBackward = false;
                break;

            case 39: // direita
            case 68: // d
                moveRight = false;
                break;
        }
    };

    // Adicione ouvintes de eventos para quando as teclas de movimento forem pressionadas e liberadas
    document.addEventListener('keydown', onKeyDown, false);
    document.addEventListener('keyup', onKeyUp, false);
}

// Adicione luzes à cena
function addLights() {
    var lightOne = new THREE.DirectionalLight(0xffffff);
    lightOne.position.set(1, 1, 1);
    scene.add(lightOne);

    var lightTwo = new THREE.DirectionalLight(0xffffff, .4);
    lightTwo.position.set(1, -1, -1);
    scene.add(lightTwo);
}

// Crie as paredes do labirinto usando cubos que são mapeados com uma matriz 2D
function createMazeCubes() {
    // Mapeamento de parede do labirinto, assumindo matriz
    // 1 é cubo, 0 é espaço vazio
    var map = [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, ],
        [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 1, ],
        [1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, ],
        [1, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, ],
        [1, 1, 1, 0, 1, 0, 0, 1, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, ],
        [1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, ],
        [1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, ],
        [1, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 1, 1, 0, 1, 1, 0, 1, ],
        [1, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 1, ],
        [1, 1, 0, 1, 0, 1, 1, 1, 1, 1, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1, ],
        [1, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, ],
        [1, 0, 0, 0, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, 0, 1, ],
        [1, 0, 1, 1, 1, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 0, 0, 1, ],
        [1, 0, 0, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1, 1, ],
        [1, 0, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 0, 0, 0, 0, 1, ],
        [1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, ],
        [1, 0, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, ],
        [1, 0, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1, 1, 1, ],
        [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, ],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, ]
      ]

    // detalhes da parede
    var cubeGeo = new THREE.BoxGeometry(UNITWIDTH, UNITHEIGHT, UNITWIDTH);
    var cubeMat = new THREE.MeshPhongMaterial({
        color: 0x483D8B,
    });
    var cubeMat2 = new THREE.MeshPhongMaterial({
        color: 0x8B008B,
    });

    // Mantenha os cubos dentro das paredes delimitadas
    var widthOffset = UNITWIDTH / 2;
    // Coloque a parte inferior do cubo em y = 0
    var heightOffset = UNITHEIGHT / 2;

    // Veja a largura do mapa vendo quanto tempo a primeira matriz tem
    totalCubesWide = map[0].length;

   // Coloque paredes onde 1s estão
    for (var i = 0; i < totalCubesWide; i++) {
        for (var j = 0; j < map[i].length; j++) {
            // Se 1 for encontrado, adicione um cubo na posição correspondente
            if (map[i][j]) {
                if(i == 0 && j == 1){
                // Make the cube
                var cube = new THREE.Mesh(cubeGeo, cubeMat2);
                // Define a posição do cubo
                cube.position.z = (i - totalCubesWide / 2) * UNITWIDTH + widthOffset;
                cube.position.y = heightOffset;
                cube.position.x = (j - totalCubesWide / 2) * UNITWIDTH + widthOffset;
                // Adicione o cubo
                scene.add(cube);
                // Usado posteriormente para detecção de colisão
                collidableObjects.push(cube);
                }
                // Faça o cubo
                var cube = new THREE.Mesh(cubeGeo, cubeMat);
                // Defina a posição do cubo
                cube.position.z = (i - totalCubesWide / 2) * UNITWIDTH + widthOffset;
                cube.position.y = heightOffset;
                cube.position.x = (j - totalCubesWide / 2) * UNITWIDTH + widthOffset;
                // Add the cube
                scene.add(cube);
                // Usado posteriormente para detecção de colisão
                collidableObjects.push(cube);
            }
        }
    }
    // Crie o terreno com base no tamanho do mapa, o tamanho da matriz / cubo produzido
    mapSize = totalCubesWide * UNITWIDTH;
}


// Crie o plano do solo em que o labirinto fica em cima
function createGround() {
   // Crie a geometria e o material do solo
    var groundGeo = new THREE.PlaneGeometry(mapSize, mapSize);
    var groundMat = new THREE.MeshPhongMaterial({ color: 0xD3D3D3, side: THREE.DoubleSide, shading: THREE.FlatShading });

    // Crie o solo e gire-o horizontalmente
    var ground = new THREE.Mesh(groundGeo, groundMat);
    ground.position.set(0, 1, 0);
    ground.rotation.x = degreesToRadians(90);
    scene.add(ground);
}


// Faça as quatro paredes do perímetro para o labirinto
function createPerimWalls() {
    var halfMap = mapSize / 2;  // Metade do tamanho do mapa
    var sign = 1;               // Usado para fazer uma quantia positiva ou negativa
    // Passa duas vezes, criando duas paredes de perímetro por vez
    for (var i = 0; i < 2; i++) {
        var perimGeo = new THREE.PlaneGeometry(mapSize, UNITHEIGHT);
        // Faça o material dupla face
        var perimMat = new THREE.MeshPhongMaterial({ color: 0x464646, side: THREE.DoubleSide });
        // Faça duas paredes
        var perimWallLR = new THREE.Mesh(perimGeo, perimMat);
        var perimWallFB = new THREE.Mesh(perimGeo, perimMat);

        // Criar paredes esquerda / direita
        perimWallLR.position.set(halfMap * sign, UNITHEIGHT / 2, 0);
        perimWallLR.rotation.y = degreesToRadians(90);
        scene.add(perimWallLR);
        collidableObjects.push(perimWallLR);
        // Criar paredes dianteiras / traseiras
        perimWallFB.position.set(0, UNITHEIGHT / 2, halfMap * sign);
        scene.add(perimWallFB);
        collidableObjects.push(perimWallFB);

        collidableObjects.push(perimWallLR);
        collidableObjects.push(perimWallFB);

        sign = -1; // Trocar para valor negativo
    }
}

// Atualize a câmera e o renderizador quando a janela mudar de tamanho
function onWindowResize() {

    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();

    renderer.setSize(window.innerWidth, window.innerHeight);

}





function animate() {
    render();
    requestAnimationFrame(animate);

    // Obtenha a mudança no tempo entre os quadros
    var delta = clock.getDelta();
    // Atualiza nossos quadros por segundo
    animatePlayer(delta);
    
}

// Renderize a cena
function render() {
    renderer.render(scene, camera);

}

// Animar a câmera do player
function animatePlayer(delta) {
    // Gradual slowdown
    playerVelocity.x -= playerVelocity.x * 10.0 * delta;
    playerVelocity.z -= playerVelocity.z * 10.0 * delta;

    // Se nenhuma colisão e uma tecla de movimento estiverem sendo pressionadas, aplique a velocidade de movimento
    if (detectPlayerCollision() == false) {
        if (moveForward) {
            playerVelocity.z -= PLAYERSPEED * delta;
        }
        if (moveBackward) playerVelocity.z += PLAYERSPEED * delta;
        if (moveLeft) playerVelocity.x -= PLAYERSPEED * delta;
        if (moveRight) playerVelocity.x += PLAYERSPEED * delta;

        controls.getObject().translateX(playerVelocity.x * delta);
        controls.getObject().translateZ(playerVelocity.z * delta);
    } else {
        // Colisão ou nenhuma tecla de movimento sendo pressionada. Parar o movimento
        playerVelocity.x = 0;
        playerVelocity.z = 0;
    }
}


// Determina se o jogador está colidindo com um objeto colidível
function detectPlayerCollision() {
    // A matriz de rotação a ser aplicada ao nosso vetor de direção
    // Indefinido por padrão para indicar que o raio deve vir da frente
    var rotationMatrix;
    // Obter direção da câmera
    var cameraDirection = controls.getDirection(new THREE.Vector3(0, 0, 0)).clone();

    // Verifique em qual direção estamos nos movendo (sem olhar)
    // Inverta a matriz nessa direção para que possamos reposicionar o raio
    if (moveBackward) {
        rotationMatrix = new THREE.Matrix4();
        rotationMatrix.makeRotationY(degreesToRadians(180));
    }
    else if (moveLeft) {
        rotationMatrix = new THREE.Matrix4();
        rotationMatrix.makeRotationY(degreesToRadians(90));
    }
    else if (moveRight) {
        rotationMatrix = new THREE.Matrix4();
        rotationMatrix.makeRotationY(degreesToRadians(270));
    }

   // O jogador está avançando, nenhuma matriz de rotação é necessária
    if (rotationMatrix !== undefined) {
        cameraDirection.applyMatrix4(rotationMatrix);
    }

   // Aplicar raio na câmera do player
    var rayCaster = new THREE.Raycaster(controls.getObject().position, cameraDirection);

    // Se nosso raio atingir um objeto colidível, retorne true
    if (rayIntersect(rayCaster, PLAYERCOLLISIONDISTANCE)) {
        return true;
    } else {
        return false;
    }
}

// Faz um raio e vê se está colidindo com alguma coisa da lista de objetos colidíveis
// Retorna true se certa distância do objeto
function rayIntersect(ray, distance) {
    var intersects = ray.intersectObjects(collidableObjects);
    for (var i = 0; i < intersects.length; i++) {
        if (intersects[i].distance < distance) {
            return true;
        }
    }
    return false;
}

// Converte graus em radianos
function degreesToRadians(degrees) {
    return degrees * Math.PI / 180;
}

// Converte radianos em graus
function radiansToDegrees(radians) {
    return radians * 180 / Math.PI;
}
