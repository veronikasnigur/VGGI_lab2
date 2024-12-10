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
    
        // Генерація нормалей та індексів
        for (let i = 0; i < uSteps; i++) {
            for (let j = 0; j < vSteps; j++) {
                let idx = i * (vSteps + 1) + j;
                let nextIdx = idx + vSteps + 1;
    
                if (idx < vertices.length / 3 && nextIdx < vertices.length / 3) {
                    // Отримання вершин трикутника
                    let v0 = vertices.slice(idx * 3, idx * 3 + 3);
                    let v1 = vertices.slice((idx + 1) * 3, (idx + 1) * 3 + 3);
                    let v2 = vertices.slice(nextIdx * 3, nextIdx * 3 + 3);
    
                    // Розрахунок нормалі граней
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
                    flatNormals.push(...normal, ...normal, ...normal);
    
                    // Індекси
                    indices.push(idx, idx + 1, nextIdx);
                }
            }
        }
    
        return { vertices, indices, flatNormals };
    };    

    // Заповнення буферу WebGL
    this.BufferData = function() {
        let surfaceData = this.generateSurfaceData();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(surfaceData.vertices), gl.STATIC_DRAW);
        this.count = surfaceData.vertices.length / 3;

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.iIndexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(surfaceData.indices), gl.STATIC_DRAW);
        this.countIndices = surfaceData.indices.length;
    };

    // Малювання трикутників
    this.Draw = function() {
        gl.bindBuffer(gl.ARRAY_BUFFER, this.iVertexBuffer);
        gl.vertexAttribPointer(shProgram.iAttribVertex, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(shProgram.iAttribVertex);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.iIndexBuffer);
        gl.drawElements(gl.TRIANGLES, this.countIndices, gl.UNSIGNED_SHORT, 0);
    };

    // Малювання ліній для U і V
    this.DrawLines = function() {
        let uStep = 2 * Math.PI / this.uSegments;
        let vStep = 2 / this.vSegments;

        // Малювання ліній для U
        for (let i = 0; i < this.uSegments; i++) {
            for (let j = 0; j < this.vSegments; j++) {
                let u1 = i * uStep;
                let u2 = (i + 1) * uStep;
                let v1 = j * vStep;
                let v2 = (j + 1) * vStep;

                let vertex1 = this.surfaceFunction(u1, v1);
                let vertex2 = this.surfaceFunction(u2, v2);

                // Малюємо лінії між двома точками
                gl.uniform4fv(shProgram.iColor, [1, 0, 0, 1]); // Червоний для U
                gl.drawArrays(gl.LINES, 0, 2); // Малюємо лінію між двома точками
            }
        }

        // Малювання ліній для V
        for (let j = 0; j < this.vSegments; j++) {
            for (let i = 0; i < this.uSegments; i++) {
                let u1 = i * uStep;
                let u2 = (i + 1) * uStep;
                let v1 = j * vStep;
                let v2 = (j + 1) * vStep;

                let vertex1 = this.surfaceFunction(u1, v1);
                let vertex2 = this.surfaceFunction(u2, v2);

                // Малюємо лінії між двома точками
                gl.uniform4fv(shProgram.iColor, [0, 0, 1, 1]); // Синій для V
                gl.drawArrays(gl.LINES, 0, 2); // Малюємо лінію між двома точками
            }
        }
    };
}
