'use strict';

let gl;                         // The WebGL context.
let surface;                    // A surface model
let shProgram;                  // A shader program
let spaceball;                  // A SimpleRotator object that lets the user rotate the view by mouse.

// Параметри конуса
let a = 2;  // Радіус сфери
let p = 1;  // Константа для параметра omega
let uSegments = 60;  // Кількість сегментів по U
let vSegments = 20;  // Кількість сегментів по V

// Конвертація градусів в радіани
function deg2rad(angle) {
    return angle * Math.PI / 180;
}

function updateSliderValue(id) {
    const value = document.getElementById(id).value;
    document.getElementById(`${id}Value`).textContent = value;
}

// Конструктор для шейдерної програми
function ShaderProgram(program) {
    this.prog = program;
    this.iAttribVertex = -1;
    this.iModelViewProjectionMatrix = -1;
    this.iColor = -1;
    this.iLightPos = -1;
    this.iLightColor = -1;
    this.iAmbientColor = -1;

    this.Use = function() {
        gl.useProgram(this.prog);
    }
}

// Передача параметрів освітлення в шейдери
function setLighting() {
    // Параметри освітлення
    let lightPos = [5.0, 5.0, 10.0]; // Ближче до фігури
    let lightColor = [1.0, 1.0, 1.0]; // Біле світло
    let ambientColor = [0.1, 0.1, 0.1]; // Тіньове освітлення (ambient)

    // Відправляємо ці параметри в шейдери
    gl.uniform3fv(shProgram.iLightPos, lightPos);
    gl.uniform3fv(shProgram.iLightColor, lightColor);
    gl.uniform3fv(shProgram.iAmbientColor, ambientColor);
}

// Ініціалізація WebGL
function initGL() {
    let prog = createProgram(gl, vertexShaderSource, fragmentShaderSource);

    shProgram = new ShaderProgram(prog);
    shProgram.Use();

    shProgram.iAttribVertex = gl.getAttribLocation(prog, "vertex");
    shProgram.iModelViewProjectionMatrix = gl.getUniformLocation(prog, "ModelViewProjectionMatrix");
    shProgram.iColor = gl.getUniformLocation(prog, "color");
    shProgram.iLightPos = gl.getUniformLocation(prog, "lightPos");
    shProgram.iLightColor = gl.getUniformLocation(prog, "lightColor");
    shProgram.iAmbientColor = gl.getUniformLocation(prog, "ambientColor");

    surface = new Model(a, p, uSegments, vSegments);  // Створюємо об'єкт моделі з параметрами
    surface.BufferData();  // Заповнюємо буфери

    gl.enable(gl.DEPTH_TEST);  // Включаємо тест глибини
}

// Функція малювання
function draw() { 
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    let projection = m4.perspective(Math.PI / 6, 1, 8, 12); 
    let modelView = spaceball.getViewMatrix();
    let translateToPointZero = m4.translation(0, 0, -10);
    let matAccum = m4.multiply(translateToPointZero, modelView);
    let modelViewProjection = m4.multiply(projection, matAccum);

    gl.uniformMatrix4fv(shProgram.iModelViewProjectionMatrix, false, modelViewProjection);
    
    // Викликаємо setLighting для передачі параметрів освітлення
    setLighting();
    
    // Малюємо заповнені трикутники (сірий)
    gl.uniform4fv(shProgram.iColor, [0.5, 0.5, 0.5, 1]); // Сірий
    surface.Draw(); // Викликаємо метод малювання з об'єкта моделі
}

// Оновлення кількості сегментів по U та V
function updateSurface() {
    // Оновлюємо сегменти з повзунків
    uSegments = parseInt(document.getElementById('uSegments').value, 10);
    vSegments = parseInt(document.getElementById('vSegments').value, 10);

    // Відображаємо поточні значення
    document.getElementById('uSegmentsValue').textContent = uSegments;
    document.getElementById('vSegmentsValue').textContent = vSegments;

    // Оновлюємо дані поверхні
    surface.uSegments = uSegments;  // Оновлюємо сегменти в існуючій моделі
    surface.vSegments = vSegments;
    surface.BufferData();  // Оновлюємо буфери з новими сегментами

    // Перемалювання поверхні після оновлення
    draw();
}

// Створення програми
function createProgram(gl, vShader, fShader) {
    let vsh = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vsh, vShader);
    gl.compileShader(vsh);
    if (!gl.getShaderParameter(vsh, gl.COMPILE_STATUS)) {
        throw new Error("Error in vertex shader: " + gl.getShaderInfoLog(vsh));
    }

    let fsh = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fsh, fShader);
    gl.compileShader(fsh);
    if (!gl.getShaderParameter(fsh, gl.COMPILE_STATUS)) {
        throw new Error("Error in fragment shader: " + gl.getShaderInfoLog(fsh));
    }

    let prog = gl.createProgram();
    gl.attachShader(prog, vsh);
    gl.attachShader(prog, fsh);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        throw new Error("Link error in program: " + gl.getProgramInfoLog(prog));
    }
    return prog;
}

// Ініціалізація
function init() {
    let canvas = document.getElementById("webglcanvas");
    gl = canvas.getContext("webgl");
    if (!gl) {
        document.getElementById("canvas-holder").innerHTML = "<p>Sorry, could not get a WebGL graphics context.</p>";
        return;
    }

    initGL();
    spaceball = new TrackballRotator(canvas, draw, 0);
    draw();
}
