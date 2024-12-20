// model.js
function Model(a, p, uSegments, vSegments) {
    this.a = a;
    this.p = p;
    this.uSegments = uSegments;
    this.vSegments = vSegments;
    this.iVertexBuffer = gl.createBuffer();
    this.iIndexBuffer = gl.createBuffer();
    this.count = 0;
    this.countIndices = 0;

    // Параметричні рівняння поверхні
    this.surfaceFunction = function(u, v) {
        let omega = this.p * u;
        let x = (this.a + v) * Math.cos(omega) * Math.cos(u);
        let y = (this.a + v) * Math.cos(omega) * Math.sin(u);
        let z = (this.a + v) * Math.sin(omega);
        console.log(`u: ${u}, v: ${v} => x: ${x}, y: ${y}, z: ${z}`);  // Вивести координати кожної вершини
        return [x, y, z];
    };

    // Генерація даних для поверхні та індексів
    this.generateSurfaceData = function() {
        let vertices = [];
        let indices = [];
        let flatNormals = [];
        let uSteps = this.uSegments;
        let vSteps = this.vSegments;
        let uMin = -Math.PI, uMax = Math.PI;
        let vMin = -this.a, vMax = 0;
        
        // Генерація вершин
        for (let i = 0; i <= uSteps; i++) {
            let u = uMin + (uMax - uMin) * i / uSteps;
        
            for (let j = 0; j <= vSteps; j++) {
                let v = vMin + (vMax - vMin) * j / vSteps;
                let vertex = this.surfaceFunction(u, v);
                vertices.push(...vertex);
            }
        }
        
        // Генерація індексів для трикутників
        for (let i = 0; i < uSteps; i++) {
            for (let j = 0; j < vSteps; j++) {
                let idx = i * (vSteps + 1) + j;
                let nextIdx = idx + vSteps + 1;
    
                if (i < uSteps - 1 && j < vSteps - 1) {
                    // Додаємо два трикутники для кожного квадрата
                    indices.push(idx, idx + 1, nextIdx); // Перший трикутник
                    indices.push(idx + 1, nextIdx + 1, nextIdx); // Другий трикутник
    
                    // Отримуємо вершини для нормалей
                    let v0 = vertices.slice(idx * 3, idx * 3 + 3);
                    let v1 = vertices.slice((idx + 1) * 3, (idx + 1) * 3 + 3);
                    let v2 = vertices.slice(nextIdx * 3, nextIdx * 3 + 3);
    
                    let edge1 = [
                        v1[0] - v0[0],
                        v1[1] - v0[1],
                        v1[2] - v0[2],
                    ];
                    let edge2 = [
                        v2[0] - v0[0],
                        v2[1] - v0[1],
                        v2[2] - v0[2],
                    ];
                    let normal = [
                        edge1[1] * edge2[2] - edge1[2] * edge2[1],
                        edge1[2] * edge2[0] - edge1[0] * edge2[2],
                        edge1[0] * edge2[1] - edge1[1] * edge2[0],
                    ];
    
                    // Нормалізація нормалі
                    let length = Math.sqrt(
                        normal[0] ** 2 + normal[1] ** 2 + normal[2] ** 2
                    );
                    normal = normal.map((n) => n / length);
    
                    // Додаємо нормалі для Flat Shading
                    flatNormals.push(...normal, ...normal, ...normal);  // Повторюємо нормаль для трьох вершин трикутника
                }
            }
        }
        
        // Додати замикання для кінця поверхні (закриття за u)
        for (let j = 0; j < vSteps; j++) {
            let idx1 = j;
            let idx2 = j + 1;
            let idx1NextRow = (uSteps) * (vSteps + 1) + j;
            let idx2NextRow = (uSteps) * (vSteps + 1) + j + 1;
    
            indices.push(idx1, idx2, idx1NextRow);       // Трикутник для замикання
            indices.push(idx2, idx2NextRow, idx1NextRow); // Трикутник для замикання
        }
    
        // Додати замикання для кінця поверхні (закриття за v)
        for (let i = 0; i < uSteps; i++) {
            let idx1 = i * (vSteps + 1) + (vSteps);
            let idx2 = (i + 1) * (vSteps + 1) + (vSteps);
            let idx1NextRow = i * (vSteps + 1);
            let idx2NextRow = (i + 1) * (vSteps + 1);
    
            indices.push(idx1, idx2, idx1NextRow);       // Трикутник для замикання
            indices.push(idx2, idx2NextRow, idx1NextRow); // Трикутник для замикання
        }
    
        return { vertices, indices, flatNormals };
    };
    
    this.BufferData = function() {
        let surfaceData = this.generateSurfaceData();
    
        // Буфер вершин
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(surfaceData.vertices), gl.STATIC_DRAW);
        this.count = surfaceData.vertices.length / 3;
    
        // Буфер індексів
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.iIndexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(surfaceData.indices), gl.STATIC_DRAW);
        this.countIndices = surfaceData.indices.length;
    
        // Буфер нормалей для Flat Shading
        this.iFlatNormalBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iFlatNormalBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(surfaceData.flatNormals), gl.STATIC_DRAW);
    };
    
    this.Draw = function() {
        // Вершини
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribVertex);
    
        // Нормалі
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iFlatNormalBuffer);
        gl.vertexAttribPointer(shProgram.iAttribFlatNormal, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribFlatNormal);
    
        // Малюємо поверхню
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.iIndexBuffer);
        gl.drawElements(gl.TRIANGLES, this.countIndices, gl.UNSIGNED_SHORT, 0);
    };
    

    // Малювання ліній для U і V
    // this.DrawLines = function() {
    //     let uStep = 2 * Math.PI / this.uSegments;
    //     let vStep = 2 / this.vSegments;
        
    //     // Буфер для ліній U і V
    //     let lineVertices = [];
        
    //     // Малювання ліній для U
    //     for (let i = 0; i < this.uSegments; i++) {
    //         for (let j = 0; j < this.vSegments; j++) {
    //             let u1 = i * uStep;
    //             let u2 = (i + 1) * uStep;
    //             let v1 = j * vStep;
    //             let v2 = (j + 1) * vStep;
    
    //             let vertex1 = this.surfaceFunction(u1, v1);
    //             let vertex2 = this.surfaceFunction(u2, v2);
    
    //             // Додаємо координати лінії
    //             lineVertices.push(...vertex1, ...vertex2);
    //         }
    //     }
    
    //     // Буфер для ліній
    //     let lineBuffer = gl.createBuffer();
    //     gl.bindBuffer(gl.ARRAY_BUFFER, lineBuffer);
    //     gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(lineVertices), gl.STATIC_DRAW);
    
    //     // Малюємо лінії для U
    //     gl.bindBuffer(gl.ARRAY_BUFFER, lineBuffer);
    //     gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
    //     gl.enableVertexAttribArray(shProgram.iAttribVertex);
    //     gl.uniform4fv(shProgram.iColor, [1, 0, 0, 1]); // Червоний для U
    //     gl.drawArrays(gl.LINES, 0, lineVertices.length / 3);
        
    //     // Малюємо лінії для V
    //     lineVertices = [];  // Очистимо масив для ліній V
    
    //     for (let j = 0; j < this.vSegments; j++) {
    //         for (let i = 0; i < this.uSegments; i++) {
    //             let u1 = i * uStep;
    //             let u2 = (i + 1) * uStep;
    //             let v1 = j * vStep;
    //             let v2 = (j + 1) * vStep;
    
    //             let vertex1 = this.surfaceFunction(u1, v1);
    //             let vertex2 = this.surfaceFunction(u2, v2);
    
    //             // Додаємо координати лінії
    //             lineVertices.push(...vertex1, ...vertex2);
    //         }
    //     }
    
    //     // Буфер для ліній V
    //     gl.bindBuffer(gl.ARRAY_BUFFER, lineBuffer);
    //     gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(lineVertices), gl.STATIC_DRAW);
    
    //     // Малюємо лінії для V
    //     gl.bindBuffer(gl.ARRAY_BUFFER, lineBuffer);
    //     gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
    //     gl.enableVertexAttribArray(shProgram.iAttribVertex);
    //     gl.uniform4fv(shProgram.iColor, [0, 0, 1, 1]); // Синій для V
    //     gl.drawArrays(gl.LINES, 0, lineVertices.length / 3);
    // };
    
}
