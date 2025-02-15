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
    this.iAttribFlatNormal = -1;  // Атрибут для нормалей

    this.Use = function() {
        gl.useProgram(this.prog);
    }
}

// Передача параметрів освітлення в шейдери
let angle = 0.0;  // Кут обертання джерела світла
function setLighting() {
    // Параметри освітлення
    let lightRadius = 5.0;  // Радіус орбіти джерела світла
    let lightPos = [
        lightRadius * Math.cos(angle),  // X-координата
        5.0,  // Y-координата (постійна)
        lightRadius * Math.sin(angle)   // Z-координата
    ];
    let lightColor = [1.0, 1.0, 1.0]; // Біле світло
    let ambientColor = [0.2, 0.2, 0.2]; // Тіньове освітлення (ambient)
    
    // Позиція камери
    let cameraPos = [0.0, 0.0, 10.0]; // Камера на певній відстані

    // Відправляємо ці параметри в шейдери
    gl.uniform3fv(shProgram.iLightPos, lightPos);
    gl.uniform3fv(shProgram.iLightColor, lightColor);
    gl.uniform3fv(shProgram.iAmbientColor, ambientColor);
    gl.uniform3fv(shProgram.iCameraPos, cameraPos); // Додаємо відправку позиції камери
}

// Функція для анімації джерела світла
function animate() {
    angle += 0.01;  // Оновлення кута для обертання (можна змінити швидкість обертання)
    if (angle > 2 * Math.PI) {
        angle -= 2 * Math.PI;  // Обмежуємо кут, щоб він не ставав занадто великим
    }

    // Перемалювання поверхні
    draw();

    // Оновлюємо освітлення кожного кадру
    setLighting();
    requestAnimationFrame(animate);  // Анімація кадр за кадром
}

// Ініціалізація WebGL
function initGL() {
    let prog = createProgram(gl, vertexShaderSource, fragmentShaderSource);
    shProgram = new ShaderProgram(prog);
    shProgram.Use();

    // Отримуємо атрибути та uniform змінні
    shProgram.iAttribVertex = gl.getAttribLocation(prog, "vertex");
    shProgram.iModelViewProjectionMatrix = gl.getUniformLocation(prog, "ModelViewProjectionMatrix");
    shProgram.iColor = gl.getUniformLocation(prog, "color");
    shProgram.iLightPos = gl.getUniformLocation(prog, "lightPos");
    shProgram.iLightColor = gl.getUniformLocation(prog, "lightColor");
    shProgram.iAmbientColor = gl.getUniformLocation(prog, "ambientColor");
    shProgram.iAttribFlatNormal = gl.getAttribLocation(prog, "normal");

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

    // Передаємо модельно-видову-перспективну матрицю в шейдер
    gl.uniformMatrix4fv(shProgram.iModelViewProjectionMatrix, false, modelViewProjection);

    // Передаємо параметри освітлення
    setLighting();

    // Підключення буфера нормалей
    gl.bindBuffer(gl.ARRAY_BUFFER, surface.iFlatNormalBuffer);
    gl.vertexAttribPointer(shProgram.iAttribFlatNormal, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(shProgram.iAttribFlatNormal);

    // Підключення буфера вершин
    gl.bindBuffer(gl.ARRAY_BUFFER, surface.iVertexBuffer);
    gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(shProgram.iAttribVertex);

    // Малюємо поверхню
    surface.Draw();
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
    animate();  // Запускаємо анімацію
}